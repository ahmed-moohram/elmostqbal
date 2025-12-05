-- ========================================
-- إنشاء حساب أدمن للدخول للوحة التحكم
-- Create Admin Account
-- ========================================

-- 1. إنشاء حساب أدمن
INSERT INTO users (
    name,
    email,
    phone,
    password,
    role,
    is_active,
    is_verified
) VALUES (
    'مدير النظام',
    'admin@admin.com',
    '01000000000',
    btoa('admin123'), -- كلمة المرور: admin123
    'admin',
    true,
    true
) ON CONFLICT (email) DO UPDATE 
SET 
    role = 'admin',
    is_active = true,
    is_verified = true,
    password = btoa('admin123');

-- 2. إنشاء حساب أدمن احتياطي
INSERT INTO users (
    name,
    email,
    phone,
    password,
    role,
    is_active,
    is_verified
) VALUES (
    'المسؤول',
    'admin@example.com',
    '01111111111',
    btoa('admin123'), -- كلمة المرور: admin123
    'admin',
    true,
    true
) ON CONFLICT (email) DO UPDATE 
SET 
    role = 'admin',
    is_active = true,
    is_verified = true,
    password = btoa('admin123');

-- 3. عرض حسابات الأدمن
SELECT 
    '👤 حسابات الأدمن المتاحة:' as info;
    
SELECT 
    name as "الاسم",
    email as "البريد الإلكتروني",
    phone as "رقم الهاتف",
    'admin123' as "كلمة المرور",
    role as "الصلاحية",
    CASE 
        WHEN is_active THEN '✅ نشط'
        ELSE '❌ غير نشط'
    END as "الحالة"
FROM users
WHERE role = 'admin'
ORDER BY created_at DESC;

-- 4. رسالة النجاح
SELECT 
    '✅ تم إنشاء حسابات الأدمن بنجاح!' as status,
    '📧 البريد: admin@admin.com' as email1,
    '🔑 كلمة المرور: admin123' as password,
    '🌐 الرابط: http://localhost:3000/login' as url;
