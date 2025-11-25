-- ========================================
-- إنشاء جداول التقدم والنتائج
-- Create Progress and Results Tables
-- ========================================

-- 1. جدول تقدم الدروس (إذا لم يكن موجوداً)
CREATE TABLE IF NOT EXISTS lesson_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    time_spent INT DEFAULT 0, -- بالدقائق
    last_position INT DEFAULT 0, -- آخر موضع في الفيديو
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lesson_id)
);

-- في حال كان جدول lesson_progress موجوداً من سكربت قديم بدون عمود course_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lesson_progress' AND column_name = 'course_id'
    ) THEN
        ALTER TABLE lesson_progress
        ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. جدول نتائج الاختبارات
CREATE TABLE IF NOT EXISTS quiz_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    quiz_id UUID,
    quiz_title VARCHAR(255),
    score INT NOT NULL,
    total_questions INT NOT NULL,
    passed BOOLEAN DEFAULT false,
    time_taken INT, -- بالثواني
    answers JSONB,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. جدول النقاط (إذا لم يكن موجوداً)
CREATE TABLE IF NOT EXISTS user_points (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_points INT DEFAULT 0,
    current_level INT DEFAULT 1,
    courses_completed INT DEFAULT 0,
    lessons_completed INT DEFAULT 0,
    quizzes_passed INT DEFAULT 0,
    achievements_earned INT DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- 4. جدول الشهادات
CREATE TABLE IF NOT EXISTS certificates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    certificate_number VARCHAR(50) UNIQUE,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    grade VARCHAR(10),
    score DECIMAL(5,2),
    pdf_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. جدول الإشعارات
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    icon VARCHAR(50),
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. جدول الكتب (للمكتبة)
CREATE TABLE IF NOT EXISTS books (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    cover_image TEXT,
    pdf_url TEXT,
    category VARCHAR(100),
    rating DECIMAL(3,2) DEFAULT 0,
    downloads INT DEFAULT 0,
    views INT DEFAULT 0,
    is_premium BOOLEAN DEFAULT false,
    is_new_release BOOLEAN DEFAULT false,
    description TEXT,
    year INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. إضافة فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_course ON lesson_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- 8. إدراج بيانات تجريبية للتقدم
DO $$
DECLARE
    test_user_id UUID;
    test_course_id UUID;
    test_lesson_id UUID;
BEGIN
    -- جلب مستخدم تجريبي
    SELECT id INTO test_user_id FROM users WHERE role = 'student' LIMIT 1;
    
    -- جلب كورس تجريبي
    SELECT id INTO test_course_id FROM courses WHERE is_published = true LIMIT 1;
    
    -- جلب درس تجريبي: في السكيمة الحالية الدرس مرتبط بالقسم، والقسم مرتبط بالكورس
    SELECT l.id
    INTO test_lesson_id
    FROM lessons l
    JOIN sections s ON l.section_id = s.id
    WHERE s.course_id = test_course_id
    LIMIT 1;
    
    IF test_user_id IS NOT NULL AND test_lesson_id IS NOT NULL THEN
        -- إضافة تقدم تجريبي
        INSERT INTO lesson_progress (user_id, course_id, lesson_id, is_completed, time_spent)
        VALUES (test_user_id, test_course_id, test_lesson_id, true, 45)
        ON CONFLICT (user_id, lesson_id) DO UPDATE
        SET is_completed = true, time_spent = 45;
        
        -- إضافة نتيجة اختبار تجريبية
        INSERT INTO quiz_results (user_id, course_id, quiz_title, score, total_questions, passed)
        VALUES (test_user_id, test_course_id, 'اختبار الوحدة الأولى', 85, 100, true);
        
        -- إضافة نقاط للمستخدم
        INSERT INTO user_points (user_id, total_points, current_level, lessons_completed)
        VALUES (test_user_id, 150, 2, 5)
        ON CONFLICT (user_id) DO UPDATE
        SET total_points = 150, current_level = 2, lessons_completed = 5;
        
        -- إضافة إشعار
        INSERT INTO notifications (user_id, title, message, type, icon)
        VALUES (test_user_id, 'مرحباً بك!', 'أهلاً بك في منصتنا التعليمية', 'info', '👋');
        
        RAISE NOTICE '✅ تم إضافة بيانات التقدم التجريبية';
    END IF;
END $$;

-- 9. عرض الإحصائيات
SELECT 'إحصائيات التقدم:' as info;
SELECT 
    (SELECT COUNT(*) FROM lesson_progress WHERE is_completed = true) as "الدروس المكتملة",
    (SELECT COUNT(*) FROM quiz_results WHERE passed = true) as "الاختبارات الناجحة",
    (SELECT COUNT(*) FROM certificates) as "الشهادات الصادرة",
    (SELECT COUNT(*) FROM notifications WHERE is_read = false) as "الإشعارات غير المقروءة";

-- رسالة النجاح
SELECT 
    '✅ تم إنشاء جداول التقدم بنجاح!' as النتيجة,
    '📊 البيانات التجريبية جاهزة' as البيانات,
    '🚀 النظام جاهز للعمل!' as الحالة;
