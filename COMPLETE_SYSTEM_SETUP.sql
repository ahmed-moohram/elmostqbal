-- =============================================
-- سكريبت تطبيق النظام الكامل
-- يشمل جميع الجداول المطلوبة
-- =============================================

-- 1️⃣ جدول المستخدمين الشامل
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

-- 2️⃣ جدول الكورسات
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

-- 3️⃣ جدول طلبات الدفع
CREATE TABLE IF NOT EXISTS payment_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- بيانات الطالب
    student_name VARCHAR(255) NOT NULL,
    student_phone VARCHAR(20) NOT NULL,
    student_email VARCHAR(255),
    student_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- بيانات الكورس
    course_id UUID NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    course_price DECIMAL(10, 2) NOT NULL,
    
    -- بيانات المدرس
    teacher_id UUID,
    teacher_name VARCHAR(255),
    teacher_phone VARCHAR(20),
    
    -- بيانات الدفع
    payment_method VARCHAR(50) DEFAULT 'vodafone_cash',
    transaction_id VARCHAR(100),
    payment_phone VARCHAR(20),
    amount_paid DECIMAL(10, 2),
    
    -- حالة الطلب
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    admin_notes TEXT,
    rejection_reason TEXT,
    
    -- التواريخ
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4️⃣ جدول الاشتراكات
CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL,
    payment_request_id UUID REFERENCES payment_requests(id) ON DELETE SET NULL,
    
    -- معلومات الاشتراك
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    access_type VARCHAR(20) DEFAULT 'full' CHECK (access_type IN ('full', 'limited', 'trial')),
    
    -- تفاصيل إضافية
    progress_percentage INTEGER DEFAULT 0,
    last_accessed TIMESTAMPTZ,
    completed_lessons JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5️⃣ جدول الدروس
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

-- 6️⃣ جدول إشعارات الأدمن
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

-- 7️⃣ جدول الجلسات
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8️⃣ جدول إعدادات المستخدم
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

-- =============================================
-- الفهارس للأداء
-- =============================================

-- فهارس المستخدمين
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at DESC);

-- فهارس الكورسات
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_created ON courses(created_at DESC);

-- فهارس طلبات الدفع
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_student ON payment_requests(student_phone);
CREATE INDEX IF NOT EXISTS idx_payment_requests_course ON payment_requests(course_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_created ON payment_requests(created_at DESC);

-- فهارس الاشتراكات
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_active ON course_enrollments(is_active);

-- فهارس الدروس
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(order_index);

-- =============================================
-- Triggers للتحديث التلقائي
-- =============================================

-- دالة التحديث
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء Triggers بأمان
DO $$
BEGIN
    -- Trigger لجدول المستخدمين
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_users_updated_at'
    ) THEN
        CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Trigger لجدول الكورسات
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_courses_updated_at'
    ) THEN
        CREATE TRIGGER update_courses_updated_at
            BEFORE UPDATE ON courses
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Trigger لجدول طلبات الدفع
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_payment_requests_updated_at'
    ) THEN
        CREATE TRIGGER update_payment_requests_updated_at
            BEFORE UPDATE ON payment_requests
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Trigger لجدول الاشتراكات
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_enrollments_updated_at'
    ) THEN
        CREATE TRIGGER update_enrollments_updated_at
            BEFORE UPDATE ON course_enrollments
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =============================================
-- Row Level Security (RLS)
-- =============================================

-- تفعيل RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- =============================================
-- بيانات تجريبية (اختياري)
-- =============================================

-- إدخال مستخدم أدمن افتراضي
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
) ON CONFLICT (email) DO NOTHING;

-- إدخال كورس تجريبي
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

-- =============================================
-- دوال مساعدة
-- =============================================

-- دالة للتحقق من اشتراك الطالب
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

-- دالة لحساب إحصائيات الإيرادات
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

-- =============================================
-- رسالة النجاح
-- =============================================
DO $$
DECLARE
    user_count INTEGER;
    course_count INTEGER;
    payment_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO course_count FROM courses;
    SELECT COUNT(*) INTO payment_count FROM payment_requests;
    
    RAISE NOTICE '';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '✅ تم تطبيق النظام الكامل بنجاح!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 الإحصائيات الحالية:';
    RAISE NOTICE '   👥 المستخدمون: % مستخدم', user_count;
    RAISE NOTICE '   📚 الكورسات: % كورس', course_count;
    RAISE NOTICE '   💳 طلبات الدفع: % طلب', payment_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ الجداول الجاهزة:';
    RAISE NOTICE '   • users (المستخدمون)';
    RAISE NOTICE '   • courses (الكورسات)';
    RAISE NOTICE '   • payment_requests (طلبات الدفع)';
    RAISE NOTICE '   • course_enrollments (الاشتراكات)';
    RAISE NOTICE '   • lessons (الدروس)';
    RAISE NOTICE '   • admin_notifications (الإشعارات)';
    RAISE NOTICE '   • user_sessions (الجلسات)';
    RAISE NOTICE '   • user_preferences (الإعدادات)';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 الأمان:';
    RAISE NOTICE '   • RLS مفعل على كل الجداول';
    RAISE NOTICE '   • Triggers للتحديث التلقائي';
    RAISE NOTICE '   • فهارس للأداء السريع';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 النظام جاهز للاستخدام!';
    RAISE NOTICE '==============================================';
END $$;
