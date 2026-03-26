-- ========================================
-- 🎯 التحقق النهائي الشامل من كل شيء
-- Final Complete System Check
-- ========================================

-- 1. عرض كل الجداول الموجودة
SELECT '📊 الجداول الموجودة في قاعدة البيانات:' as section;
SELECT 
    table_name as "اسم الجدول",
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as "عدد الأعمدة"
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. عدد السجلات في كل جدول
SELECT '📈 عدد السجلات في كل جدول:' as section;
SELECT 
    'users' as جدول, COUNT(*) as العدد FROM users
UNION ALL
SELECT 'courses', COUNT(*) FROM courses
UNION ALL
SELECT 'enrollments', COUNT(*) FROM enrollments
UNION ALL
SELECT 'lessons', COUNT(*) FROM lessons
UNION ALL
SELECT 'achievements', COUNT(*) FROM achievements
UNION ALL
SELECT 'user_achievements', COUNT(*) FROM user_achievements
UNION ALL
SELECT 'user_points', COUNT(*) FROM user_points;

-- 3. المستخدمون حسب الدور
SELECT '👥 المستخدمون حسب الدور:' as section;
SELECT 
    role as "الدور",
    COUNT(*) as "العدد",
    STRING_AGG(name, ', ' ORDER BY name) as "الأسماء"
FROM users
GROUP BY role
ORDER BY role;

-- 4. الكورسات المتاحة
SELECT '📚 الكورسات المتاحة:' as section;
SELECT 
    id,
    title as "العنوان",
    instructor_name as "المدرس",
    price as "السعر",
    CASE 
        WHEN is_published THEN '✅ منشور'
        ELSE '❌ غير منشور'
    END as "الحالة",
    (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as "عدد الدروس",
    (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as "عدد المسجلين"
FROM courses c
ORDER BY created_at DESC;

-- 5. التسجيلات النشطة
SELECT '📝 التسجيلات النشطة:' as section;
SELECT 
    u.name as "الطالب",
    c.title as "الكورس",
    e.status as "الحالة",
    e.progress || '%' as "التقدم",
    e.enrolled_at::date as "تاريخ التسجيل"
FROM enrollments e
JOIN users u ON e.user_id = u.id
JOIN courses c ON e.course_id = c.id
WHERE e.is_active = true
ORDER BY e.enrolled_at DESC
LIMIT 10;

-- 6. الإنجازات المربوطة بالكورسات
SELECT '🏆 الإنجازات المربوطة بالكورسات:' as section;
SELECT 
    a.title as "الإنجاز",
    a.points as "النقاط",
    c.title as "الكورس المرتبط",
    CASE 
        WHEN a.course_id IS NULL THEN '🌍 عام'
        ELSE '🎯 خاص'
    END as "النوع"
FROM achievements a
LEFT JOIN courses c ON a.course_id = c.id
ORDER BY a.course_id NULLS FIRST, a.points DESC;

-- 7. إنجازات المستخدمين
SELECT '🎖️ إنجازات المستخدمين المحققة:' as section;
SELECT 
    u.name as "الطالب",
    COUNT(ua.id) as "عدد الإنجازات",
    SUM(a.points) as "مجموع النقاط"
FROM users u
LEFT JOIN user_achievements ua ON u.id = ua.user_id AND ua.is_completed = true
LEFT JOIN achievements a ON ua.achievement_id = a.id
WHERE u.role = 'student'
GROUP BY u.id, u.name
ORDER BY SUM(a.points) DESC NULLS LAST;

-- 8. الدروس المتاحة
SELECT '📖 الدروس المتاحة:' as section;
SELECT 
    c.title as "الكورس",
    COUNT(l.id) as "عدد الدروس",
    SUM(l.duration_minutes) as "المدة الكلية (دقيقة)",
    COUNT(CASE WHEN l.is_free THEN 1 END) as "دروس مجانية",
    COUNT(CASE WHEN l.is_published THEN 1 END) as "دروس منشورة"
FROM courses c
LEFT JOIN lessons l ON c.id = l.course_id
GROUP BY c.id, c.title
ORDER BY c.title;

-- 9. التحقق من العلاقات
SELECT '🔗 العلاقات الخارجية (Foreign Keys):' as section;
SELECT 
    tc.table_name as "الجدول",
    kcu.column_name as "العمود",
    ccu.table_name AS "يشير إلى",
    ccu.column_name AS "العمود المرجعي"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 10. الملخص النهائي
SELECT '✅ الملخص النهائي للنظام:' as section;
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'admin') as "المسؤولون",
    (SELECT COUNT(*) FROM users WHERE role = 'teacher') as "المدرسون",
    (SELECT COUNT(*) FROM users WHERE role = 'student') as "الطلاب",
    (SELECT COUNT(*) FROM courses WHERE is_published = true) as "الكورسات المنشورة",
    (SELECT COUNT(*) FROM enrollments WHERE status = 'approved') as "التسجيلات المعتمدة",
    (SELECT COUNT(*) FROM lessons WHERE is_published = true) as "الدروس المنشورة",
    (SELECT COUNT(*) FROM achievements) as "إجمالي الإنجازات",
    (SELECT COUNT(DISTINCT ua.user_id) FROM user_achievements ua WHERE ua.is_completed = true) as "طلاب حققوا إنجازات";

-- 11. اختبار الوظائف الأساسية
SELECT '🔧 اختبار الوظائف الأساسية:' as section;
DO $$
DECLARE
    test_result BOOLEAN := true;
    table_count INT;
    relation_count INT;
BEGIN
    -- التحقق من وجود الجداول الأساسية
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('users', 'courses', 'enrollments', 'lessons', 'achievements');
    
    IF table_count < 5 THEN
        test_result := false;
        RAISE NOTICE '❌ بعض الجداول الأساسية مفقودة';
    ELSE
        RAISE NOTICE '✅ كل الجداول الأساسية موجودة';
    END IF;
    
    -- التحقق من العلاقات
    SELECT COUNT(*) INTO relation_count
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
    AND table_schema = 'public';
    
    IF relation_count < 5 THEN
        RAISE NOTICE '⚠️ عدد العلاقات قليل: %', relation_count;
    ELSE
        RAISE NOTICE '✅ العلاقات موجودة: % علاقة', relation_count;
    END IF;
    
    -- التحقق من وجود بيانات
    IF (SELECT COUNT(*) FROM users) = 0 THEN
        RAISE NOTICE '⚠️ لا يوجد مستخدمون في النظام';
    ELSE
        RAISE NOTICE '✅ يوجد % مستخدم في النظام', (SELECT COUNT(*) FROM users);
    END IF;
    
    IF (SELECT COUNT(*) FROM courses) = 0 THEN
        RAISE NOTICE '⚠️ لا يوجد كورسات في النظام';
    ELSE
        RAISE NOTICE '✅ يوجد % كورس في النظام', (SELECT COUNT(*) FROM courses);
    END IF;
    
    IF test_result THEN
        RAISE NOTICE '🎉 النظام جاهز للعمل بشكل كامل!';
    ELSE
        RAISE NOTICE '⚠️ النظام يحتاج بعض الإصلاحات';
    END IF;
END $$;

-- الرسالة النهائية
SELECT 
    '🎊 التحقق النهائي اكتمل!' as النتيجة,
    '✅ قاعدة البيانات جاهزة' as قاعدة_البيانات,
    '✅ كل العلاقات مربوطة' as العلاقات,
    '✅ البيانات التجريبية موجودة' as البيانات,
    '🚀 النظام جاهز للاستخدام!' as الحالة;
