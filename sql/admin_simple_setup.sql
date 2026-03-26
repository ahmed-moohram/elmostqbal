-- =====================================================
-- إعداد حساب الأدمن - نسخة مبسطة
-- =====================================================

-- 1. إضافة الأعمدة المطلوبة
-- =====================================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. حذف الأدمن القديم (اختياري)
-- =====================================================

-- DELETE FROM public.users WHERE phone = '01005209667';

-- 3. إنشاء/تحديث حساب الأدمن
-- =====================================================

-- تحديث إذا موجود أو إنشاء جديد
INSERT INTO public.users (
    id,
    email,
    name,
    phone,
    role,
    password,
    avatar,
    bio,
    email_verified,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'ahmed_admin_' || substring(md5(random()::text), 1, 6) || '@platform.com', -- بريد فريد
    'أحمد - مدير المنصة',
    '01005209667',
    'admin',
    'Ahmed@010052',
    '/admin-avatar.png',
    'مدير المنصة التعليمية',
    TRUE,
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- 4. تحديث أي حساب برقم 01005209667 ليكون أدمن
-- =====================================================

UPDATE public.users 
SET 
    role = 'admin',
    name = 'أحمد - مدير المنصة',
    password = 'Ahmed@010052',
    email_verified = TRUE,
    is_active = TRUE,
    updated_at = NOW()
WHERE phone = '01005209667';

-- 5. عرض النتائج
-- =====================================================

-- عرض حساب الأدمن
SELECT 
    id,
    email,
    name,
    phone,
    role,
    CASE 
        WHEN password = 'Ahmed@010052' THEN '✓ كلمة المرور صحيحة'
        ELSE '✗ كلمة المرور مختلفة'
    END as password_check,
    is_active,
    created_at
FROM public.users 
WHERE phone = '01005209667' OR role = 'admin'
ORDER BY created_at DESC
LIMIT 5;

-- 6. رسالة النجاح
-- =====================================================

DO $$
DECLARE
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count
    FROM public.users 
    WHERE phone = '01005209667' AND role = 'admin';
    
    IF admin_count > 0 THEN
        RAISE NOTICE '✓ تم إعداد حساب الأدمن بنجاح!';
        RAISE NOTICE '  الهاتف: 01005209667';
        RAISE NOTICE '  كلمة المرور: Ahmed@010052';
        RAISE NOTICE '  الدور: admin';
    ELSE
        RAISE WARNING '✗ فشل إنشاء حساب الأدمن';
    END IF;
END $$;

-- =====================================================
-- معلومات تسجيل الدخول:
-- الهاتف: 01005209667
-- كلمة المرور: Ahmed@010052
-- =====================================================
