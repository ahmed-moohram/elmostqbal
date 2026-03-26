import { supabase } from '@/lib/supabase';

/**
 * Security Database Operations
 * عمليات قاعدة بيانات الأمان
 */

// ================ Security Logs ================

export async function logSecurityEvent(
  eventType: 'login_attempt' | 'rate_limit' | 'csrf_blocked' | 'suspicious_activity',
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: any,
  userId?: string,
  blocked: boolean = false
) {
  try {
    const { data, error } = await supabase
      .from('security_logs')
      .insert({
        user_id: userId,
        event_type: eventType,
        severity,
        details,
        blocked,
        ip_address: await getUserIP(),
        user_agent: navigator.userAgent
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error logging security event:', error);
    return null;
  }
}

export async function getSecurityLogs(filters?: {
  userId?: string;
  eventType?: string;
  severity?: string;
  limit?: number;
}) {
  try {
    let query = supabase
      .from('security_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.userId) query = query.eq('user_id', filters.userId);
    if (filters?.eventType) query = query.eq('event_type', filters.eventType);
    if (filters?.severity) query = query.eq('severity', filters.severity);
    if (filters?.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error fetching security logs:', error);
    return [];
  }
}

// ================ Rate Limiting ================

export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  maxRequests: number = 100,
  windowMinutes: number = 15
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

    // Get current count
    const { data: existing, error: fetchError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existing) {
      // Check if blocked
      if (existing.blocked_until && new Date(existing.blocked_until) > new Date()) {
        return { allowed: false, remaining: 0 };
      }

      // Update count
      const newCount = existing.request_count + 1;
      const { error: updateError } = await supabase
        .from('rate_limits')
        .update({ 
          request_count: newCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) throw updateError;

      const remaining = maxRequests - newCount;
      
      // Block if exceeded
      if (remaining <= 0) {
        const blockedUntil = new Date();
        blockedUntil.setMinutes(blockedUntil.getMinutes() + windowMinutes);
        
        await supabase
          .from('rate_limits')
          .update({ blocked_until: blockedUntil.toISOString() })
          .eq('id', existing.id);
        
        await logSecurityEvent('rate_limit', 'medium', {
          identifier,
          endpoint,
          requests: newCount
        }, undefined, true);
      }

      return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
    } else {
      // Create new record
      const windowEnd = new Date();
      windowEnd.setMinutes(windowEnd.getMinutes() + windowMinutes);
      
      const { error: insertError } = await supabase
        .from('rate_limits')
        .insert({
          identifier,
          endpoint,
          request_count: 1,
          window_start: new Date().toISOString(),
          window_end: windowEnd.toISOString()
        });

      if (insertError) throw insertError;
      
      return { allowed: true, remaining: maxRequests - 1 };
    }
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return { allowed: true, remaining: 100 }; // Fail open for now
  }
}

// ================ User Sessions ================

export async function createUserSession(
  userId: string,
  sessionToken: string,
  refreshToken?: string,
  csrfToken?: string
) {
  try {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minutes

    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        session_token: sessionToken,
        refresh_token: refreshToken,
        csrf_token: csrfToken,
        ip_address: await getUserIP(),
        user_agent: navigator.userAgent,
        device_info: getDeviceInfo(),
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating user session:', error);
    return null;
  }
}

export async function validateSession(sessionToken: string) {
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (error || !data) return null;

    // Update last activity
    await supabase
      .from('user_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', data.id);

    return data;
  } catch (error) {
    console.error('Error validating session:', error);
    return null;
  }
}

export async function invalidateSession(sessionToken: string) {
  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('session_token', sessionToken);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error invalidating session:', error);
    return false;
  }
}

// ================ Payment Requests ================

export async function createPaymentRequest(data: {
  studentId: string;
  courseId: string;
  studentName: string;
  studentPhone: string;
  courseName: string;
  amount: number;
  vodafoneNumber: string;
  teacherId?: string;
  whatsappMessage?: string;
}) {
  try {
    const { data: request, error } = await supabase
      .from('payment_requests')
      .insert({
        student_id: data.studentId,
        course_id: data.courseId,
        student_name: data.studentName,
        student_phone: data.studentPhone,
        course_name: data.courseName,
        amount: data.amount,
        vodafone_number: data.vodafoneNumber,
        teacher_id: data.teacherId,
        whatsapp_message: data.whatsappMessage,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return request;
  } catch (error) {
    console.error('Error creating payment request:', error);
    return null;
  }
}

export async function getPaymentRequests(status?: 'pending' | 'approved' | 'rejected') {
  try {
    let query = supabase
      .from('payment_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching payment requests:', error);
    return [];
  }
}

export async function approvePaymentRequest(
  requestId: string,
  approvedBy: string,
  notes?: string
) {
  try {
    const { data, error } = await supabase
      .from('payment_requests')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approval_date: new Date().toISOString(),
        admin_notes: notes
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;

    // Create enrollment for the student
    if (data) {
      await supabase
        .from('enrollments')
        .insert({
          student_id: data.student_id,
          course_id: data.course_id,
          payment_status: 'completed',
          payment_amount: data.amount,
          payment_method: 'vodafone_cash'
        });
    }

    return data;
  } catch (error) {
    console.error('Error approving payment request:', error);
    return null;
  }
}

export async function rejectPaymentRequest(
  requestId: string,
  rejectedBy: string,
  reason: string
) {
  try {
    const { data, error } = await supabase
      .from('payment_requests')
      .update({
        status: 'rejected',
        approved_by: rejectedBy,
        approval_date: new Date().toISOString(),
        admin_notes: reason
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error rejecting payment request:', error);
    return null;
  }
}

// ================ Blocked IPs ================

export async function blockIP(
  ipAddress: string,
  reason: string,
  blockedBy: string,
  permanent: boolean = false,
  blockedUntil?: Date
) {
  try {
    const { data, error } = await supabase
      .from('blocked_ips')
      .insert({
        ip_address: ipAddress,
        reason,
        blocked_by: blockedBy,
        permanent,
        blocked_until: blockedUntil?.toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error blocking IP:', error);
    return null;
  }
}

export async function unblockIP(ipAddress: string) {
  try {
    const { error } = await supabase
      .from('blocked_ips')
      .delete()
      .eq('ip_address', ipAddress);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error unblocking IP:', error);
    return false;
  }
}

export async function isIPBlocked(ipAddress: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('blocked_ips')
      .select('*')
      .eq('ip_address', ipAddress)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) return false;

    // Check if temporary block has expired
    if (!data.permanent && data.blocked_until) {
      if (new Date(data.blocked_until) < new Date()) {
        await unblockIP(ipAddress);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error checking IP block:', error);
    return false;
  }
}

// ================ Security Config ================

export async function getSecurityConfig(key?: string) {
  try {
    if (key) {
      const { data, error } = await supabase
        .from('security_config')
        .select('*')
        .eq('config_key', key)
        .single();

      if (error) throw error;
      return data?.config_value;
    } else {
      const { data, error } = await supabase
        .from('security_config')
        .select('*');

      if (error) throw error;
      
      const config: Record<string, any> = {};
      data?.forEach(item => {
        config[item.config_key] = item.config_value;
      });
      
      return config;
    }
  } catch (error) {
    console.error('Error fetching security config:', error);
    return null;
  }
}

export async function updateSecurityConfig(
  key: string,
  value: any,
  updatedBy: string
) {
  try {
    const { data, error } = await supabase
      .from('security_config')
      .update({
        config_value: value,
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      })
      .eq('config_key', key)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating security config:', error);
    return null;
  }
}

// ================ System Metrics ================

export async function recordMetric(
  metricType: string,
  value: number,
  unit?: string,
  metadata?: any
) {
  try {
    const { error } = await supabase
      .from('system_metrics')
      .insert({
        metric_type: metricType,
        value,
        unit,
        metadata
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error recording metric:', error);
    return false;
  }
}

export async function getMetrics(
  metricType?: string,
  timeRange?: { start: Date; end: Date }
) {
  try {
    let query = supabase
      .from('system_metrics')
      .select('*')
      .order('recorded_at', { ascending: false });

    if (metricType) query = query.eq('metric_type', metricType);
    
    if (timeRange) {
      query = query
        .gte('recorded_at', timeRange.start.toISOString())
        .lte('recorded_at', timeRange.end.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return [];
  }
}

// ================ Cache Operations ================

export async function getCached(key: string) {
  try {
    const { data, error } = await supabase
      .from('cache_entries')
      .select('*')
      .eq('cache_key', key)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (error || !data) return null;
    return data.cache_value;
  } catch (error) {
    return null;
  }
}

export async function setCached(key: string, value: any, ttlSeconds: number = 3600) {
  try {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + ttlSeconds);

    const { error } = await supabase
      .from('cache_entries')
      .upsert({
        cache_key: key,
        cache_value: value,
        expires_at: expiresAt.toISOString()
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error setting cache:', error);
    return false;
  }
}

// ================ Helper Functions ================

async function getUserIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return '0.0.0.0';
  }
}

function getDeviceInfo() {
  return {
    screen: {
      width: window.screen.width,
      height: window.screen.height
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    deviceMemory: (navigator as any).deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency
  };
}

// ================ Performance Tracking ================

export async function trackPerformance(data: {
  pagePath: string;
  loadTime?: number;
  fcp?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  userId?: string;
}) {
  try {
    const deviceType = /Mobile/.test(navigator.userAgent) ? 'mobile' : 'desktop';
    
    const { error } = await supabase
      .from('performance_stats')
      .insert({
        page_path: data.pagePath,
        load_time_ms: data.loadTime,
        fcp_ms: data.fcp,
        lcp_ms: data.lcp,
        fid_ms: data.fid,
        cls_score: data.cls,
        user_id: data.userId,
        device_type: deviceType,
        browser: getBrowser()
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error tracking performance:', error);
    return false;
  }
}

function getBrowser(): string {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
}

// ================ API Error Tracking ================

export async function logAPIError(data: {
  endpoint: string;
  method: string;
  statusCode?: number;
  errorMessage: string;
  stackTrace?: string;
  userId?: string;
  requestBody?: any;
  responseBody?: any;
}) {
  try {
    const { error } = await supabase
      .from('api_errors')
      .insert({
        endpoint: data.endpoint,
        method: data.method,
        status_code: data.statusCode,
        error_message: data.errorMessage,
        stack_trace: data.stackTrace,
        user_id: data.userId,
        ip_address: await getUserIP(),
        request_body: data.requestBody,
        response_body: data.responseBody
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error logging API error:', error);
    return false;
  }
}

export async function getAPIErrors(filters?: {
  endpoint?: string;
  statusCode?: number;
  limit?: number;
}) {
  try {
    let query = supabase
      .from('api_errors')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.endpoint) query = query.eq('endpoint', filters.endpoint);
    if (filters?.statusCode) query = query.eq('status_code', filters.statusCode);
    if (filters?.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching API errors:', error);
    return [];
  }
}
