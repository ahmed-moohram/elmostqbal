-- ========================================
-- إصلاح الأعمدة المفقودة في الجداول
-- Fix Missing Columns
-- ========================================

-- التحقق من وجود الجداول أولاً
DO $$
BEGIN
    -- إضافة عمود course_id إلى جدول achievements إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'achievements' 
        AND column_name = 'course_id'
    ) THEN
        ALTER TABLE achievements 
        ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
        RAISE NOTICE 'تم إضافة عمود course_id إلى جدول achievements';
    ELSE
        RAISE NOTICE 'عمود course_id موجود بالفعل في جدول achievements';
    END IF;

    -- إضافة عمود course_id إلى جدول user_achievements إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_achievements' 
        AND column_name = 'course_id'
    ) THEN
        ALTER TABLE user_achievements 
        ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
        RAISE NOTICE 'تم إضافة عمود course_id إلى جدول user_achievements';
    ELSE
        RAISE NOTICE 'عمود course_id موجود بالفعل في جدول user_achievements';
    END IF;

    -- إضافة عمود enrollment_id إلى جدول user_achievements إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_achievements' 
        AND column_name = 'enrollment_id'
    ) THEN
        ALTER TABLE user_achievements 
        ADD COLUMN enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE;
        RAISE NOTICE 'تم إضافة عمود enrollment_id إلى جدول user_achievements';
    ELSE
        RAISE NOTICE 'عمود enrollment_id موجود بالفعل في جدول user_achievements';
    END IF;

    -- إضافة عمود enrollment_id إلى جدول lesson_progress إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lesson_progress' 
        AND column_name = 'enrollment_id'
    ) THEN
        ALTER TABLE lesson_progress 
        ADD COLUMN enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE;
        RAISE NOTICE 'تم إضافة عمود enrollment_id إلى جدول lesson_progress';
    ELSE
        RAISE NOTICE 'عمود enrollment_id موجود بالفعل في جدول lesson_progress';
    END IF;

    -- إضافة عمود enrollment_id إلى جدول quiz_results إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quiz_results' 
        AND column_name = 'enrollment_id'
    ) THEN
        ALTER TABLE quiz_results 
        ADD COLUMN enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE;
        RAISE NOTICE 'تم إضافة عمود enrollment_id إلى جدول quiz_results';
    ELSE
        RAISE NOTICE 'عمود enrollment_id موجود بالفعل في جدول quiz_results';
    END IF;

    -- إضافة عمود enrollment_id إلى جدول certificates إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'certificates' 
        AND column_name = 'enrollment_id'
    ) THEN
        ALTER TABLE certificates 
        ADD COLUMN enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE;
        RAISE NOTICE 'تم إضافة عمود enrollment_id إلى جدول certificates';
    ELSE
        RAISE NOTICE 'عمود enrollment_id موجود بالفعل في جدول certificates';
    END IF;

    -- إضافة عمود enrollment_id إلى جدول course_reviews إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'course_reviews' 
        AND column_name = 'enrollment_id'
    ) THEN
        ALTER TABLE course_reviews 
        ADD COLUMN enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE;
        RAISE NOTICE 'تم إضافة عمود enrollment_id إلى جدول course_reviews';
    ELSE
        RAISE NOTICE 'عمود enrollment_id موجود بالفعل في جدول course_reviews';
    END IF;

    -- إضافة عمود enrollment_id إلى جدول payments إذا لم يكن موجوداً
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'enrollment_id'
    ) THEN
        ALTER TABLE payments 
        ADD COLUMN enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE;
        RAISE NOTICE 'تم إضافة عمود enrollment_id إلى جدول payments';
    ELSE
        RAISE NOTICE 'عمود enrollment_id موجود بالفعل في جدول payments';
    END IF;

    -- إضافة أعمدة إضافية لجدول points_history
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'points_history' 
        AND column_name = 'course_id'
    ) THEN
        ALTER TABLE points_history 
        ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
        RAISE NOTICE 'تم إضافة عمود course_id إلى جدول points_history';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'points_history' 
        AND column_name = 'lesson_id'
    ) THEN
        ALTER TABLE points_history 
        ADD COLUMN lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE;
        RAISE NOTICE 'تم إضافة عمود lesson_id إلى جدول points_history';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'points_history' 
        AND column_name = 'achievement_id'
    ) THEN
        ALTER TABLE points_history 
        ADD COLUMN achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE;
        RAISE NOTICE 'تم إضافة عمود achievement_id إلى جدول points_history';
    END IF;

    -- إضافة أعمدة إحصائية لجدول user_points
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_points' 
        AND column_name = 'courses_completed'
    ) THEN
        ALTER TABLE user_points 
        ADD COLUMN courses_completed INT DEFAULT 0;
        RAISE NOTICE 'تم إضافة عمود courses_completed إلى جدول user_points';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_points' 
        AND column_name = 'lessons_completed'
    ) THEN
        ALTER TABLE user_points 
        ADD COLUMN lessons_completed INT DEFAULT 0;
        RAISE NOTICE 'تم إضافة عمود lessons_completed إلى جدول user_points';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_points' 
        AND column_name = 'achievements_earned'
    ) THEN
        ALTER TABLE user_points 
        ADD COLUMN achievements_earned INT DEFAULT 0;
        RAISE NOTICE 'تم إضافة عمود achievements_earned إلى جدول user_points';
    END IF;

    -- إضافة أعمدة إحصائية لجدول leaderboard
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leaderboard' 
        AND column_name = 'achievements_count'
    ) THEN
        ALTER TABLE leaderboard 
        ADD COLUMN achievements_count INT DEFAULT 0;
        RAISE NOTICE 'تم إضافة عمود achievements_count إلى جدول leaderboard';
    END IF;

END $$;

-- ========================================
-- إنشاء الفهارس للأعمدة الجديدة
-- ========================================

-- فهارس للعلاقات
CREATE INDEX IF NOT EXISTS idx_achievements_course ON achievements(course_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_course ON user_achievements(course_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_enrollment ON user_achievements(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment ON lesson_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_enrollment ON quiz_results(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_certificates_enrollment ON certificates(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_enrollment ON course_reviews(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_payments_enrollment ON payments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_points_history_course ON points_history(course_id);
CREATE INDEX IF NOT EXISTS idx_points_history_lesson ON points_history(lesson_id);
CREATE INDEX IF NOT EXISTS idx_points_history_achievement ON points_history(achievement_id);

-- ========================================
-- رسالة النجاح
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ تم إصلاح الأعمدة المفقودة بنجاح!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 الأعمدة التي تم التحقق منها:';
    RAISE NOTICE '- achievements.course_id';
    RAISE NOTICE '- user_achievements.course_id';
    RAISE NOTICE '- user_achievements.enrollment_id';
    RAISE NOTICE '- lesson_progress.enrollment_id';
    RAISE NOTICE '- quiz_results.enrollment_id';
    RAISE NOTICE '- certificates.enrollment_id';
    RAISE NOTICE '- course_reviews.enrollment_id';
    RAISE NOTICE '- payments.enrollment_id';
    RAISE NOTICE '- points_history (course_id, lesson_id, achievement_id)';
    RAISE NOTICE '- user_points (courses_completed, lessons_completed, achievements_earned)';
    RAISE NOTICE '- leaderboard.achievements_count';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 تم إنشاء الفهارس للأداء الأمثل';
    RAISE NOTICE '========================================';
END $$;
