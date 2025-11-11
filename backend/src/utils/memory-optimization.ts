/**
 * نظام متقدم لتحسين استخدام الذاكرة وإدارتها
 */
import v8 from 'v8';
import fs from 'fs';
import path from 'path';
import os from 'os';

// حدود استخدام الذاكرة التي تحدد متى يجب تنظيف الذاكرة
const MEM_HIGH_WATER = 0.8; // 80% من الحد الأقصى
const MEM_LOW_WATER = 0.6; // 60% من الحد الأقصى

let lastGC = Date.now();
const MIN_GC_INTERVAL = 60000; // الحد الأدنى للوقت بين عمليات تنظيف الذاكرة (دقيقة)

/**
 * إنشاء مخطط لتصوير استخدام الذاكرة
 */
export function takeHeapSnapshot(name = 'heap') {
  const snapshotDir = path.join(__dirname, '../../logs/memory');
  
  // إنشاء مجلد السجلات إذا لم يكن موجودًا
  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const snapshotPath = path.join(snapshotDir, `${name}-${timestamp}.heapsnapshot`);
  
  // أخذ لقطة من الذاكرة
  const snapshot = v8.getHeapSnapshot();
  
  // كتابة اللقطة إلى ملف
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));
  
  return snapshotPath;
}

/**
 * إعادة تدوير الذاكرة يدويًا عند الحاجة
 */
export function checkMemoryUsage() {
  const memoryUsage = process.memoryUsage();
  const heapUsed = memoryUsage.heapUsed;
  const heapTotal = memoryUsage.heapTotal;
  
  // نسبة استخدام الذاكرة
  const ratio = heapUsed / heapTotal;
  
  // تحقق من الوقت المنقضي منذ آخر تنظيف
  const now = Date.now();
  const elapsed = now - lastGC;
  
  // سجل استخدام الذاكرة
  console.log({
    heapUsedMB: Math.round(heapUsed / 1024 / 1024),
    heapTotalMB: Math.round(heapTotal / 1024 / 1024),
    ratio: ratio.toFixed(2),
    rss: Math.round(memoryUsage.rss / 1024 / 1024),
    elapsedSinceGC: Math.round(elapsed / 1000)
  });
  
  // إذا تجاوز استخدام الذاكرة الحد الأعلى وتجاوزت المدة الزمنية الحد الأدنى
  if (ratio > MEM_HIGH_WATER && elapsed > MIN_GC_INTERVAL) {
    console.log('تنظيف الذاكرة...');
    
    // تنظيف الذاكرة يدويًا
    if (global.gc) {
      try {
        global.gc();
        lastGC = now;
        
        // تحقق مرة أخرى بعد التنظيف
        const afterGC = process.memoryUsage();
        console.log('بعد التنظيف:', {
          heapUsedMB: Math.round(afterGC.heapUsed / 1024 / 1024),
          heapTotalMB: Math.round(afterGC.heapTotal / 1024 / 1024),
          rss: Math.round(afterGC.rss / 1024 / 1024),
        });
      } catch (e) {
        console.error('خطأ أثناء تنظيف الذاكرة:', e);
      }
    } else {
      console.warn('تشغيل Node مع --expose-gc مطلوب لتنظيف الذاكرة يدويًا');
    }
  }
}

/**
 * إدارة ذاكرة النظام وتقديم معلومات عنها
 */
export function getSystemMemoryInfo() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  
  return {
    total: Math.round(totalMemory / 1024 / 1024),
    free: Math.round(freeMemory / 1024 / 1024),
    used: Math.round(usedMemory / 1024 / 1024),
    percentUsed: Math.round((usedMemory / totalMemory) * 100)
  };
}

/**
 * إعداد مراقبة الذاكرة بشكل دوري
 */
export function setupMemoryMonitoring(interval = 300000) { // كل 5 دقائق
  // تشغيل التحقق الأولي
  checkMemoryUsage();
  
  // إعداد فحص دوري
  return setInterval(() => {
    checkMemoryUsage();
    
    // أخذ لقطة من الذاكرة إذا كان الاستخدام عاليًا
    const memoryUsage = process.memoryUsage();
    if (memoryUsage.heapUsed / memoryUsage.heapTotal > MEM_HIGH_WATER) {
      takeHeapSnapshot('high-memory');
    }
  }, interval);
} 