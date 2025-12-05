-- =====================================================
-- إصلاح جدول users وإضافة حساب الأدمن
-- =====================================================

-- 1. أولاً: تحقق من وجود جدول users وأنشئه إذا لم يكن موجوداً
-- =====================================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. إضافة الأعمدة الناقصة للجدول الموجود
-- =====================================================

-- إضافة عمود phone
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- إضافة عمود role
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

-- إضافة عمود avatar
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar TEXT;

-- إضافة عمود bio
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- إضافة عمود email_verified (إذا كان مطلوباً)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- إضافة عمود is_active
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- إضافة عمود password (مطلوب في بعض الإعدادات)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password TEXT;

-- 3. إضافة حساب الأدمن بطريقة آمنة
-- =====================================================

-- إضافة أدمن بـ ID ثابت للتطوير
INSERT INTO public.users (
    id,
    email,
    name,
    phone,
    role,
    avatar,
    bio,
    email_verified,
    is_active,
    password,
    created_at,
    updated_at
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::UUID, -- ID ثابت للتطوير
    'admin@platform.com',
    'أحمد - مدير المنصة',
    '01005209667',
    'admin',
    '/admin-avatar.png',
    'مدير المنصة التعليمية',
    TRUE,
    TRUE,
    'Ahmed@010052', -- كلمة المرور
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    email_verified = EXCLUDED.email_verified,
    updated_at = NOW();

-- 4. طريقة بديلة: إضافة أدمن بالبريد الإلكتروني
-- =====================================================

INSERT INTO public.users (
    email,
    name,
    phone,
    role,
    avatar,
    bio,
    email_verified,
    is_active,
    password
) VALUES (
    'ahmed.admin@platform.com',
    'أحمد - مدير المنصة',
    '01005209667',
    'admin',
    '/admin-avatar.png',
    'مدير المنصة التعليمية',
    TRUE,
    TRUE,
    'Ahmed@010052'
)
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    updated_at = NOW();

-- 5. دالة بسيطة للتحقق من الأدمن
-- =====================================================

CREATE OR REPLACE FUNCTION check_admin_login(
    p_phone TEXT,
    p_password TEXT
)
RETURNS TABLE (
    user_id UUID,
    user_email TEXT,
    user_name TEXT,
    user_role TEXT,
    is_valid BOOLEAN
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
            TRUE as is_valid
        FROM public.users u
        WHERE u.phone = '01005209667' AND u.role = 'admin'
        LIMIT 1;
        
        -- إذا لم يوجد، أنشئ الحساب
        IF NOT FOUND THEN
            -- أنشئ حساب أدمن جديد
            INSERT INTO public.users (
                email,
                name,
                phone,
                role,
                email_verified,
                is_active,
                password
            ) VALUES (
                'admin.ahmed@platform.com',
                'أحمد - مدير المنصة',
                '01005209667',
                'admin',
                TRUE,
                TRUE,
                'Ahmed@010052'
            );
            
            -- أعد البيانات
            RETURN QUERY
            SELECT 
                u.id,
                u.email,
                u.name,
                u.role,
                TRUE as is_valid
            FROM public.users u
            WHERE u.phone = '01005209667' AND u.role = 'admin'
            LIMIT 1;
        END IF;
    ELSE
        -- إرجاع فشل
        RETURN QUERY
        SELECT 
            NULL::UUID,
            NULL::TEXT,
            NULL::TEXT,
            NULL::TEXT,
            FALSE as is_valid;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. View بسيط لإحصائيات الأدمن
-- =====================================================

CREATE OR REPLACE VIEW admin_stats AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
    (SELECT COUNT(*) FROM users WHERE role = 'teacher') as total_teachers,
    (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admins,
    (SELECT COUNT(*) FROM courses WHERE is_published = true) as total_courses,
    (SELECT COUNT(*) FROM enrollments) as total_enrollments;

-- 7. تحقق من نجاح الإضافة
-- =====================================================

-- عرض جميع المستخدمين من نوع admin
SELECT id, email, name, phone, role 
FROM public.users 
WHERE role = 'admin';

-- =====================================================
-- ملاحظات مهمة:
-- =====================================================
-- 1. هذا الملف يعمل حتى لو كان الجدول غير موجود
-- 2. يضيف الأعمدة الناقصة تلقائياً
-- 3. يضيف حساب الأدمن مباشرة
-- 4. لا يحتاج لـ Supabase Auth (للتطوير فقط)
-- =====================================================
