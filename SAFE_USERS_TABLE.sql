-- =============================================
-- نسخة آمنة من جدول المستخدمين
-- تتعامل مع الجداول الموجودة بذكاء
-- =============================================

-- 1️⃣ إصلاح جدول المستخدمين الرئيسي
DO $$
BEGIN
    -- إنشاء الجدول إن لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE TABLE users (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            phone VARCHAR(20) UNIQUE,
            password_hash VARCHAR(255),
            role VARCHAR(20) DEFAULT 'student',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE '✅ تم إنشاء جدول users';
    ELSE
        RAISE NOTICE '✅ جدول users موجود بالفعل';
    END IF;
    
    -- إضافة الأعمدة المفقودة
    -- password_hash
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password') THEN
            ALTER TABLE users RENAME COLUMN password TO password_hash;
        ELSE
            ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
        END IF;
    END IF;
    
    -- avatar_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
    END IF;
    
    -- bio
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'bio') THEN
        ALTER TABLE users ADD COLUMN bio TEXT;
    END IF;
    
    -- birth_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'birth_date') THEN
        ALTER TABLE users ADD COLUMN birth_date DATE;
    END IF;
    
    -- gender
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'gender') THEN
        ALTER TABLE users ADD COLUMN gender VARCHAR(10);
    END IF;
    
    -- معلومات العائلة
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'father_name') THEN
        ALTER TABLE users ADD COLUMN father_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'student_phone') THEN
        ALTER TABLE users ADD COLUMN student_phone VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'parent_phone') THEN
        ALTER TABLE users ADD COLUMN parent_phone VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'mother_phone') THEN
        ALTER TABLE users ADD COLUMN mother_phone VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'guardian_job') THEN
        ALTER TABLE users ADD COLUMN guardian_job VARCHAR(255);
    END IF;
    
    -- معلومات التعليم
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'school_name') THEN
        ALTER TABLE users ADD COLUMN school_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'grade_level') THEN
        ALTER TABLE users ADD COLUMN grade_level VARCHAR(100);
    END IF;
    
    -- معلومات الموقع
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'country') THEN
        ALTER TABLE users ADD COLUMN country VARCHAR(100) DEFAULT 'مصر';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'city') THEN
        ALTER TABLE users ADD COLUMN city VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address') THEN
        ALTER TABLE users ADD COLUMN address TEXT;
    END IF;
    
    -- معلومات إدارية
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_verified') THEN
        ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'registration_source') THEN
        ALTER TABLE users ADD COLUMN registration_source VARCHAR(50) DEFAULT 'website';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'referral_code') THEN
        ALTER TABLE users ADD COLUMN referral_code VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'referred_by') THEN
        ALTER TABLE users ADD COLUMN referred_by UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
    
    -- إحصائيات
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'courses_enrolled') THEN
        ALTER TABLE users ADD COLUMN courses_enrolled INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'courses_completed') THEN
        ALTER TABLE users ADD COLUMN courses_completed INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_spent') THEN
        ALTER TABLE users ADD COLUMN total_spent DECIMAL(10, 2) DEFAULT 0;
    END IF;
    
    -- التواريخ
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified_at') THEN
        ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_login_at') THEN
        ALTER TABLE users ADD COLUMN last_login_at TIMESTAMPTZ;
    END IF;
    
    RAISE NOTICE '✅ تم تحديث جدول users بكل الأعمدة المطلوبة';
END $$;

-- 2️⃣ جدول جلسات المستخدم (مع الفحص الآمن)
DO $$
BEGIN
    -- حذف الجدول القديم إن كان موجوداً بدون الأعمدة المطلوبة
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_sessions' AND column_name = 'token') THEN
            DROP TABLE IF EXISTS user_sessions CASCADE;
            RAISE NOTICE '⚠️ تم حذف جدول user_sessions القديم لإعادة إنشائه بالبنية الصحيحة';
        END IF;
    END IF;
    
    -- إنشاء الجدول بالبنية الصحيحة
    CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    RAISE NOTICE '✅ جدول user_sessions جاهز';
END $$;

-- 3️⃣ جدول إعدادات المستخدم
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

-- 4️⃣ جدول سجل النشاط
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    metadata JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5️⃣ الفهارس
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_activities_user ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON user_activities(created_at DESC);

-- 6️⃣ Triggers للتحديث التلقائي
CREATE OR REPLACE FUNCTION update_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_user_updated_at();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_preferences_updated_at') THEN
        CREATE TRIGGER update_preferences_updated_at
            BEFORE UPDATE ON user_preferences
            FOR EACH ROW
            EXECUTE FUNCTION update_user_updated_at();
    END IF;
END $$;

-- 7️⃣ تفعيل RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- 8️⃣ دوال مساعدة آمنة
-- دالة إنشاء مستخدم
CREATE OR REPLACE FUNCTION safe_create_user(
    p_name VARCHAR,
    p_email VARCHAR,
    p_phone VARCHAR,
    p_password VARCHAR
) RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
    hashed_password VARCHAR;
BEGIN
    -- تشفير كلمة المرور
    hashed_password := crypt(p_password, gen_salt('bf'));
    
    -- إنشاء المستخدم
    INSERT INTO users (name, email, phone, password_hash)
    VALUES (p_name, p_email, p_phone, hashed_password)
    RETURNING id INTO new_user_id;
    
    -- إنشاء إعدادات افتراضية
    INSERT INTO user_preferences (user_id)
    VALUES (new_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- تسجيل النشاط
    INSERT INTO user_activities (user_id, action, description)
    VALUES (new_user_id, 'registration', 'تم إنشاء حساب جديد');
    
    RETURN new_user_id;
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'البريد الإلكتروني أو رقم الهاتف مستخدم بالفعل';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'حدث خطأ في إنشاء الحساب: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- دالة تسجيل الدخول آمنة
CREATE OR REPLACE FUNCTION safe_login_user(
    p_email VARCHAR,
    p_password VARCHAR
) RETURNS TABLE(user_id UUID, session_token TEXT) AS $$
DECLARE
    v_user_id UUID;
    v_password_hash VARCHAR;
    v_token TEXT;
BEGIN
    -- جلب معلومات المستخدم
    SELECT id, password_hash 
    INTO v_user_id, v_password_hash
    FROM users
    WHERE email = p_email
    AND is_active = true;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'البريد الإلكتروني غير مسجل';
    END IF;
    
    -- التحقق من كلمة المرور
    IF v_password_hash != crypt(p_password, v_password_hash) THEN
        RAISE EXCEPTION 'كلمة المرور غير صحيحة';
    END IF;
    
    -- إنشاء توكن الجلسة
    v_token := encode(gen_random_bytes(32), 'hex');
    
    -- إنشاء جلسة جديدة
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
EXCEPTION
    WHEN OTHERS THEN
        -- تسجيل محاولة فاشلة
        INSERT INTO user_activities (user_id, action, description, metadata)
        VALUES (v_user_id, 'failed_login', 'محاولة تسجيل دخول فاشلة', 
                jsonb_build_object('email', p_email, 'error', SQLERRM));
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- 9️⃣ إضافة مستخدم أدمن افتراضي
INSERT INTO users (
    name, 
    email, 
    phone,
    password_hash,
    role,
    is_verified,
    is_active
) VALUES (
    'مدير النظام',
    'admin@platform.edu',
    '01000000000',
    crypt('admin123', gen_salt('bf')),
    'admin',
    true,
    true
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    is_verified = EXCLUDED.is_verified,
    is_active = EXCLUDED.is_active;

-- 🎉 رسالة النجاح
DO $$
DECLARE
    user_count INTEGER;
    session_count INTEGER;
    activity_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO session_count FROM user_sessions;
    SELECT COUNT(*) INTO activity_count FROM user_activities;
    
    RAISE NOTICE '';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '✅ تم إنشاء نظام المستخدمين بنجاح!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 الإحصائيات:';
    RAISE NOTICE '   👥 المستخدمون: % مستخدم', user_count;
    RAISE NOTICE '   🔐 الجلسات: % جلسة', session_count;
    RAISE NOTICE '   📝 الأنشطة: % نشاط', activity_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ الجداول الجاهزة:';
    RAISE NOTICE '   • users - جدول المستخدمين الرئيسي';
    RAISE NOTICE '   • user_sessions - جلسات تسجيل الدخول';
    RAISE NOTICE '   • user_preferences - إعدادات المستخدمين';
    RAISE NOTICE '   • user_activities - سجل النشاط';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 الأمان:';
    RAISE NOTICE '   • RLS مفعل على كل الجداول';
    RAISE NOTICE '   • كلمات المرور مشفرة بـ bcrypt';
    RAISE NOTICE '   • Triggers للتحديث التلقائي';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ الدوال الجاهزة:';
    RAISE NOTICE '   • safe_create_user - إنشاء مستخدم جديد';
    RAISE NOTICE '   • safe_login_user - تسجيل الدخول';
    RAISE NOTICE '';
    RAISE NOTICE '👤 مستخدم الأدمن:';
    RAISE NOTICE '   • البريد: admin@platform.edu';
    RAISE NOTICE '   • كلمة المرور: admin123';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 النظام جاهز للاستخدام!';
    RAISE NOTICE '==============================================';
END $$;
