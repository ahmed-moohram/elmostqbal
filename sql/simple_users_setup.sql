-- =====================================================
-- إعداد بسيط لجدول المستخدمين
-- =====================================================

-- 1. حذف الجدول القديم إن وجد (اختياري)
-- DROP TABLE IF EXISTS public.users CASCADE;

-- 2. إنشاء جدول المستخدمين البسيط
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE,
    name TEXT,
    password TEXT, -- لحفظ كلمة المرور المشفرة
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. تفعيل Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. سياسة للسماح بالقراءة العامة (مؤقتاً للتجربة)
DROP POLICY IF EXISTS "Allow public read" ON public.users;
CREATE POLICY "Allow public read" 
ON public.users 
FOR SELECT 
USING (true);

-- 5. سياسة للسماح بالإدراج (للتسجيل)
DROP POLICY IF EXISTS "Allow public insert" ON public.users;
CREATE POLICY "Allow public insert" 
ON public.users 
FOR INSERT 
WITH CHECK (true);

-- 6. سياسة للسماح بالتحديث
DROP POLICY IF EXISTS "Allow users to update own data" ON public.users;
CREATE POLICY "Allow users to update own data" 
ON public.users 
FOR UPDATE 
USING (true);

-- 7. إضافة حساب الأدمن مباشرة
INSERT INTO public.users (
    email,
    phone,
    name,
    password,
    role
) VALUES (
    'admin@platform.com',
    '01005209667',
    'أحمد - مدير المنصة',
    crypt('Ahmed@010052', gen_salt('bf')), -- تشفير كلمة المرور
    'admin'
) ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    phone = '01005209667',
    name = 'أحمد - مدير المنصة';

-- 8. إضافة طالب تجريبي
INSERT INTO public.users (
    email,
    phone,
    name,
    password,
    role
) VALUES (
    'student@test.com',
    '01234567890',
    'طالب تجريبي',
    crypt('student123', gen_salt('bf')),
    'student'
) ON CONFLICT (email) DO NOTHING;

-- 9. دالة للتحقق من تسجيل الدخول
CREATE OR REPLACE FUNCTION public.check_login(
    input_email TEXT,
    input_password TEXT
)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    user_phone TEXT,
    user_role TEXT,
    is_valid BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        (u.password = crypt(input_password, u.password)) as is_valid
    FROM public.users u
    WHERE u.email = input_email OR u.phone = input_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- =====================================================
-- ✅ الحسابات الجاهزة:
-- =====================================================
-- أدمن:
--   Email: admin@platform.com
--   Phone: 01005209667
--   Password: Ahmed@010052
--
-- طالب:
--   Email: student@test.com
--   Phone: 01234567890
--   Password: student123
-- =====================================================
