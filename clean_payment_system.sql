-- ⚠️ تحذير: هذا السكريبت سيحذف كل البيانات الموجودة
-- استخدمه فقط إذا أردت البدء من جديد تماماً

-- حذف Triggers
DROP TRIGGER IF EXISTS update_payment_requests_updated_at ON payment_requests;
DROP TRIGGER IF EXISTS update_enrollments_updated_at ON course_enrollments;

-- حذف الجداول (بالترتيب الصحيح للمراجع)
DROP TABLE IF EXISTS admin_notifications CASCADE;
DROP TABLE IF EXISTS course_enrollments CASCADE;  
DROP TABLE IF EXISTS payment_requests CASCADE;

-- حذف الدوال
DROP FUNCTION IF EXISTS check_enrollment(VARCHAR, UUID);
DROP FUNCTION IF EXISTS get_revenue_stats();

-- رسالة التأكيد
DO $$
BEGIN
    RAISE NOTICE '✅ تم حذف نظام الدفع القديم';
    RAISE NOTICE '📝 الآن يمكنك تشغيل: payment_system_safe.sql';
END $$;
