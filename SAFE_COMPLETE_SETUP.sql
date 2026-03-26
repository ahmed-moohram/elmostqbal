-- =============================================
-- نسخة آمنة من تطبيق النظام الكامل
-- تتعامل مع الجداول الموجودة بذكاء
-- =============================================

-- 1️⃣ التأكد من وجود جدول المستخدمين وتحديثه
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
    END IF;
    
    -- إضافة الأعمدة المفقودة
    -- password_hash
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash') THEN
        -- التحقق من وجود عمود password قديم
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password') THEN
            ALTER TABLE users RENAME COLUMN password TO password_hash;
        ELSE
            ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
        END IF;
    END IF;
    
    -- إضافة باقي الأعمدة إن لم تكن موجودة
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'bio') THEN
        ALTER TABLE users ADD COLUMN bio TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'birth_date') THEN
        ALTER TABLE users ADD COLUMN birth_date DATE;
    END IF;
    
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
END $$;

-- 2️⃣ باقي الجداول (مع الفحص الآمن)
CREATE TABLE IF NOT EXISTS courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) DEFAULT 0,
    thumbnail TEXT,
    instructor_name VARCHAR(255),
    instructor_phone VARCHAR(20),
    vodafone_cash VARCHAR(20),
    rating DECIMAL(3, 2) DEFAULT 0,
    enrollment_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_name VARCHAR(255) NOT NULL,
    student_phone VARCHAR(20) NOT NULL,
    student_email VARCHAR(255),
    student_id UUID REFERENCES users(id) ON DELETE SET NULL,
    course_id UUID NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    course_price DECIMAL(10, 2) NOT NULL,
    teacher_id UUID,
    teacher_name VARCHAR(255),
    teacher_phone VARCHAR(20),
    payment_method VARCHAR(50) DEFAULT 'vodafone_cash',
    transaction_id VARCHAR(100),
    payment_phone VARCHAR(20),
    amount_paid DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    admin_notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL,
    payment_request_id UUID REFERENCES payment_requests(id) ON DELETE SET NULL,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    access_type VARCHAR(20) DEFAULT 'full' CHECK (access_type IN ('full', 'limited', 'trial')),
    progress_percentage INTEGER DEFAULT 0,
    last_accessed TIMESTAMPTZ,
    completed_lessons JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url TEXT,
    order_index INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- 3️⃣ الفهارس (مع الفحص)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_created ON courses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_student ON payment_requests(student_phone);
CREATE INDEX IF NOT EXISTS idx_payment_requests_course ON payment_requests(course_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_created ON payment_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_active ON course_enrollments(is_active);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(order_index);

-- 4️⃣ دالة التحديث التلقائي
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5️⃣ Triggers (مع الفحص الآمن)
DO $$
BEGIN
    -- Trigger لجدول المستخدمين
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Trigger لجدول الكورسات
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_courses_updated_at') THEN
        CREATE TRIGGER update_courses_updated_at
            BEFORE UPDATE ON courses
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Trigger لجدول طلبات الدفع
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payment_requests_updated_at') THEN
        CREATE TRIGGER update_payment_requests_updated_at
            BEFORE UPDATE ON payment_requests
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Trigger لجدول الاشتراكات
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_enrollments_updated_at') THEN
        CREATE TRIGGER update_enrollments_updated_at
            BEFORE UPDATE ON course_enrollments
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 6️⃣ تفعيل RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 7️⃣ إضافة المستخدم الأدمن (مع الأمان)
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
    '$2a$12$xVEzhL5JCWO2Qv1UwNXPqeUY0YvyRvqYorKMcXCLASLZ0/G3KGafi', -- admin123
    'admin',
    true,
    true
) ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    is_verified = EXCLUDED.is_verified,
    is_active = EXCLUDED.is_active;

-- 8️⃣ إضافة كورس تجريبي (مع الأمان)
INSERT INTO courses (
    title,
    description,
    price,
    instructor_name,
    instructor_phone,
    is_published
) VALUES (
    'دورة الرياضيات المتقدمة',
    'دورة شاملة في الرياضيات للثانوية العامة',
    299,
    'أ. محمد أحمد',
    '01012345678',
    true
) ON CONFLICT DO NOTHING;

-- 9️⃣ دوال مساعدة
CREATE OR REPLACE FUNCTION check_enrollment(
    p_student_phone VARCHAR,
    p_course_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    is_enrolled BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM payment_requests
        WHERE student_phone = p_student_phone
        AND course_id = p_course_id
        AND status = 'approved'
    ) INTO is_enrolled;
    
    RETURN is_enrolled;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_revenue_stats()
RETURNS TABLE(
    total_requests BIGINT,
    pending_requests BIGINT,
    approved_requests BIGINT,
    rejected_requests BIGINT,
    total_revenue DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_requests,
        COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_requests,
        COUNT(*) FILTER (WHERE status = 'approved')::BIGINT as approved_requests,
        COUNT(*) FILTER (WHERE status = 'rejected')::BIGINT as rejected_requests,
        COALESCE(SUM(amount_paid) FILTER (WHERE status = 'approved'), 0) as total_revenue
    FROM payment_requests;
END;
$$ LANGUAGE plpgsql;

-- 🎉 رسالة النجاح
DO $$
DECLARE
    user_count INTEGER;
    course_count INTEGER;
    payment_count INTEGER;
    admin_exists BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO course_count FROM courses;
    SELECT COUNT(*) INTO payment_count FROM payment_requests;
    SELECT EXISTS(SELECT 1 FROM users WHERE email = 'admin@platform.edu') INTO admin_exists;
    
    RAISE NOTICE '';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '✅ تم تطبيق النظام بنجاح!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 الإحصائيات:';
    RAISE NOTICE '   👥 المستخدمون: % مستخدم', user_count;
    RAISE NOTICE '   📚 الكورسات: % كورس', course_count;
    RAISE NOTICE '   💳 طلبات الدفع: % طلب', payment_count;
    
    IF admin_exists THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ مستخدم الأدمن جاهز:';
        RAISE NOTICE '   • البريد: admin@platform.edu';
        RAISE NOTICE '   • كلمة المرور: admin123';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ الجداول الجاهزة:';
    RAISE NOTICE '   • users - مع كل الأعمدة المطلوبة';
    RAISE NOTICE '   • courses - الكورسات';
    RAISE NOTICE '   • payment_requests - طلبات الدفع';
    RAISE NOTICE '   • course_enrollments - الاشتراكات';
    RAISE NOTICE '   • lessons - الدروس';
    RAISE NOTICE '   • admin_notifications - الإشعارات';
    RAISE NOTICE '   • user_sessions - الجلسات';
    RAISE NOTICE '   • user_preferences - الإعدادات';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 النظام جاهز للاستخدام!';
    RAISE NOTICE '==============================================';
END $$;
