-- ========================================
-- إضافة الأعمدة المفقودة للجداول الموجودة
-- Add Missing Columns to Existing Tables
-- ========================================

-- تفعيل الإضافات المطلوبة
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. إضافة الأعمدة المفقودة لجدول courses
-- ========================================

DO $$
BEGIN
    -- duration_hours
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'duration_hours') THEN
        ALTER TABLE courses ADD COLUMN duration_hours INT;
        RAISE NOTICE 'تم إضافة عمود duration_hours إلى جدول courses';
    END IF;
    
    -- discount_price
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'discount_price') THEN
        ALTER TABLE courses ADD COLUMN discount_price DECIMAL(10,2);
        RAISE NOTICE 'تم إضافة عمود discount_price إلى جدول courses';
    END IF;
    
    -- thumbnail
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'thumbnail') THEN
        ALTER TABLE courses ADD COLUMN thumbnail TEXT;
        RAISE NOTICE 'تم إضافة عمود thumbnail إلى جدول courses';
    END IF;
    
    -- preview_video
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'preview_video') THEN
        ALTER TABLE courses ADD COLUMN preview_video TEXT;
        RAISE NOTICE 'تم إضافة عمود preview_video إلى جدول courses';
    END IF;
    
    -- is_featured
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'is_featured') THEN
        ALTER TABLE courses ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'تم إضافة عمود is_featured إلى جدول courses';
    END IF;
    
    -- is_published
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'is_published') THEN
        ALTER TABLE courses ADD COLUMN is_published BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'تم إضافة عمود is_published إلى جدول courses';
    END IF;
    
    -- rating
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'rating') THEN
        ALTER TABLE courses ADD COLUMN rating DECIMAL(3,2) DEFAULT 0;
        RAISE NOTICE 'تم إضافة عمود rating إلى جدول courses';
    END IF;
    
    -- students_count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'students_count') THEN
        ALTER TABLE courses ADD COLUMN students_count INT DEFAULT 0;
        RAISE NOTICE 'تم إضافة عمود students_count إلى جدول courses';
    END IF;
END $$;

-- ========================================
-- 2. إنشاء جدول lesson_progress إذا لم يكن موجوداً
-- ========================================

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

-- ========================================
-- 3. إضافة الأعمدة المفقودة لجدول achievements
-- ========================================

DO $$
BEGIN
    -- course_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'achievements' AND column_name = 'course_id') THEN
        ALTER TABLE achievements ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
        RAISE NOTICE 'تم إضافة عمود course_id إلى جدول achievements';
    END IF;
END $$;

-- ========================================
-- 4. إضافة الأعمدة المفقودة لجدول user_achievements
-- ========================================

DO $$
BEGIN
    -- course_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_achievements' AND column_name = 'course_id') THEN
        ALTER TABLE user_achievements ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
        RAISE NOTICE 'تم إضافة عمود course_id إلى جدول user_achievements';
    END IF;
    
    -- enrollment_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_achievements' AND column_name = 'enrollment_id') THEN
        ALTER TABLE user_achievements ADD COLUMN enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE;
        RAISE NOTICE 'تم إضافة عمود enrollment_id إلى جدول user_achievements';
    END IF;
END $$;

-- ========================================
-- 5. إضافة الأعمدة المفقودة لجدول user_points
-- ========================================

DO $$
BEGIN
    -- courses_completed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_points' AND column_name = 'courses_completed') THEN
        ALTER TABLE user_points ADD COLUMN courses_completed INT DEFAULT 0;
        RAISE NOTICE 'تم إضافة عمود courses_completed إلى جدول user_points';
    END IF;
    
    -- lessons_completed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_points' AND column_name = 'lessons_completed') THEN
        ALTER TABLE user_points ADD COLUMN lessons_completed INT DEFAULT 0;
        RAISE NOTICE 'تم إضافة عمود lessons_completed إلى جدول user_points';
    END IF;
    
    -- achievements_earned
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_points' AND column_name = 'achievements_earned') THEN
        ALTER TABLE user_points ADD COLUMN achievements_earned INT DEFAULT 0;
        RAISE NOTICE 'تم إضافة عمود achievements_earned إلى جدول user_points';
    END IF;
END $$;

-- ========================================
-- 6. إضافة الأعمدة المفقودة لجدول points_history
-- ========================================

DO $$
BEGIN
    -- course_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'points_history' AND column_name = 'course_id') THEN
        ALTER TABLE points_history ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
        RAISE NOTICE 'تم إضافة عمود course_id إلى جدول points_history';
    END IF;
    
    -- lesson_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'points_history' AND column_name = 'lesson_id') THEN
        ALTER TABLE points_history ADD COLUMN lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE;
        RAISE NOTICE 'تم إضافة عمود lesson_id إلى جدول points_history';
    END IF;
    
    -- achievement_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'points_history' AND column_name = 'achievement_id') THEN
        ALTER TABLE points_history ADD COLUMN achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE;
        RAISE NOTICE 'تم إضافة عمود achievement_id إلى جدول points_history';
    END IF;
END $$;

-- ========================================
-- 7. إنشاء الجداول المفقودة الأخرى
-- ========================================

-- جدول الشهادات
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

-- جدول الاختبارات
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

-- جدول نتائج الاختبارات
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

-- جدول التقييمات
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

-- جدول لوحة المتصدرين
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

-- جدول المدفوعات
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

-- ========================================
-- 8. إنشاء الفهارس
-- ========================================

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
-- 9. إضافة البيانات التجريبية (بعد إضافة الأعمدة)
-- ========================================

-- إضافة كورسات تجريبية
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
-- 10. التحقق من النتائج
-- ========================================

-- عرض أعمدة جدول courses
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'courses'
ORDER BY ordinal_position;

-- عرض عدد الجداول المنشأة
SELECT 
    COUNT(*) as total_tables,
    STRING_AGG(table_name, ', ' ORDER BY table_name) as tables_list
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'users', 'courses', 'lessons', 'enrollments', 
    'lesson_progress', 'achievements', 'user_achievements',
    'user_points', 'points_history', 'certificates',
    'quizzes', 'quiz_results', 'course_reviews',
    'leaderboard', 'payments'
);

-- ========================================
-- رسالة النجاح
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ تم إضافة الأعمدة المفقودة وإنشاء الجداول بنجاح!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 الأعمدة المضافة لجدول courses:';
    RAISE NOTICE '- duration_hours';
    RAISE NOTICE '- discount_price';
    RAISE NOTICE '- thumbnail';
    RAISE NOTICE '- preview_video';
    RAISE NOTICE '- is_featured';
    RAISE NOTICE '- is_published';
    RAISE NOTICE '- rating';
    RAISE NOTICE '- students_count';
    RAISE NOTICE '';
    RAISE NOTICE '📋 الجداول المنشأة/المحدثة:';
    RAISE NOTICE '- lesson_progress (مع enrollment_id)';
    RAISE NOTICE '- achievements (مع course_id)';
    RAISE NOTICE '- user_achievements (مع course_id و enrollment_id)';
    RAISE NOTICE '- user_points (مع الإحصائيات)';
    RAISE NOTICE '- points_history (مع العلاقات)';
    RAISE NOTICE '- certificates';
    RAISE NOTICE '- quizzes';
    RAISE NOTICE '- quiz_results';
    RAISE NOTICE '- course_reviews';
    RAISE NOTICE '- leaderboard';
    RAISE NOTICE '- payments';
    RAISE NOTICE '';
    RAISE NOTICE '🔗 العلاقات مربوطة بشكل صحيح';
    RAISE NOTICE '🔍 الفهارس منشأة للأداء الأمثل';
    RAISE NOTICE '📊 البيانات التجريبية مضافة';
    RAISE NOTICE '========================================';
END $$;
