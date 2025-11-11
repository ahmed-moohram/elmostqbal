-- ========================================
-- تابع: منصة التعليم الإلكترونية
-- الجزء الخامس: الأمان وسياسات RLS لـ Supabase
-- ========================================

-- ========================================
-- 18. تفعيل Row Level Security (RLS)
-- ========================================

-- تفعيل RLS على جميع الجداول
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 19. سياسات الأمان (Security Policies)
-- ========================================

-- سياسات جدول المستخدمين
-- السماح للمستخدمين بعرض معلوماتهم الخاصة
CREATE POLICY users_view_own ON users
    FOR SELECT
    USING (auth.uid() = id);

-- السماح للأدمن بعرض جميع المستخدمين
CREATE POLICY users_admin_view ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- السماح للمستخدمين بتحديث معلوماتهم الخاصة
CREATE POLICY users_update_own ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- السماح بالتسجيل للمستخدمين الجدد
CREATE POLICY users_insert ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- سياسات جدول الكورسات
-- السماح بعرض الكورسات المنشورة للجميع
CREATE POLICY courses_view_published ON courses
    FOR SELECT
    USING (status = 'published' AND is_active = TRUE);

-- السماح للمدرسين بعرض كورساتهم
CREATE POLICY courses_view_own ON courses
    FOR SELECT
    USING (instructor_id = auth.uid());

-- السماح للمدرسين بإنشاء كورسات
CREATE POLICY courses_insert ON courses
    FOR INSERT
    WITH CHECK (
        instructor_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('teacher', 'admin')
        )
    );

-- السماح للمدرسين بتحديث كورساتهم
CREATE POLICY courses_update_own ON courses
    FOR UPDATE
    USING (instructor_id = auth.uid())
    WITH CHECK (instructor_id = auth.uid());

-- سياسات جدول التسجيلات
-- السماح للطلاب بعرض تسجيلاتهم
CREATE POLICY enrollments_view_own ON enrollments
    FOR SELECT
    USING (user_id = auth.uid());

-- السماح للمدرسين بعرض تسجيلات كورساتهم
CREATE POLICY enrollments_view_teacher ON enrollments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = enrollments.course_id
            AND courses.instructor_id = auth.uid()
        )
    );

-- سياسات جدول الدروس
-- السماح بعرض الدروس للطلاب المسجلين
CREATE POLICY lessons_view_enrolled ON lessons
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM enrollments e
            JOIN sections s ON s.course_id = e.course_id
            WHERE e.user_id = auth.uid()
            AND s.id = lessons.section_id
            AND e.is_active = TRUE
        )
        OR is_preview = TRUE
    );

-- السماح للمدرسين بإدارة دروس كورساتهم
CREATE POLICY lessons_manage_teacher ON lessons
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM sections s
            JOIN courses c ON c.id = s.course_id
            WHERE s.id = lessons.section_id
            AND c.instructor_id = auth.uid()
        )
    );

-- سياسات جدول المدفوعات
-- السماح للمستخدمين بعرض مدفوعاتهم
CREATE POLICY payments_view_own ON payments
    FOR SELECT
    USING (user_id = auth.uid());

-- السماح للأدمن بعرض جميع المدفوعات
CREATE POLICY payments_admin_view ON payments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- سياسات جدول الواجبات
-- السماح بعرض الواجبات للطلاب المسجلين
CREATE POLICY assignments_view_enrolled ON assignments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM enrollments
            WHERE enrollments.user_id = auth.uid()
            AND enrollments.course_id = assignments.course_id
            AND enrollments.is_active = TRUE
        )
    );

-- السماح للمدرسين بإدارة واجبات كورساتهم
CREATE POLICY assignments_manage_teacher ON assignments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = assignments.course_id
            AND courses.instructor_id = auth.uid()
        )
    );

-- سياسات جدول التسليمات
-- السماح للطلاب بعرض وإدارة تسليماتهم
CREATE POLICY submissions_manage_own ON assignment_submissions
    FOR ALL
    USING (student_id = auth.uid());

-- السماح للمدرسين بعرض وتقييم التسليمات
CREATE POLICY submissions_teacher_view ON assignment_submissions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM assignments a
            JOIN courses c ON c.id = a.course_id
            WHERE a.id = assignment_submissions.assignment_id
            AND c.instructor_id = auth.uid()
        )
    );

-- سياسات جدول الأسئلة والإجابات
-- السماح بعرض الأسئلة للطلاب المسجلين
CREATE POLICY questions_view_enrolled ON questions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM enrollments
            WHERE enrollments.user_id = auth.uid()
            AND enrollments.course_id = questions.course_id
            AND enrollments.is_active = TRUE
        )
    );

-- السماح للمستخدمين بإنشاء أسئلة في كورساتهم المسجلة
CREATE POLICY questions_create ON questions
    FOR INSERT
    WITH CHECK (
        author_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM enrollments
            WHERE enrollments.user_id = auth.uid()
            AND enrollments.course_id = questions.course_id
            AND enrollments.is_active = TRUE
        )
    );

-- سياسات جدول الإشعارات
-- السماح للمستخدمين بعرض إشعاراتهم فقط
CREATE POLICY notifications_view_own ON notifications
    FOR SELECT
    USING (user_id = auth.uid());

-- السماح بتحديث حالة القراءة للإشعارات الخاصة
CREATE POLICY notifications_update_own ON notifications
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- سياسات جدول الرسائل
-- السماح بعرض الرسائل المرسلة والمستلمة
CREATE POLICY messages_view_own ON messages
    FOR SELECT
    USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- السماح بإرسال الرسائل
CREATE POLICY messages_send ON messages
    FOR INSERT
    WITH CHECK (sender_id = auth.uid());

-- سياسات جدول الشهادات
-- السماح للمستخدمين بعرض شهاداتهم
CREATE POLICY certificates_view_own ON certificates
    FOR SELECT
    USING (user_id = auth.uid());

-- السماح بالتحقق من الشهادات بواسطة رمز التحقق
CREATE POLICY certificates_verify ON certificates
    FOR SELECT
    USING (verification_code IS NOT NULL);

-- ========================================
-- 20. دوال Supabase Edge Functions
-- ========================================

-- دالة تسجيل الدخول المخصصة
CREATE OR REPLACE FUNCTION authenticate_user(
    p_phone VARCHAR,
    p_password VARCHAR
)
RETURNS TABLE (
    user_id UUID,
    name VARCHAR,
    role user_role,
    token TEXT
) AS $$
DECLARE
    v_user_id UUID;
    v_password_hash VARCHAR;
    v_name VARCHAR;
    v_role user_role;
    v_status user_status;
BEGIN
    -- البحث عن المستخدم
    SELECT id, password_hash, users.name, users.role, users.status
    INTO v_user_id, v_password_hash, v_name, v_role, v_status
    FROM users
    WHERE student_phone = p_phone;
    
    -- التحقق من وجود المستخدم
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Invalid credentials';
    END IF;
    
    -- التحقق من حالة الحساب
    IF v_status != 'active' THEN
        RAISE EXCEPTION 'Account is not active';
    END IF;
    
    -- التحقق من كلمة المرور
    IF NOT crypt(p_password, v_password_hash) = v_password_hash THEN
        -- تحديث محاولات الدخول الفاشلة
        UPDATE users
        SET login_attempts = login_attempts + 1,
            last_login_attempt = CURRENT_TIMESTAMP
        WHERE id = v_user_id;
        
        RAISE EXCEPTION 'Invalid credentials';
    END IF;
    
    -- تحديث آخر نشاط وإعادة تعيين المحاولات
    UPDATE users
    SET last_active = CURRENT_TIMESTAMP,
        login_attempts = 0
    WHERE id = v_user_id;
    
    -- إرجاع البيانات مع توليد JWT token
    RETURN QUERY
    SELECT 
        v_user_id,
        v_name,
        v_role,
        sign(
            json_build_object(
                'user_id', v_user_id,
                'role', v_role,
                'exp', extract(epoch from now() + interval '7 days')
            ),
            current_setting('app.jwt_secret')
        ) as token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة التحقق من صلاحية المستخدم
CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id UUID,
    p_resource VARCHAR,
    p_action VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_role user_role;
    v_has_permission BOOLEAN DEFAULT FALSE;
BEGIN
    -- الحصول على دور المستخدم
    SELECT role INTO v_role
    FROM users
    WHERE id = p_user_id;
    
    -- التحقق من الصلاحيات حسب الدور
    CASE v_role
        WHEN 'admin' THEN
            v_has_permission := TRUE; -- الأدمن له جميع الصلاحيات
        WHEN 'teacher' THEN
            -- صلاحيات المدرس
            IF p_resource IN ('courses', 'lessons', 'assignments', 'live_sessions') THEN
                v_has_permission := TRUE;
            ELSIF p_resource = 'students' AND p_action = 'view' THEN
                v_has_permission := TRUE;
            END IF;
        WHEN 'student' THEN
            -- صلاحيات الطالب
            IF p_resource IN ('courses', 'lessons') AND p_action = 'view' THEN
                v_has_permission := TRUE;
            ELSIF p_resource IN ('assignments', 'questions') AND p_action IN ('view', 'create') THEN
                v_has_permission := TRUE;
            END IF;
        ELSE
            v_has_permission := FALSE;
    END CASE;
    
    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql;

-- دالة إحصائيات لوحة التحكم
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_role user_role;
    v_stats JSON;
BEGIN
    SELECT role INTO v_role FROM users WHERE id = p_user_id;
    
    IF v_role = 'admin' THEN
        SELECT json_build_object(
            'total_users', (SELECT COUNT(*) FROM users),
            'total_courses', (SELECT COUNT(*) FROM courses WHERE status = 'published'),
            'total_enrollments', (SELECT COUNT(*) FROM enrollments),
            'total_revenue', (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed'),
            'active_students', (SELECT COUNT(*) FROM users WHERE role = 'student' AND status = 'active'),
            'active_teachers', (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND status = 'active')
        ) INTO v_stats;
        
    ELSIF v_role = 'teacher' THEN
        SELECT json_build_object(
            'my_courses', (SELECT COUNT(*) FROM courses WHERE instructor_id = p_user_id),
            'total_students', (
                SELECT COUNT(DISTINCT e.user_id)
                FROM enrollments e
                JOIN courses c ON e.course_id = c.id
                WHERE c.instructor_id = p_user_id
            ),
            'total_revenue', (
                SELECT COALESCE(SUM(p.amount), 0)
                FROM payments p
                JOIN courses c ON p.course_id = c.id
                WHERE c.instructor_id = p_user_id
                AND p.status = 'completed'
            ),
            'pending_assignments', (
                SELECT COUNT(*)
                FROM assignment_submissions s
                JOIN assignments a ON s.assignment_id = a.id
                JOIN courses c ON a.course_id = c.id
                WHERE c.instructor_id = p_user_id
                AND s.status = 'submitted'
            )
        ) INTO v_stats;
        
    ELSIF v_role = 'student' THEN
        SELECT json_build_object(
            'enrolled_courses', (SELECT COUNT(*) FROM enrollments WHERE user_id = p_user_id AND is_active = TRUE),
            'completed_courses', (SELECT COUNT(*) FROM enrollments WHERE user_id = p_user_id AND completed_at IS NOT NULL),
            'certificates', (SELECT COUNT(*) FROM certificates WHERE user_id = p_user_id),
            'pending_assignments', (
                SELECT COUNT(*)
                FROM assignments a
                JOIN enrollments e ON a.course_id = e.course_id
                LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.student_id = p_user_id
                WHERE e.user_id = p_user_id
                AND e.is_active = TRUE
                AND a.due_date > CURRENT_TIMESTAMP
                AND s.id IS NULL
            )
        ) INTO v_stats;
    END IF;
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- النهاية
-- ========================================
