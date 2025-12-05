-- ========================================
-- إعادة تعيين قاعدة البيانات (في حالة وجود أخطاء)
-- Database Reset Script
-- ========================================

-- حذف الأنواع الموجودة مسبقاً (إن وجدت)
DROP TYPE IF EXISTS resource_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS course_level CASCADE;
DROP TYPE IF EXISTS course_status CASCADE;
DROP TYPE IF EXISTS payment_type CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS enrollment_status CASCADE;
DROP TYPE IF EXISTS session_platform CASCADE;
DROP TYPE IF EXISTS session_status CASCADE;
DROP TYPE IF EXISTS submission_status CASCADE;
DROP TYPE IF EXISTS discount_type CASCADE;
DROP TYPE IF EXISTS grade_level CASCADE;

-- حذف الجداول (بالترتيب الصحيح لتجنب مشاكل Foreign Keys)
DROP TABLE IF EXISTS quiz_answers CASCADE;
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS quiz_options CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS submission_comments CASCADE;
DROP TABLE IF EXISTS submission_files CASCADE;
DROP TABLE IF EXISTS assignment_submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS session_recordings CASCADE;
DROP TABLE IF EXISTS session_messages CASCADE;
DROP TABLE IF EXISTS session_participants CASCADE;
DROP TABLE IF EXISTS live_sessions CASCADE;
DROP TABLE IF EXISTS teacher_ratings CASCADE;
DROP TABLE IF EXISTS review_reactions CASCADE;
DROP TABLE IF EXISTS course_reviews CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS coupon_usage CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS enrollment_requests CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS course_gallery CASCADE;
DROP TABLE IF EXISTS course_tags CASCADE;
DROP TABLE IF EXISTS course_faqs CASCADE;
DROP TABLE IF EXISTS course_target_audience CASCADE;
DROP TABLE IF EXISTS course_features CASCADE;
DROP TABLE IF EXISTS course_requirements CASCADE;
DROP TABLE IF EXISTS course_outcomes CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS course_co_instructors CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- حذف الدوال
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS calculate_course_progress(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS update_course_stats() CASCADE;
DROP FUNCTION IF EXISTS update_teacher_stats() CASCADE;
DROP FUNCTION IF EXISTS update_enrollment_progress() CASCADE;
DROP FUNCTION IF EXISTS check_user_permission(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_role(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_dashboard_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS validate_relationships() CASCADE;
DROP FUNCTION IF EXISTS check_data_integrity() CASCADE;
DROP FUNCTION IF EXISTS cleanup_orphaned_data() CASCADE;
DROP FUNCTION IF EXISTS get_database_stats() CASCADE;
DROP FUNCTION IF EXISTS process_payment(UUID, UUID, DECIMAL, payment_method, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS get_course_statistics(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_live_session_status() CASCADE;
DROP FUNCTION IF EXISTS update_expired_subscriptions() CASCADE;
DROP FUNCTION IF EXISTS send_session_reminders() CASCADE;
DROP FUNCTION IF EXISTS log_performance(VARCHAR, DECIMAL, UUID, VARCHAR, INT) CASCADE;

-- حذف Views
DROP VIEW IF EXISTS v_course_details CASCADE;
DROP VIEW IF EXISTS v_student_progress CASCADE;
DROP VIEW IF EXISTS v_revenue_summary CASCADE;
DROP VIEW IF EXISTS course_catalog CASCADE;
DROP VIEW IF EXISTS student_dashboard CASCADE;

-- حذف الجداول الإضافية
DROP TABLE IF EXISTS performance_logs CASCADE;

-- تنظيف Extensions (إن لزم)
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
-- DROP EXTENSION IF EXISTS "pgcrypto" CASCADE;

-- رسالة نجاح
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ تم تنظيف قاعدة البيانات بنجاح';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'يمكنك الآن تشغيل ملفات SQL بالترتيب:';
    RAISE NOTICE '1. 01_schema.sql';
    RAISE NOTICE '2. 02_enrollments_payments.sql';
    RAISE NOTICE '3. 03_live_sessions_assignments.sql';
    RAISE NOTICE '4. 04_indexes_constraints.sql';
    RAISE NOTICE '5. 05_security_rls.sql';
    RAISE NOTICE '6. 06_initial_data.sql';
    RAISE NOTICE '7. 07_fixes_and_validation.sql';
    RAISE NOTICE '8. supabase_setup.sql';
    RAISE NOTICE '';
END $$;
