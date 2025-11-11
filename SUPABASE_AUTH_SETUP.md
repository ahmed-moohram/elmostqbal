# 🔐 إعداد نظام المصادقة الحقيقي في Supabase

## ✅ الخطوات المطلوبة:

### 1️⃣ **إعداد قاعدة البيانات**

1. افتح: https://supabase.com/dashboard/project/wnqifmvgvlmxgswhcwnc/sql
2. انسخ والصق محتوى: `sql/setup_auth_users.sql`
3. اضغط **Run**

### 2️⃣ **إنشاء حساب الأدمن**

#### من Supabase Dashboard:
1. اذهب إلى: **Authentication** > **Users**
2. اضغط **Add user** > **Create new user**
3. أدخل:
   - Email: `admin@platform.com`
   - Password: `Ahmed@010052`
4. اضغط **Create user**
5. انسخ **User ID** الذي سيظهر

#### تحديث SQL:
1. ارجع لـ SQL Editor
2. نفذ:
```sql
UPDATE public.users 
SET 
    role = 'admin',
    phone = '01005209667',
    name = 'أحمد - مدير المنصة',
    is_verified = TRUE
WHERE email = 'admin@platform.com';
```

### 3️⃣ **إنشاء حسابات طلاب للاختبار**

```sql
-- إنشاء طالب تجريبي
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('student@test.com', crypt('student123', gen_salt('bf')), NOW());

-- تحديث بيانات الطالب
UPDATE public.users 
SET 
    phone = '01234567890',
    name = 'طالب تجريبي',
    role = 'student'
WHERE email = 'student@test.com';
```

### 4️⃣ **تفعيل Email Auth في Supabase**

1. اذهب إلى: **Authentication** > **Providers**
2. تأكد من تفعيل **Email**
3. في **Auth settings**:
   - ✅ Enable email confirmations: **OFF** (للتجربة)
   - ✅ Enable email change confirmations: **OFF**

### 5️⃣ **اختبار تسجيل الدخول**

#### حساب الأدمن:
- **Email/Phone:** `admin@platform.com` أو `01005209667`
- **Password:** `Ahmed@010052`
- **يوجه إلى:** `/admin/dashboard`

#### حساب طالب:
- **Email/Phone:** `student@test.com` أو `01234567890`
- **Password:** `student123`
- **يوجه إلى:** `/dashboard`

## 🔍 **التحقق من الاتصال:**

### في Console المتصفح:
```javascript
// اختبار الاتصال
import { supabase } from '/src/lib/supabase-auth.js';

// جلب المستخدمين
const { data, error } = await supabase
  .from('users')
  .select('*');
  
console.log('Users:', data);
```

## ⚠️ **حل المشاكل الشائعة:**

### خطأ "Invalid API key":
1. تحقق من المفتاح في: **Settings** > **API**
2. انسخ **anon public** key
3. حدث في: `src/lib/supabase-auth.js`

### خطأ "User not found":
1. تأكد من إنشاء المستخدم في **Authentication** > **Users**
2. تحقق من وجوده في جدول `users`

### خطأ "Permission denied":
1. تحقق من RLS policies
2. تأكد من تفعيل السياسات الصحيحة

## 📊 **جداول قاعدة البيانات:**

### جدول `users`:
```sql
- id (UUID) - مرتبط بـ auth.users
- email (TEXT) - البريد الإلكتروني
- phone (TEXT) - رقم الهاتف
- name (TEXT) - الاسم
- role (TEXT) - الدور (student/teacher/admin)
- is_verified (BOOLEAN) - حالة التحقق
```

### جدول `courses`:
```sql
- id (UUID)
- title (TEXT)
- instructor (TEXT)
- price (DECIMAL)
- is_published (BOOLEAN)
```

## ✅ **النتيجة النهائية:**

بعد إتمام الخطوات:
1. ✅ نظام مصادقة حقيقي 100%
2. ✅ تسجيل دخول بالبريد أو الهاتف
3. ✅ حسابات حقيقية في قاعدة البيانات
4. ✅ صلاحيات وأدوار المستخدمين
5. ✅ أمان كامل مع RLS

## 🚀 **البدء:**

```bash
# في المتصفح
http://localhost:3003/login

# جرب تسجيل الدخول بـ:
Email: admin@platform.com
Password: Ahmed@010052
```

**النظام جاهز للعمل! 🎉**
