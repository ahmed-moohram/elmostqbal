-- =============================================
-- جداول الأمان والأداء (نسخة آمنة مع فحص الوجود)
-- =============================================

-- حذف الجداول القديمة إذا كانت موجودة (اختياري)
-- إذا كنت تريد البدء من جديد، قم بإلغاء التعليق عن الأسطر التالية:
/*
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
*/

-- =============================================
-- 1. جدول سجلات الأمان
-- =============================================
CREATE TABLE IF NOT EXISTS security_logs (
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

-- حذف الفهارس القديمة إذا كانت موجودة
DROP INDEX IF EXISTS idx_security_logs_user;
DROP INDEX IF EXISTS idx_security_logs_type;
DROP INDEX IF EXISTS idx_security_logs_severity;
DROP INDEX IF EXISTS idx_security_logs_created;

-- إنشاء الفهارس
CREATE INDEX idx_security_logs_user ON security_logs(user_id);
CREATE INDEX idx_security_logs_type ON security_logs(event_type);
CREATE INDEX idx_security_logs_severity ON security_logs(severity);
CREATE INDEX idx_security_logs_created ON security_logs(created_at DESC);

-- =============================================
-- 2. جدول معدل الطلبات
-- =============================================
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  window_end TIMESTAMPTZ,
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- حذف القيد الفريد القديم إذا كان موجوداً
ALTER TABLE rate_limits DROP CONSTRAINT IF EXISTS rate_limits_identifier_endpoint_window_start_key;
-- إضافة القيد الفريد
ALTER TABLE rate_limits ADD CONSTRAINT rate_limits_unique UNIQUE(identifier, endpoint, window_start);

DROP INDEX IF EXISTS idx_rate_limits_identifier;
DROP INDEX IF EXISTS idx_rate_limits_window;

CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start, window_end);

-- =============================================
-- 3. جدول الجلسات
-- =============================================
CREATE TABLE IF NOT EXISTS user_sessions (
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

DROP INDEX IF EXISTS idx_sessions_user;
DROP INDEX IF EXISTS idx_sessions_token;
DROP INDEX IF EXISTS idx_sessions_active;

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_active ON user_sessions(is_active, expires_at);

-- =============================================
-- 4. جدول مقاييس النظام
-- =============================================
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type VARCHAR(50) NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20),
  metadata JSONB,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_metrics_type;
DROP INDEX IF EXISTS idx_metrics_time;

CREATE INDEX idx_metrics_type ON system_metrics(metric_type);
CREATE INDEX idx_metrics_time ON system_metrics(recorded_at DESC);

-- =============================================
-- 5. جدول طلبات الدفع
-- =============================================
-- تحقق من وجود جداول students, courses, teachers
DO $$
BEGIN
  -- إنشاء الجداول المطلوبة إذا لم تكن موجودة
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students') THEN
    CREATE TABLE students (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teachers') THEN
    CREATE TABLE teachers (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') THEN
    CREATE TABLE courses (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS payment_requests (
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

DROP INDEX IF EXISTS idx_payment_requests_status;
DROP INDEX IF EXISTS idx_payment_requests_student;
DROP INDEX IF EXISTS idx_payment_requests_course;

CREATE INDEX idx_payment_requests_status ON payment_requests(status);
CREATE INDEX idx_payment_requests_student ON payment_requests(student_id);
CREATE INDEX idx_payment_requests_course ON payment_requests(course_id);

-- =============================================
-- 6. جدول IPs المحظورة
-- =============================================
CREATE TABLE IF NOT EXISTS blocked_ips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET UNIQUE NOT NULL,
  reason TEXT,
  blocked_by UUID REFERENCES auth.users(id),
  blocked_until TIMESTAMPTZ,
  permanent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_blocked_ips;
DROP INDEX IF EXISTS idx_blocked_ips_until;

CREATE INDEX idx_blocked_ips ON blocked_ips(ip_address);
CREATE INDEX idx_blocked_ips_until ON blocked_ips(blocked_until);

-- =============================================
-- 7. جدول إعدادات الأمان
-- =============================================
CREATE TABLE IF NOT EXISTS security_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إدخال الإعدادات الافتراضية (مع تجاهل التكرار)
INSERT INTO security_config (config_key, config_value, description) VALUES
  ('two_factor_auth', '{"enabled": false, "required_for_admin": true}', 'إعدادات التحقق بخطوتين'),
  ('rate_limiting', '{"enabled": true, "max_requests": 100, "window_minutes": 15}', 'إعدادات حد الطلبات'),
  ('csrf_protection', '{"enabled": true, "token_lifetime": 3600}', 'إعدادات حماية CSRF'),
  ('password_policy', '{"min_length": 8, "require_uppercase": true, "require_lowercase": true, "require_numbers": true, "require_special": true}', 'سياسة كلمة المرور'),
  ('session_config', '{"timeout_minutes": 30, "max_concurrent": 3}', 'إعدادات الجلسة'),
  ('encryption', '{"enabled": true, "algorithm": "AES-256"}', 'إعدادات التشفير')
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- =============================================
-- 8. جدول الكاش
-- =============================================
CREATE TABLE IF NOT EXISTS cache_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_cache_key;
DROP INDEX IF EXISTS idx_cache_expires;

CREATE INDEX idx_cache_key ON cache_entries(cache_key);
CREATE INDEX idx_cache_expires ON cache_entries(expires_at);

-- =============================================
-- 9. جدول أخطاء API
-- =============================================
CREATE TABLE IF NOT EXISTS api_errors (
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

DROP INDEX IF EXISTS idx_api_errors_endpoint;
DROP INDEX IF EXISTS idx_api_errors_status;
DROP INDEX IF EXISTS idx_api_errors_time;

CREATE INDEX idx_api_errors_endpoint ON api_errors(endpoint);
CREATE INDEX idx_api_errors_status ON api_errors(status_code);
CREATE INDEX idx_api_errors_time ON api_errors(created_at DESC);

-- =============================================
-- 10. جدول إحصائيات الأداء
-- =============================================
CREATE TABLE IF NOT EXISTS performance_stats (
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

DROP INDEX IF EXISTS idx_performance_page;
DROP INDEX IF EXISTS idx_performance_time;

CREATE INDEX idx_performance_page ON performance_stats(page_path);
CREATE INDEX idx_performance_time ON performance_stats(created_at DESC);

-- =============================================
-- الدوال المساعدة
-- =============================================

-- دالة تنظيف الكاش
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM cache_entries WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- دالة تنظيف الجلسات
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
-- Triggers
-- =============================================

-- دالة تحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- حذف التريجرز القديمة إذا كانت موجودة
DROP TRIGGER IF EXISTS update_rate_limits_updated_at ON rate_limits;
DROP TRIGGER IF EXISTS update_payment_requests_updated_at ON payment_requests;
DROP TRIGGER IF EXISTS update_security_config_updated_at ON security_config;

-- إنشاء التريجرز
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
-- Row Level Security (RLS)
-- =============================================

-- تفعيل RLS
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة إذا كانت موجودة
DROP POLICY IF EXISTS "Allow public read for development" ON security_logs;
DROP POLICY IF EXISTS "Allow public insert for development" ON security_logs;
DROP POLICY IF EXISTS "Allow public read for development" ON user_sessions;
DROP POLICY IF EXISTS "Allow public insert for development" ON user_sessions;
DROP POLICY IF EXISTS "Allow public update for development" ON user_sessions;
DROP POLICY IF EXISTS "Allow public read for development" ON blocked_ips;
DROP POLICY IF EXISTS "Allow public delete for development" ON blocked_ips;
DROP POLICY IF EXISTS "Allow public read for development" ON security_config;
DROP POLICY IF EXISTS "Allow public update for development" ON security_config;
DROP POLICY IF EXISTS "Allow public read for development" ON payment_requests;
DROP POLICY IF EXISTS "Allow public insert for development" ON payment_requests;
DROP POLICY IF EXISTS "Allow public update for development" ON payment_requests;
DROP POLICY IF EXISTS "Allow public read for development" ON rate_limits;
DROP POLICY IF EXISTS "Allow public insert for development" ON rate_limits;
DROP POLICY IF EXISTS "Allow public update for development" ON rate_limits;
DROP POLICY IF EXISTS "Allow public read for development" ON system_metrics;
DROP POLICY IF EXISTS "Allow public insert for development" ON system_metrics;
DROP POLICY IF EXISTS "Allow public read for development" ON cache_entries;
DROP POLICY IF EXISTS "Allow public insert for development" ON cache_entries;
DROP POLICY IF EXISTS "Allow public update for development" ON cache_entries;
DROP POLICY IF EXISTS "Allow public delete for development" ON cache_entries;
DROP POLICY IF EXISTS "Allow public read for development" ON api_errors;
DROP POLICY IF EXISTS "Allow public insert for development" ON api_errors;
DROP POLICY IF EXISTS "Allow public read for development" ON performance_stats;
DROP POLICY IF EXISTS "Allow public insert for development" ON performance_stats;

-- سياسات القراءة العامة (للتطوير)
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

-- سياسات الكتابة (للتطوير)
CREATE POLICY "Allow public insert for development" ON security_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert for development" ON user_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert for development" ON payment_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert for development" ON rate_limits FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert for development" ON system_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert for development" ON cache_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert for development" ON api_errors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert for development" ON performance_stats FOR INSERT WITH CHECK (true);

-- سياسات التحديث (للتطوير)
CREATE POLICY "Allow public update for development" ON user_sessions FOR UPDATE USING (true);
CREATE POLICY "Allow public update for development" ON payment_requests FOR UPDATE USING (true);
CREATE POLICY "Allow public update for development" ON rate_limits FOR UPDATE USING (true);
CREATE POLICY "Allow public update for development" ON security_config FOR UPDATE USING (true);
CREATE POLICY "Allow public update for development" ON cache_entries FOR UPDATE USING (true);

-- سياسات الحذف (للتطوير)
CREATE POLICY "Allow public delete for development" ON blocked_ips FOR DELETE USING (true);
CREATE POLICY "Allow public delete for development" ON cache_entries FOR DELETE USING (true);

-- =============================================
-- إضافة بيانات تجريبية
-- =============================================

-- سجل أمان تجريبي
INSERT INTO security_logs (event_type, severity, details, blocked)
SELECT 'login_attempt', 'low', '{"message": "تسجيل دخول تجريبي"}'::jsonb, false
WHERE NOT EXISTS (
  SELECT 1 FROM security_logs WHERE event_type = 'login_attempt' LIMIT 1
);

-- طلب دفع تجريبي
INSERT INTO payment_requests (
  student_name, student_phone, course_name, 
  amount, vodafone_number, status
) 
SELECT 'طالب تجريبي', '01000000000', 'دورة تجريبية',
  299, '01098765432', 'pending'
WHERE NOT EXISTS (
  SELECT 1 FROM payment_requests WHERE student_name = 'طالب تجريبي' LIMIT 1
);

-- مقياس أداء تجريبي
INSERT INTO system_metrics (metric_type, value, unit)
SELECT 'cpu', 45.5, 'percentage'
WHERE NOT EXISTS (
  SELECT 1 FROM system_metrics WHERE metric_type = 'cpu' LIMIT 1
);

-- =============================================
-- رسالة النجاح
-- =============================================
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
  
  RAISE NOTICE '✅ تم إنشاء/تحديث % جداول من أصل 10', table_count;
  RAISE NOTICE '✅ النظام جاهز للعمل!';
END $$;
