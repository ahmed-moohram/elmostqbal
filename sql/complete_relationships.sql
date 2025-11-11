-- ========================================
-- ملف العلاقات الكاملة بين الجداول
-- Complete Database Relationships
-- ========================================

-- تفعيل الإضافات المطلوبة
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. جدول المستخدمين (الأساسي)
-- ========================================
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

-- ========================================
-- 2. جدول الكورسات
-- ========================================
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

-- ========================================
-- 3. جدول الدروس
-- ========================================
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, order_index)
);

-- ========================================
-- 4. جدول التسجيلات (ربط الطلاب بالكورسات)
-- ========================================
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
-- 5. جدول تقدم الدروس
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lesson_id)
);

-- ========================================
-- 6. جدول الإنجازات
-- ========================================
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
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE, -- ربط بالكورس
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 7. جدول إنجازات المستخدمين
-- ========================================
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE, -- الكورس المرتبط
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE, -- التسجيل المرتبط
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress DECIMAL(5,2) DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, achievement_id)
);

-- ========================================
-- 8. جدول الشهادات
-- ========================================
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    grade VARCHAR(10),
    completion_percentage DECIMAL(5,2),
    pdf_url TEXT,
    verification_url TEXT,
    is_valid BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, course_id)
);

-- ========================================
-- 9. جدول الاختبارات
-- ========================================
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    passing_score DECIMAL(5,2) DEFAULT 60,
    max_attempts INT DEFAULT 3,
    time_limit INT, -- بالدقائق
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 10. جدول نتائج الاختبارات
-- ========================================
CREATE TABLE IF NOT EXISTS quiz_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL,
    passed BOOLEAN DEFAULT FALSE,
    attempt_number INT DEFAULT 1,
    time_taken INT, -- بالثواني
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 11. جدول التقييمات
-- ========================================
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

-- ========================================
-- 12. جدول النقاط والمستويات
-- ========================================
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

-- ========================================
-- 13. جدول سجل النقاط
-- ========================================
CREATE TABLE IF NOT EXISTS points_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INT NOT NULL,
    action VARCHAR(100),
    description TEXT,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 14. جدول لوحة المتصدرين
-- ========================================
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

-- ========================================
-- 15. جدول المدفوعات
-- ========================================
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
-- الدوال المساعدة
-- ========================================

-- دالة لتحديث تقدم التسجيل بناءً على الدروس المكتملة
CREATE OR REPLACE FUNCTION update_enrollment_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_total_lessons INT;
    v_completed_lessons INT;
    v_progress DECIMAL(5,2);
    v_enrollment_id UUID;
BEGIN
    -- الحصول على معرف التسجيل
    SELECT e.id INTO v_enrollment_id
    FROM enrollments e
    JOIN lessons l ON l.course_id = e.course_id
    WHERE e.user_id = NEW.user_id 
    AND l.id = NEW.lesson_id;
    
    -- حساب عدد الدروس الكلي والمكتمل
    SELECT 
        COUNT(DISTINCT l.id),
        COUNT(DISTINCT lp.lesson_id) FILTER (WHERE lp.is_completed = TRUE)
    INTO v_total_lessons, v_completed_lessons
    FROM lessons l
    LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = NEW.user_id
    WHERE l.course_id = (SELECT course_id FROM lessons WHERE id = NEW.lesson_id);
    
    -- حساب النسبة المئوية
    IF v_total_lessons > 0 THEN
        v_progress := (v_completed_lessons::DECIMAL / v_total_lessons) * 100;
        
        -- تحديث تقدم التسجيل
        UPDATE enrollments 
        SET 
            progress = v_progress,
            last_accessed = CURRENT_TIMESTAMP,
            completed_at = CASE 
                WHEN v_progress = 100 THEN CURRENT_TIMESTAMP 
                ELSE NULL 
            END
        WHERE id = v_enrollment_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق الدالة عند تحديث تقدم الدروس
DROP TRIGGER IF EXISTS trigger_update_enrollment_progress ON lesson_progress;
CREATE TRIGGER trigger_update_enrollment_progress
AFTER INSERT OR UPDATE OF is_completed ON lesson_progress
FOR EACH ROW
EXECUTE FUNCTION update_enrollment_progress();

-- دالة لمنح الإنجازات تلقائياً
CREATE OR REPLACE FUNCTION check_and_grant_achievements()
RETURNS TRIGGER AS $$
DECLARE
    v_achievement RECORD;
    v_user_stats RECORD;
BEGIN
    -- جمع إحصائيات المستخدم
    SELECT 
        COUNT(DISTINCT e.course_id) FILTER (WHERE e.progress = 100) as courses_completed,
        COUNT(DISTINCT lp.lesson_id) FILTER (WHERE lp.is_completed = TRUE) as lessons_completed,
        COUNT(DISTINCT ua.achievement_id) as achievements_earned
    INTO v_user_stats
    FROM users u
    LEFT JOIN enrollments e ON e.user_id = u.id
    LEFT JOIN lesson_progress lp ON lp.user_id = u.id
    LEFT JOIN user_achievements ua ON ua.user_id = u.id
    WHERE u.id = NEW.user_id;
    
    -- التحقق من الإنجازات المستحقة
    FOR v_achievement IN 
        SELECT * FROM achievements a
        WHERE NOT EXISTS (
            SELECT 1 FROM user_achievements ua 
            WHERE ua.user_id = NEW.user_id 
            AND ua.achievement_id = a.id
        )
    LOOP
        -- التحقق من شروط الإنجاز
        IF (v_achievement.requirement_type = 'courses_completed' 
            AND v_user_stats.courses_completed >= v_achievement.requirement_value)
        OR (v_achievement.requirement_type = 'lessons_completed' 
            AND v_user_stats.lessons_completed >= v_achievement.requirement_value)
        THEN
            -- منح الإنجاز
            INSERT INTO user_achievements (
                user_id, 
                achievement_id, 
                course_id,
                enrollment_id,
                is_completed
            ) VALUES (
                NEW.user_id,
                v_achievement.id,
                NEW.course_id,
                NEW.id,
                TRUE
            ) ON CONFLICT DO NOTHING;
            
            -- إضافة النقاط
            INSERT INTO points_history (
                user_id,
                points,
                action,
                description,
                achievement_id
            ) VALUES (
                NEW.user_id,
                v_achievement.points,
                'achievement_earned',
                'حصلت على إنجاز: ' || v_achievement.title,
                v_achievement.id
            );
            
            -- تحديث نقاط المستخدم
            INSERT INTO user_points (user_id, total_points, achievements_earned)
            VALUES (NEW.user_id, v_achievement.points, 1)
            ON CONFLICT (user_id) DO UPDATE
            SET 
                total_points = user_points.total_points + v_achievement.points,
                achievements_earned = user_points.achievements_earned + 1,
                updated_at = CURRENT_TIMESTAMP;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق الدالة عند إكمال كورس
DROP TRIGGER IF EXISTS trigger_check_achievements ON enrollments;
CREATE TRIGGER trigger_check_achievements
AFTER UPDATE OF progress ON enrollments
FOR EACH ROW
WHEN (NEW.progress = 100)
EXECUTE FUNCTION check_and_grant_achievements();

-- دالة لإصدار الشهادة عند إكمال الكورس
CREATE OR REPLACE FUNCTION issue_certificate()
RETURNS TRIGGER AS $$
DECLARE
    v_certificate_number VARCHAR(100);
BEGIN
    IF NEW.progress = 100 AND NEW.certificate_issued = FALSE THEN
        -- توليد رقم شهادة فريد
        v_certificate_number := 'CERT-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || 
                               LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
        
        -- إنشاء الشهادة
        INSERT INTO certificates (
            user_id,
            course_id,
            enrollment_id,
            certificate_number,
            completion_percentage,
            grade
        ) VALUES (
            NEW.user_id,
            NEW.course_id,
            NEW.id,
            v_certificate_number,
            NEW.progress,
            'A'
        ) ON CONFLICT DO NOTHING;
        
        -- تحديث حالة الشهادة في التسجيل
        UPDATE enrollments 
        SET 
            certificate_issued = TRUE,
            certificate_url = '/certificates/' || v_certificate_number || '.pdf'
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق الدالة عند إكمال الكورس
DROP TRIGGER IF EXISTS trigger_issue_certificate ON enrollments;
CREATE TRIGGER trigger_issue_certificate
AFTER UPDATE OF progress ON enrollments
FOR EACH ROW
WHEN (NEW.progress = 100)
EXECUTE FUNCTION issue_certificate();

-- ========================================
-- الفهارس للأداء
-- ========================================

-- فهارس للعلاقات الأساسية
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment ON lesson_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_course ON user_achievements(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_enrollment ON quiz_results(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_points_history_user ON points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_course ON points_history(course_id);

-- ========================================
-- بيانات تجريبية للاختبار
-- ========================================

-- إضافة كورسات تجريبية
INSERT INTO courses (title, description, category, level, price, duration_hours, is_published) 
VALUES 
    ('أساسيات البرمجة بلغة Python', 'تعلم البرمجة من الصفر', 'برمجة', 'مبتدئ', 299, 20, true),
    ('تطوير تطبيقات الويب', 'HTML, CSS, JavaScript', 'تطوير ويب', 'متوسط', 499, 30, true),
    ('الذكاء الاصطناعي للمبتدئين', 'مقدمة في AI و Machine Learning', 'ذكاء اصطناعي', 'مبتدئ', 699, 40, true)
ON CONFLICT DO NOTHING;

-- إضافة إنجازات مرتبطة بالكورسات
INSERT INTO achievements (title, description, icon, category, points, requirement_type, requirement_value)
VALUES 
    ('أول خطوة', 'أكمل درسك الأول', '🎯', 'learning', 10, 'lessons_completed', 1),
    ('الطالب المجتهد', 'أكمل 5 دروس', '📚', 'learning', 25, 'lessons_completed', 5),
    ('محترف Python', 'أكمل كورس Python', '🐍', 'completion', 100, 'courses_completed', 1),
    ('مطور ويب', 'أكمل كورس تطوير الويب', '🌐', 'completion', 100, 'courses_completed', 1),
    ('خبير AI', 'أكمل كورس الذكاء الاصطناعي', '🤖', 'completion', 150, 'courses_completed', 1),
    ('المتفوق', 'احصل على 90% أو أكثر في 3 اختبارات', '🏆', 'excellence', 75, 'quiz_score', 90),
    ('المثابر', 'ادرس لمدة 7 أيام متتالية', '🔥', 'participation', 50, 'study_streak', 7)
ON CONFLICT DO NOTHING;

-- ========================================
-- رسالة النجاح
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ تم إنشاء العلاقات الكاملة بنجاح!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '🔗 العلاقات المنشأة:';
    RAISE NOTICE '- enrollments ← users + courses';
    RAISE NOTICE '- lesson_progress ← users + lessons + enrollments';
    RAISE NOTICE '- user_achievements ← users + achievements + courses + enrollments';
    RAISE NOTICE '- certificates ← users + courses + enrollments';
    RAISE NOTICE '- quiz_results ← users + quizzes + enrollments';
    RAISE NOTICE '- course_reviews ← users + courses + enrollments';
    RAISE NOTICE '- points_history ← users + courses + lessons + achievements';
    RAISE NOTICE '- payments ← users + courses + enrollments';
    RAISE NOTICE '';
    RAISE NOTICE '⚙️ الدوال التلقائية:';
    RAISE NOTICE '- تحديث تقدم التسجيل عند إكمال الدروس';
    RAISE NOTICE '- منح الإنجازات تلقائياً عند تحقيق الشروط';
    RAISE NOTICE '- إصدار الشهادات عند إكمال الكورسات';
    RAISE NOTICE '';
    RAISE NOTICE '📊 البيانات التجريبية:';
    RAISE NOTICE '- 3 كورسات';
    RAISE NOTICE '- 7 إنجازات';
    RAISE NOTICE '========================================';
END $$;
