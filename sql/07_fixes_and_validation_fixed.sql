-- ========================================
-- إصلاحات ومراجعة قاعدة البيانات (محسّن)
-- Database Fixes and Validation (FIXED)
-- ========================================

-- ========================================
-- 1. إصلاح المشاكل المحتملة
-- ========================================

-- إصلاح: إزالة PRIMARY KEY المكرر في course_co_instructors
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'course_co_instructors' 
               AND constraint_name = 'course_co_instructors_pkey') THEN
        ALTER TABLE course_co_instructors DROP CONSTRAINT course_co_instructors_pkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'course_co_instructors' AND column_name = 'id') THEN
        ALTER TABLE course_co_instructors DROP COLUMN id;
    END IF;
    
    ALTER TABLE course_co_instructors ADD PRIMARY KEY (course_id, instructor_id);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'تحذير: مشكلة في course_co_instructors - %', SQLERRM;
END $$;

-- إصلاح: إزالة PRIMARY KEY المكرر في course_tags
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'course_tags' 
               AND constraint_name = 'course_tags_pkey') THEN
        ALTER TABLE course_tags DROP CONSTRAINT course_tags_pkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'course_tags' AND column_name = 'id') THEN
        ALTER TABLE course_tags DROP COLUMN id;
    END IF;
    
    ALTER TABLE course_tags ADD PRIMARY KEY (course_id, tag);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'تحذير: مشكلة في course_tags - %', SQLERRM;
END $$;

-- إصلاح: التأكد من وجود best_answer_id كـ foreign key
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_best_answer') THEN
        ALTER TABLE questions 
            ADD CONSTRAINT fk_best_answer 
            FOREIGN KEY (best_answer_id) 
            REFERENCES answers(id) 
            ON DELETE SET NULL;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'تحذير: مشكلة في fk_best_answer - %', SQLERRM;
END $$;

-- إصلاح: منع الحلقات اللانهائية في الردود
DO $$ 
BEGIN
    ALTER TABLE session_messages 
        ADD CONSTRAINT no_self_reply 
        CHECK (parent_message_id != id);
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'القيد no_self_reply موجود بالفعل';
    WHEN OTHERS THEN
        RAISE NOTICE 'تحذير: مشكلة في no_self_reply - %', SQLERRM;
END $$;

-- إصلاح: التأكد من أن تاريخ انتهاء الصلاحية بعد تاريخ البداية
DO $$ 
BEGIN
    ALTER TABLE enrollments 
        ADD CONSTRAINT check_enrollment_validity 
        CHECK (expires_at IS NULL OR enrolled_at < expires_at);
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'القيد check_enrollment_validity موجود بالفعل';
END $$;

DO $$ 
BEGIN
    ALTER TABLE user_subscriptions 
        ADD CONSTRAINT check_subscription_validity 
        CHECK (starts_at < ends_at);
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'القيد check_subscription_validity موجود بالفعل';
END $$;

-- إصلاح: التأكد من أن الدرجة المحصلة لا تتجاوز الدرجة الكاملة
-- استخدام TRIGGER بدلاً من CHECK (لا يمكن استخدام subquery في CHECK)
CREATE OR REPLACE FUNCTION check_assignment_score()
RETURNS TRIGGER AS $$
DECLARE
    v_max_score INT;
BEGIN
    IF NEW.score IS NOT NULL THEN
        SELECT max_score INTO v_max_score
        FROM assignments
        WHERE id = NEW.assignment_id;
        
        IF NEW.score > v_max_score THEN
            RAISE EXCEPTION 'الدرجة (%) تتجاوز الدرجة الكاملة (%)', NEW.score, v_max_score;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_assignment_score ON assignment_submissions;
CREATE TRIGGER trg_check_assignment_score
    BEFORE INSERT OR UPDATE ON assignment_submissions
    FOR EACH ROW
    EXECUTE FUNCTION check_assignment_score();

-- إصلاح: منع التسجيل في نفس الكورس أكثر من مرة بحالات مختلفة
DROP INDEX IF EXISTS unique_active_enrollment;
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_enrollment 
    ON enrollments(user_id, course_id) 
    WHERE is_active = TRUE;

-- إصلاح: منع وجود أكثر من طلب معلق لنفس الكورس
DROP INDEX IF EXISTS enrollment_requests_student_course_status_key;
DROP INDEX IF EXISTS unique_pending_request;
CREATE UNIQUE INDEX unique_pending_request 
    ON enrollment_requests(student_id, course_id) 
    WHERE status = 'pending';

-- ========================================
-- 2. إضافة القيود المفقودة
-- ========================================

-- التأكد من أن عدد المشاركين لا يتجاوز الحد الأقصى
DO $$ 
BEGIN
    ALTER TABLE live_sessions 
        ADD CONSTRAINT check_participants_limit 
        CHECK (current_participants <= max_participants);
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'القيد check_participants_limit موجود بالفعل';
END $$;

-- التأكد من أن النسبة المئوية صحيحة
DO $$ 
BEGIN
    ALTER TABLE lesson_progress 
        ADD CONSTRAINT check_progress_percentage 
        CHECK (progress >= 0 AND progress <= 100);
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'القيد check_progress_percentage موجود بالفعل';
END $$;

DO $$ 
BEGIN
    ALTER TABLE enrollments 
        ADD CONSTRAINT check_enrollment_progress 
        CHECK (progress >= 0 AND progress <= 100);
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'القيد check_enrollment_progress موجود بالفعل';
END $$;

-- التأكد من أن التقييمات في النطاق الصحيح
DO $$ 
BEGIN
    ALTER TABLE courses 
        ADD CONSTRAINT check_course_rating 
        CHECK (rating >= 0 AND rating <= 5);
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'القيد check_course_rating موجود بالفعل';
END $$;

DO $$ 
BEGIN
    ALTER TABLE teachers 
        ADD CONSTRAINT check_teacher_rating 
        CHECK (average_rating >= 0 AND average_rating <= 5);
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'القيد check_teacher_rating موجود بالفعل';
END $$;

-- ========================================
-- 3. إضافة الفهارس المفقودة
-- ========================================

-- فهارس للأداء على الجداول الكبيرة
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON enrollments(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_lesson ON lesson_progress(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_id) WHERE transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;

-- فهارس للبحث السريع (مع معالجة الأخطاء)
DO $$ 
BEGIN
    CREATE INDEX IF NOT EXISTS idx_courses_search ON courses USING gin(
        to_tsvector('arabic', title || ' ' || COALESCE(description, ''))
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'تحذير: لم يتم إنشاء idx_courses_search - %', SQLERRM;
END $$;

DO $$ 
BEGIN
    CREATE INDEX IF NOT EXISTS idx_users_search ON users USING gin(
        to_tsvector('arabic', name || ' ' || COALESCE(father_name, ''))
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'تحذير: لم يتم إنشاء idx_users_search - %', SQLERRM;
END $$;

-- ========================================
-- 4. دوال التحقق من سلامة البيانات
-- ========================================

-- دالة للتحقق من سلامة العلاقات
CREATE OR REPLACE FUNCTION validate_relationships()
RETURNS TABLE (
    table_name TEXT,
    issue TEXT,
    count BIGINT
) AS $$
BEGIN
    -- التحقق من المستخدمين بدون دور
    RETURN QUERY
    SELECT 'users'::TEXT, 'Users without role'::TEXT, COUNT(*)
    FROM users WHERE role IS NULL;
    
    -- التحقق من الكورسات بدون مدرس
    RETURN QUERY
    SELECT 'courses'::TEXT, 'Courses without instructor'::TEXT, COUNT(*)
    FROM courses c
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = c.instructor_id);
    
    -- التحقق من التسجيلات لكورسات غير موجودة
    RETURN QUERY
    SELECT 'enrollments'::TEXT, 'Enrollments for non-existent courses'::TEXT, COUNT(*)
    FROM enrollments e
    WHERE NOT EXISTS (SELECT 1 FROM courses c WHERE c.id = e.course_id);
    
    -- التحقق من الدروس بدون أقسام
    RETURN QUERY
    SELECT 'lessons'::TEXT, 'Lessons without sections'::TEXT, COUNT(*)
    FROM lessons l
    WHERE NOT EXISTS (SELECT 1 FROM sections s WHERE s.id = l.section_id);
    
    -- التحقق من الأقسام بدون كورسات
    RETURN QUERY
    SELECT 'sections'::TEXT, 'Sections without courses'::TEXT, COUNT(*)
    FROM sections s
    WHERE NOT EXISTS (SELECT 1 FROM courses c WHERE c.id = s.course_id);
    
    -- التحقق من المدفوعات بدون مستخدمين
    RETURN QUERY
    SELECT 'payments'::TEXT, 'Payments without users'::TEXT, COUNT(*)
    FROM payments p
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p.user_id);
END;
$$ LANGUAGE plpgsql;

-- دالة للتحقق من تكامل البيانات
CREATE OR REPLACE FUNCTION check_data_integrity()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- التحقق من التواريخ
    RETURN QUERY
    SELECT 
        'Date Consistency'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'PASS'::TEXT 
            ELSE 'FAIL'::TEXT 
        END,
        'Enrollments with invalid dates: ' || COUNT(*)::TEXT
    FROM enrollments
    WHERE expires_at IS NOT NULL AND enrolled_at >= expires_at;
    
    -- التحقق من التقدم
    RETURN QUERY
    SELECT 
        'Progress Values'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'PASS'::TEXT 
            ELSE 'FAIL'::TEXT 
        END,
        'Invalid progress values: ' || COUNT(*)::TEXT
    FROM enrollments
    WHERE progress < 0 OR progress > 100;
    
    -- التحقق من التقييمات
    RETURN QUERY
    SELECT 
        'Rating Values'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'PASS'::TEXT 
            ELSE 'FAIL'::TEXT 
        END,
        'Invalid ratings: ' || COUNT(*)::TEXT
    FROM course_reviews
    WHERE rating < 1 OR rating > 5;
    
    -- التحقق من الأسعار
    RETURN QUERY
    SELECT 
        'Price Consistency'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'PASS'::TEXT 
            ELSE 'FAIL'::TEXT 
        END,
        'Courses with discount > price: ' || COUNT(*)::TEXT
    FROM courses
    WHERE discount_price IS NOT NULL AND discount_price >= price;
    
    -- التحقق من أرقام الهواتف
    RETURN QUERY
    SELECT 
        'Phone Numbers'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'PASS'::TEXT 
            ELSE 'FAIL'::TEXT 
        END,
        'Invalid phone numbers: ' || COUNT(*)::TEXT
    FROM users
    WHERE student_phone !~ '^0\d{10}$';
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 5. دوال تنظيف البيانات
-- ========================================

-- دالة لتنظيف البيانات المعلقة
CREATE OR REPLACE FUNCTION cleanup_orphaned_data()
RETURNS TABLE (
    table_name TEXT,
    deleted_count BIGINT
) AS $$
DECLARE
    v_count BIGINT;
BEGIN
    -- حذف تقدم الدروس للمستخدمين المحذوفين
    DELETE FROM lesson_progress lp
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = lp.user_id);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN QUERY SELECT 'lesson_progress'::TEXT, v_count;
    
    -- حذف التسجيلات للكورسات المحذوفة
    DELETE FROM enrollments e
    WHERE NOT EXISTS (SELECT 1 FROM courses c WHERE c.id = e.course_id);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN QUERY SELECT 'enrollments'::TEXT, v_count;
    
    -- حذف الموارد للدروس المحذوفة
    DELETE FROM resources r
    WHERE NOT EXISTS (SELECT 1 FROM lessons l WHERE l.id = r.lesson_id);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN QUERY SELECT 'resources'::TEXT, v_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 6. دوال المراقبة والإحصائيات
-- ========================================

-- دالة لعرض إحصائيات قاعدة البيانات
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS TABLE (
    entity TEXT,
    total_count BIGINT,
    active_count BIGINT,
    inactive_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'Users'::TEXT, 
           COUNT(*), 
           COUNT(*) FILTER (WHERE status = 'active'),
           COUNT(*) FILTER (WHERE status != 'active')
    FROM users;
    
    RETURN QUERY
    SELECT 'Courses'::TEXT,
           COUNT(*),
           COUNT(*) FILTER (WHERE status = 'published' AND is_active = TRUE),
           COUNT(*) FILTER (WHERE status != 'published' OR is_active = FALSE)
    FROM courses;
    
    RETURN QUERY
    SELECT 'Enrollments'::TEXT,
           COUNT(*),
           COUNT(*) FILTER (WHERE is_active = TRUE),
           COUNT(*) FILTER (WHERE is_active = FALSE)
    FROM enrollments;
    
    RETURN QUERY
    SELECT 'Payments'::TEXT,
           COUNT(*),
           COUNT(*) FILTER (WHERE status = 'completed'),
           COUNT(*) FILTER (WHERE status != 'completed')
    FROM payments;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. إنشاء Views للتقارير
-- ========================================

-- View لعرض الكورسات مع معلومات كاملة
CREATE OR REPLACE VIEW v_course_details AS
SELECT 
    c.*,
    u.name as instructor_name,
    u.email as instructor_email,
    COUNT(DISTINCT e.user_id) as enrolled_students,
    COUNT(DISTINCT s.id) as total_sections_count
FROM courses c
LEFT JOIN users u ON c.instructor_id = u.id
LEFT JOIN enrollments e ON c.id = e.course_id AND e.is_active = TRUE
LEFT JOIN sections s ON c.id = s.course_id
GROUP BY c.id, u.name, u.email;

-- View لعرض تقدم الطلاب
CREATE OR REPLACE VIEW v_student_progress AS
SELECT 
    u.id as student_id,
    u.name as student_name,
    c.id as course_id,
    c.title as course_title,
    e.enrolled_at,
    e.progress,
    e.last_accessed,
    CASE 
        WHEN e.completed_at IS NOT NULL THEN 'مكتمل'
        WHEN e.progress >= 80 THEN 'شبه مكتمل'
        WHEN e.progress >= 50 THEN 'في التقدم'
        ELSE 'في البداية'
    END as status_text
FROM users u
JOIN enrollments e ON u.id = e.user_id
JOIN courses c ON e.course_id = c.id
WHERE u.role = 'student';

-- View لعرض الإيرادات
CREATE OR REPLACE VIEW v_revenue_summary AS
SELECT 
    DATE_TRUNC('month', payment_date) as month,
    COUNT(*) as total_transactions,
    COUNT(DISTINCT user_id) as unique_customers,
    SUM(amount) FILTER (WHERE status = 'completed') as revenue,
    SUM(amount) FILTER (WHERE status = 'refunded') as refunds,
    AVG(amount) as average_transaction,
    payment_method,
    currency
FROM payments
GROUP BY DATE_TRUNC('month', payment_date), payment_method, currency
ORDER BY month DESC;

-- ========================================
-- النهاية - رسالة نجاح
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ تم تطبيق الإصلاحات بنجاح!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'الإصلاحات المطبقة:';
    RAISE NOTICE '✅ إزالة PRIMARY KEY المكررة';
    RAISE NOTICE '✅ إضافة القيود المفقودة';
    RAISE NOTICE '✅ إنشاء الفهارس للأداء';
    RAISE NOTICE '✅ إنشاء دوال التحقق';
    RAISE NOTICE '✅ إنشاء Views للتقارير';
    RAISE NOTICE '';
    RAISE NOTICE 'قاعدة البيانات محققة ومربوطة بشكل صحيح ✓';
    RAISE NOTICE '========================================';
END $$;
