-- ========================================
-- إصلاحات ومراجعة قاعدة البيانات
-- Database Fixes and Validation
-- ========================================

-- ========================================
-- 1. إصلاح المشاكل المحتملة
-- ========================================

-- إصلاح: إزالة PRIMARY KEY المكرر في course_co_instructors
-- المشكلة: يوجد PRIMARY KEY مكرر (السطر 260 و 264 في 01_schema.sql)
ALTER TABLE course_co_instructors DROP CONSTRAINT IF EXISTS course_co_instructors_pkey;
ALTER TABLE course_co_instructors ADD PRIMARY KEY (course_id, instructor_id);
ALTER TABLE course_co_instructors DROP COLUMN IF EXISTS id;

-- إصلاح: إزالة PRIMARY KEY المكرر في course_tags
-- المشكلة: يوجد PRIMARY KEY مكرر (السطر 367 و 370 في 01_schema.sql)
ALTER TABLE course_tags DROP CONSTRAINT IF EXISTS course_tags_pkey;
ALTER TABLE course_tags ADD PRIMARY KEY (course_id, tag);
ALTER TABLE course_tags DROP COLUMN IF EXISTS id;

-- إصلاح: التأكد من وجود best_answer_id كـ foreign key
ALTER TABLE questions 
    ADD CONSTRAINT fk_best_answer 
    FOREIGN KEY (best_answer_id) 
    REFERENCES answers(id) 
    ON DELETE SET NULL;

-- إصلاح: منع الحلقات اللانهائية في الردود
ALTER TABLE session_messages 
    ADD CONSTRAINT no_self_reply 
    CHECK (parent_message_id != id);

-- إصلاح: التأكد من أن تاريخ انتهاء الصلاحية بعد تاريخ البداية
ALTER TABLE enrollments 
    ADD CONSTRAINT check_enrollment_validity 
    CHECK (expires_at IS NULL OR enrolled_at < expires_at);

ALTER TABLE user_subscriptions 
    ADD CONSTRAINT check_subscription_validity 
    CHECK (starts_at < ends_at);

-- إصلاح: التأكد من أن الدرجة المحصلة لا تتجاوز الدرجة الكاملة
-- لا يمكن استخدام subquery في CHECK، نستخدم TRIGGER بدلاً من ذلك
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
CREATE UNIQUE INDEX unique_active_enrollment 
    ON enrollments(user_id, course_id) 
    WHERE is_active = TRUE;

-- إصلاح: منع وجود أكثر من طلب معلق لنفس الكورس
DROP INDEX IF EXISTS enrollment_requests_student_course_status_key;
CREATE UNIQUE INDEX unique_pending_request 
    ON enrollment_requests(student_id, course_id) 
    WHERE status = 'pending';

-- ========================================
-- 2. إضافة القيود المفقودة
-- ========================================

-- التأكد من أن عدد المشاركين لا يتجاوز الحد الأقصى
ALTER TABLE live_sessions 
    ADD CONSTRAINT check_participants_limit 
    CHECK (current_participants <= max_participants);

-- التأكد من أن النسبة المئوية صحيحة
ALTER TABLE lesson_progress 
    ADD CONSTRAINT check_progress_percentage 
    CHECK (progress >= 0 AND progress <= 100);

ALTER TABLE enrollments 
    ADD CONSTRAINT check_enrollment_progress 
    CHECK (progress >= 0 AND progress <= 100);

-- التأكد من أن التقييمات في النطاق الصحيح
ALTER TABLE courses 
    ADD CONSTRAINT check_course_rating 
    CHECK (rating >= 0 AND rating <= 5);

ALTER TABLE teachers 
    ADD CONSTRAINT check_teacher_rating 
    CHECK (average_rating >= 0 AND average_rating <= 5);

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

-- فهارس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_courses_search ON courses USING gin(
    to_tsvector('arabic', title || ' ' || COALESCE(description, ''))
);

CREATE INDEX IF NOT EXISTS idx_users_search ON users USING gin(
    to_tsvector('arabic', name || ' ' || COALESCE(father_name, ''))
);

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
    
    -- التحقق من الواجبات بدون كورسات
    RETURN QUERY
    SELECT 'assignments'::TEXT, 'Assignments without courses'::TEXT, COUNT(*)
    FROM assignments a
    WHERE NOT EXISTS (SELECT 1 FROM courses c WHERE c.id = a.course_id);
    
    -- التحقق من الأسئلة بأفضل إجابة غير موجودة
    RETURN QUERY
    SELECT 'questions'::TEXT, 'Questions with invalid best answer'::TEXT, COUNT(*)
    FROM questions q
    WHERE q.best_answer_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM answers a WHERE a.id = q.best_answer_id);
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
    
    -- التحقق من البريد الإلكتروني
    RETURN QUERY
    SELECT 
        'Email Format'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'PASS'::TEXT 
            ELSE 'FAIL'::TEXT 
        END,
        'Invalid emails: ' || COUNT(*)::TEXT
    FROM users
    WHERE email IS NOT NULL 
    AND email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
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
    
    -- حذف الإجابات للأسئلة المحذوفة
    DELETE FROM answers a
    WHERE NOT EXISTS (SELECT 1 FROM questions q WHERE q.id = a.question_id);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN QUERY SELECT 'answers'::TEXT, v_count;
    
    -- حذف التصويتات للعناصر المحذوفة
    DELETE FROM votes v
    WHERE (v.voteable_type = 'question' AND NOT EXISTS (SELECT 1 FROM questions q WHERE q.id = v.voteable_id))
    OR (v.voteable_type = 'answer' AND NOT EXISTS (SELECT 1 FROM answers a WHERE a.id = v.voteable_id));
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN QUERY SELECT 'votes'::TEXT, v_count;
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
    
    RETURN QUERY
    SELECT 'Live Sessions'::TEXT,
           COUNT(*),
           COUNT(*) FILTER (WHERE status IN ('scheduled', 'live')),
           COUNT(*) FILTER (WHERE status IN ('completed', 'cancelled'))
    FROM live_sessions;
    
    RETURN QUERY
    SELECT 'Assignments'::TEXT,
           COUNT(*),
           COUNT(*) FILTER (WHERE is_published = TRUE),
           COUNT(*) FILTER (WHERE is_published = FALSE)
    FROM assignments;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. تشغيل التحقق من الصحة
-- ========================================

-- تشغيل فحص العلاقات
SELECT * FROM validate_relationships() WHERE count > 0;

-- تشغيل فحص تكامل البيانات
SELECT * FROM check_data_integrity() WHERE status = 'FAIL';

-- عرض الإحصائيات
SELECT * FROM get_database_stats();

-- ========================================
-- 8. إنشاء Views للتقارير
-- ========================================

-- View لعرض الكورسات مع معلومات كاملة
CREATE OR REPLACE VIEW v_course_details AS
SELECT 
    c.*,
    u.name as instructor_name,
    u.email as instructor_email,
    COUNT(DISTINCT e.user_id) as enrolled_students,
    COUNT(DISTINCT s.id) as total_sections,
    COUNT(DISTINCT l.id) as total_lessons_count,
    AVG(cr.rating) as average_rating,
    COUNT(DISTINCT cr.id) as review_count
FROM courses c
LEFT JOIN users u ON c.instructor_id = u.id
LEFT JOIN enrollments e ON c.id = e.course_id AND e.is_active = TRUE
LEFT JOIN sections s ON c.id = s.course_id
LEFT JOIN lessons l ON s.id = l.section_id
LEFT JOIN course_reviews cr ON c.id = cr.course_id
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
    COUNT(DISTINCT lp.lesson_id) as completed_lessons,
    c.total_lessons,
    CASE 
        WHEN e.completed_at IS NOT NULL THEN 'مكتمل'
        WHEN e.progress >= 80 THEN 'شبه مكتمل'
        WHEN e.progress >= 50 THEN 'في التقدم'
        ELSE 'في البداية'
    END as status_text
FROM users u
JOIN enrollments e ON u.id = e.user_id
JOIN courses c ON e.course_id = c.id
LEFT JOIN lesson_progress lp ON u.id = lp.user_id AND lp.is_completed = TRUE
WHERE u.role = 'student'
GROUP BY u.id, u.name, c.id, c.title, e.enrolled_at, e.progress, e.last_accessed, e.completed_at, c.total_lessons;

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
-- النهاية - قاعدة البيانات محققة ومربوطة بشكل صحيح
-- ========================================
