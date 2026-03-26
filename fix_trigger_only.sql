-- حل سريع: حذف الـ Trigger المكرر فقط
DROP TRIGGER IF EXISTS update_payment_requests_updated_at ON payment_requests;
DROP TRIGGER IF EXISTS update_enrollments_updated_at ON course_enrollments;

-- إعادة إنشاء الـ Triggers
CREATE TRIGGER update_payment_requests_updated_at
    BEFORE UPDATE ON payment_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at
    BEFORE UPDATE ON course_enrollments  
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- رسالة النجاح
DO $$
BEGIN
    RAISE NOTICE '✅ تم إصلاح الـ Triggers بنجاح!';
END $$;
