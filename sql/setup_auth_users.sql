-- =====================================================
-- إعداد نظام المصادقة الحقيقي في Supabase
-- =====================================================

-- 1. إنشاء جدول المستخدمين
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE,
    name TEXT,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. إنشاء دالة لإضافة مستخدم جديد تلقائياً عند التسجيل
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'name', new.email)
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. إنشاء Trigger للتسجيل التلقائي
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. تفعيل Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. سياسات الأمان
-- السماح للمستخدمين بقراءة بياناتهم
CREATE POLICY "Users can read own data" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

-- السماح للمستخدمين بتحديث بياناتهم
CREATE POLICY "Users can update own data" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id);

-- السماح للأدمن بقراءة جميع البيانات
CREATE POLICY "Admins can read all users" 
ON public.users 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- 6. إنشاء حساب أدمن
-- ملاحظة: يجب تنفيذ هذا من Supabase Dashboard > Authentication > Users
-- أو استخدام Supabase Admin API

-- بديل: إضافة أدمن مباشرة (بعد إنشاء الحساب من Dashboard)
-- استبدل YOUR_ADMIN_USER_ID_HERE بـ ID المستخدم الفعلي
/*
INSERT INTO public.users (
    id,
    email,
    phone,
    name,
    role
) VALUES (
    'YOUR_ADMIN_USER_ID_HERE', -- ضع ID المستخدم من auth.users
    'admin@platform.com',
    '01005209667',
    'أحمد - مدير المنصة',
    'admin'
) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    phone = '01005209667',
    name = 'أحمد - مدير المنصة';
*/

-- 7. دالة للتحقق من دور المستخدم
CREATE OR REPLACE FUNCTION public.check_user_role(user_id UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = user_id 
        AND role = required_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. دالة لتسجيل الدخول بالهاتف
CREATE OR REPLACE FUNCTION public.get_email_by_phone(phone_number TEXT)
RETURNS TEXT AS $$
DECLARE
    user_email TEXT;
BEGIN
    SELECT email INTO user_email
    FROM public.users
    WHERE phone = phone_number
    LIMIT 1;
    
    RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- =====================================================
-- تعليمات مهمة:
-- =====================================================
-- 1. اذهب إلى Supabase Dashboard > Authentication > Users
-- 2. أضف مستخدم جديد:
--    - Email: admin@platform.com
--    - Password: Ahmed@010052
-- 3. انسخ User ID
-- 4. استبدل YOUR_ADMIN_USER_ID_HERE بالـ ID
-- 5. نفذ هذا SQL مرة أخرى
-- =====================================================
