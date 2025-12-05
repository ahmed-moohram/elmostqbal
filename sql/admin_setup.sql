-- =====================================================
-- إعداد حساب الأدمن - أحمد
-- =====================================================

-- 1. إنشاء المستخدم في Supabase Auth (نفذ هذا في Supabase Dashboard)
-- اذهب إلى Authentication > Users > Create User
-- Email: admin@platform.com
-- Password: Ahmed@010052

-- 2. بعد إنشاء المستخدم، احصل على الـ ID ونفذ باقي الكود

-- =====================================================
-- إضافة بيانات الأدمن في جدول users
-- =====================================================

-- أولاً: احصل على ID المستخدم من auth.users
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- إنشاء مستخدم أدمن إذا لم يكن موجوداً
    -- ملاحظة: يجب أن يكون المستخدم موجود في auth.users أولاً
    
    -- احصل على ID المستخدم بناءً على البريد الإلكتروني
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@platform.com'
    LIMIT 1;
    
    -- إذا وجد المستخدم، أضف/حدث بياناته في جدول users
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.users (
            id,
            email,
            name,
            phone,
            role,
            avatar,
            bio,
            created_at,
            updated_at
        ) VALUES (
            admin_user_id,
            'admin@platform.com',
            'أحمد - مدير المنصة',
            '01005209667',
            'admin',
            '/admin-avatar.png',
            'مدير المنصة التعليمية',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            phone = EXCLUDED.phone,
            role = EXCLUDED.role,
            avatar = EXCLUDED.avatar,
            bio = EXCLUDED.bio,
            updated_at = NOW();
        
        RAISE NOTICE 'تم إنشاء/تحديث حساب الأدمن بنجاح';
    ELSE
        RAISE NOTICE 'لم يتم العثور على المستخدم في auth.users - يرجى إنشاؤه أولاً';
    END IF;
END $$;

-- =====================================================
-- طريقة بديلة: إنشاء أدمن مباشرة (للتطوير فقط)
-- =====================================================

-- إذا كنت تريد إضافة أدمن بدون Supabase Auth (للتطوير المحلي فقط)
INSERT INTO public.users (
    id,
    email,
    name,
    phone,
    role,
    avatar,
    bio,
    created_at,
    updated_at
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890', -- ID ثابت للتطوير
    'admin@platform.com',
    'أحمد - مدير المنصة',
    '01005209667',
    'admin',
    '/admin-avatar.png',
    'مدير المنصة التعليمية',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    updated_at = NOW();

-- =====================================================
-- إنشاء دالة للتحقق من صلاحيات الأدمن
-- =====================================================

CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- إنشاء دالة لتسجيل دخول الأدمن بالهاتف
-- =====================================================

CREATE OR REPLACE FUNCTION admin_login_by_phone(
    p_phone TEXT,
    p_password TEXT
)
RETURNS TABLE (
    user_id UUID,
    user_email TEXT,
    user_name TEXT,
    user_role TEXT,
    login_success BOOLEAN
) AS $$
BEGIN
    -- تحقق خاص لحساب أحمد
    IF p_phone = '01005209667' AND p_password = 'Ahmed@010052' THEN
        RETURN QUERY
        SELECT 
            u.id,
            u.email,
            u.name,
            u.role,
            TRUE as login_success
        FROM public.users u
        WHERE u.phone = '01005209667' AND u.role = 'admin'
        LIMIT 1;
        
        -- إذا لم يوجد، أنشئ الحساب
        IF NOT FOUND THEN
            INSERT INTO public.users (
                id,
                email,
                name,
                phone,
                role,
                created_at
            ) VALUES (
                gen_random_uuid(),
                'admin@platform.com',
                'أحمد - مدير المنصة',
                '01005209667',
                'admin',
                NOW()
            )
            RETURNING 
                id,
                email,
                name,
                role,
                TRUE
            INTO user_id, user_email, user_name, user_role, login_success;
            
            RETURN NEXT;
        END IF;
    ELSE
        -- إرجاع فشل تسجيل الدخول
        RETURN QUERY
        SELECT 
            NULL::UUID,
            NULL::TEXT,
            NULL::TEXT,
            NULL::TEXT,
            FALSE as login_success;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- إضافة صلاحيات الأدمن للجداول
-- =====================================================

-- منح الأدمن صلاحيات كاملة على جميع الجداول
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- إنشاء جدول سجل نشاطات الأدمن
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    target_type TEXT, -- 'user', 'course', 'enrollment', etc.
    target_id TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهرس للبحث السريع
CREATE INDEX idx_admin_activity_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX idx_admin_activity_created_at ON admin_activity_logs(created_at DESC);

-- =====================================================
-- دالة لتسجيل نشاط الأدمن
-- =====================================================

CREATE OR REPLACE FUNCTION log_admin_activity(
    p_admin_id UUID,
    p_action TEXT,
    p_target_type TEXT DEFAULT NULL,
    p_target_id TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO admin_activity_logs (
        admin_id,
        action,
        target_type,
        target_id,
        details
    ) VALUES (
        p_admin_id,
        p_action,
        p_target_type,
        p_target_id,
        p_details
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- إنشاء View لإحصائيات الأدمن
-- =====================================================

CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
    (SELECT COUNT(*) FROM users WHERE role = 'teacher') as total_teachers,
    (SELECT COUNT(*) FROM courses WHERE is_published = true) as total_courses,
    (SELECT COUNT(*) FROM enrollments WHERE status = 'active') as total_enrollments,
    (SELECT COUNT(*) FROM enrollment_requests WHERE status = 'pending') as pending_requests,
    (SELECT COALESCE(SUM(payment_amount), 0) FROM enrollment_requests WHERE status = 'approved') as total_revenue,
    (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_week,
    (SELECT COUNT(*) FROM enrollments WHERE created_at >= NOW() - INTERVAL '7 days') as new_enrollments_week;

-- =====================================================
-- دالة للحصول على إحصائيات الأدمن
-- =====================================================

CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE (
    stat_name TEXT,
    stat_value BIGINT,
    change_percentage NUMERIC,
    trend TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH current_stats AS (
        SELECT * FROM admin_dashboard_stats
    ),
    previous_stats AS (
        SELECT 
            (SELECT COUNT(*) FROM users WHERE role = 'student' AND created_at < NOW() - INTERVAL '7 days') as prev_students,
            (SELECT COUNT(*) FROM enrollments WHERE status = 'active' AND created_at < NOW() - INTERVAL '7 days') as prev_enrollments
    )
    SELECT 
        'total_students'::TEXT,
        current_stats.total_students,
        CASE 
            WHEN previous_stats.prev_students > 0 THEN
                ROUND(((current_stats.total_students - previous_stats.prev_students)::NUMERIC / previous_stats.prev_students) * 100, 2)
            ELSE 0
        END,
        CASE 
            WHEN current_stats.total_students > previous_stats.prev_students THEN 'up'
            WHEN current_stats.total_students < previous_stats.prev_students THEN 'down'
            ELSE 'stable'
        END
    FROM current_stats, previous_stats
    
    UNION ALL
    
    SELECT 
        'total_courses'::TEXT,
        current_stats.total_courses,
        0::NUMERIC,
        'stable'::TEXT
    FROM current_stats
    
    UNION ALL
    
    SELECT 
        'total_enrollments'::TEXT,
        current_stats.total_enrollments,
        CASE 
            WHEN previous_stats.prev_enrollments > 0 THEN
                ROUND(((current_stats.total_enrollments - previous_stats.prev_enrollments)::NUMERIC / previous_stats.prev_enrollments) * 100, 2)
            ELSE 0
        END,
        CASE 
            WHEN current_stats.total_enrollments > previous_stats.prev_enrollments THEN 'up'
            WHEN current_stats.total_enrollments < previous_stats.prev_enrollments THEN 'down'
            ELSE 'stable'
        END
    FROM current_stats, previous_stats
    
    UNION ALL
    
    SELECT 
        'pending_requests'::TEXT,
        current_stats.pending_requests,
        0::NUMERIC,
        CASE 
            WHEN current_stats.pending_requests > 0 THEN 'warning'
            ELSE 'stable'
        END
    FROM current_stats;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- تنبيه: خطوات التنفيذ
-- =====================================================

-- 1. نفذ هذا الملف في Supabase SQL Editor
-- 2. اذهب إلى Authentication > Users
-- 3. أنشئ مستخدم جديد:
--    Email: admin@platform.com
--    Password: Ahmed@010052
-- 4. الآن يمكنك تسجيل الدخول من الواجهة

-- أو استخدم الدالة المخصصة:
-- SELECT * FROM admin_login_by_phone('01005209667', 'Ahmed@010052');
