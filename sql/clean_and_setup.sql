-- ========================================
-- تنظيف وإعادة إنشاء قاعدة البيانات
-- Clean and Setup Database
-- ========================================

-- 1. حذف جميع الـ triggers
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I CASCADE', r.trigger_name, r.event_object_table);
        RAISE NOTICE 'حذف trigger: % من جدول %', r.trigger_name, r.event_object_table;
    END LOOP;
END $$;

-- 2. حذف جميع الجداول
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT LIKE 'pg_%'
    LOOP
        EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', r.tablename);
        RAISE NOTICE 'حذف جدول: %', r.tablename;
    END LOOP;
END $$;

-- 3. حذف جميع الأنواع المخصصة (ENUMs)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT typname 
        FROM pg_type 
        WHERE typtype = 'e'
        AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        EXECUTE format('DROP TYPE IF EXISTS %I CASCADE', r.typname);
        RAISE NOTICE 'حذف نوع: %', r.typname;
    END LOOP;
END $$;

-- 4. حذف جميع الدوال
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT proname, oidvectortypes(proargtypes) as argtypes
        FROM pg_proc 
        WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I(%s) CASCADE', r.proname, r.argtypes);
        RAISE NOTICE 'حذف دالة: %', r.proname;
    END LOOP;
END $$;

-- ========================================
-- إنشاء الإضافات
-- ========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- إنشاء الأنواع (ENUMs)
-- ========================================

-- أدوار المستخدمين
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin', 'parent');

-- حالة المستخدم
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');

-- مستوى الكورس
CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced', 'all-levels');

-- حالة الكورس
CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');

-- نوع الدفع
CREATE TYPE payment_type AS ENUM ('free', 'onetime', 'subscription', 'installment');

-- طريقة الدفع
CREATE TYPE payment_method AS ENUM (
    'vodafone_cash', 'orange_cash', 'etisalat_cash', 'we_cash',
    'bank_transfer', 'credit_card', 'paypal', 'fawry', 'cash'
);

-- حالة الدفع
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');

-- حالة التسجيل
CREATE TYPE enrollment_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- نوع المورد
CREATE TYPE resource_type AS ENUM ('pdf', 'video', 'audio', 'document', 'link', 'zip', 'image');

-- منصة الجلسة
CREATE TYPE session_platform AS ENUM ('zoom', 'google_meet', 'microsoft_teams', 'youtube_live', 'facebook_live', 'custom');

-- حالة الجلسة
CREATE TYPE session_status AS ENUM ('scheduled', 'live', 'completed', 'cancelled');

-- حالة التسليم
CREATE TYPE submission_status AS ENUM ('pending', 'submitted', 'graded', 'late');

-- نوع الخصم
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');

-- المرحلة الدراسية
CREATE TYPE grade_level AS ENUM (
    'grade_1', 'grade_2', 'grade_3', 'grade_4', 'grade_5', 'grade_6',
    'grade_7', 'grade_8', 'grade_9', 'grade_10', 'grade_11', 'grade_12',
    'university', 'other'
);

-- ========================================
-- إنشاء الجداول
-- ========================================

-- جدول المستخدمين
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    student_phone VARCHAR(20) UNIQUE,
    parent_phone VARCHAR(20),
    mother_phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'student',
    status user_status DEFAULT 'active',
    grade_level grade_level,
    city VARCHAR(100),
    school_name VARCHAR(255),
    guardian_job VARCHAR(255),
    specialty VARCHAR(255),
    profile_picture TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول المعلمين
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    specialization VARCHAR(255),
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

-- جدول الطلاب
CREATE TABLE students (
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

-- جدول الكورسات
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    instructor_id UUID NOT NULL REFERENCES users(id),
    category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100),
    level course_level DEFAULT 'all-levels',
    language VARCHAR(10) DEFAULT 'ar',
    payment_type payment_type DEFAULT 'onetime',
    price DECIMAL(10,2) DEFAULT 0,
    discount_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'EGP',
    thumbnail TEXT,
    preview_video TEXT,
    status course_status DEFAULT 'draft',
    duration_weeks INT DEFAULT 0,
    total_duration INT DEFAULT 0,
    total_lessons INT DEFAULT 0,
    total_students INT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

-- جدول الأقسام
CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, order_index)
);

-- جدول الدروس
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url TEXT,
    duration INT DEFAULT 0,
    order_index INT NOT NULL,
    is_preview BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(section_id, order_index)
);

-- جدول التسجيلات
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    progress DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    last_accessed TIMESTAMP,
    UNIQUE(user_id, course_id)
);

-- جدول الدفعات
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    course_id UUID REFERENCES courses(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EGP',
    payment_method payment_method NOT NULL,
    status payment_status DEFAULT 'pending',
    transaction_id VARCHAR(255),
    receipt_image TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- دالة تحديث updated_at
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- إنشاء Triggers
-- ========================================

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at
    BEFORE UPDATE ON teachers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sections_updated_at
    BEFORE UPDATE ON sections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- بيانات تجريبية
-- ========================================

-- مستخدم Admin
INSERT INTO users (name, email, password, role, status, is_verified)
VALUES (
    'المسؤول الرئيسي',
    'admin@platform.com',
    crypt('Admin@123', gen_salt('bf')),
    'admin',
    'active',
    true
);

-- مستخدم مدرس
INSERT INTO users (name, email, password, role, status, is_verified)
VALUES (
    'أستاذ أحمد محمد',
    'teacher@platform.com',
    crypt('Teacher@123', gen_salt('bf')),
    'teacher',
    'active',
    true
);

-- مستخدم طالب
INSERT INTO users (name, email, student_phone, password, role, status, grade_level, is_verified)
VALUES (
    'محمد علي',
    'student@platform.com',
    '01234567890',
    crypt('Student@123', gen_salt('bf')),
    'student',
    'active',
    'grade_10',
    true
);

-- إضافة بيانات المدرس
INSERT INTO teachers (user_id, bio, specialization, experience_years)
SELECT 
    id,
    'مدرس متخصص في البرمجة وعلوم الحاسب',
    'علوم الحاسب والبرمجة',
    5
FROM users WHERE email = 'teacher@platform.com';

-- إضافة بيانات الطالب
INSERT INTO students (user_id, student_code, academic_year)
SELECT 
    id,
    'STU2024001',
    '2024/2025'
FROM users WHERE email = 'student@platform.com';

-- إضافة دورة تجريبية
INSERT INTO courses (
    title, slug, description, short_description,
    instructor_id, category, level, status, price,
    thumbnail, duration_weeks, language
)
SELECT
    'دورة البرمجة الشاملة - من الصفر للاحتراف',
    'full-stack-programming',
    'دورة متكاملة لتعلم البرمجة من البداية حتى الاحتراف. تشمل HTML, CSS, JavaScript, React, Node.js, وقواعد البيانات.',
    'تعلم البرمجة الكاملة من الصفر',
    id,
    'البرمجة',
    'beginner',
    'published',
    299.99,
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
    12,
    'ar'
FROM users WHERE email = 'teacher@platform.com';

-- إضافة قسم للدورة
INSERT INTO sections (course_id, title, description, order_index)
SELECT
    id,
    'مقدمة البرمجة',
    'تعرف على أساسيات البرمجة والمفاهيم الأولية',
    1
FROM courses WHERE slug = 'full-stack-programming';

-- إضافة درس
INSERT INTO lessons (section_id, title, description, duration, order_index, is_preview)
SELECT
    id,
    'ما هي البرمجة؟',
    'مقدمة شاملة عن عالم البرمجة والتطوير',
    600,
    1,
    true
FROM sections WHERE title = 'مقدمة البرمجة';

-- ========================================
-- تقرير النجاح
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ تم إنشاء قاعدة البيانات بنجاح!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 الإحصائيات:';
    RAISE NOTICE '- المستخدمين: %', (SELECT count(*) FROM users);
    RAISE NOTICE '- المدرسين: %', (SELECT count(*) FROM teachers);
    RAISE NOTICE '- الطلاب: %', (SELECT count(*) FROM students);
    RAISE NOTICE '- الدورات: %', (SELECT count(*) FROM courses);
    RAISE NOTICE '- الأقسام: %', (SELECT count(*) FROM sections);
    RAISE NOTICE '- الدروس: %', (SELECT count(*) FROM lessons);
    RAISE NOTICE '';
    RAISE NOTICE '🔑 بيانات الدخول:';
    RAISE NOTICE '- Admin: admin@platform.com / Admin@123';
    RAISE NOTICE '- Teacher: teacher@platform.com / Teacher@123';
    RAISE NOTICE '- Student: student@platform.com / Student@123';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
