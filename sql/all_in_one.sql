-- ========================================
-- منصة التعليم الإلكترونية - الإعداد الكامل
-- All-in-One Setup Script
-- ========================================
-- ملف واحد يحتوي على كل شيء بالترتيب الصحيح
-- ========================================

-- ========================================
-- الخطوة 1: التنظيف (اختياري)
-- ========================================

-- لإعادة البدء من الصفر، قم بإلغاء التعليق:
/*
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
*/

-- ========================================
-- الخطوة 2: الإضافات
-- ========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- الخطوة 3: الأنواع (Types) مع معالجة الأخطاء
-- ========================================

-- أدوار المستخدمين
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('student', 'parent', 'teacher', 'admin');
    END IF;
END $$;

-- حالة المستخدم
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
    END IF;
END $$;

-- مستوى الكورس
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_level') THEN
        CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced', 'all-levels');
    END IF;
END $$;

-- حالة الكورس
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_status') THEN
        CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');
    END IF;
END $$;

-- أنواع الدفع
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_type') THEN
        CREATE TYPE payment_type AS ENUM ('onetime', 'subscription', 'installment');
    END IF;
END $$;

-- طرق الدفع
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE payment_method AS ENUM ('vodafone_cash', 'bank_transfer', 'instapay', 'credit_card', 'paypal', 'other');
    END IF;
END $$;

-- حالة الدفع
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled');
    END IF;
END $$;

-- حالة طلب التسجيل
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enrollment_status') THEN
        CREATE TYPE enrollment_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
    END IF;
END $$;

-- أنواع الموارد
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resource_type') THEN
        CREATE TYPE resource_type AS ENUM ('pdf', 'video', 'audio', 'document', 'link', 'other');
    END IF;
END $$;

-- منصات الجلسات المباشرة
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_platform') THEN
        CREATE TYPE session_platform AS ENUM ('zoom', 'google_meet', 'microsoft_teams', 'custom');
    END IF;
END $$;

-- حالة الجلسة المباشرة
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
        CREATE TYPE session_status AS ENUM ('scheduled', 'live', 'completed', 'cancelled');
    END IF;
END $$;

-- حالة تسليم الواجب
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status') THEN
        CREATE TYPE submission_status AS ENUM ('submitted', 'graded', 'returned', 'late');
    END IF;
END $$;

-- أنواع الخصومات
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discount_type') THEN
        CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');
    END IF;
END $$;

-- المستوى الدراسي
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'grade_level') THEN
        CREATE TYPE grade_level AS ENUM (
            'الصف الأول الابتدائي', 'الصف الثاني الابتدائي', 'الصف الثالث الابتدائي',
            'الصف الرابع الابتدائي', 'الصف الخامس الابتدائي', 'الصف السادس الابتدائي',
            'الصف الأول الإعدادي', 'الصف الثاني الإعدادي', 'الصف الثالث الإعدادي',
            'الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'
        );
    END IF;
END $$;

-- ========================================
-- الخطوة 4: الجداول الأساسية
-- ========================================

-- المستخدمون
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    father_name VARCHAR(255) NOT NULL,
    student_phone VARCHAR(20) UNIQUE NOT NULL,
    parent_phone VARCHAR(20) NOT NULL,
    mother_phone VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'student',
    status user_status DEFAULT 'active',
    specialty VARCHAR(255),
    guardian_job VARCHAR(255),
    school_name VARCHAR(255),
    city VARCHAR(100) DEFAULT 'السويس',
    grade_level grade_level DEFAULT 'الصف الثالث الثانوي',
    profile_picture TEXT DEFAULT '/placeholder-profile.jpg',
    cover_image TEXT,
    login_attempts INT DEFAULT 0,
    last_login_attempt TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reset_password_code VARCHAR(100),
    reset_password_expires TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    phone_verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- المدرسون
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    specialization VARCHAR(255) NOT NULL,
    experience_years INT DEFAULT 0,
    facebook_url TEXT,
    twitter_url TEXT,
    linkedin_url TEXT,
    website_url TEXT,
    youtube_url TEXT,
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_ratings INT DEFAULT 0,
    total_students INT DEFAULT 0,
    total_courses INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- الطلاب
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    student_code VARCHAR(50) UNIQUE,
    academic_year VARCHAR(20),
    section VARCHAR(50),
    total_courses INT DEFAULT 0,
    completed_courses INT DEFAULT 0,
    total_certificates INT DEFAULT 0,
    total_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- الكورسات
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500) NOT NULL,
    instructor_id UUID NOT NULL REFERENCES users(id),
    category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100),
    level course_level DEFAULT 'all-levels',
    language VARCHAR(10) DEFAULT 'ar',
    payment_type payment_type DEFAULT 'onetime',
    price DECIMAL(10,2) DEFAULT 0,
    discount_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'EGP',
    thumbnail TEXT NOT NULL,
    preview_video TEXT,
    cover_image TEXT,
    total_lessons INT DEFAULT 0,
    total_duration INT DEFAULT 0,
    students_count INT DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    rating_count INT DEFAULT 0,
    status course_status DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    is_bestseller BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    has_lifetime_access BOOLEAN DEFAULT TRUE,
    access_duration_days INT,
    has_certificate BOOLEAN DEFAULT FALSE,
    has_assignments BOOLEAN DEFAULT FALSE,
    has_forum_access BOOLEAN DEFAULT FALSE,
    has_refund_policy BOOLEAN DEFAULT FALSE,
    refund_period_days INT DEFAULT 30,
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT[],
    published_at TIMESTAMP,
    start_date TIMESTAMP,
    enrollment_end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- التسجيلات
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    progress DECIMAL(5,2) DEFAULT 0,
    last_accessed TIMESTAMP,
    completed_at TIMESTAMP,
    certificate_issued BOOLEAN DEFAULT FALSE,
    certificate_issued_at TIMESTAMP,
    certificate_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_expired BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, course_id)
);

-- المدفوعات
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    course_id UUID REFERENCES courses(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EGP',
    payment_method payment_method NOT NULL,
    status payment_status DEFAULT 'pending',
    transaction_id VARCHAR(255) UNIQUE,
    gateway_response JSONB,
    description TEXT,
    invoice_number VARCHAR(50) UNIQUE,
    receipt_url TEXT,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    refunded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- الخطوة 5: دالة تحديث updated_at
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- تطبيق الدالة على الجداول
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            CREATE TRIGGER update_%I_updated_at 
            BEFORE UPDATE ON %I 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column()',
            t, t);
    END LOOP;
END $$;

-- ========================================
-- الخطوة 6: البيانات الأولية
-- ========================================

-- إدخال مستخدم أدمن افتراضي
INSERT INTO users (
    name, father_name, student_phone, parent_phone, 
    email, password_hash, role, status, is_verified
) VALUES (
    'مدير النظام', 'النظام', '01000000000', '01000000000',
    'admin@platform.com', crypt('Admin@123456', gen_salt('bf')), 
    'admin', 'active', true
) ON CONFLICT (email) DO NOTHING;

-- إدخال مدرس تجريبي
INSERT INTO users (
    name, father_name, student_phone, parent_phone,
    email, password_hash, role, status, is_verified, specialty
) VALUES (
    'د. أحمد محمد', 'محمد', '01111111111', '01111111111',
    'teacher@platform.com', crypt('Teacher@123', gen_salt('bf')),
    'teacher', 'active', true, 'رياضيات'
) ON CONFLICT (email) DO NOTHING;

-- إدخال طالب تجريبي
INSERT INTO users (
    name, father_name, student_phone, parent_phone,
    email, password_hash, role, status, grade_level
) VALUES (
    'محمد علي', 'علي', '01222222222', '01333333333',
    'student@platform.com', crypt('Student@123', gen_salt('bf')),
    'student', 'active', 'الصف الثالث الثانوي'
) ON CONFLICT (email) DO NOTHING;

-- ========================================
-- الخطوة 7: الفهارس الأساسية
-- ========================================

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(student_phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ========================================
-- النهاية - رسالة النجاح
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 تم إعداد قاعدة البيانات بنجاح!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ تم إنشاء الأنواع';
    RAISE NOTICE '✅ تم إنشاء الجداول الأساسية';
    RAISE NOTICE '✅ تم إضافة المستخدمين التجريبيين';
    RAISE NOTICE '✅ تم إنشاء الفهارس';
    RAISE NOTICE '';
    RAISE NOTICE 'بيانات الدخول التجريبية:';
    RAISE NOTICE '------------------------';
    RAISE NOTICE 'Admin: admin@platform.com / Admin@123456';
    RAISE NOTICE 'Teacher: teacher@platform.com / Teacher@123';
    RAISE NOTICE 'Student: student@platform.com / Student@123';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 قاعدة البيانات جاهزة للاستخدام!';
    RAISE NOTICE '========================================';
END $$;
