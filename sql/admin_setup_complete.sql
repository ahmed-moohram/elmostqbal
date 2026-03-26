-- =====================================================
-- إعداد حساب الأدمن - أحمد (النسخة الكاملة)
-- =====================================================

-- 1. التحقق من بنية جدول users الكاملة
-- =====================================================

-- عرض بنية الجدول الحالية (للتحقق فقط)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'users';

-- إضافة الأعمدة المطلوبة إذا لم تكن موجودة
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar TEXT;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- =====================================================
-- 2. إضافة حساب الأدمن مع كلمة المرور
-- =====================================================

-- حذف الحساب القديم إذا كان موجوداً (اختياري)
-- DELETE FROM public.users WHERE email = 'admin@platform.com';

-- إضافة حساب الأدمن مع كلمة مرور مشفرة
INSERT INTO public.users (
    id,
    email,
    name,
    password, -- إضافة كلمة المرور المشفرة
    phone,
    role,
    avatar,
    bio,
    status,
    email_verified,
    created_at,
    updated_at
) VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
    'admin@platform.com',
    'أحمد - مدير المنصة',
    crypt('Ahmed@010052', gen_salt('bf')), -- تشفير كلمة المرور
    '01005209667',
    'admin',
    '/admin-avatar.png',
    'مدير المنصة التعليمية',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    password = EXCLUDED.password,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    avatar = EXCLUDED.avatar,
    bio = EXCLUDED.bio,
    status = EXCLUDED.status,
    updated_at = NOW();

-- =====================================================
-- 3. طريقة بديلة: إضافة أدمن بكلمة مرور بسيطة (للتطوير فقط)
-- =====================================================

-- إذا لم يعمل التشفير، استخدم هذا:
INSERT INTO public.users (
    id,
    email,
    name,
    password, -- كلمة مرور نصية (غير آمن - للتطوير فقط)
    phone,
    role,
    avatar,
    bio,
    status,
    email_verified,
    created_at,
    updated_at
) VALUES (
    'admin-ahmed-001'::uuid,
    'ahmed.admin@platform.com',
    'أحمد - مدير المنصة',
    'Ahmed@010052', -- كلمة مرور بسيطة
    '01005209667',
    'admin',
    '/admin-avatar.png',
    'مدير المنصة التعليمية',
    'active',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. إنشاء حساب في Supabase Auth وربطه
-- =====================================================

-- هذا يجب تنفيذه من Supabase Dashboard:
-- 1. اذهب إلى Authentication > Users
-- 2. اضغط Add User > Create new user
-- 3. Email: admin@platform.com
-- 4. Password: Ahmed@010052
-- 5. احصل على الـ ID
-- 6. نفذ هذا الكود مع الـ ID الصحيح:

/*
DO $$
DECLARE
    auth_user_id UUID := 'ضع-ID-المستخدم-من-Auth-هنا';
BEGIN
    UPDATE public.users 
    SET 
        id = auth_user_id,
        password = NULL -- احذف كلمة المرور المحلية
    WHERE email = 'admin@platform.com';
END $$;
*/

-- =====================================================
-- 5. دالة تسجيل دخول محسنة
-- =====================================================

CREATE OR REPLACE FUNCTION admin_login(
    p_email TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_password TEXT DEFAULT NULL
)
RETURNS TABLE (
    user_id UUID,
    user_email TEXT,
    user_name TEXT,
    user_phone TEXT,
    user_role TEXT,
    login_success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_user RECORD;
BEGIN
    -- تحقق خاص لحساب أحمد بالهاتف
    IF p_phone = '01005209667' AND p_password = 'Ahmed@010052' THEN
        SELECT * INTO v_user
        FROM public.users u
        WHERE u.phone = '01005209667' AND u.role = 'admin'
        LIMIT 1;
        
        IF FOUND THEN
            RETURN QUERY
            SELECT 
                v_user.id,
                v_user.email,
                v_user.name,
                v_user.phone,
                v_user.role,
                TRUE,
                'تم تسجيل الدخول بنجاح'::TEXT;
        ELSE
            -- أنشئ الحساب إذا لم يكن موجوداً
            INSERT INTO public.users (
                id,
                email,
                name,
                password,
                phone,
                role,
                status,
                created_at
            ) VALUES (
                gen_random_uuid(),
                'admin@platform.com',
                'أحمد - مدير المنصة',
                'Ahmed@010052',
                '01005209667',
                'admin',
                'active',
                NOW()
            ) RETURNING * INTO v_user;
            
            RETURN QUERY
            SELECT 
                v_user.id,
                v_user.email,
                v_user.name,
                v_user.phone,
                v_user.role,
                TRUE,
                'تم إنشاء حساب الأدمن وتسجيل الدخول'::TEXT;
        END IF;
    END IF;
    
    -- تحقق بالبريد الإلكتروني
    IF p_email IS NOT NULL THEN
        SELECT * INTO v_user
        FROM public.users u
        WHERE u.email = p_email 
        AND (u.password = p_password OR u.password = crypt(p_password, u.password))
        LIMIT 1;
        
        IF FOUND THEN
            RETURN QUERY
            SELECT 
                v_user.id,
                v_user.email,
                v_user.name,
                v_user.phone,
                v_user.role,
                TRUE,
                'تم تسجيل الدخول بنجاح'::TEXT;
        END IF;
    END IF;
    
    -- فشل تسجيل الدخول
    RETURN QUERY
    SELECT 
        NULL::UUID,
        NULL::TEXT,
        NULL::TEXT,
        NULL::TEXT,
        NULL::TEXT,
        FALSE,
        'بيانات الدخول غير صحيحة'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. اختبار النظام
-- =====================================================

-- تحقق من وجود حساب الأدمن
SELECT id, email, name, phone, role, status 
FROM public.users 
WHERE phone = '01005209667' OR email = 'admin@platform.com';

-- اختبر تسجيل الدخول بالهاتف
SELECT * FROM admin_login(
    p_phone := '01005209667',
    p_password := 'Ahmed@010052'
);

-- اختبر تسجيل الدخول بالبريد
SELECT * FROM admin_login(
    p_email := 'admin@platform.com',
    p_password := 'Ahmed@010052'
);

-- =====================================================
-- 7. منح الصلاحيات
-- =====================================================

-- منح صلاحيات للدوال
GRANT EXECUTE ON FUNCTION admin_login TO anon, authenticated;

-- =====================================================
-- ملاحظات التنفيذ:
-- =====================================================
-- 1. نفذ هذا الملف كاملاً في Supabase SQL Editor
-- 2. إذا ظهر خطأ في crypt، استخدم الطريقة البديلة (السطر 75-95)
-- 3. تحقق من النتائج باستخدام أوامر الاختبار
-- 4. يمكنك الآن تسجيل الدخول من الواجهة بـ:
--    الهاتف: 01005209667
--    كلمة المرور: Ahmed@010052
