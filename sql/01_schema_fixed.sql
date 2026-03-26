-- ========================================
-- منصة التعليم الإلكترونية - قاعدة البيانات
-- Education Platform Database Schema (FIXED)
-- ========================================
-- تم إصلاح جميع الأخطاء
-- ========================================

-- ========================================
-- 1. تفعيل الإضافات المطلوبة
-- ========================================

-- تفعيل UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- تفعيل التشفير
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- 2. إنشاء الأنواع المخصصة (ENUMS)
-- ========================================

-- أدوار المستخدمين
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'parent', 'teacher', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- حالة المستخدم
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- مستوى الكورس
DO $$ BEGIN
    CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced', 'all-levels');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- حالة الكورس
DO $$ BEGIN
    CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- أنواع الدفع
DO $$ BEGIN
    CREATE TYPE payment_type AS ENUM ('onetime', 'subscription', 'installment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- طرق الدفع
DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('vodafone_cash', 'bank_transfer', 'instapay', 'credit_card', 'paypal', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- حالة الدفع
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- حالة طلب التسجيل
DO $$ BEGIN
    CREATE TYPE enrollment_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- أنواع الموارد
DO $$ BEGIN
    CREATE TYPE resource_type AS ENUM ('pdf', 'video', 'audio', 'document', 'link', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- منصات الجلسات المباشرة
DO $$ BEGIN
    CREATE TYPE session_platform AS ENUM ('zoom', 'google_meet', 'microsoft_teams', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- حالة الجلسة المباشرة
DO $$ BEGIN
    CREATE TYPE session_status AS ENUM ('scheduled', 'live', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- حالة تسليم الواجب
DO $$ BEGIN
    CREATE TYPE submission_status AS ENUM ('submitted', 'graded', 'returned', 'late');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- أنواع الخصومات
DO $$ BEGIN
    CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- المستوى الدراسي
DO $$ BEGIN
    CREATE TYPE grade_level AS ENUM (
        'الصف الأول الابتدائي', 'الصف الثاني الابتدائي', 'الصف الثالث الابتدائي',
        'الصف الرابع الابتدائي', 'الصف الخامس الابتدائي', 'الصف السادس الابتدائي',
        'الصف الأول الإعدادي', 'الصف الثاني الإعدادي', 'الصف الثالث الإعدادي',
        'الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- 3. جداول المستخدمين والصلاحيات
-- ========================================

-- جدول المستخدمين الرئيسي
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    father_name VARCHAR(255) NOT NULL,
    student_phone VARCHAR(20) UNIQUE NOT NULL CHECK (student_phone ~ '^0\d{10}$'),
    parent_phone VARCHAR(20) NOT NULL CHECK (parent_phone ~ '^0\d{10}$'),
    mother_phone VARCHAR(20) CHECK (mother_phone IS NULL OR mother_phone ~ '^0\d{10}$'),
    phone VARCHAR(20), -- للمدرسين والأدمن
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'student',
    status user_status DEFAULT 'active',
    
    -- معلومات إضافية
    specialty VARCHAR(255), -- للمدرسين
    guardian_job VARCHAR(255),
    school_name VARCHAR(255),
    city VARCHAR(100) DEFAULT 'السويس',
    grade_level grade_level DEFAULT 'الصف الثالث الثانوي',
    
    -- الصور
    profile_picture TEXT DEFAULT '/placeholder-profile.jpg',
    cover_image TEXT,
    
    -- الأمان
    login_attempts INT DEFAULT 0,
    last_login_attempt TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reset_password_code VARCHAR(100),
    reset_password_expires TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    phone_verified_at TIMESTAMP,
    
    -- التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT check_email_format CHECK (
        email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
);

-- جدول معلومات المدرسين الإضافية
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    specialization VARCHAR(255) NOT NULL,
    experience_years INT DEFAULT 0 CHECK (experience_years >= 0),
    
    -- روابط التواصل الاجتماعي
    facebook_url TEXT,
    twitter_url TEXT,
    linkedin_url TEXT,
    website_url TEXT,
    youtube_url TEXT,
    
    -- الإحصائيات
    average_rating DECIMAL(3,2) DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
    total_ratings INT DEFAULT 0,
    total_students INT DEFAULT 0,
    total_courses INT DEFAULT 0,
    
    -- التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول الطلاب
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- معلومات أكاديمية
    student_code VARCHAR(50) UNIQUE,
    academic_year VARCHAR(20),
    section VARCHAR(50),
    
    -- الإحصائيات
    total_courses INT DEFAULT 0,
    completed_courses INT DEFAULT 0,
    total_certificates INT DEFAULT 0,
    total_points INT DEFAULT 0,
    
    -- التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول الأجهزة المسموحة
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_name VARCHAR(255) NOT NULL,
    device_type VARCHAR(50), -- mobile, tablet, desktop
    device_id VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_trusted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- منع تكرار الجهاز لنفس المستخدم
    UNIQUE(user_id, device_id)
);

-- ========================================
-- 4. جداول الكورسات والمحتوى التعليمي
-- ========================================

-- جدول الكورسات الرئيسي
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500) NOT NULL,
    instructor_id UUID NOT NULL REFERENCES users(id),
    
    -- التصنيف
    category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100),
    level course_level DEFAULT 'all-levels',
    language VARCHAR(10) DEFAULT 'ar',
    
    -- الأسعار والدفع
    payment_type payment_type DEFAULT 'onetime',
    price DECIMAL(10,2) DEFAULT 0 CHECK (price >= 0),
    discount_price DECIMAL(10,2) CHECK (discount_price IS NULL OR discount_price >= 0),
    currency VARCHAR(3) DEFAULT 'EGP',
    
    -- الصور والفيديو
    thumbnail TEXT NOT NULL,
    preview_video TEXT,
    cover_image TEXT,
    
    -- المعلومات الإحصائية
    total_lessons INT DEFAULT 0,
    total_duration INT DEFAULT 0, -- بالدقائق
    students_count INT DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    rating_count INT DEFAULT 0,
    
    -- الحالة
    status course_status DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    is_bestseller BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- التحكم في الوصول
    has_lifetime_access BOOLEAN DEFAULT TRUE,
    access_duration_days INT, -- عدد أيام الوصول إذا لم يكن دائم
    has_certificate BOOLEAN DEFAULT FALSE,
    has_assignments BOOLEAN DEFAULT FALSE,
    has_forum_access BOOLEAN DEFAULT FALSE,
    has_refund_policy BOOLEAN DEFAULT FALSE,
    refund_period_days INT DEFAULT 30,
    
    -- SEO
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT[],
    
    -- التواريخ
    published_at TIMESTAMP,
    start_date TIMESTAMP,
    enrollment_end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- جدول المدرسين المساعدين (تم إصلاحه)
CREATE TABLE IF NOT EXISTS course_co_instructors (
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES users(id),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (course_id, instructor_id)
);

-- جدول الأقسام (Sections)
CREATE TABLE IF NOT EXISTS sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INT NOT NULL,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- ترتيب فريد داخل الكورس
    UNIQUE(course_id, order_index)
);

-- جدول الدروس (Lessons)
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    duration INT NOT NULL CHECK (duration > 0), -- بالدقائق
    order_index INT NOT NULL,
    is_preview BOOLEAN DEFAULT FALSE,
    thumbnail TEXT,
    views_count INT DEFAULT 0,
    
    -- ترميز الفيديو بجودات مختلفة
    video_hd_url TEXT,
    video_sd_url TEXT,
    video_mobile_url TEXT,
    
    -- الحالة
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- ترتيب فريد داخل القسم
    UNIQUE(section_id, order_index)
);

-- جدول الموارد التعليمية
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type resource_type NOT NULL,
    url TEXT NOT NULL,
    is_downloadable BOOLEAN DEFAULT TRUE,
    file_size BIGINT, -- بالبايت
    description TEXT,
    order_index INT DEFAULT 0,
    downloads_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول ما سيتعلمه الطالب
CREATE TABLE IF NOT EXISTS course_outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    outcome TEXT NOT NULL,
    order_index INT DEFAULT 0
);

-- جدول متطلبات الكورس
CREATE TABLE IF NOT EXISTS course_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    requirement TEXT NOT NULL,
    order_index INT DEFAULT 0
);

-- جدول مميزات الكورس
CREATE TABLE IF NOT EXISTS course_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    feature TEXT NOT NULL,
    order_index INT DEFAULT 0
);

-- جدول الجمهور المستهدف
CREATE TABLE IF NOT EXISTS course_target_audience (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    audience TEXT NOT NULL,
    order_index INT DEFAULT 0
);

-- جدول الأسئلة الشائعة للكورس
CREATE TABLE IF NOT EXISTS course_faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    order_index INT DEFAULT 0
);

-- جدول العلامات (Tags) - تم إصلاحه
CREATE TABLE IF NOT EXISTS course_tags (
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    PRIMARY KEY (course_id, tag)
);

-- جدول معرض الصور
CREATE TABLE IF NOT EXISTS course_gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 5. جداول الاختبارات والتقييمات
-- ========================================

-- جدول الاختبارات
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    time_limit INT, -- بالدقائق
    passing_score INT DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
    max_attempts INT DEFAULT 3,
    order_index INT NOT NULL,
    is_required BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول أسئلة الاختبار
CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    question_type VARCHAR(20) DEFAULT 'multiple_choice', -- multiple_choice, true_false, short_answer
    points INT DEFAULT 1 CHECK (points > 0),
    order_index INT NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول خيارات الأسئلة
CREATE TABLE IF NOT EXISTS quiz_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    order_index INT NOT NULL
);

-- جدول محاولات الاختبار
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id),
    user_id UUID NOT NULL REFERENCES users(id),
    attempt_number INT NOT NULL,
    score DECIMAL(5,2),
    percentage DECIMAL(5,2),
    passed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    time_spent INT, -- بالثواني
    
    -- منع المحاولات المكررة
    UNIQUE(quiz_id, user_id, attempt_number)
);

-- جدول إجابات الطلاب
CREATE TABLE IF NOT EXISTS quiz_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES quiz_questions(id),
    selected_option_id UUID REFERENCES quiz_options(id),
    text_answer TEXT, -- للأسئلة المقالية
    is_correct BOOLEAN,
    points_earned DECIMAL(5,2) DEFAULT 0,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- النهاية - قاعدة البيانات جاهزة
-- ========================================
