-- ========================================
-- تابع: منصة التعليم الإلكترونية
-- الجزء الرابع: الفهارس والقيود والعلاقات
-- ========================================

-- ========================================
-- 14. الفهارس (Indexes) لتحسين الأداء
-- ========================================

-- فهارس جدول المستخدمين
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_student_phone ON users(student_phone);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_last_active ON users(last_active DESC);
CREATE INDEX idx_users_city_grade ON users(city, grade_level);

-- فهارس البحث النصي
CREATE INDEX idx_users_name_gin ON users USING gin(to_tsvector('arabic', name));

-- فهارس جدول المدرسين
CREATE INDEX idx_teachers_user_id ON teachers(user_id);
CREATE INDEX idx_teachers_specialization ON teachers(specialization);
CREATE INDEX idx_teachers_rating ON teachers(average_rating DESC);

-- فهارس جدول الطلاب
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_code ON students(student_code);

-- فهارس جدول الكورسات
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_courses_featured ON courses(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_courses_published ON courses(status, is_active) WHERE status = 'published';
CREATE INDEX idx_courses_rating ON courses(rating DESC);
CREATE INDEX idx_courses_students ON courses(students_count DESC);
CREATE INDEX idx_courses_price ON courses(price);
CREATE INDEX idx_courses_created ON courses(created_at DESC);

-- فهارس البحث النصي للكورسات
CREATE INDEX idx_courses_title_gin ON courses USING gin(to_tsvector('arabic', title));
CREATE INDEX idx_courses_description_gin ON courses USING gin(to_tsvector('arabic', description));

-- فهارس جدول الأقسام
CREATE INDEX idx_sections_course ON sections(course_id);
CREATE INDEX idx_sections_order ON sections(course_id, order_index);

-- فهارس جدول الدروس
CREATE INDEX idx_lessons_section ON lessons(section_id);
CREATE INDEX idx_lessons_order ON lessons(section_id, order_index);
CREATE INDEX idx_lessons_preview ON lessons(is_preview) WHERE is_preview = TRUE;

-- فهارس جدول التسجيلات
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_active ON enrollments(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_enrollments_dates ON enrollments(enrolled_at DESC);
CREATE INDEX idx_enrollments_progress ON enrollments(progress);

-- فهارس جدول طلبات التسجيل
CREATE INDEX idx_enrollment_requests_student ON enrollment_requests(student_id);
CREATE INDEX idx_enrollment_requests_course ON enrollment_requests(course_id);
CREATE INDEX idx_enrollment_requests_status ON enrollment_requests(status);
CREATE INDEX idx_enrollment_requests_pending ON enrollment_requests(status) WHERE status = 'pending';
CREATE INDEX idx_enrollment_requests_dates ON enrollment_requests(submitted_at DESC);

-- فهارس جدول تقدم الدروس
CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX idx_lesson_progress_completed ON lesson_progress(is_completed);

-- فهارس جدول المدفوعات
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_course ON payments(course_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_method ON payments(payment_method);
CREATE INDEX idx_payments_date ON payments(payment_date DESC);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);

-- فهارس جدول الكوبونات
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_coupons_validity ON coupons(valid_from, valid_until);

-- فهارس جدول الجلسات المباشرة
CREATE INDEX idx_live_sessions_course ON live_sessions(course_id);
CREATE INDEX idx_live_sessions_teacher ON live_sessions(teacher_id);
CREATE INDEX idx_live_sessions_scheduled ON live_sessions(scheduled_at);
CREATE INDEX idx_live_sessions_status ON live_sessions(status);
CREATE INDEX idx_live_sessions_upcoming ON live_sessions(scheduled_at) WHERE status = 'scheduled';

-- فهارس جدول الواجبات
CREATE INDEX idx_assignments_course ON assignments(course_id);
CREATE INDEX idx_assignments_section ON assignments(section_id);
CREATE INDEX idx_assignments_due ON assignments(due_date);
CREATE INDEX idx_assignments_published ON assignments(is_published) WHERE is_published = TRUE;

-- فهارس جدول التسليمات
CREATE INDEX idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_submissions_student ON assignment_submissions(student_id);
CREATE INDEX idx_submissions_status ON assignment_submissions(status);
CREATE INDEX idx_submissions_graded ON assignment_submissions(graded_at);

-- فهارس جدول الأسئلة
CREATE INDEX idx_questions_course ON questions(course_id);
CREATE INDEX idx_questions_lesson ON questions(lesson_id);
CREATE INDEX idx_questions_author ON questions(author_id);
CREATE INDEX idx_questions_resolved ON questions(is_resolved);
CREATE INDEX idx_questions_views ON questions(views_count DESC);

-- فهارس جدول الإجابات
CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_answers_author ON answers(author_id);
CREATE INDEX idx_answers_accepted ON answers(is_accepted) WHERE is_accepted = TRUE;

-- فهارس جدول الإشعارات
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- فهارس جدول الرسائل
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_unread ON messages(recipient_id, is_read) WHERE is_read = FALSE;

-- فهارس جدول التقييمات
CREATE INDEX idx_reviews_course ON course_reviews(course_id);
CREATE INDEX idx_reviews_user ON course_reviews(user_id);
CREATE INDEX idx_reviews_rating ON course_reviews(rating);
CREATE INDEX idx_reviews_featured ON course_reviews(is_featured) WHERE is_featured = TRUE;

-- ========================================
-- 15. القيود الإضافية (Additional Constraints)
-- ========================================

-- قيود التحقق من التواريخ
ALTER TABLE courses ADD CONSTRAINT check_course_dates 
    CHECK (published_at IS NULL OR created_at <= published_at);

ALTER TABLE enrollments ADD CONSTRAINT check_enrollment_dates 
    CHECK (expires_at IS NULL OR enrolled_at < expires_at);

ALTER TABLE live_sessions ADD CONSTRAINT check_session_times 
    CHECK (ended_at IS NULL OR started_at IS NULL OR started_at < ended_at);

ALTER TABLE assignments ADD CONSTRAINT check_assignment_dates 
    CHECK (available_from <= due_date);

ALTER TABLE coupons ADD CONSTRAINT check_coupon_dates 
    CHECK (valid_from < valid_until);

ALTER TABLE user_subscriptions ADD CONSTRAINT check_subscription_dates 
    CHECK (starts_at < ends_at);

-- قيود التحقق من القيم
ALTER TABLE courses ADD CONSTRAINT check_course_price 
    CHECK (discount_price IS NULL OR discount_price < price);

ALTER TABLE quiz_attempts ADD CONSTRAINT check_quiz_score 
    CHECK (percentage >= 0 AND percentage <= 100);

ALTER TABLE lesson_progress ADD CONSTRAINT check_lesson_progress 
    CHECK (watched_duration <= total_duration);

-- ========================================
-- 16. الدوال المساعدة (Helper Functions)
-- ========================================

-- دالة تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- دالة حساب تقدم الطالب في الكورس
CREATE OR REPLACE FUNCTION calculate_course_progress(p_user_id UUID, p_course_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_lessons INT;
    completed_lessons INT;
    progress DECIMAL;
BEGIN
    -- حساب إجمالي الدروس في الكورس
    SELECT COUNT(*)
    INTO total_lessons
    FROM lessons l
    JOIN sections s ON l.section_id = s.id
    WHERE s.course_id = p_course_id;
    
    -- حساب الدروس المكتملة
    SELECT COUNT(*)
    INTO completed_lessons
    FROM lesson_progress lp
    JOIN lessons l ON lp.lesson_id = l.id
    JOIN sections s ON l.section_id = s.id
    WHERE s.course_id = p_course_id
    AND lp.user_id = p_user_id
    AND lp.is_completed = TRUE;
    
    -- حساب النسبة المئوية
    IF total_lessons > 0 THEN
        progress := (completed_lessons::DECIMAL / total_lessons) * 100;
    ELSE
        progress := 0;
    END IF;
    
    RETURN ROUND(progress, 2);
END;
$$ LANGUAGE plpgsql;

-- دالة تحديث إحصائيات الكورس
CREATE OR REPLACE FUNCTION update_course_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'enrollments' THEN
        -- تحديث عدد الطلاب
        UPDATE courses
        SET students_count = (
            SELECT COUNT(*)
            FROM enrollments
            WHERE course_id = NEW.course_id
            AND is_active = TRUE
        )
        WHERE id = NEW.course_id;
    
    ELSIF TG_TABLE_NAME = 'course_reviews' THEN
        -- تحديث التقييم المتوسط
        UPDATE courses
        SET rating = (
            SELECT AVG(rating)
            FROM course_reviews
            WHERE course_id = NEW.course_id
            AND is_published = TRUE
        ),
        rating_count = (
            SELECT COUNT(*)
            FROM course_reviews
            WHERE course_id = NEW.course_id
            AND is_published = TRUE
        )
        WHERE id = NEW.course_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- دالة تحديث إحصائيات المدرس
CREATE OR REPLACE FUNCTION update_teacher_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE teachers
    SET total_students = (
        SELECT COUNT(DISTINCT e.user_id)
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE c.instructor_id = NEW.instructor_id
        AND e.is_active = TRUE
    ),
    total_courses = (
        SELECT COUNT(*)
        FROM courses
        WHERE instructor_id = NEW.instructor_id
        AND status = 'published'
    )
    WHERE user_id = NEW.instructor_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- دالة توليد رقم الفاتورة
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR AS $$
DECLARE
    year_month VARCHAR;
    last_number INT;
    new_number VARCHAR;
BEGIN
    year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 8) AS INT)), 0)
    INTO last_number
    FROM invoices
    WHERE invoice_number LIKE year_month || '%';
    
    new_number := year_month || LPAD((last_number + 1)::TEXT, 5, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- دالة توليد رقم الشهادة
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS VARCHAR AS $$
DECLARE
    random_part VARCHAR;
    timestamp_part VARCHAR;
BEGIN
    random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    timestamp_part := TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDDHH24MISS');
    
    RETURN 'CERT-' || timestamp_part || '-' || random_part;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 17. المشغلات (Triggers)
-- ========================================

-- مشغلات تحديث updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON answers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- مشغلات تحديث الإحصائيات
CREATE TRIGGER update_course_stats_on_enrollment AFTER INSERT OR UPDATE OR DELETE ON enrollments
    FOR EACH ROW EXECUTE FUNCTION update_course_stats();

CREATE TRIGGER update_course_stats_on_review AFTER INSERT OR UPDATE OR DELETE ON course_reviews
    FOR EACH ROW EXECUTE FUNCTION update_course_stats();

CREATE TRIGGER update_teacher_stats_on_course AFTER INSERT OR UPDATE OR DELETE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_teacher_stats();

-- مشغل تحديث تقدم الطالب عند إكمال درس
CREATE OR REPLACE FUNCTION update_enrollment_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_course_id UUID;
    v_progress DECIMAL;
BEGIN
    -- الحصول على معرف الكورس
    SELECT s.course_id
    INTO v_course_id
    FROM lessons l
    JOIN sections s ON l.section_id = s.id
    WHERE l.id = NEW.lesson_id;
    
    -- حساب التقدم الجديد
    v_progress := calculate_course_progress(NEW.user_id, v_course_id);
    
    -- تحديث تقدم التسجيل
    UPDATE enrollments
    SET progress = v_progress,
        last_accessed = CURRENT_TIMESTAMP,
        completed_at = CASE 
            WHEN v_progress = 100 THEN CURRENT_TIMESTAMP 
            ELSE completed_at 
        END
    WHERE user_id = NEW.user_id
    AND course_id = v_course_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_enrollment_on_lesson_complete 
    AFTER INSERT OR UPDATE OF is_completed ON lesson_progress
    FOR EACH ROW 
    WHEN (NEW.is_completed = TRUE)
    EXECUTE FUNCTION update_enrollment_progress();

-- ========================================
-- يتبع في الملف التالي...
-- ========================================
