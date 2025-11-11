-- =====================================================
-- إعداد حساب الأدمن النهائي - مع معالجة التكرار
-- =====================================================

-- 1. أولاً: تأكد من وجود الأعمدة المطلوبة
-- =====================================================

-- إضافة الأعمدة إذا لم تكن موجودة
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar TEXT;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password TEXT;

-- 2. حذف الأدمن القديم إذا كان موجوداً (اختياري)
-- =====================================================

-- إذا كنت تريد حذف الحساب القديم وإعادة إنشائه
-- DELETE FROM public.users WHERE email = 'admin@platform.com';

-- 3. تحديث أو إنشاء حساب الأدمن
-- =====================================================

-- محاولة التحديث أولاً، ثم الإنشاء إذا لم يكن موجوداً
DO $$
BEGIN
    -- تحقق من وجود الحساب
    IF EXISTS (SELECT 1 FROM public.users WHERE email = 'admin@platform.com') THEN
        -- حدث الحساب الموجود
        UPDATE public.users 
        SET 
            name = 'أحمد - مدير المنصة',
            phone = '01005209667',
            role = 'admin',
            avatar = '/admin-avatar.png',
            bio = 'مدير المنصة التعليمية',
            email_verified = TRUE,
            is_active = TRUE,
            password = 'Ahmed@010052',
            updated_at = NOW()
        WHERE email = 'admin@platform.com';
        
        RAISE NOTICE 'تم تحديث حساب الأدمن الموجود';
    ELSE
        -- أنشئ حساب جديد
        INSERT INTO public.users (
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
            'admin@platform.com',
            'أحمد - مدير المنصة',
            '01005209667',
            'admin',
            '/admin-avatar.png',
            'مدير المنصة التعليمية',
            TRUE,
            TRUE,
            'Ahmed@010052',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'تم إنشاء حساب أدمن جديد';
    END IF;
END $$;

-- 4. تحديث أو إنشاء حساب أدمن بديل
-- =====================================================

-- حساب بديل بالرقم كمعرف فريد
DO $$
BEGIN
    -- تحقق من وجود حساب بنفس الرقم
    IF EXISTS (SELECT 1 FROM public.users WHERE phone = '01005209667') THEN
        -- حدث الحساب الموجود ليكون أدمن
        UPDATE public.users 
        SET 
            role = 'admin',
            name = 'أحمد - مدير المنصة',
            email = COALESCE(email, 'admin@platform.com'),
            avatar = '/admin-avatar.png',
            bio = 'مدير المنصة التعليمية',
            email_verified = TRUE,
            is_active = TRUE,
            password = 'Ahmed@010052',
            updated_at = NOW()
        WHERE phone = '01005209667';
        
        RAISE NOTICE 'تم تحديث الحساب برقم الهاتف 01005209667 ليكون أدمن';
    ELSE
        -- أنشئ حساب جديد بالرقم
        INSERT INTO public.users (
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
            'ahmed_' || substring(md5(random()::text), 1, 8) || '@platform.com', -- بريد فريد
            'أحمد - مدير المنصة',
            '01005209667',
            'admin',
            '/admin-avatar.png',
            'مدير المنصة التعليمية',
            TRUE,
            TRUE,
            'Ahmed@010052',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'تم إنشاء حساب أدمن جديد برقم الهاتف';
    END IF;
END $$;

-- 5. دالة تسجيل دخول الأدمن المحسنة
-- =====================================================

CREATE OR REPLACE FUNCTION admin_login_check(
    p_phone TEXT,
    p_password TEXT
)
RETURNS TABLE (
    user_id UUID,
    user_email TEXT,
    user_name TEXT,
    user_role TEXT,
    is_valid BOOLEAN,
    message TEXT
) AS $$
BEGIN
    -- تحقق من بيانات أحمد
    IF p_phone = '01005209667' AND p_password = 'Ahmed@010052' THEN
        -- ابحث عن الحساب
        RETURN QUERY
        SELECT 
            u.id,
            u.email::TEXT,
            u.name::TEXT,
            u.role::TEXT,
            TRUE as is_valid,
            'تم تسجيل الدخول بنجاح'::TEXT as message
        FROM public.users u
        WHERE u.phone = '01005209667' AND u.role = 'admin'
        LIMIT 1;
        
        -- إذا لم يوجد
        IF NOT FOUND THEN
            RETURN QUERY
            SELECT 
                NULL::UUID,
                NULL::TEXT,
                NULL::TEXT,
                NULL::TEXT,
                FALSE as is_valid,
                'لم يتم العثور على حساب الأدمن - يرجى تنفيذ السكريبت أولاً'::TEXT as message;
        END IF;
    ELSE
        -- بيانات خاطئة
        RETURN QUERY
        SELECT 
            NULL::UUID,
            NULL::TEXT,
            NULL::TEXT,
            NULL::TEXT,
            FALSE as is_valid,
            'رقم الهاتف أو كلمة المرور غير صحيحة'::TEXT as message;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. عرض معلومات الأدمن
-- =====================================================

-- عرض جميع حسابات الأدمن
SELECT 
    id,
    email,
    name,
    phone,
    role,
    CASE 
        WHEN password = 'Ahmed@010052' THEN 'كلمة المرور صحيحة ✓'
        ELSE 'كلمة المرور مختلفة'
    END as password_status,
    created_at
FROM public.users 
WHERE role = 'admin' OR phone = '01005209667'
ORDER BY created_at DESC;

-- 7. تحقق من إمكانية تسجيل الدخول
-- =====================================================

-- اختبار دالة تسجيل الدخول
SELECT * FROM admin_login_check('01005209667', 'Ahmed@010052');

-- =====================================================
-- ملخص النتائج
-- =====================================================
-- بعد تنفيذ هذا السكريبت:
-- 1. سيكون لديك حساب أدمن يعمل
-- 2. البريد: admin@platform.com (أو بريد فريد آخر)
-- 3. الهاتف: 01005209667
-- 4. كلمة المرور: Ahmed@010052
-- 5. الدور: admin
-- =====================================================
