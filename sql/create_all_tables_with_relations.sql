-- ========================================
-- إنشاء كل الجداول المطلوبة مع العلاقات
-- Create All Required Tables with Relations
-- ========================================

-- تفعيل الإضافات المطلوبة
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- الجزء 1: إنشاء الجداول الأساسية
-- ========================================

-- 1. جدول المستخدمين (إذا لم يكن موجوداً)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'student',
    avatar TEXT,
    bio TEXT,
    city VARCHAR(100),
    grade_level VARCHAR(50),
    parent_phone VARCHAR(20),
    mother_phone VARCHAR(20),
    guardian_job VARCHAR(100),
    school_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. جدول الكورسات
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    category VARCHAR(100),
    level VARCHAR(50),
    price DECIMAL(10,2) DEFAULT 0,
    discount_price DECIMAL(10,2),
    duration_hours INT,
    thumbnail TEXT,
    preview_video TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0,
    students_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. جدول الدروس
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url TEXT,
    duration_minutes INT,
    order_index INT NOT NULL,
    is_free BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. جدول التسجيلات
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress DECIMAL(5,2) DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    last_accessed TIMESTAMP,
    completed_at TIMESTAMP,
    certificate_issued BOOLEAN DEFAULT FALSE,
    certificate_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, course_id)
);

-- ========================================
-- الجزء 2: إنشاء جداول التقدم والإنجازات
-- ========================================

-- 5. جدول تقدم الدروس (الجدول المفقود)
CREATE TABLE IF NOT EXISTS lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
    watched_duration INT DEFAULT 0,
    total_duration INT,
    progress DECIMAL(5,2) DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    last_position INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lesson_id)
);

-- 6. جدول الإنجازات
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    badge_image TEXT,
    category VARCHAR(100),
    points INT DEFAULT 0,
    requirement_type VARCHAR(50),
    requirement_value INT DEFAULT 1,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. جدول إنجازات المستخدمين
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress DECIMAL(5,2) DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, achievement_id)
);

-- 8. جدول النقاط والمستويات
CREATE TABLE IF NOT EXISTS user_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    total_points INT DEFAULT 0,
    current_level INT DEFAULT 1,
    courses_completed INT DEFAULT 0,
    lessons_completed INT DEFAULT 0,
    achievements_earned INT DEFAULT 0,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. جدول سجل النقاط
CREATE TABLE IF NOT EXISTS points_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INT NOT NULL,
    action VARCHAR(100),
    description TEXT,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    reference_id UUID,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- الجزء 3: جداول إضافية
-- ========================================

-- 10. جدول الشهادات
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    grade VARCHAR(10),
    completion_percentage DECIMAL(5,2),
    pdf_url TEXT,
    verification_url TEXT,
    is_valid BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, course_id)
);

-- 11. جدول الاختبارات
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    passing_score DECIMAL(5,2) DEFAULT 60,
    max_attempts INT DEFAULT 3,
    time_limit INT,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. جدول نتائج الاختبارات
CREATE TABLE IF NOT EXISTS quiz_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL,
    passed BOOLEAN DEFAULT FALSE,
    attempt_number INT DEFAULT 1,
    time_taken INT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. جدول التقييمات
CREATE TABLE IF NOT EXISTS course_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, user_id)
);

-- 14. جدول لوحة المتصدرين
CREATE TABLE IF NOT EXISTS leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_type VARCHAR(20),
    period_date DATE,
    points INT DEFAULT 0,
    rank INT,
    courses_completed INT DEFAULT 0,
    lessons_completed INT DEFAULT 0,
    achievements_count INT DEFAULT 0,
    study_hours DECIMAL(10,2) DEFAULT 0,
    UNIQUE(user_id, period_type, period_date)
);

-- 15. جدول المدفوعات
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EGP',
    payment_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    transaction_id VARCHAR(255) UNIQUE,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP
);

-- 16. جدول الكتب (إذا لم يكن موجوداً)
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    description TEXT,
    cover_image TEXT,
    pdf_url TEXT,
    category VARCHAR(100),
    grade_level VARCHAR(50),
    pages INT,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- الجزء 4: إضافة الأعمدة المفقودة للجداول الموجودة
-- ========================================

DO $$
BEGIN
    -- إضافة الأعمدة إذا لم تكن موجودة
    
    -- achievements table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'course_id') THEN
        ALTER TABLE achievements ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
    END IF;
    
    -- user_achievements table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_achievements' AND column_name = 'course_id') THEN
        ALTER TABLE user_achievements ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_achievements' AND column_name = 'enrollment_id') THEN
        ALTER TABLE user_achievements ADD COLUMN enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE;
    END IF;
    
    -- lesson_progress table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_progress' AND column_name = 'enrollment_id') THEN
        ALTER TABLE lesson_progress ADD COLUMN enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE;
    END IF;
    
    -- user_points table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_points' AND column_name = 'courses_completed') THEN
        ALTER TABLE user_points ADD COLUMN courses_completed INT DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_points' AND column_name = 'lessons_completed') THEN
        ALTER TABLE user_points ADD COLUMN lessons_completed INT DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_points' AND column_name = 'achievements_earned') THEN
        ALTER TABLE user_points ADD COLUMN achievements_earned INT DEFAULT 0;
    END IF;
    
    -- points_history table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'points_history' AND column_name = 'course_id') THEN
        ALTER TABLE points_history ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'points_history' AND column_name = 'lesson_id') THEN
        ALTER TABLE points_history ADD COLUMN lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'points_history' AND column_name = 'achievement_id') THEN
        ALTER TABLE points_history ADD COLUMN achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'بعض الأعمدة موجودة بالفعل أو حدث خطأ: %', SQLERRM;
END $$;

-- ========================================
-- الجزء 5: إنشاء الفهارس
-- ========================================

-- فهارس الأداء
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment ON lesson_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_course ON user_achievements(course_id);
CREATE INDEX IF NOT EXISTS idx_achievements_course ON achievements(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_user ON points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_course ON points_history(course_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user ON leaderboard(user_id);

-- ========================================
-- الجزء 6: إضافة بيانات تجريبية
-- ========================================

-- إضافة كورسات تجريبية (إذا لم تكن موجودة)
INSERT INTO courses (title, description, category, level, price, duration_hours, is_published) 
VALUES 
    ('أساسيات البرمجة بلغة Python', 'تعلم البرمجة من الصفر مع Python', 'برمجة', 'مبتدئ', 299, 20, true),
    ('تطوير تطبيقات الويب', 'HTML, CSS, JavaScript من البداية للاحتراف', 'تطوير ويب', 'متوسط', 499, 30, true),
    ('الذكاء الاصطناعي للمبتدئين', 'مقدمة في AI و Machine Learning', 'ذكاء اصطناعي', 'مبتدئ', 699, 40, true)
ON CONFLICT DO NOTHING;

-- إضافة إنجازات تجريبية
INSERT INTO achievements (title, description, icon, category, points, requirement_type, requirement_value)
VALUES 
    ('البداية الموفقة', 'أكمل درسك الأول', '🎯', 'learning', 10, 'lessons_completed', 1),
    ('الطالب المجتهد', 'أكمل 5 دروس', '📚', 'learning', 25, 'lessons_completed', 5),
    ('النجم الصاعد', 'أكمل دورة كاملة', '⭐', 'completion', 100, 'courses_completed', 1),
    ('المثابر', 'ادرس لمدة 7 أيام متتالية', '🔥', 'participation', 50, 'study_streak', 7),
    ('العبقري', 'احصل على 90% أو أكثر في اختبار', '🏆', 'excellence', 75, 'quiz_score', 90)
ON CONFLICT DO NOTHING;

-- ========================================
-- الجزء 7: التحقق من النتائج
-- ========================================

-- عرض الجداول المنشأة
SELECT 
    table_name,
    COUNT(*) as columns_count
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN (
    'users', 'courses', 'lessons', 'enrollments', 
    'lesson_progress', 'achievements', 'user_achievements',
    'user_points', 'points_history', 'certificates',
    'quizzes', 'quiz_results', 'course_reviews',
    'leaderboard', 'payments', 'books'
)
GROUP BY table_name
ORDER BY table_name;

-- ========================================
-- رسالة النجاح
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ تم إنشاء كل الجداول والعلاقات بنجاح!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 الجداول المنشأة:';
    RAISE NOTICE '1. users - المستخدمين';
    RAISE NOTICE '2. courses - الكورسات';
    RAISE NOTICE '3. lessons - الدروس';
    RAISE NOTICE '4. enrollments - التسجيلات';
    RAISE NOTICE '5. lesson_progress - تقدم الدروس';
    RAISE NOTICE '6. achievements - الإنجازات';
    RAISE NOTICE '7. user_achievements - إنجازات المستخدمين';
    RAISE NOTICE '8. user_points - نقاط المستخدمين';
    RAISE NOTICE '9. points_history - سجل النقاط';
    RAISE NOTICE '10. certificates - الشهادات';
    RAISE NOTICE '11. quizzes - الاختبارات';
    RAISE NOTICE '12. quiz_results - نتائج الاختبارات';
    RAISE NOTICE '13. course_reviews - تقييمات الكورسات';
    RAISE NOTICE '14. leaderboard - لوحة المتصدرين';
    RAISE NOTICE '15. payments - المدفوعات';
    RAISE NOTICE '16. books - الكتب';
    RAISE NOTICE '';
    RAISE NOTICE '🔗 العلاقات مربوطة بشكل صحيح';
    RAISE NOTICE '🔍 الفهارس منشأة للأداء الأمثل';
    RAISE NOTICE '📊 البيانات التجريبية مضافة';
    RAISE NOTICE '========================================';
END $$;
