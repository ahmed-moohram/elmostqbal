# 🔒 **توصيات الأمان - منصة المستقبل**

---

## 🚨 **مشاكل أمنية حرجة:**

### **1. API Keys مكشوفة في الكود**

**المشكلة:**
```javascript
// في config/supabase.js و lib/supabase.ts
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiI...' // ❌ مباشرة في الكود
```

**الخطر:**
- أي شخص يفحص الكود يرى الـ keys
- يمكن استخدامها للوصول لقاعدة البيانات
- إذا تم رفعها على GitHub Public = كارثة

**الحل:**
```javascript
// ✅ استخدم environment variables
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// في .env.local
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

---

### **2. RLS معطّل أو غير صحيح**

**المشكلة:**
```sql
-- بعض الجداول RLS معطّل
SELECT * FROM users; -- ✅ يعمل للجميع (خطر!)
```

**الخطر:**
- أي مستخدم يمكنه رؤية بيانات مستخدمين آخرين
- يمكن تعديل أو حذف بيانات الآخرين
- لا توجد حماية على مستوى الصفوف

**الحل:**
```sql
-- لكل جدول:
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy للقراءة (المستخدم يرى بياناته فقط)
CREATE POLICY "Users view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Policy للتحديث
CREATE POLICY "Users update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Policy للإدمن
CREATE POLICY "Admins view all"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

### **3. JWT Secret غير آمن**

**المشكلة:**
```javascript
// في api/auth/login/route.ts
const JWT_SECRET = process.env.JWT_SECRET || 
  'your_jwt_secret_key_replace_in_production'; // ❌
```

**الخطر:**
- إذا استخدمت القيمة الافتراضية = أي شخص يمكنه إنشاء tokens
- يمكن انتحال شخصية أي مستخدم

**الحل:**
```javascript
// ✅ تأكد من وجود JWT_SECRET
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required!');
}

const JWT_SECRET = process.env.JWT_SECRET;

// في .env.local
JWT_SECRET=your_very_long_random_string_at_least_32_chars_dfkjsdhfkjsdh
```

---

### **4. XSS في الصور**

**المشكلة:**
```javascript
// في next.config.js
hostname: '**', // ❌ يسمح بأي مصدر
```

**الخطر:**
- يمكن تحميل صور من مواقع ضارة
- يمكن استخدامها في هجمات XSS
- Tracking pixels

**الحل:**
```javascript
remotePatterns: [
  {
    protocol: 'https',
    hostname: 'wnqifmvgvlmxgswhcwnc.supabase.co',
  },
  // أضف فقط المصادر الموثوقة
],
```

---

### **5. localStorage للـ Auth**

**المشكلة:**
```javascript
localStorage.setItem('token', token); // ❌
```

**الخطر:**
- يمكن الوصول إليه من JavaScript
- عرضة لـ XSS attacks
- لا يُحذف تلقائياً عند إغلاق المتصفح

**الحل:**
```javascript
// ✅ استخدم httpOnly cookies
cookies.set('auth_token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
});

// أو استخدم Supabase Auth
await supabase.auth.signInWithPassword({...});
// Supabase يدير الـ tokens بشكل آمن
```

---

## ⚠️ **مشاكل أمنية متوسطة:**

### **6. CORS غير مقيّد**

**الحل:**
```javascript
// في next.config.js
headers: async () => {
  return [
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Access-Control-Allow-Origin',
          value: 'https://yourdomain.com', // ✅ نطاقك فقط
        },
      ],
    },
  ];
},
```

---

### **7. Rate Limiting**

**المشكلة:**
- لا يوجد rate limiting على API routes

**الخطر:**
- Brute force attacks
- DDoS attacks

**الحل:**
```javascript
// استخدم مكتبة rate limiting
npm install express-rate-limit

// في API routes
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100 // 100 request
});
```

---

### **8. SQL Injection (محمي جزئياً)**

**الحالة الحالية:**
- Supabase يحمي من SQL injection ✅
- لكن إذا كتبت SQL queries مباشرة = خطر

**الحل:**
```javascript
// ❌ لا تفعل هذا:
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ استخدم parameterized queries:
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId);
```

---

### **9. HTTPS فقط**

**الحل:**
```javascript
// في next.config.js
headers: async () => {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ],
    },
  ];
},
```

---

### **10. Content Security Policy**

**الحل:**
```javascript
headers: async () => {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self' https://wnqifmvgvlmxgswhcwnc.supabase.co",
          ].join('; '),
        },
      ],
    },
  ];
},
```

---

## 💡 **توصيات عامة:**

### **11. Logging والـ Monitoring**

```javascript
// أنشئ lib/logger.ts
export const logger = {
  info: (message, meta) => {
    // أرسل لـ logging service
  },
  error: (message, error) => {
    // أرسل لـ error tracking (Sentry)
  },
  security: (message, meta) => {
    // أرسل لـ security monitoring
  }
};
```

---

### **12. Input Validation**

```javascript
// استخدم Zod
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100)
});

// في API routes
const validated = loginSchema.parse(body);
```

---

### **13. Password Hashing**

**الحالة الحالية:**
- API routes تستخدم bcrypt ✅

**تأكد:**
```javascript
// ✅ استخدم salt rounds كافي
const hashedPassword = await bcrypt.hash(password, 12);
```

---

### **14. Session Management**

```javascript
// تأكد من:
- Session timeout (مثلاً 24 ساعة)
- Automatic logout عند الخمول
- Refresh tokens
```

---

### **15. Error Messages**

```javascript
// ❌ لا تكشف معلومات حساسة
res.json({ error: 'User not found in database table users' });

// ✅ رسائل عامة
res.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
```

---

## 🔐 **Checklist أمني:**

### **Environment Variables:**
- [ ] .env.local في .gitignore
- [ ] لا توجد keys في الكود
- [ ] JWT_SECRET قوي وطويل
- [ ] Environment variables في Vercel

### **Database Security:**
- [ ] RLS مفعّل على كل الجداول
- [ ] Policies صحيحة لكل دور
- [ ] لا توجد direct database access من Frontend
- [ ] Backup منتظم

### **Authentication:**
- [ ] Passwords مُشفرة (bcrypt)
- [ ] JWT tokens آمنة
- [ ] Session timeout
- [ ] Logout endpoint
- [ ] Rate limiting على login

### **API Security:**
- [ ] CORS مقيّد
- [ ] Rate limiting
- [ ] Input validation
- [ ] Error handling صحيح
- [ ] HTTPS only

### **Frontend Security:**
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Content Security Policy
- [ ] Secure cookies
- [ ] No sensitive data in localStorage

### **Deployment:**
- [ ] Environment variables في Vercel
- [ ] HTTPS enabled
- [ ] Security headers
- [ ] Error tracking (Sentry)
- [ ] Logging

---

## 🎯 **الأولويات:**

### **الأسبوع الأول:**
```
1. ✅ أنشئ .env.local
2. ✅ أضف environment variables في Vercel
3. ✅ فعّل RLS على كل الجداول
4. ✅ أنشئ Policies أساسية
5. ✅ غيّر JWT_SECRET
```

### **الأسبوع الثاني:**
```
6. ✅ أضف rate limiting
7. ✅ حسّن error messages
8. ✅ أضف input validation (Zod)
9. ✅ قيّد CORS
10. ✅ قيّد image sources
```

### **الشهر الأول:**
```
11. ✅ أضف CSP headers
12. ✅ استخدم httpOnly cookies
13. ✅ أضف security monitoring
14. ✅ أضف automated security scans
15. ✅ اختبار penetration testing
```

---

## 📊 **تقييم الأمان:**

```
قبل الإصلاح:  4/10 ❌
بعد الأسبوع الأول: 7/10 ⚠️
بعد الشهر الأول:  9/10 ✅
```

---

## 📚 **مصادر مفيدة:**

```
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Supabase Security: https://supabase.com/docs/guides/auth/row-level-security
- Next.js Security: https://nextjs.org/docs/pages/building-your-application/configuring/security
```

---

**ابدأ بالإصلاحات الحرجة الآن! 🔒**
