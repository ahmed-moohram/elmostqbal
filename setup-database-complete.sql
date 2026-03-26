-- =============================================
-- سكريبت كامل لإنشاء قاعدة البيانات والربط
-- يُطبق مرة واحدة في Supabase SQL Editor
-- =============================================

-- تأكد من حذف الجداول القديمة أولاً
DROP TABLE IF EXISTS api_errors CASCADE;
DROP TABLE IF EXISTS performance_stats CASCADE;
DROP TABLE IF EXISTS cache_entries CASCADE;
DROP TABLE IF EXISTS security_config CASCADE;
DROP TABLE IF EXISTS blocked_ips CASCADE;
DROP TABLE IF EXISTS payment_requests CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS rate_limits CASCADE;
DROP TABLE IF EXISTS security_logs CASCADE;
DROP TABLE IF EXISTS system_metrics CASCADE;

-- =============================================
-- 1. جداول الأمان والأداء
-- =============================================

-- جدول سجلات الأمان
CREATE TABLE security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول معدل الطلبات
CREATE TABLE rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  window_end TIMESTAMPTZ,
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(identifier, endpoint, window_start)
);

-- جدول الجلسات
CREATE TABLE user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  refresh_token VARCHAR(255) UNIQUE,
  csrf_token VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,
  is_active BOOLEAN DEFAULT true,
  two_factor_verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول طلبات الدفع
CREATE TABLE payment_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID,
  course_id UUID,
  student_name VARCHAR(255) NOT NULL,
  student_phone VARCHAR(20) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  vodafone_number VARCHAR(20) NOT NULL,
  teacher_id UUID,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  whatsapp_message TEXT,
  transfer_date TIMESTAMPTZ,
  approval_date TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول IPs المحظورة
CREATE TABLE blocked_ips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET UNIQUE NOT NULL,
  reason TEXT,
  blocked_by UUID REFERENCES auth.users(id),
  blocked_until TIMESTAMPTZ,
  permanent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول إعدادات الأمان
CREATE TABLE security_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول مقاييس النظام
CREATE TABLE system_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type VARCHAR(50) NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20),
  metadata JSONB,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الكاش
CREATE TABLE cache_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول أخطاء API
CREATE TABLE api_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER,
  error_message TEXT,
  stack_trace TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  request_body JSONB,
  response_body JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول إحصائيات الأداء
CREATE TABLE performance_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path VARCHAR(255) NOT NULL,
  load_time_ms INTEGER,
  fcp_ms INTEGER,
  lcp_ms INTEGER,
  fid_ms INTEGER,
  cls_score DECIMAL(5,3),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  device_type VARCHAR(50),
  browser VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. إنشاء الفهارس للأداء
-- =============================================

CREATE INDEX idx_security_logs_user ON security_logs(user_id);
CREATE INDEX idx_security_logs_type ON security_logs(event_type);
CREATE INDEX idx_security_logs_severity ON security_logs(severity);
CREATE INDEX idx_security_logs_created ON security_logs(created_at DESC);

CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start, window_end);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_active ON user_sessions(is_active, expires_at);

CREATE INDEX idx_payment_requests_status ON payment_requests(status);
CREATE INDEX idx_payment_requests_student ON payment_requests(student_id);
CREATE INDEX idx_payment_requests_course ON payment_requests(course_id);

CREATE INDEX idx_blocked_ips ON blocked_ips(ip_address);
CREATE INDEX idx_blocked_ips_until ON blocked_ips(blocked_until);

CREATE INDEX idx_metrics_type ON system_metrics(metric_type);
CREATE INDEX idx_metrics_time ON system_metrics(recorded_at DESC);

CREATE INDEX idx_cache_key ON cache_entries(cache_key);
CREATE INDEX idx_cache_expires ON cache_entries(expires_at);

CREATE INDEX idx_api_errors_endpoint ON api_errors(endpoint);
CREATE INDEX idx_api_errors_status ON api_errors(status_code);
CREATE INDEX idx_api_errors_time ON api_errors(created_at DESC);

CREATE INDEX idx_performance_page ON performance_stats(page_path);
CREATE INDEX idx_performance_time ON performance_stats(created_at DESC);

-- =============================================
-- 3. إدخال البيانات الافتراضية
-- =============================================

-- إعدادات الأمان الافتراضية
INSERT INTO security_config (config_key, config_value, description) VALUES
  ('two_factor_auth', '{"enabled": false, "required_for_admin": true}', 'إعدادات التحقق بخطوتين'),
  ('rate_limiting', '{"enabled": true, "max_requests": 100, "window_minutes": 15}', 'إعدادات حد الطلبات'),
  ('csrf_protection', '{"enabled": true, "token_lifetime": 3600}', 'إعدادات حماية CSRF'),
  ('password_policy', '{"min_length": 8, "require_uppercase": true, "require_lowercase": true, "require_numbers": true, "require_special": true}', 'سياسة كلمة المرور'),
  ('session_config', '{"timeout_minutes": 30, "max_concurrent": 3}', 'إعدادات الجلسة'),
  ('encryption', '{"enabled": true, "algorithm": "AES-256"}', 'إعدادات التشفير')
ON CONFLICT (config_key) DO NOTHING;

-- =============================================
-- 4. دوال مساعدة
-- =============================================

-- دالة تنظيف الكاش المنتهي
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM cache_entries WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- دالة تنظيف الجلسات المنتهية
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE user_sessions 
  SET is_active = false 
  WHERE expires_at < NOW() AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- دالة حساب معدل نجاح API
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
  
  total_requests := GREATEST(error_requests * 100, 100);
  
  IF total_requests > 0 THEN
    success_rate := ((total_requests - error_requests)::DECIMAL / total_requests) * 100;
  ELSE
    success_rate := 100;
  END IF;
  
  RETURN success_rate;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 5. Triggers
-- =============================================

-- Trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rate_limits_updated_at 
  BEFORE UPDATE ON rate_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_requests_updated_at 
  BEFORE UPDATE ON payment_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_config_updated_at 
  BEFORE UPDATE ON security_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 6. Row Level Security (RLS)
-- =============================================

-- تفعيل RLS
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- سياسات للقراءة العامة (للتطوير)
CREATE POLICY "Allow public read for development" ON security_logs FOR SELECT USING (true);
CREATE POLICY "Allow public read for development" ON user_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public read for development" ON blocked_ips FOR SELECT USING (true);
CREATE POLICY "Allow public read for development" ON security_config FOR SELECT USING (true);
CREATE POLICY "Allow public read for development" ON payment_requests FOR SELECT USING (true);
CREATE POLICY "Allow public read for development" ON rate_limits FOR SELECT USING (true);
CREATE POLICY "Allow public read for development" ON system_metrics FOR SELECT USING (true);
CREATE POLICY "Allow public read for development" ON cache_entries FOR SELECT USING (true);
CREATE POLICY "Allow public read for development" ON api_errors FOR SELECT USING (true);
CREATE POLICY "Allow public read for development" ON performance_stats FOR SELECT USING (true);

-- سياسات للكتابة العامة (للتطوير)
CREATE POLICY "Allow public insert for development" ON security_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert for development" ON user_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert for development" ON payment_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert for development" ON rate_limits FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert for development" ON system_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert for development" ON cache_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert for development" ON api_errors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert for development" ON performance_stats FOR INSERT WITH CHECK (true);

-- سياسات للتحديث (للتطوير)
CREATE POLICY "Allow public update for development" ON user_sessions FOR UPDATE USING (true);
CREATE POLICY "Allow public update for development" ON payment_requests FOR UPDATE USING (true);
CREATE POLICY "Allow public update for development" ON rate_limits FOR UPDATE USING (true);
CREATE POLICY "Allow public update for development" ON security_config FOR UPDATE USING (true);
CREATE POLICY "Allow public update for development" ON cache_entries FOR UPDATE USING (true);

-- سياسات للحذف (للتطوير)
CREATE POLICY "Allow public delete for development" ON blocked_ips FOR DELETE USING (true);
CREATE POLICY "Allow public delete for development" ON cache_entries FOR DELETE USING (true);

-- =============================================
-- 7. إضافة بيانات تجريبية
-- =============================================

-- إضافة سجل أمان تجريبي
INSERT INTO security_logs (event_type, severity, details, blocked)
VALUES ('login_attempt', 'low', '{"message": "تسجيل دخول ناجح"}'::jsonb, false);

-- إضافة طلب دفع تجريبي
INSERT INTO payment_requests (
  student_name, student_phone, course_name, 
  amount, vodafone_number, status
) VALUES (
  'طالب تجريبي', '01000000000', 'دورة تجريبية',
  299, '01098765432', 'pending'
);

-- إضافة مقياس أداء تجريبي
INSERT INTO system_metrics (metric_type, value, unit)
VALUES ('cpu', 45.5, 'percentage');

-- =============================================
-- 8. رسالة النجاح
-- =============================================

-- التحقق من إنشاء الجداول
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'security_logs', 'rate_limits', 'user_sessions',
    'payment_requests', 'blocked_ips', 'security_config',
    'system_metrics', 'cache_entries', 'api_errors',
    'performance_stats'
  );
  
  IF table_count = 10 THEN
    RAISE NOTICE '✅ تم إنشاء جميع جداول الأمان والأداء بنجاح! (% جداول)', table_count;
  ELSE
    RAISE WARNING '⚠️ تم إنشاء % جداول فقط من أصل 10', table_count;
  END IF;
END $$;
