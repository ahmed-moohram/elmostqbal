-- =====================================================
-- إعداد حساب الأدمن - أحمد (نسخة محدثة)
-- =====================================================

-- 1. التحقق من بنية جدول users وإضافة الأعمدة الناقصة
-- =====================================================

-- إضافة عمود phone إذا لم يكن موجوداً
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- إضافة عمود role إذا لم يكن موجوداً
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

-- إضافة عمود avatar إذا لم يكن موجوداً
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar TEXT;

-- إضافة عمود bio إذا لم يكن موجوداً
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- إضافة عمود name إذا لم يكن موجوداً
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS name TEXT;

-- =====================================================
-- 2. إضافة حساب الأدمن
-- =====================================================

-- طريقة 1: إضافة أدمن مباشرة (للتطوير)
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
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
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
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    avatar = EXCLUDED.avatar,
    bio = EXCLUDED.bio,
    updated_at = NOW();

-- طريقة 2: ربط مع Supabase Auth
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- احصل على ID المستخدم من auth.users
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@platform.com'
    LIMIT 1;
    
    -- إذا وجد المستخدم في Auth، حدث بياناته
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
        
        RAISE NOTICE 'تم تحديث حساب الأدمن من Supabase Auth';
    ELSE
        RAISE NOTICE 'لم يتم العثور على المستخدم في auth.users';
    END IF;
END $$;

-- =====================================================
-- 3. دالة تسجيل دخول الأدمن المبسطة
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
        
        -- إذا لم يوجد، أنشئه
        IF NOT FOUND THEN
            -- أنشئ حساب أدمن جديد
            INSERT INTO public.users (
                id,
                email,
                name,
                phone,
                role,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                'admin@platform.com',
                'أحمد - مدير المنصة',
                '01005209667',
                'admin',
                NOW(),
                NOW()
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
        -- فشل تسجيل الدخول
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

-- =====================================================
-- 4. دالة للتحقق من صلاحيات الأدمن
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
-- 5. View لإحصائيات لوحة التحكم
-- =====================================================

CREATE OR REPLACE VIEW admin_stats AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
    (SELECT COUNT(*) FROM users WHERE role = 'teacher') as total_teachers,
    (SELECT COUNT(*) FROM courses) as total_courses,
    (SELECT COUNT(*) FROM enrollments) as total_enrollments,
    (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_week,
    (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_month;

-- =====================================================
-- 6. اختبار الإعداد
-- =====================================================

-- تحقق من وجود حساب الأدمن
SELECT * FROM public.users WHERE phone = '01005209667' AND role = 'admin';

-- اختبر تسجيل الدخول
SELECT * FROM check_admin_login('01005209667', 'Ahmed@010052');

-- =====================================================
-- ملاحظات مهمة:
-- =====================================================
-- 1. نفذ هذا الملف في Supabase SQL Editor
-- 2. إذا ظهر خطأ في الأعمدة، نفذ الجزء الأول (ALTER TABLE) أولاً
-- 3. ثم نفذ باقي الملف
-- 4. يمكنك الآن تسجيل الدخول من الواجهة بـ:
--    الهاتف: 01005209667
--    كلمة المرور: Ahmed@010052
