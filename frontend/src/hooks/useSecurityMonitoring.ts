import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

// Types
interface SecurityLog {
  id: string;
  event_type: string;
  severity: string;
  details: any;
  created_at: string;
  blocked: boolean;
}

interface PaymentRequest {
  id: string;
  student_name: string;
  course_name: string;
  amount: number;
  status: string;
  created_at: string;
}

interface Metrics {
  cpu?: number;
  memory?: number;
  disk?: number;
  network?: number;
  api_requests?: number;
  api_errors?: number;
}

interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: string;
}

// Custom hooks
export function useSecurityLogs(autoRefresh: boolean = false) {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (filters?: any) => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/security/logs?${params}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.data || []);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
      toast.error('فشل في جلب سجلات الأمان');
    } finally {
      setLoading(false);
    }
  }, []);

  const logEvent = useCallback(async (
    eventType: string,
    severity: string,
    details: any
  ) => {
    try {
      const response = await fetch('/api/security/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, severity, details })
      });

      const data = await response.json();
      
      if (data.success) {
        // إضافة السجل الجديد للقائمة
        setLogs(prev => [data.data, ...prev]);
        return data.data;
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Failed to log security event:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchLogs();

    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 30000); // كل 30 ثانية
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchLogs]);

  return { logs, loading, error, fetchLogs, logEvent };
}

export function usePaymentRequests() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async (status?: string) => {
    try {
      setLoading(true);
      const params = status ? `?status=${status}` : '';
      const response = await fetch(`/api/payments/request${params}`);
      const data = await response.json();

      if (data.success) {
        setRequests(data.data || []);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment requests');
      toast.error('فشل في جلب طلبات الدفع');
    } finally {
      setLoading(false);
    }
  }, []);

  const createRequest = useCallback(async (requestData: any) => {
    try {
      const response = await fetch('/api/payments/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      
      if (data.success) {
        setRequests(prev => [data.data, ...prev]);
        toast.success('تم إرسال طلب الدفع بنجاح');
        
        // فتح WhatsApp
        if (data.whatsappUrl) {
          window.open(data.whatsappUrl, '_blank');
        }
        
        return data.data;
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error('فشل في إرسال طلب الدفع');
      return null;
    }
  }, []);

  const updateRequest = useCallback(async (
    requestId: string,
    action: 'approve' | 'reject',
    adminId: string,
    notes?: string
  ) => {
    try {
      const response = await fetch('/api/payments/request', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action, adminId, notes })
      });

      const data = await response.json();
      
      if (data.success) {
        // تحديث القائمة
        setRequests(prev => prev.map(req => 
          req.id === requestId ? data.data : req
        ));
        
        toast.success(action === 'approve' ? 'تم قبول الطلب' : 'تم رفض الطلب');
        return data.data;
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error(`فشل في ${action === 'approve' ? 'قبول' : 'رفض'} الطلب`);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return { 
    requests, 
    loading, 
    error, 
    fetchRequests, 
    createRequest,
    updateRequest 
  };
}

export function useSystemMetrics(realTime: boolean = false) {
  const [metrics, setMetrics] = useState<Metrics>({});
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/monitoring/metrics');
      const data = await response.json();

      if (data.success) {
        // تحديث المقاييس الحالية
        const latest = data.data[0];
        if (latest) {
          setMetrics({
            cpu: data.averages.cpu?.avg,
            memory: data.averages.memory?.avg,
            disk: data.averages.disk?.avg,
            network: data.averages.network?.avg,
            api_requests: data.averages.api_requests?.total,
            api_errors: data.averages.api_errors?.total,
          });
        }
        
        setHistory(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const recordMetric = useCallback(async (
    type: string,
    value: number,
    unit?: string
  ) => {
    try {
      const response = await fetch('/api/monitoring/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value, unit })
      });

      const data = await response.json();
      
      if (data.success) {
        // تحديث المقاييس محلياً
        setMetrics(prev => ({ ...prev, [type]: value }));
      }
      
      return data.success;
    } catch (err) {
      console.error('Failed to record metric:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchMetrics();

    if (realTime) {
      const interval = setInterval(fetchMetrics, 5000); // كل 5 ثواني
      return () => clearInterval(interval);
    }
  }, [realTime, fetchMetrics]);

  return { metrics, history, loading, fetchMetrics, recordMetric };
}

export function useRateLimit() {
  const [status, setStatus] = useState<RateLimitStatus | null>(null);
  const [checking, setChecking] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      setChecking(true);
      const response = await fetch('/api/security/rate-limit');
      const data = await response.json();

      if (response.status === 429) {
        setStatus({
          allowed: false,
          remaining: 0,
          limit: 100,
          resetAt: data.resetAt
        });
        
        toast.error('لقد تجاوزت الحد المسموح به من الطلبات');
      } else if (data.success) {
        setStatus({
          allowed: data.allowed,
          remaining: data.remaining,
          limit: data.limit,
          resetAt: data.resetAt
        });
      }
    } catch (err) {
      console.error('Failed to check rate limit:', err);
    } finally {
      setChecking(false);
    }
  }, []);

  return { status, checking, checkStatus };
}

export function usePerformanceTracking() {
  const trackPagePerformance = useCallback(async () => {
    if (typeof window === 'undefined') return;

    // انتظار تحميل الصفحة بالكامل
    window.addEventListener('load', async () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');

      const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime;
      const lcp = navigation.loadEventEnd - navigation.fetchStart;

      const data = {
        pagePath: window.location.pathname,
        loadTime: navigation.loadEventEnd - navigation.fetchStart,
        fcp,
        lcp,
        // FID و CLS يحتاجان لمكتبات خاصة للقياس الدقيق
      };

      try {
        await fetch('/api/monitoring/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } catch (err) {
        console.error('Failed to track performance:', err);
      }
    });
  }, []);

  useEffect(() => {
    trackPagePerformance();
  }, [trackPagePerformance]);

  return { trackPagePerformance };
}

// Hook شامل للأمان والمراقبة
export function useSecurityMonitoring() {
  const securityLogs = useSecurityLogs(true);
  const paymentRequests = usePaymentRequests();
  const systemMetrics = useSystemMetrics(true);
  const rateLimit = useRateLimit();
  const performance = usePerformanceTracking();

  return {
    security: securityLogs,
    payments: paymentRequests,
    metrics: systemMetrics,
    rateLimit,
    performance
  };
}
