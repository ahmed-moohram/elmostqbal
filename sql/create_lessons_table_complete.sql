-- ========================================
-- إنشاء جدول الدروس من الصفر
-- Create Lessons Table from Scratch
-- ========================================

-- 1. حذف الجدول القديم إذا كان موجوداً (احذر: سيحذف كل البيانات)
-- DROP TABLE IF EXISTS lesson_progress CASCADE;
-- DROP TABLE IF EXISTS lessons CASCADE;

-- 2. إنشاء جدول الدروس الجديد
CREATE TABLE IF NOT EXISTS lessons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url TEXT,
    duration_minutes INT DEFAULT 0,
    order_index INT DEFAULT 0,
    is_free BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. إضافة فهرس للأداء
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(course_id, order_index);

-- 4. إضافة دروس تجريبية
DO $$
DECLARE
    course_record RECORD;
    lesson_count INT;
BEGIN
    -- لكل كورس منشور، أضف دروس تجريبية
    FOR course_record IN SELECT id, title FROM courses WHERE is_published = true LOOP
        -- تحقق من وجود دروس للكورس
        SELECT COUNT(*) INTO lesson_count FROM lessons WHERE course_id = course_record.id;
        
        IF lesson_count = 0 THEN
            -- إضافة دروس تجريبية
            INSERT INTO lessons (course_id, title, description, video_url, duration_minutes, order_index, is_free, is_published)
            VALUES 
                (course_record.id, 'مقدمة في ' || course_record.title, 'مقدمة شاملة عن محتوى الكورس وما ستتعلمه', 'https://youtube.com/watch?v=intro', 10, 1, true, true),
                (course_record.id, 'الدرس الأول: الأساسيات', 'نبدأ رحلتنا بتعلم الأساسيات المهمة', 'https://youtube.com/watch?v=lesson1', 25, 2, false, true),
                (course_record.id, 'الدرس الثاني: المفاهيم المتقدمة', 'نتعمق أكثر في المفاهيم المتقدمة', 'https://youtube.com/watch?v=lesson2', 30, 3, false, true),
                (course_record.id, 'الدرس الثالث: التطبيق العملي', 'تطبيق عملي شامل على ما تعلمناه', 'https://youtube.com/watch?v=lesson3', 45, 4, false, true),
                (course_record.id, 'الدرس الرابع: حل المشاكل', 'نتعلم كيفية حل المشاكل الشائعة', 'https://youtube.com/watch?v=lesson4', 35, 5, false, true),
                (course_record.id, 'المراجعة النهائية', 'مراجعة شاملة لكل ما تعلمناه في الكورس', 'https://youtube.com/watch?v=review', 20, 6, false, true);
            
            RAISE NOTICE '✅ تم إضافة 6 دروس للكورس: %', course_record.title;
        END IF;
    END LOOP;
END $$;

-- 5. التحقق من الجدول
SELECT 'معلومات جدول الدروس:' as info;
SELECT 
    column_name as "العمود",
    data_type as "النوع",
    is_nullable as "يقبل NULL",
    column_default as "القيمة الافتراضية"
FROM information_schema.columns
WHERE table_name = 'lessons'
ORDER BY ordinal_position;

-- 6. عرض الدروس المضافة
SELECT 'الدروس المضافة:' as info;
SELECT 
    c.title as "الكورس",
    COUNT(l.id) as "عدد الدروس",
    SUM(l.duration_minutes) as "المدة الكلية (دقيقة)",
    COUNT(CASE WHEN l.is_free THEN 1 END) as "دروس مجانية"
FROM courses c
LEFT JOIN lessons l ON c.id = l.course_id
GROUP BY c.id, c.title
ORDER BY c.title;

-- 7. عرض تفاصيل الدروس
SELECT 'تفاصيل الدروس:' as info;
SELECT 
    l.title as "عنوان الدرس",
    c.title as "الكورس",
    l.duration_minutes || ' دقيقة' as "المدة",
    'الدرس ' || l.order_index as "الترتيب",
    CASE WHEN l.is_free THEN '✅ مجاني' ELSE '💰 مدفوع' END as "النوع"
FROM lessons l
JOIN courses c ON l.course_id = c.id
ORDER BY c.title, l.order_index
LIMIT 20;

-- 8. الآن إنشاء جداول التقدم الأخرى
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

-- 9. إضافة فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_course ON lesson_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- 10. إدراج بيانات تجريبية للتقدم
DO $$
DECLARE
    test_user_id UUID;
    test_course_id UUID;
    test_lesson_id UUID;
BEGIN
    -- جلب أول طالب
    SELECT id INTO test_user_id FROM users WHERE role = 'student' LIMIT 1;
    
    IF test_user_id IS NULL THEN
        -- إنشاء طالب تجريبي إذا لم يكن موجوداً
        INSERT INTO users (name, email, phone, password, role)
        VALUES ('طالب تجريبي', 'test_student@example.com', '01000000001', encode('password123', 'base64'), 'student')
        RETURNING id INTO test_user_id;
    END IF;
    
    -- جلب أول كورس منشور
    SELECT id INTO test_course_id FROM courses WHERE is_published = true LIMIT 1;
    
    IF test_course_id IS NOT NULL THEN
        -- جلب أول درس من الكورس
        SELECT id INTO test_lesson_id FROM lessons WHERE course_id = test_course_id ORDER BY order_index LIMIT 1;
        
        IF test_lesson_id IS NOT NULL THEN
            -- إضافة تقدم في الدرس
            INSERT INTO lesson_progress (user_id, course_id, lesson_id, is_completed, time_spent)
            VALUES (test_user_id, test_course_id, test_lesson_id, true, 25)
            ON CONFLICT (user_id, lesson_id) DO UPDATE
            SET is_completed = true, time_spent = 25;
            
            -- إضافة نتيجة اختبار
            INSERT INTO quiz_results (user_id, course_id, quiz_title, score, total_questions, passed)
            VALUES 
                (test_user_id, test_course_id, 'اختبار الوحدة الأولى', 85, 100, true),
                (test_user_id, test_course_id, 'اختبار منتصف الكورس', 92, 100, true);
            
            -- إضافة نقاط للمستخدم
            INSERT INTO user_points (user_id, total_points, current_level, lessons_completed, quizzes_passed)
            VALUES (test_user_id, 250, 3, 8, 2)
            ON CONFLICT (user_id) DO UPDATE
            SET total_points = 250, current_level = 3, lessons_completed = 8, quizzes_passed = 2;
            
            -- إضافة إشعارات
            INSERT INTO notifications (user_id, title, message, type, icon)
            VALUES 
                (test_user_id, 'مرحباً بك في المنصة!', 'نتمنى لك رحلة تعليمية ممتعة ومفيدة', 'info', '👋'),
                (test_user_id, 'أحسنت! 🎉', 'لقد أكملت الدرس الأول بنجاح', 'success', '✅'),
                (test_user_id, 'درس جديد متاح', 'تم إضافة درس جديد في كورس Python', 'course', '📚'),
                (test_user_id, 'تذكير', 'لديك اختبار غداً في الساعة 3:00 مساءً', 'reminder', '⏰');
            
            RAISE NOTICE '✅ تم إضافة كل البيانات التجريبية بنجاح';
        END IF;
    END IF;
END $$;

-- 11. إضافة كتب تجريبية للمكتبة
INSERT INTO books (title, author, category, description, rating, is_free, is_new_release)
VALUES 
    ('تعلم البرمجة بلغة Python', 'د. أحمد محمد', 'البرمجة', 'كتاب شامل لتعلم Python من الصفر', 4.8, true, true),
    ('أساسيات قواعد البيانات', 'م. سارة أحمد', 'قواعد البيانات', 'مقدمة في قواعد البيانات SQL', 4.6, true, false),
    ('تطوير تطبيقات الويب', 'د. محمد علي', 'تطوير الويب', 'دليل شامل لتطوير تطبيقات الويب الحديثة', 4.9, false, true)
ON CONFLICT DO NOTHING;

-- 12. الإحصائيات النهائية
SELECT 'الإحصائيات النهائية:' as info;
SELECT 
    (SELECT COUNT(*) FROM lessons) as "إجمالي الدروس",
    (SELECT COUNT(DISTINCT course_id) FROM lessons) as "الكورسات التي لها دروس",
    (SELECT COUNT(*) FROM lesson_progress WHERE is_completed = true) as "الدروس المكتملة",
    (SELECT COUNT(*) FROM quiz_results WHERE passed = true) as "الاختبارات الناجحة",
    (SELECT COUNT(*) FROM notifications WHERE is_read = false) as "الإشعارات الجديدة",
    (SELECT COUNT(*) FROM books) as "الكتب في المكتبة";

-- رسالة النجاح
SELECT 
    '🎉 تم إنشاء كل الجداول بنجاح!' as النتيجة,
    '✅ جدول الدروس جاهز' as الدروس,
    '✅ جداول التقدم جاهزة' as التقدم,
    '✅ البيانات التجريبية مضافة' as البيانات,
    '🚀 النظام جاهز للعمل الآن!' as الحالة;
