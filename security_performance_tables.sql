-- =============================================
-- جداول الأمان والأداء للمنصة التعليمية
-- =============================================

-- 1. جدول سجلات الأمان
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL, -- login_attempt, rate_limit, csrf_blocked, suspicious_activity
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index للبحث السريع
CREATE INDEX idx_security_logs_user ON security_logs(user_id);
CREATE INDEX idx_security_logs_type ON security_logs(event_type);
CREATE INDEX idx_security_logs_severity ON security_logs(severity);
CREATE INDEX idx_security_logs_created ON security_logs(created_at DESC);

-- 2. جدول تتبع معدل الطلبات (Rate Limiting)
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL, -- IP or user_id
  endpoint VARCHAR(255) NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  window_end TIMESTAMP WITH TIME ZONE,
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(identifier, endpoint, window_start)
);

CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start, window_end);

-- 3. جدول جلسات المستخدمين المُحسّنة
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  refresh_token VARCHAR(255) UNIQUE,
  csrf_token VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,
  is_active BOOLEAN DEFAULT true,
  two_factor_verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_active ON user_sessions(is_active, expires_at);

-- 4. جدول مقاييس الأداء
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type VARCHAR(50) NOT NULL, -- cpu, memory, disk, network, api_response, db_query
  value DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20), -- percentage, ms, MB, requests
  metadata JSONB,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_metrics_type ON system_metrics(metric_type);
CREATE INDEX idx_metrics_time ON system_metrics(recorded_at DESC);

-- 5. جدول طلبات الدفع بفودافون كاش
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  student_name VARCHAR(255) NOT NULL,
  student_phone VARCHAR(20) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  vodafone_number VARCHAR(20) NOT NULL,
  teacher_id UUID REFERENCES teachers(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  whatsapp_message TEXT,
  transfer_date TIMESTAMP WITH TIME ZONE,
  approval_date TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_payment_requests_status ON payment_requests(status);
CREATE INDEX idx_payment_requests_student ON payment_requests(student_id);
CREATE INDEX idx_payment_requests_course ON payment_requests(course_id);

-- 6. جدول IPs المحظورة
CREATE TABLE IF NOT EXISTS blocked_ips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET UNIQUE NOT NULL,
  reason TEXT,
  blocked_by UUID REFERENCES users(id),
  blocked_until TIMESTAMP WITH TIME ZONE,
  permanent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_blocked_ips ON blocked_ips(ip_address);
CREATE INDEX idx_blocked_ips_until ON blocked_ips(blocked_until);

-- 7. جدول إعدادات الأمان
CREATE TABLE IF NOT EXISTS security_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- إدخال الإعدادات الافتراضية
INSERT INTO security_config (config_key, config_value, description) VALUES
  ('two_factor_auth', '{"enabled": false, "required_for_admin": true}', 'إعدادات التحقق بخطوتين'),
  ('rate_limiting', '{"enabled": true, "max_requests": 100, "window_minutes": 15}', 'إعدادات حد الطلبات'),
  ('csrf_protection', '{"enabled": true, "token_lifetime": 3600}', 'إعدادات حماية CSRF'),
  ('password_policy', '{"min_length": 8, "require_uppercase": true, "require_lowercase": true, "require_numbers": true, "require_special": true}', 'سياسة كلمة المرور'),
  ('session_config', '{"timeout_minutes": 30, "max_concurrent": 3}', 'إعدادات الجلسة'),
  ('encryption', '{"enabled": true, "algorithm": "AES-256"}', 'إعدادات التشفير')
ON CONFLICT (config_key) DO NOTHING;

-- 8. جدول كاش قاعدة البيانات
CREATE TABLE IF NOT EXISTS cache_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_cache_key ON cache_entries(cache_key);
CREATE INDEX idx_cache_expires ON cache_entries(expires_at);

-- 9. جدول تتبع أخطاء API
CREATE TABLE IF NOT EXISTS api_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER,
  error_message TEXT,
  stack_trace TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET,
  request_body JSONB,
  response_body JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_api_errors_endpoint ON api_errors(endpoint);
CREATE INDEX idx_api_errors_status ON api_errors(status_code);
CREATE INDEX idx_api_errors_time ON api_errors(created_at DESC);

-- 10. جدول إحصائيات الأداء
CREATE TABLE IF NOT EXISTS performance_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path VARCHAR(255) NOT NULL,
  load_time_ms INTEGER,
  fcp_ms INTEGER, -- First Contentful Paint
  lcp_ms INTEGER, -- Largest Contentful Paint
  fid_ms INTEGER, -- First Input Delay
  cls_score DECIMAL(5,3), -- Cumulative Layout Shift
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  device_type VARCHAR(50),
  browser VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_performance_page ON performance_stats(page_path);
CREATE INDEX idx_performance_time ON performance_stats(created_at DESC);

-- دوال مساعدة

-- دالة لتنظيف الكاش المنتهي
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM cache_entries WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- دالة لتنظيف الجلسات المنتهية
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE user_sessions 
  SET is_active = false 
  WHERE expires_at < NOW() AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- دالة لحساب معدل نجاح API
CREATE OR REPLACE FUNCTION calculate_api_success_rate(time_range INTERVAL DEFAULT '1 hour')
RETURNS DECIMAL AS $$
DECLARE
  total_requests INTEGER;
  error_requests INTEGER;
  success_rate DECIMAL;
BEGIN
  SELECT COUNT(*) INTO error_requests
  FROM api_errors
  WHERE created_at > NOW() - time_range;
  
  -- نفترض أن total_requests يأتي من جدول آخر أو نحسبه
  -- هنا نستخدم قيمة تقديرية
  total_requests := error_requests * 100; -- نفترض 1% معدل خطأ
  
  IF total_requests > 0 THEN
    success_rate := ((total_requests - error_requests)::DECIMAL / total_requests) * 100;
  ELSE
    success_rate := 100;
  END IF;
  
  RETURN success_rate;
END;
$$ LANGUAGE plpgsql;

-- Triggers

-- Trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rate_limits_updated_at BEFORE UPDATE ON rate_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_requests_updated_at BEFORE UPDATE ON payment_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_config_updated_at BEFORE UPDATE ON security_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)

-- تفعيل RLS على الجداول الحساسة
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_config ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للأدمن فقط
CREATE POLICY admin_only_security_logs ON security_logs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY admin_only_blocked_ips ON blocked_ips
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY admin_only_security_config ON security_config
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- سياسة للمستخدمين لرؤية جلساتهم فقط
CREATE POLICY users_own_sessions ON user_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- منح الصلاحيات
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
