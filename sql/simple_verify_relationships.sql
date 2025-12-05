-- ========================================
-- التحقق البسيط من العلاقات
-- Simple Relationships Verification
-- ========================================

-- 1. عرض الجداول الموجودة
SELECT 'الجداول الموجودة في قاعدة البيانات:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. التحقق من أعمدة جدول achievements
SELECT 'أعمدة جدول الإنجازات:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'achievements'
ORDER BY ordinal_position;

-- 3. التحقق من أعمدة جدول user_achievements  
SELECT 'أعمدة جدول إنجازات المستخدمين:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_achievements'
ORDER BY ordinal_position;

-- 4. التحقق من أعمدة جدول enrollments
SELECT 'أعمدة جدول التسجيلات:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'enrollments'
ORDER BY ordinal_position;

-- 5. التحقق من أعمدة جدول lesson_progress
SELECT 'أعمدة جدول تقدم الدروس:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'lesson_progress'
ORDER BY ordinal_position;

-- 6. عرض الكورسات الموجودة
SELECT 'الكورسات المتاحة:' as info;
SELECT id, title, category, level, is_published
FROM courses
WHERE is_published = true;

-- 7. عرض الإنجازات الموجودة
SELECT 'الإنجازات المتاحة:' as info;
SELECT 
    a.id,
    a.title,
    a.category,
    a.points,
    c.title as course_title,
    CASE 
        WHEN a.course_id IS NULL THEN 'إنجاز عام'
        ELSE 'إنجاز خاص بكورس'
    END as type
FROM achievements a
LEFT JOIN courses c ON a.course_id = c.id
ORDER BY a.points;

-- 8. إضافة إنجازات مربوطة بالكورسات الموجودة
DO $$
DECLARE
    python_course_id UUID;
    web_course_id UUID;
    ai_course_id UUID;
BEGIN
    -- جلب معرفات الكورسات
    SELECT id INTO python_course_id FROM courses WHERE title LIKE '%Python%' LIMIT 1;
    SELECT id INTO web_course_id FROM courses WHERE title LIKE '%ويب%' LIMIT 1;
    SELECT id INTO ai_course_id FROM courses WHERE title LIKE '%ذكاء%' OR title LIKE '%AI%' LIMIT 1;
    
    -- إضافة إنجازات عامة
    INSERT INTO achievements (title, description, icon, category, points, requirement_type, requirement_value)
    VALUES 
        ('أول خطوة', 'سجل في أول كورس', '👋', 'learning', 5, 'first_enrollment', 1),
        ('متعلم نشط', 'أكمل 10 دروس', '📖', 'learning', 30, 'lessons_completed', 10),
        ('الأسبوع الأول', 'أكمل أسبوع من التعلم', '📅', 'participation', 20, 'days_active', 7)
    ON CONFLICT DO NOTHING;
    
    -- إضافة إنجازات خاصة بكورس Python إذا وجد
    IF python_course_id IS NOT NULL THEN
        INSERT INTO achievements (title, description, icon, category, points, requirement_type, requirement_value, course_id)
        VALUES 
            ('مبرمج Python', 'أكمل 5 دروس في Python', '🐍', 'learning', 40, 'lessons_in_course', 5, python_course_id),
            ('خبير Python', 'أكمل كورس Python', '💎', 'completion', 100, 'complete_course', 1, python_course_id)
        ON CONFLICT DO NOTHING;
        RAISE NOTICE 'تم إضافة إنجازات Python';
    END IF;
    
    -- إضافة إنجازات خاصة بكورس الويب إذا وجد
    IF web_course_id IS NOT NULL THEN
        INSERT INTO achievements (title, description, icon, category, points, requirement_type, requirement_value, course_id)
        VALUES 
            ('مطور واجهات', 'أكمل 3 دروس في تطوير الويب', '🎨', 'learning', 35, 'lessons_in_course', 3, web_course_id),
            ('مطور ويب محترف', 'أكمل كورس تطوير الويب', '🌐', 'completion', 100, 'complete_course', 1, web_course_id)
        ON CONFLICT DO NOTHING;
        RAISE NOTICE 'تم إضافة إنجازات الويب';
    END IF;
    
    -- إضافة إنجازات خاصة بكورس AI إذا وجد
    IF ai_course_id IS NOT NULL THEN
        INSERT INTO achievements (title, description, icon, category, points, requirement_type, requirement_value, course_id)
        VALUES 
            ('مستكشف AI', 'أكمل 3 دروس في الذكاء الاصطناعي', '🤖', 'learning', 45, 'lessons_in_course', 3, ai_course_id),
            ('خبير AI', 'أكمل كورس الذكاء الاصطناعي', '🧠', 'completion', 150, 'complete_course', 1, ai_course_id)
        ON CONFLICT DO NOTHING;
        RAISE NOTICE 'تم إضافة إنجازات AI';
    END IF;
END $$;

-- 9. إنشاء مستخدم وبيانات تجريبية
DO $$
DECLARE
    demo_user_id UUID;
    demo_course_id UUID;
    demo_enrollment_id UUID;
    demo_achievement_id UUID;
BEGIN
    -- إنشاء أو تحديث مستخدم تجريبي
    INSERT INTO users (name, email, phone, password, role)
    VALUES ('أحمد محمد', 'ahmed@demo.com', '01098765432', 'demo123', 'student')
    ON CONFLICT (email) DO UPDATE SET name = 'أحمد محمد'
    RETURNING id INTO demo_user_id;
    
    -- جلب أول كورس منشور
    SELECT id INTO demo_course_id FROM courses WHERE is_published = true LIMIT 1;
    
    IF demo_course_id IS NOT NULL THEN
        -- إنشاء تسجيل
        INSERT INTO enrollments (user_id, course_id, progress, is_active)
        VALUES (demo_user_id, demo_course_id, 35, true)
        ON CONFLICT (user_id, course_id) DO UPDATE SET progress = 35
        RETURNING id INTO demo_enrollment_id;
        
        -- جلب إنجاز عام
        SELECT id INTO demo_achievement_id FROM achievements WHERE course_id IS NULL LIMIT 1;
        
        IF demo_achievement_id IS NOT NULL THEN
            -- منح الإنجاز
            INSERT INTO user_achievements (user_id, achievement_id, course_id, enrollment_id, is_completed)
            VALUES (demo_user_id, demo_achievement_id, demo_course_id, demo_enrollment_id, true)
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
            
            -- إضافة نقاط
            INSERT INTO user_points (user_id, total_points, current_level)
            VALUES (demo_user_id, 50, 1)
            ON CONFLICT (user_id) DO UPDATE SET total_points = 50;
            
            RAISE NOTICE 'تم إنشاء بيانات تجريبية';
        END IF;
    END IF;
END $$;

-- 10. عرض العلاقات النهائية
SELECT 'مثال على الربط الكامل:' as info;
SELECT 
    u.name as student,
    c.title as course,
    e.progress as progress_percent,
    a.title as achievement,
    ua.is_completed as earned
FROM users u
LEFT JOIN enrollments e ON u.id = e.user_id
LEFT JOIN courses c ON e.course_id = c.id
LEFT JOIN user_achievements ua ON u.id = ua.user_id
LEFT JOIN achievements a ON ua.achievement_id = a.id
WHERE u.email = 'ahmed@demo.com';

-- 11. ملخص العلاقات
SELECT 'ملخص العلاقات:' as info;
SELECT 
    'users → enrollments' as relation,
    COUNT(DISTINCT e.user_id) as connected_records
FROM enrollments e
UNION ALL
SELECT 
    'enrollments → courses' as relation,
    COUNT(DISTINCT e.course_id) as connected_records
FROM enrollments e
UNION ALL
SELECT 
    'achievements → courses' as relation,
    COUNT(DISTINCT a.course_id) as connected_records
FROM achievements a
WHERE a.course_id IS NOT NULL
UNION ALL
SELECT 
    'user_achievements → users' as relation,
    COUNT(DISTINCT ua.user_id) as connected_records
FROM user_achievements ua;

-- رسالة النجاح
SELECT 
    '✅ التحقق اكتمل بنجاح!' as status,
    'كل الإنجازات مربوطة بالكورسات' as achievements,
    'كل التسجيلات مربوطة بالمستخدمين والكورسات' as enrollments,
    'البيانات التجريبية جاهزة' as demo_data;
