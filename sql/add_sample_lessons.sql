-- ========================================
-- إضافة دروس تجريبية للكورسات
-- Add Sample Lessons to Courses
-- ========================================

-- جلب معرفات الكورسات
DO $$
DECLARE
    python_course UUID;
    web_course UUID;
    ai_course UUID;
BEGIN
    -- جلب معرف كورس Python
    SELECT id INTO python_course FROM courses WHERE title LIKE '%Python%' LIMIT 1;
    
    -- جلب معرف كورس الويب
    SELECT id INTO web_course FROM courses WHERE title LIKE '%ويب%' LIMIT 1;
    
    -- جلب معرف كورس AI
    SELECT id INTO ai_course FROM courses WHERE title LIKE '%ذكاء%' OR title LIKE '%AI%' LIMIT 1;
    
    -- إضافة دروس لكورس Python
    IF python_course IS NOT NULL THEN
        INSERT INTO lessons (course_id, title, description, video_url, duration_minutes, order_index, is_free, is_published)
        VALUES 
            (python_course, 'مقدمة في Python', 'تعرف على لغة Python وتطبيقاتها', 'https://youtube.com/watch?v=1', 15, 1, true, true),
            (python_course, 'تثبيت Python', 'كيفية تثبيت Python على جهازك', 'https://youtube.com/watch?v=2', 10, 2, true, true),
            (python_course, 'المتغيرات والأنواع', 'أساسيات المتغيرات في Python', 'https://youtube.com/watch?v=3', 20, 3, false, true),
            (python_course, 'الشروط والحلقات', 'if, else, for, while', 'https://youtube.com/watch?v=4', 25, 4, false, true),
            (python_course, 'الدوال Functions', 'كيفية إنشاء واستخدام الدوال', 'https://youtube.com/watch?v=5', 30, 5, false, true)
        ON CONFLICT DO NOTHING;
        RAISE NOTICE '✅ تم إضافة دروس Python';
    END IF;
    
    -- إضافة دروس لكورس الويب
    IF web_course IS NOT NULL THEN
        INSERT INTO lessons (course_id, title, description, video_url, duration_minutes, order_index, is_free, is_published)
        VALUES 
            (web_course, 'مقدمة في تطوير الويب', 'نظرة عامة على تطوير الويب', 'https://youtube.com/watch?v=6', 12, 1, true, true),
            (web_course, 'أساسيات HTML', 'تعلم بناء هيكل الصفحات', 'https://youtube.com/watch?v=7', 18, 2, true, true),
            (web_course, 'تنسيق CSS', 'تصميم وتنسيق الصفحات', 'https://youtube.com/watch?v=8', 22, 3, false, true),
            (web_course, 'JavaScript الأساسيات', 'إضافة التفاعل للصفحات', 'https://youtube.com/watch?v=9', 28, 4, false, true),
            (web_course, 'مشروع عملي', 'بناء موقع كامل', 'https://youtube.com/watch?v=10', 45, 5, false, true)
        ON CONFLICT DO NOTHING;
        RAISE NOTICE '✅ تم إضافة دروس الويب';
    END IF;
    
    -- إضافة دروس لكورس AI
    IF ai_course IS NOT NULL THEN
        INSERT INTO lessons (course_id, title, description, video_url, duration_minutes, order_index, is_free, is_published)
        VALUES 
            (ai_course, 'ما هو الذكاء الاصطناعي؟', 'مقدمة شاملة عن AI', 'https://youtube.com/watch?v=11', 20, 1, true, true),
            (ai_course, 'Machine Learning', 'أساسيات تعلم الآلة', 'https://youtube.com/watch?v=12', 25, 2, false, true),
            (ai_course, 'Deep Learning', 'الشبكات العصبية العميقة', 'https://youtube.com/watch?v=13', 30, 3, false, true),
            (ai_course, 'معالجة اللغات الطبيعية', 'NLP وتطبيقاتها', 'https://youtube.com/watch?v=14', 35, 4, false, true),
            (ai_course, 'مشروع AI عملي', 'بناء نموذج AI', 'https://youtube.com/watch?v=15', 50, 5, false, true)
        ON CONFLICT DO NOTHING;
        RAISE NOTICE '✅ تم إضافة دروس AI';
    END IF;
END $$;

-- عرض الدروس المضافة
SELECT 
    c.title as "الكورس",
    COUNT(l.id) as "عدد الدروس",
    SUM(l.duration_minutes) as "المدة الكلية (دقيقة)",
    COUNT(CASE WHEN l.is_free THEN 1 END) as "دروس مجانية"
FROM courses c
LEFT JOIN lessons l ON c.id = l.course_id
WHERE c.is_published = true
GROUP BY c.id, c.title
ORDER BY c.title;

-- رسالة النجاح
SELECT 
    '✅ تم إضافة الدروس التجريبية بنجاح!' as status,
    '📚 15 درس تم إضافتها' as lessons,
    '🎯 موزعة على 3 كورسات' as courses;
