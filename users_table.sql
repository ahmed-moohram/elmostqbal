-- =============================================
-- جدول المستخدمين الشامل
-- =============================================

-- إنشاء جدول المستخدمين الرئيسي
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- معلومات أساسية
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255),
    
    -- معلومات إضافية
    avatar_url TEXT,
    bio TEXT,
    birth_date DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    
    -- معلومات العائلة (للطلاب)
    father_name VARCHAR(255),
    student_phone VARCHAR(20),
    parent_phone VARCHAR(20),
    mother_phone VARCHAR(20),
    guardian_job VARCHAR(255),
    
    -- معلومات التعليم
    school_name VARCHAR(255),
    grade_level VARCHAR(100),
    
    -- معلومات الموقع
    country VARCHAR(100) DEFAULT 'مصر',
    city VARCHAR(100),
    address TEXT,
    
    -- نوع المستخدم
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin', 'super_admin')),
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- معلومات التسجيل
    registration_source VARCHAR(50) DEFAULT 'website',
    referral_code VARCHAR(50),
    referred_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- إحصائيات
    courses_enrolled INTEGER DEFAULT 0,
    courses_completed INTEGER DEFAULT 0,
    total_spent DECIMAL(10, 2) DEFAULT 0,
    
    -- التواريخ
    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول جلسات المستخدم
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول إعدادات المستخدم
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    language VARCHAR(10) DEFAULT 'ar',
    theme VARCHAR(10) DEFAULT 'light',
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    whatsapp_notifications BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    course_reminders BOOLEAN DEFAULT true,
    payment_reminders BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول سجل النشاط
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    metadata JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- الفهارس
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_activities_user ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON user_activities(created_at DESC);

-- Triggers
CREATE OR REPLACE FUNCTION update_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_users_updated_at'
    ) THEN
        CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_user_updated_at();
    END IF;
END $$;

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
DO $$
BEGIN
    -- سياسات جدول المستخدمين
    DROP POLICY IF EXISTS "Users can view own profile" ON users;
    CREATE POLICY "Users can view own profile"
        ON users FOR SELECT
        USING (auth.uid() = id OR role = 'admin');
    
    DROP POLICY IF EXISTS "Users can update own profile" ON users;
    CREATE POLICY "Users can update own profile"
        ON users FOR UPDATE
        USING (auth.uid() = id);
    
    -- سياسات الجلسات
    DROP POLICY IF EXISTS "Users can manage own sessions" ON user_sessions;
    CREATE POLICY "Users can manage own sessions"
        ON user_sessions FOR ALL
        USING (auth.uid() = user_id);
    
    -- سياسات الإعدادات
    DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;
    CREATE POLICY "Users can manage own preferences"
        ON user_preferences FOR ALL
        USING (auth.uid() = user_id);
    
    -- سياسات النشاط
    DROP POLICY IF EXISTS "Users can view own activities" ON user_activities;
    CREATE POLICY "Users can view own activities"
        ON user_activities FOR SELECT
        USING (auth.uid() = user_id);
END $$;

-- دوال مساعدة
CREATE OR REPLACE FUNCTION create_user(
    p_name VARCHAR,
    p_email VARCHAR,
    p_phone VARCHAR,
    p_password VARCHAR
) RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- إنشاء المستخدم
    INSERT INTO users (name, email, phone, password_hash)
    VALUES (p_name, p_email, p_phone, crypt(p_password, gen_salt('bf')))
    RETURNING id INTO new_user_id;
    
    -- إنشاء إعدادات افتراضية
    INSERT INTO user_preferences (user_id)
    VALUES (new_user_id);
    
    -- تسجيل النشاط
    INSERT INTO user_activities (user_id, action, description)
    VALUES (new_user_id, 'registration', 'تم إنشاء حساب جديد');
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;

-- دالة تسجيل الدخول
CREATE OR REPLACE FUNCTION login_user(
    p_email VARCHAR,
    p_password VARCHAR
) RETURNS TABLE(user_id UUID, token TEXT) AS $$
DECLARE
    v_user_id UUID;
    v_token TEXT;
BEGIN
    -- التحقق من كلمة المرور
    SELECT id INTO v_user_id
    FROM users
    WHERE email = p_email
    AND password_hash = crypt(p_password, password_hash);
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'بيانات الدخول غير صحيحة';
    END IF;
    
    -- إنشاء جلسة جديدة
    v_token := encode(gen_random_bytes(32), 'hex');
    
    INSERT INTO user_sessions (user_id, token, expires_at)
    VALUES (v_user_id, v_token, NOW() + INTERVAL '30 days');
    
    -- تحديث آخر تسجيل دخول
    UPDATE users 
    SET last_login_at = NOW() 
    WHERE id = v_user_id;
    
    -- تسجيل النشاط
    INSERT INTO user_activities (user_id, action, description)
    VALUES (v_user_id, 'login', 'تسجيل دخول ناجح');
    
    RETURN QUERY SELECT v_user_id, v_token;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    RAISE NOTICE '✅ تم إنشاء جدول المستخدمين وملحقاته بنجاح!';
    RAISE NOTICE '📋 الجداول: users, user_sessions, user_preferences, user_activities';
    RAISE NOTICE '🔒 تم تفعيل RLS وسياسات الأمان';
    RAISE NOTICE '⚡ تم إنشاء الدوال المساعدة: create_user, login_user';
END $$;
