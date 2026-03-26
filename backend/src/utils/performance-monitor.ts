/**
 * أداة متقدمة لمراقبة أداء التطبيق
 */
import { performance, PerformanceObserver } from 'perf_hooks';
import fs from 'fs';
import path from 'path';

// تخزين مقاييس الأداء
const metrics = {
  requests: {
    total: 0,
    success: 0,
    failed: 0,
    byCurrency: new Map<string, number>(),
  },
  endpoints: new Map<string, {
    calls: number,
    avgResponseTime: number,
    minResponseTime: number,
    maxResponseTime: number
  }>(),
  db: {
    queries: 0,
    avgQueryTime: 0,
    slowQueries: 0,
  },
  memory: {
    lastUsage: 0,
    peak: 0,
    gcCount: 0,
  },
};

// ملف سجل الأداء
const logFile = path.join(__dirname, '../../logs/performance', `performance-${new Date().toISOString().split('T')[0]}.log`);

// التأكد من وجود مجلد السجلات
const logDir = path.dirname(logFile);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * تسجيل أداء استدعاء واجهة برمجة التطبيقات
 */
export function recordApiCall(endpoint: string, statusCode: number, durationMs: number) {
  metrics.requests.total++;
  
  if (statusCode >= 200 && statusCode < 400) {
    metrics.requests.success++;
  } else {
    metrics.requests.failed++;
  }
  
  // تحديث إحصائيات النقطة النهائية
  if (!metrics.endpoints.has(endpoint)) {
    metrics.endpoints.set(endpoint, {
      calls: 0,
      avgResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0
    });
  }
  
  const endpointStats = metrics.endpoints.get(endpoint)!;
  const oldAvg = endpointStats.avgResponseTime;
  const oldCalls = endpointStats.calls;
  
  // تحديث الإحصائيات
  endpointStats.calls++;
  endpointStats.avgResponseTime = ((oldAvg * oldCalls) + durationMs) / endpointStats.calls;
  endpointStats.minResponseTime = Math.min(endpointStats.minResponseTime, durationMs);
  endpointStats.maxResponseTime = Math.max(endpointStats.maxResponseTime, durationMs);
}

/**
 * تسجيل أداء استعلام قاعدة البيانات
 */
export function recordDbQuery(queryDurationMs: number) {
  metrics.db.queries++;
  
  const oldAvg = metrics.db.avgQueryTime;
  const oldQueries = metrics.db.queries;
  
  // تحديث المتوسط
  metrics.db.avgQueryTime = ((oldAvg * (oldQueries - 1)) + queryDurationMs) / oldQueries;
  
  // تحديد الاستعلامات البطيئة (أكثر من 100 مللي ثانية)
  if (queryDurationMs > 100) {
    metrics.db.slowQueries++;
  }
}

/**
 * رصد استخدام الذاكرة
 */
export function recordMemoryUsage() {
  const memUsage = process.memoryUsage();
  const heapUsed = Math.round(memUsage.heapUsed / (1024 * 1024));
  
  metrics.memory.lastUsage = heapUsed;
  
  if (heapUsed > metrics.memory.peak) {
    metrics.memory.peak = heapUsed;
  }
}

/**
 * إعداد قياسات الأداء باستخدام Performance API
 */
export function setupPerformanceMonitoring() {
  // إعداد مراقب الأداء
  const obs = new PerformanceObserver((items) => {
    const entry = items.getEntries()[0];
    recordApiCall(entry.name, 200, entry.duration);
    
    performance.clearMarks();
  });
  
  obs.observe({ entryTypes: ['measure'] });
  
  // تسجيل الإحصائيات بشكل دوري
  setInterval(() => {
    recordMemoryUsage();
    logPerformanceMetrics();
  }, 60000); // كل دقيقة
  
  return {
    startMeasure: (name: string) => {
      performance.mark(`${name}-start`);
    },
    
    endMeasure: (name: string) => {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }
  };
}

/**
 * كتابة مقاييس الأداء إلى ملف السجل
 */
export function logPerformanceMetrics() {
  const timestamp = new Date().toISOString();
  const metricsData = {
    timestamp,
    requests: {
      total: metrics.requests.total,
      success: metrics.requests.success,
      failed: metrics.requests.failed,
      successRate: metrics.requests.total > 0 ? (metrics.requests.success / metrics.requests.total) * 100 : 0
    },
    endpoints: Array.from(metrics.endpoints.entries()).map(([endpoint, stats]) => ({
      endpoint,
      calls: stats.calls,
      avgMs: Math.round(stats.avgResponseTime),
      minMs: stats.minResponseTime === Infinity ? 0 : stats.minResponseTime,
      maxMs: stats.maxResponseTime
    })),
    db: {
      queries: metrics.db.queries,
      avgQueryTimeMs: Math.round(metrics.db.avgQueryTime),
      slowQueries: metrics.db.slowQueries,
      slowQueriesPercent: metrics.db.queries > 0 ? (metrics.db.slowQueries / metrics.db.queries) * 100 : 0
    },
    memory: {
      currentMB: metrics.memory.lastUsage,
      peakMB: metrics.memory.peak,
      gcCount: metrics.memory.gcCount
    }
  };
  
  // كتابة البيانات إلى الملف
  fs.appendFileSync(logFile, JSON.stringify(metricsData) + '\n');
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('Performance metrics:', metricsData);
  }
  
  return metricsData;
}

/**
 * الحصول على معلومات الأداء الحالية
 */
export function getCurrentPerformanceMetrics() {
  // تحديث معلومات الذاكرة قبل إرجاع البيانات
  recordMemoryUsage();
  
  return {
    requests: {
      total: metrics.requests.total,
      success: metrics.requests.success,
      failed: metrics.requests.failed,
      successRate: metrics.requests.total > 0 ? (metrics.requests.success / metrics.requests.total) * 100 : 0
    },
    topEndpoints: Array.from(metrics.endpoints.entries())
      .sort((a, b) => b[1].calls - a[1].calls)
      .slice(0, 5)
      .map(([endpoint, stats]) => ({
        endpoint,
        calls: stats.calls,
        avgResponseTimeMs: Math.round(stats.avgResponseTime)
      })),
    slowEndpoints: Array.from(metrics.endpoints.entries())
      .sort((a, b) => b[1].avgResponseTime - a[1].avgResponseTime)
      .slice(0, 5)
      .map(([endpoint, stats]) => ({
        endpoint,
        calls: stats.calls,
        avgResponseTimeMs: Math.round(stats.avgResponseTime)
      })),
    db: {
      queries: metrics.db.queries,
      avgQueryTimeMs: Math.round(metrics.db.avgQueryTime),
      slowQueries: metrics.db.slowQueries
    },
    memory: {
      currentMB: metrics.memory.lastUsage,
      peakMB: metrics.memory.peak
    }
  };
} 