-- ========================================
-- إصلاح جدول الدروس وإضافة الأعمدة المفقودة
-- Fix Lessons Table and Add Missing Columns
-- ========================================

-- 1. إضافة عمود course_id إلى جدول lessons إذا لم يكن موجوداً
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE;

-- 2. إضافة باقي الأعمدة المطلوبة
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 0;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS order_index INT DEFAULT 0;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 3. إضافة دروس تجريبية إذا لم تكن موجودة
DO $$
DECLARE
    test_course_id UUID;
BEGIN
    -- جلب أول كورس منشور
    SELECT id INTO test_course_id FROM courses WHERE is_published = true LIMIT 1;
    
    IF test_course_id IS NOT NULL THEN
        -- التحقق من وجود دروس
        IF NOT EXISTS (SELECT 1 FROM lessons WHERE course_id = test_course_id) THEN
            -- إضافة دروس تجريبية
            INSERT INTO lessons (course_id, title, description, video_url, duration_minutes, order_index, is_free, is_published)
            VALUES 
                (test_course_id, 'مقدمة الكورس', 'مقدمة شاملة عن محتوى الكورس', 'https://youtube.com/watch?v=intro', 10, 1, true, true),
                (test_course_id, 'الدرس الأول: الأساسيات', 'تعلم الأساسيات', 'https://youtube.com/watch?v=lesson1', 25, 2, false, true),
                (test_course_id, 'الدرس الثاني: المفاهيم المتقدمة', 'شرح المفاهيم المتقدمة', 'https://youtube.com/watch?v=lesson2', 30, 3, false, true),
                (test_course_id, 'الدرس الثالث: التطبيق العملي', 'تطبيق عملي على ما تعلمناه', 'https://youtube.com/watch?v=lesson3', 45, 4, false, true);
            
            RAISE NOTICE '✅ تم إضافة دروس تجريبية للكورس';
        ELSE
            RAISE NOTICE '✅ الدروس موجودة بالفعل';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ لا يوجد كورسات منشورة لإضافة دروس لها';
    END IF;
END $$;

-- 4. التحقق من الجدول
SELECT 'التحقق من جدول الدروس:' as info;
SELECT 
    column_name as "العمود",
    data_type as "النوع",
    is_nullable as "يقبل NULL"
FROM information_schema.columns
WHERE table_name = 'lessons'
ORDER BY ordinal_position;

-- 5. عرض الدروس الموجودة
SELECT 'الدروس الموجودة:' as info;
SELECT 
    l.id,
    l.title as "عنوان الدرس",
    c.title as "الكورس",
    l.duration_minutes as "المدة (دقيقة)",
    l.order_index as "الترتيب",
    CASE WHEN l.is_free THEN '✅ مجاني' ELSE '💰 مدفوع' END as "النوع",
    CASE WHEN l.is_published THEN '✅ منشور' ELSE '❌ مسودة' END as "الحالة"
FROM lessons l
LEFT JOIN courses c ON l.course_id = c.id
ORDER BY c.title, l.order_index;

-- 6. الآن يمكن إنشاء جداول التقدم
-- جدول تقدم الدروس
CREATE TABLE IF NOT EXISTS lesson_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    time_spent INT DEFAULT 0,
    last_position INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lesson_id)
);

-- جدول نتائج الاختبارات
CREATE TABLE IF NOT EXISTS quiz_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    quiz_id UUID,
    quiz_title VARCHAR(255),
    score INT NOT NULL,
    total_questions INT NOT NULL,
    passed BOOLEAN DEFAULT false,
    time_taken INT,
    answers JSONB,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول النقاط
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

-- جدول الشهادات
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

-- جدول الإشعارات
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

-- جدول الكتب
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

-- 8. إدراج بيانات تجريبية
DO $$
DECLARE
    test_user_id UUID;
    test_course_id UUID;
    test_lesson_id UUID;
BEGIN
    -- جلب مستخدم طالب
    SELECT id INTO test_user_id FROM users WHERE role = 'student' LIMIT 1;
    
    -- جلب كورس منشور
    SELECT id INTO test_course_id FROM courses WHERE is_published = true LIMIT 1;
    
    -- جلب درس من الكورس
    SELECT id INTO test_lesson_id FROM lessons WHERE course_id = test_course_id LIMIT 1;
    
    IF test_user_id IS NOT NULL AND test_lesson_id IS NOT NULL THEN
        -- إضافة تقدم في الدرس
        INSERT INTO lesson_progress (user_id, course_id, lesson_id, is_completed, time_spent)
        VALUES (test_user_id, test_course_id, test_lesson_id, true, 45)
        ON CONFLICT (user_id, lesson_id) DO UPDATE
        SET is_completed = true, time_spent = 45;
        
        -- إضافة نتيجة اختبار
        INSERT INTO quiz_results (user_id, course_id, quiz_title, score, total_questions, passed)
        VALUES (test_user_id, test_course_id, 'اختبار الوحدة الأولى', 85, 100, true);
        
        -- إضافة نقاط
        INSERT INTO user_points (user_id, total_points, current_level, lessons_completed)
        VALUES (test_user_id, 150, 2, 5)
        ON CONFLICT (user_id) DO UPDATE
        SET total_points = 150, current_level = 2, lessons_completed = 5;
        
        -- إضافة إشعار ترحيبي
        INSERT INTO notifications (user_id, title, message, type, icon)
        VALUES 
            (test_user_id, 'مرحباً بك!', 'أهلاً بك في منصتنا التعليمية', 'info', '👋'),
            (test_user_id, 'درس جديد متاح', 'تم إضافة درس جديد في الكورس', 'course', '📚');
        
        RAISE NOTICE '✅ تم إضافة البيانات التجريبية';
    ELSE
        RAISE NOTICE '⚠️ لا يمكن إضافة بيانات تجريبية - تحقق من وجود مستخدمين وكورسات';
    END IF;
END $$;

-- 9. الإحصائيات النهائية
SELECT 'الإحصائيات النهائية:' as info;
SELECT 
    (SELECT COUNT(*) FROM lessons) as "عدد الدروس",
    (SELECT COUNT(*) FROM lesson_progress WHERE is_completed = true) as "الدروس المكتملة",
    (SELECT COUNT(*) FROM quiz_results WHERE passed = true) as "الاختبارات الناجحة",
    (SELECT COUNT(*) FROM certificates) as "الشهادات الصادرة",
    (SELECT COUNT(*) FROM notifications WHERE is_read = false) as "الإشعارات غير المقروءة",
    (SELECT COUNT(DISTINCT user_id) FROM user_points) as "المستخدمون النشطون";

-- رسالة النجاح
SELECT 
    '✅ تم إصلاح جدول الدروس وإنشاء جداول التقدم!' as النتيجة,
    '📊 كل الجداول جاهزة للعمل' as الحالة,
    '🚀 يمكنك الآن تتبع تقدم الطلاب!' as الميزة;
