-- ========================================
-- التحقق من نجاح إعداد قاعدة البيانات
-- Verify Database Setup
-- ========================================

-- 1. التحقق من الجداول المنشأة
SELECT 
    'الجداول المنشأة' as check_type,
    count(*) as total_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- 2. عرض جميع الجداول
SELECT 
    table_name as "اسم الجدول",
    (SELECT count(*) 
     FROM information_schema.columns 
     WHERE table_name = t.table_name 
     AND table_schema = 'public') as "عدد الأعمدة"
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 3. التحقق من الأنواع المخصصة (ENUMs)
SELECT 
    'الأنواع المنشأة' as check_type,
    count(*) as total_count
FROM pg_type 
WHERE typname IN (
    'user_role', 'user_status', 'course_level', 'course_status',
    'payment_type', 'payment_method', 'payment_status',
    'enrollment_status', 'resource_type', 'session_platform',
    'session_status', 'submission_status', 'discount_type', 'grade_level'
);

-- 4. عرض جميع الأنواع
SELECT 
    typname as "اسم النوع",
    (SELECT count(*) FROM pg_enum WHERE enumtypid = t.oid) as "عدد القيم"
FROM pg_type t
WHERE typname IN (
    'user_role', 'user_status', 'course_level', 'course_status',
    'payment_type', 'payment_method', 'payment_status',
    'enrollment_status', 'resource_type', 'session_platform',
    'session_status', 'submission_status', 'discount_type', 'grade_level'
)
ORDER BY typname;

-- 5. التحقق من المستخدمين التجريبيين
SELECT 
    name as "الاسم",
    email as "البريد الإلكتروني",
    role as "الدور",
    status as "الحالة",
    is_verified as "مفعّل",
    created_at as "تاريخ الإنشاء"
FROM users
ORDER BY created_at;

-- 6. عرض إحصائيات الجداول
SELECT 
    schemaname as "Schema",
    tablename as "اسم الجدول",
    n_live_tup as "عدد الصفوف",
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as "الحجم"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- 7. التحقق من الفهارس
SELECT 
    'الفهارس المنشأة' as check_type,
    count(*) as total_count
FROM pg_indexes 
WHERE schemaname = 'public';

-- 8. التحقق من الدوال
SELECT 
    'الدوال المنشأة' as check_type,
    count(*) as total_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';

-- 9. رسالة النجاح النهائية
DO $$
DECLARE
    table_count INT;
    type_count INT;
    user_count INT;
    index_count INT;
BEGIN
    -- عد الجداول
    SELECT count(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    -- عد الأنواع
    SELECT count(*) INTO type_count
    FROM pg_type 
    WHERE typname IN (
        'user_role', 'user_status', 'course_level', 'course_status',
        'payment_type', 'payment_method', 'payment_status',
        'enrollment_status', 'resource_type', 'session_platform',
        'session_status', 'submission_status', 'discount_type', 'grade_level'
    );
    
    -- عد المستخدمين
    SELECT count(*) INTO user_count FROM users;
    
    -- عد الفهارس
    SELECT count(*) INTO index_count
    FROM pg_indexes WHERE schemaname = 'public';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 تقرير حالة قاعدة البيانات';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ الجداول: % جدول', table_count;
    RAISE NOTICE '✅ الأنواع: % نوع', type_count;
    RAISE NOTICE '✅ المستخدمين: % مستخدم', user_count;
    RAISE NOTICE '✅ الفهارس: % فهرس', index_count;
    RAISE NOTICE '';
    
    IF table_count >= 5 AND type_count >= 10 AND user_count >= 1 THEN
        RAISE NOTICE '🎉 قاعدة البيانات جاهزة ومكتملة!';
    ELSE
        RAISE NOTICE '⚠️ قد تكون هناك بعض العناصر المفقودة';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
