/**
 * أنواع قاعدة بيانات الأمان والأداء
 * يجب تطبيق جداول SQL أولاً في Supabase
 */

export interface SecurityLog {
  id: string;
  user_id?: string;
  event_type: 'login_attempt' | 'rate_limit' | 'csrf_blocked' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip_address?: string;
  user_agent?: string;
  details?: any;
  blocked?: boolean;
  created_at: string;
}

export interface RateLimit {
  id: string;
  identifier: string;
  endpoint: string;
  request_count: number;
  window_start: string;
  window_end?: string;
  blocked_until?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  refresh_token?: string;
  csrf_token?: string;
  ip_address?: string;
  user_agent?: string;
  device_info?: any;
  is_active: boolean;
  two_factor_verified?: boolean;
  expires_at: string;
  last_activity: string;
  created_at: string;
}

export interface PaymentRequest {
  id: string;
  student_id: string;
  course_id: string;
  student_name: string;
  student_phone: string;
  course_name: string;
  amount: number;
  vodafone_number: string;
  teacher_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  whatsapp_message?: string;
  transfer_date?: string;
  approval_date?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface BlockedIP {
  id: string;
  ip_address: string;
  reason?: string;
  blocked_by?: string;
  blocked_until?: string;
  permanent?: boolean;
  created_at: string;
}

export interface SecurityConfig {
  id: string;
  config_key: string;
  config_value: any;
  description?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SystemMetric {
  id: string;
  metric_type: string;
  value: number;
  unit?: string;
  metadata?: any;
  recorded_at: string;
}

export interface CacheEntry {
  id: string;
  cache_key: string;
  cache_value: any;
  expires_at: string;
  created_at: string;
}

export interface APIError {
  id: string;
  endpoint: string;
  method: string;
  status_code?: number;
  error_message: string;
  stack_trace?: string;
  user_id?: string;
  ip_address?: string;
  request_body?: any;
  response_body?: any;
  created_at: string;
}

export interface PerformanceStat {
  id: string;
  page_path: string;
  load_time_ms?: number;
  fcp_ms?: number;
  lcp_ms?: number;
  fid_ms?: number;
  cls_score?: number;
  user_id?: string;
  device_type?: string;
  browser?: string;
  created_at: string;
}

// Database schema type
export interface Database {
  public: {
    Tables: {
      security_logs: {
        Row: SecurityLog;
        Insert: Omit<SecurityLog, 'id' | 'created_at'>;
        Update: Partial<Omit<SecurityLog, 'id' | 'created_at'>>;
      };
      rate_limits: {
        Row: RateLimit;
        Insert: Omit<RateLimit, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<RateLimit, 'id' | 'created_at'>>;
      };
      user_sessions: {
        Row: UserSession;
        Insert: Omit<UserSession, 'id' | 'created_at'>;
        Update: Partial<Omit<UserSession, 'id' | 'created_at'>>;
      };
      payment_requests: {
        Row: PaymentRequest;
        Insert: Omit<PaymentRequest, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PaymentRequest, 'id' | 'created_at'>>;
      };
      blocked_ips: {
        Row: BlockedIP;
        Insert: Omit<BlockedIP, 'id' | 'created_at'>;
        Update: Partial<Omit<BlockedIP, 'id' | 'created_at'>>;
      };
      security_config: {
        Row: SecurityConfig;
        Insert: Omit<SecurityConfig, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SecurityConfig, 'id' | 'created_at'>>;
      };
      system_metrics: {
        Row: SystemMetric;
        Insert: Omit<SystemMetric, 'id' | 'recorded_at'>;
        Update: Partial<Omit<SystemMetric, 'id' | 'recorded_at'>>;
      };
      cache_entries: {
        Row: CacheEntry;
        Insert: Omit<CacheEntry, 'id' | 'created_at'>;
        Update: Partial<Omit<CacheEntry, 'id' | 'created_at'>>;
      };
      api_errors: {
        Row: APIError;
        Insert: Omit<APIError, 'id' | 'created_at'>;
        Update: Partial<Omit<APIError, 'id' | 'created_at'>>;
      };
      performance_stats: {
        Row: PerformanceStat;
        Insert: Omit<PerformanceStat, 'id' | 'created_at'>;
        Update: Partial<Omit<PerformanceStat, 'id' | 'created_at'>>;
      };
    };
  };
}
