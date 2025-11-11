# 🔴 حل مشكلة Invalid API Key

## ⚠️ المشكلة:
API Key المستخدم حالياً **منتهي الصلاحية** أو **غير صحيح**

## ✅ الحل السريع:

### 1️⃣ **احصل على المفتاح الصحيح من Supabase:**

1. **افتح الرابط مباشرة:**
   ```
   https://supabase.com/dashboard/project/wnqifmvgvlmxgswhcwnc/settings/api
   ```

2. **ابحث عن قسم:** `Project API keys`

3. **انسخ المفتاح:** `anon` `public`
   - يبدأ بـ: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 2️⃣ **حدث المفتاح في الملفات التالية:**

#### **ملف 1:** `frontend/src/app/register/page.tsx`
السطر 77:
```javascript
const SUPABASE_KEY = 'ضع_المفتاح_الجديد_هنا';
```

#### **ملف 2:** `frontend/src/app/courses/page.tsx`
السطر 97:
```javascript
const SUPABASE_KEY = 'ضع_المفتاح_الجديد_هنا';
```

#### **ملف 3:** `frontend/src/lib/supabase-auth.js`
السطر 9:
```javascript
const SUPABASE_ANON_KEY = 'ضع_المفتاح_الجديد_هنا';
```

#### **ملف 4:** `frontend/src/lib/supabase-client.js`
السطر 10:
```javascript
const SUPABASE_ANON_KEY = 'ضع_المفتاح_الجديد_هنا';
```

### 3️⃣ **أو استخدم ملف بيئة واحد:**

أنشئ ملف: `frontend/.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://wnqifmvgvlmxgswhcwnc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ضع_المفتاح_الجديد_هنا
```

ثم في الكود استخدم:
```javascript
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
```

## 🆘 حل بديل مؤقت:

### استخدم قاعدة بيانات محلية بدون Supabase:

```javascript
// في handleSubmit
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // حفظ محلي مؤقت
  const userData = {
    id: Date.now(),
    name: name + ' ' + fatherName,
    phone: studentPhone,
    email: email || studentPhone + '@student.com',
    role: 'student'
  };
  
  // حفظ في localStorage
  localStorage.setItem('users', JSON.stringify([
    ...JSON.parse(localStorage.getItem('users') || '[]'),
    userData
  ]));
  
  localStorage.setItem('user', JSON.stringify(userData));
  localStorage.setItem('token', 'local-' + Date.now());
  
  alert('تم التسجيل بنجاح!');
  router.push('/login');
};
```

## 📝 ملاحظات مهمة:

1. **المفتاح الحالي منتهي:** تاريخ الانتهاء كان 2046 لكن يبدو أنه تم إلغاؤه
2. **احصل على مفتاح جديد:** من Supabase Dashboard
3. **أو أنشئ مشروع جديد:** إذا لم تستطع الوصول للمشروع الحالي

## 🚀 الخطوة التالية:

1. احصل على المفتاح الصحيح
2. حدثه في الملفات
3. أعد تشغيل المشروع:
   ```bash
   npm run dev
   ```

**بعد التحديث، كل شيء سيعمل! 🎉**
