-- ========================================
-- إعداد Supabase للمنصة التعليمية
-- Supabase-Specific Configuration
-- ========================================

-- ========================================
-- 1. تفعيل Storage للملفات
-- ========================================

-- إنشاء Buckets للتخزين
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('course-thumbnails', 'course-thumbnails', true, 5242880, 
     ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    
    ('course-videos', 'course-videos', false, 524288000,
     ARRAY['video/mp4', 'video/webm', 'video/ogg']),
    
    ('course-resources', 'course-resources', false, 10485760,
     ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
           'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
           'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']),
    
    ('profile-pictures', 'profile-pictures', true, 2097152,
     ARRAY['image/jpeg', 'image/png', 'image/webp']),
    
    ('assignment-submissions', 'assignment-submissions', false, 10485760,
     ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
           'image/jpeg', 'image/png', 'application/zip']),
    
    ('payment-receipts', 'payment-receipts', false, 5242880,
     ARRAY['image/jpeg', 'image/png', 'application/pdf']),
    
    ('certificates', 'certificates', true, 5242880,
     ARRAY['application/pdf', 'image/png']);

-- ========================================
-- 2. سياسات Storage
-- ========================================

-- سياسة رفع الصور الشخصية
CREATE POLICY "Users can upload their own profile picture"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profile-pictures' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- سياسة عرض الصور الشخصية
CREATE POLICY "Profile pictures are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

-- سياسة رفع فيديوهات الكورسات (للمدرسين فقط)
CREATE POLICY "Teachers can upload course videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'course-videos' AND
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('teacher', 'admin')
    )
);

-- سياسة عرض فيديوهات الكورسات (للطلاب المسجلين)
CREATE POLICY "Enrolled students can view course videos"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'course-videos' AND
    EXISTS (
        SELECT 1 FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE e.user_id = auth.uid()
        AND e.is_active = TRUE
        AND (storage.foldername(name))[1] = c.id::text
    )
);

-- سياسة رفع الواجبات (للطلاب)
CREATE POLICY "Students can upload assignments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'assignment-submissions' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- سياسة عرض الواجبات المرفوعة
CREATE POLICY "Teachers can view assignment submissions"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'assignment-submissions' AND
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('teacher', 'admin')
    )
);

-- ========================================
-- 3. Edge Functions للعمليات المعقدة
-- ========================================

-- دالة معالجة الدفع
CREATE OR REPLACE FUNCTION process_payment(
    p_user_id UUID,
    p_course_id UUID,
    p_amount DECIMAL,
    p_payment_method payment_method,
    p_transaction_id VARCHAR
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payment_id UUID;
    v_enrollment_id UUID;
    v_result JSON;
BEGIN
    -- بدء المعاملة
    BEGIN
        -- إنشاء سجل الدفع
        INSERT INTO payments (
            user_id, course_id, amount, payment_method, 
            status, transaction_id, payment_date
        ) VALUES (
            p_user_id, p_course_id, p_amount, p_payment_method,
            'completed', p_transaction_id, CURRENT_TIMESTAMP
        ) RETURNING id INTO v_payment_id;
        
        -- إنشاء أو تحديث التسجيل
        INSERT INTO enrollments (
            user_id, course_id, enrolled_at, is_active
        ) VALUES (
            p_user_id, p_course_id, CURRENT_TIMESTAMP, TRUE
        )
        ON CONFLICT (user_id, course_id) 
        DO UPDATE SET 
            is_active = TRUE,
            enrolled_at = CURRENT_TIMESTAMP
        RETURNING id INTO v_enrollment_id;
        
        -- تحديث عدد الطلاب في الكورس
        UPDATE courses 
        SET students_count = students_count + 1
        WHERE id = p_course_id;
        
        -- إنشاء إشعار للطالب
        INSERT INTO notifications (
            user_id, type, title, message, data
        ) VALUES (
            p_user_id, 
            'payment_confirmed',
            'تأكيد الدفع',
            'تم تأكيد دفعتك وتسجيلك في الكورس بنجاح',
            jsonb_build_object(
                'payment_id', v_payment_id,
                'course_id', p_course_id,
                'enrollment_id', v_enrollment_id
            )
        );
        
        -- إرجاع النتيجة
        v_result := json_build_object(
            'success', true,
            'payment_id', v_payment_id,
            'enrollment_id', v_enrollment_id,
            'message', 'تم التسجيل بنجاح'
        );
        
        RETURN v_result;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- في حالة الخطأ، إلغاء المعاملة
            ROLLBACK;
            v_result := json_build_object(
                'success', false,
                'error', SQLERRM,
                'message', 'حدث خطأ أثناء معالجة الدفع'
            );
            RETURN v_result;
    END;
END;
$$;

-- دالة حساب إحصائيات الكورس
CREATE OR REPLACE FUNCTION get_course_statistics(p_course_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_stats JSON;
BEGIN
    SELECT json_build_object(
        'total_students', COUNT(DISTINCT e.user_id),
        'active_students', COUNT(DISTINCT e.user_id) FILTER (WHERE e.is_active = TRUE),
        'completed_students', COUNT(DISTINCT e.user_id) FILTER (WHERE e.completed_at IS NOT NULL),
        'average_progress', AVG(e.progress),
        'total_revenue', COALESCE(SUM(p.amount), 0),
        'average_rating', AVG(r.rating),
        'total_reviews', COUNT(DISTINCT r.id),
        'total_questions', COUNT(DISTINCT q.id),
        'total_assignments', COUNT(DISTINCT a.id),
        'completion_rate', 
            CASE 
                WHEN COUNT(DISTINCT e.user_id) > 0 
                THEN (COUNT(DISTINCT e.user_id) FILTER (WHERE e.completed_at IS NOT NULL)::DECIMAL / COUNT(DISTINCT e.user_id) * 100)
                ELSE 0 
            END
    ) INTO v_stats
    FROM courses c
    LEFT JOIN enrollments e ON c.id = e.course_id
    LEFT JOIN payments p ON c.id = p.course_id AND p.status = 'completed'
    LEFT JOIN course_reviews r ON c.id = r.course_id
    LEFT JOIN questions q ON c.id = q.course_id
    LEFT JOIN assignments a ON c.id = a.course_id
    WHERE c.id = p_course_id
    GROUP BY c.id;
    
    RETURN v_stats;
END;
$$;

-- ========================================
-- 4. Realtime Subscriptions
-- ========================================

-- تفعيل Realtime على الجداول المهمة
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE session_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE live_sessions;

-- ========================================
-- 5. Scheduled Jobs (Cron Jobs)
-- ========================================

-- وظيفة تحديث حالة الجلسات المباشرة
CREATE OR REPLACE FUNCTION update_live_session_status()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- تحديث الجلسات التي بدأت
    UPDATE live_sessions
    SET status = 'live'
    WHERE status = 'scheduled'
    AND scheduled_at <= CURRENT_TIMESTAMP
    AND scheduled_at + (duration * INTERVAL '1 minute') > CURRENT_TIMESTAMP;
    
    -- تحديث الجلسات المنتهية
    UPDATE live_sessions
    SET status = 'completed'
    WHERE status IN ('scheduled', 'live')
    AND scheduled_at + (duration * INTERVAL '1 minute') <= CURRENT_TIMESTAMP;
END;
$$;

-- وظيفة تحديث حالة الاشتراكات المنتهية
CREATE OR REPLACE FUNCTION update_expired_subscriptions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- تحديث الاشتراكات المنتهية
    UPDATE user_subscriptions
    SET is_active = FALSE
    WHERE is_active = TRUE
    AND ends_at < CURRENT_TIMESTAMP;
    
    -- تحديث التسجيلات المنتهية
    UPDATE enrollments
    SET is_expired = TRUE,
        is_active = FALSE
    WHERE expires_at IS NOT NULL
    AND expires_at < CURRENT_TIMESTAMP
    AND is_expired = FALSE;
    
    -- إرسال إشعارات للمستخدمين
    INSERT INTO notifications (user_id, type, title, message, priority)
    SELECT 
        user_id,
        'subscription_expired',
        'انتهى اشتراكك',
        'انتهت صلاحية اشتراكك، يرجى التجديد للاستمرار',
        'high'
    FROM user_subscriptions
    WHERE is_active = FALSE
    AND ends_at >= CURRENT_TIMESTAMP - INTERVAL '1 day'
    AND ends_at < CURRENT_TIMESTAMP;
END;
$$;

-- وظيفة إرسال تذكيرات الجلسات المباشرة
CREATE OR REPLACE FUNCTION send_session_reminders()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- إرسال تذكير قبل 30 دقيقة
    INSERT INTO notifications (user_id, type, title, message, data, priority)
    SELECT 
        sp.user_id,
        'live_session_reminder',
        'تذكير: جلسة مباشرة قريباً',
        format('الجلسة "%s" ستبدأ خلال 30 دقيقة', ls.title),
        jsonb_build_object('session_id', ls.id, 'meeting_url', ls.meeting_url),
        'urgent'
    FROM live_sessions ls
    JOIN session_participants sp ON ls.id = sp.session_id
    WHERE ls.status = 'scheduled'
    AND ls.scheduled_at BETWEEN CURRENT_TIMESTAMP + INTERVAL '29 minutes' 
                            AND CURRENT_TIMESTAMP + INTERVAL '31 minutes'
    AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.user_id = sp.user_id
        AND n.data->>'session_id' = ls.id::text
        AND n.type = 'live_session_reminder'
        AND n.created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
    );
END;
$$;

-- ========================================
-- 6. إعدادات Supabase Auth
-- ========================================

-- إعداد مزودي المصادقة
-- يتم هذا من لوحة تحكم Supabase > Authentication > Providers

-- إعداد قوالب البريد الإلكتروني
-- يتم هذا من لوحة تحكم Supabase > Authentication > Email Templates

-- ========================================
-- 7. API Configuration
-- ========================================

-- إنشاء Views للـ API
CREATE OR REPLACE VIEW public.course_catalog AS
SELECT 
    c.id,
    c.title,
    c.slug,
    c.short_description,
    c.thumbnail,
    c.price,
    c.discount_price,
    c.rating,
    c.students_count,
    c.total_lessons,
    c.total_duration,
    c.level,
    c.category,
    u.name as instructor_name,
    t.specialization as instructor_specialization,
    t.average_rating as instructor_rating
FROM courses c
JOIN users u ON c.instructor_id = u.id
LEFT JOIN teachers t ON u.id = t.user_id
WHERE c.status = 'published' 
AND c.is_active = TRUE;

-- View للوحة تحكم الطالب
CREATE OR REPLACE VIEW public.student_dashboard AS
SELECT 
    e.user_id,
    e.course_id,
    c.title as course_title,
    c.thumbnail as course_thumbnail,
    e.progress,
    e.last_accessed,
    e.enrolled_at,
    COUNT(DISTINCT lp.lesson_id) as completed_lessons,
    c.total_lessons,
    CASE 
        WHEN e.completed_at IS NOT NULL THEN 'completed'
        WHEN e.progress >= 80 THEN 'almost_done'
        WHEN e.progress >= 50 THEN 'in_progress'
        ELSE 'just_started'
    END as status
FROM enrollments e
JOIN courses c ON e.course_id = c.id
LEFT JOIN lesson_progress lp ON e.user_id = lp.user_id 
    AND lp.is_completed = TRUE
WHERE e.is_active = TRUE
GROUP BY e.user_id, e.course_id, c.id, e.progress, e.last_accessed, e.enrolled_at, e.completed_at;

-- ========================================
-- 8. Performance Monitoring
-- ========================================

-- إنشاء جدول لتتبع الأداء
CREATE TABLE IF NOT EXISTS performance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_type VARCHAR(50),
    execution_time DECIMAL(10,3), -- بالميلي ثانية
    user_id UUID REFERENCES users(id),
    endpoint VARCHAR(255),
    status_code INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- دالة تسجيل الأداء
CREATE OR REPLACE FUNCTION log_performance(
    p_query_type VARCHAR,
    p_execution_time DECIMAL,
    p_user_id UUID,
    p_endpoint VARCHAR,
    p_status_code INT
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO performance_logs (
        query_type, execution_time, user_id, endpoint, status_code
    ) VALUES (
        p_query_type, p_execution_time, p_user_id, p_endpoint, p_status_code
    );
END;
$$;

-- ========================================
-- النهاية - Supabase جاهز!
-- ========================================
