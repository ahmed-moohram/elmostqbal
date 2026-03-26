-- ========================================
-- سكريبت الإعداد الكامل للمنصة التعليمية
-- Complete Setup Script - يتعامل مع جميع الأخطاء
-- ========================================

-- ========================================
-- 1. تنظيف وإعادة تعيين (اختياري)
-- ========================================

-- إذا كنت تريد البدء من جديد، قم بإلغاء التعليق عن الأسطر التالية:
/*
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
*/

-- ========================================
-- 2. تفعيل الإضافات
-- ========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- 3. إنشاء الأنواع بأمان (مع معالجة الأخطاء)
-- ========================================

-- دالة مساعدة لإنشاء الأنواع بأمان
CREATE OR REPLACE FUNCTION create_enum_type_if_not_exists(type_name text, enum_values text[])
RETURNS void AS $$
DECLARE
    enum_value text;
    create_query text;
BEGIN
    -- التحقق من وجود النوع
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = type_name) THEN
        -- بناء استعلام الإنشاء
        create_query := format('CREATE TYPE %I AS ENUM (', type_name);
        
        FOREACH enum_value IN ARRAY enum_values
        LOOP
            create_query := create_query || quote_literal(enum_value) || ',';
        END LOOP;
        
        -- إزالة الفاصلة الأخيرة وإضافة القوس
        create_query := left(create_query, -1) || ')';
        
        -- تنفيذ الاستعلام
        EXECUTE create_query;
        RAISE NOTICE 'تم إنشاء النوع: %', type_name;
    ELSE
        RAISE NOTICE 'النوع % موجود بالفعل', type_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- إنشاء جميع الأنواع المطلوبة
SELECT create_enum_type_if_not_exists('user_role', 
    ARRAY['student', 'parent', 'teacher', 'admin']);

SELECT create_enum_type_if_not_exists('user_status', 
    ARRAY['active', 'inactive', 'suspended', 'pending']);

SELECT create_enum_type_if_not_exists('course_level', 
    ARRAY['beginner', 'intermediate', 'advanced', 'all-levels']);

SELECT create_enum_type_if_not_exists('course_status', 
    ARRAY['draft', 'published', 'archived']);

SELECT create_enum_type_if_not_exists('payment_type', 
    ARRAY['onetime', 'subscription', 'installment']);

SELECT create_enum_type_if_not_exists('payment_method', 
    ARRAY['vodafone_cash', 'bank_transfer', 'instapay', 'credit_card', 'paypal', 'other']);

SELECT create_enum_type_if_not_exists('payment_status', 
    ARRAY['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled']);

SELECT create_enum_type_if_not_exists('enrollment_status', 
    ARRAY['pending', 'approved', 'rejected', 'expired']);

SELECT create_enum_type_if_not_exists('resource_type', 
    ARRAY['pdf', 'video', 'audio', 'document', 'link', 'other']);

SELECT create_enum_type_if_not_exists('session_platform', 
    ARRAY['zoom', 'google_meet', 'microsoft_teams', 'custom']);

SELECT create_enum_type_if_not_exists('session_status', 
    ARRAY['scheduled', 'live', 'completed', 'cancelled']);

SELECT create_enum_type_if_not_exists('submission_status', 
    ARRAY['submitted', 'graded', 'returned', 'late']);

SELECT create_enum_type_if_not_exists('discount_type', 
    ARRAY['percentage', 'fixed']);

SELECT create_enum_type_if_not_exists('grade_level', 
    ARRAY[
        'الصف الأول الابتدائي', 'الصف الثاني الابتدائي', 'الصف الثالث الابتدائي',
        'الصف الرابع الابتدائي', 'الصف الخامس الابتدائي', 'الصف السادس الابتدائي',
        'الصف الأول الإعدادي', 'الصف الثاني الإعدادي', 'الصف الثالث الإعدادي',
        'الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'
    ]);

-- ========================================
-- 4. رسالة النجاح
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ تم إعداد الأنواع بنجاح!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'الآن يمكنك تشغيل الملفات التالية بالترتيب:';
    RAISE NOTICE '';
    RAISE NOTICE '1. هذا الملف: setup_complete.sql ✅ (تم)';
    RAISE NOTICE '2. الجداول: 01_schema_fixed.sql';
    RAISE NOTICE '3. التسجيلات: 02_enrollments_payments.sql';
    RAISE NOTICE '4. الجلسات: 03_live_sessions_assignments.sql';
    RAISE NOTICE '5. الفهارس: 04_indexes_constraints.sql';
    RAISE NOTICE '6. الأمان: 05_security_rls.sql';
    RAISE NOTICE '7. البيانات: 06_initial_data.sql';
    RAISE NOTICE '';
    RAISE NOTICE 'أو استخدم all_in_one.sql لتشغيل كل شيء مرة واحدة';
    RAISE NOTICE '========================================';
END $$;
