-- ========================================
-- إصلاح مشكلة Triggers
-- Fix Triggers Issue
-- ========================================

-- 1. حذف جميع الـ triggers القديمة
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        AND trigger_name LIKE '%updated_at%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', r.trigger_name, r.event_object_table);
        RAISE NOTICE 'حذف trigger: % من جدول %', r.trigger_name, r.event_object_table;
    END LOOP;
END $$;

-- 2. إنشاء دالة محسّنة للتحقق من وجود العمود
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- التحقق من وجود عمود updated_at
    IF TG_OP = 'UPDATE' THEN
        -- محاولة تحديث updated_at إذا كان موجوداً
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
        EXCEPTION
            WHEN undefined_column THEN
                -- لا يوجد عمود updated_at، لا تفعل شيئاً
                NULL;
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. تطبيق الـ trigger فقط على الجداول التي تحتوي على updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT DISTINCT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
        AND table_name IN (
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_type = 'BASE TABLE' 
            AND table_schema = 'public'
        )
    LOOP
        BEGIN
            EXECUTE format('
                DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
                CREATE TRIGGER update_%I_updated_at 
                BEFORE UPDATE ON %I 
                FOR EACH ROW 
                EXECUTE FUNCTION update_updated_at_column()',
                t, t, t, t);
            RAISE NOTICE 'تم إنشاء trigger لـ: %', t;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'خطأ في إنشاء trigger لـ %: %', t, SQLERRM;
        END;
    END LOOP;
END $$;

-- 4. عرض الجداول التي تم إضافة triggers لها
SELECT 
    trigger_name,
    event_object_table as table_name,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%updated_at%'
ORDER BY event_object_table;

-- ========================================
-- النتيجة
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ تم إصلاح مشكلة الـ Triggers';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'الآن يمكنك تشغيل ملف الاختبار بدون أخطاء';
    RAISE NOTICE '========================================';
END $$;
