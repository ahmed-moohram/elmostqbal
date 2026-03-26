# 🔗 **دليل الربط الكامل بقاعدة البيانات**

**تاريخ التحديث:** 2024-11-09  
**الحالة:** جاهز للتطبيق ✅

---

## 📋 **جدول المحتويات**
1. [نظرة عامة](#نظرة-عامة)
2. [الملفات المُنشأة](#الملفات-المنشأة)
3. [خطوات التطبيق](#خطوات-التطبيق)
4. [كيفية الاستخدام](#كيفية-الاستخدام)
5. [API Endpoints](#api-endpoints)
6. [أمثلة عملية](#أمثلة-عملية)

---

## 1️⃣ **نظرة عامة**

تم إنشاء نظام ربط كامل بين المنصة التعليمية وقاعدة البيانات يشمل:

### **الميزات المُضافة:**
✅ **الأمان (Security)**
- تشفير bcrypt للكلمات المرور
- Rate Limiting للحماية من DDoS
- CSRF Protection
- حماية من SQL Injection و XSS
- نظام جلسات آمن

✅ **الأداء (Performance)**
- نظام كاش متطور
- تتبع أداء الصفحات
- مراقبة استخدام الموارد
- تحليلات API

✅ **المراقبة (Monitoring)**
- Dashboard مراقبة real-time
- سجلات أمنية شاملة
- تتبع الأخطاء
- إحصائيات مفصلة

---

## 2️⃣ **الملفات المُنشأة**

### **أ) ملفات SQL (3 ملفات)**
```
📁 D:\2\معتصم\
├── 📄 fixed_database_schema.sql         # الجداول الأساسية
├── 📄 security_performance_tables.sql   # جداول الأمان والأداء
└── 📄 setup-database-complete.sql       # كل شيء مدمج (استخدم هذا)
```

### **ب) ملفات TypeScript (5 ملفات)**
```
📁 frontend\src\
├── 📁 lib\database\
│   └── 📄 security-db.ts               # دوال قاعدة البيانات
├── 📁 types\
│   └── 📄 security-database.types.ts   # تعريف الأنواع
├── 📁 hooks\
│   └── 📄 useSecurityMonitoring.ts     # React Hooks
└── 📄 middleware.ts                     # حماية الطلبات
```

### **ج) API Routes (4 ملفات)**
```
📁 frontend\src\pages\api\
├── 📁 security\
│   ├── 📄 logs.ts                      # سجلات الأمان
│   └── 📄 rate-limit.ts                # معدل الطلبات
├── 📁 payments\
│   └── 📄 request.ts                   # طلبات الدفع
└── 📁 monitoring\
    ├── 📄 metrics.ts                   # المقاييس
    └── 📄 performance.ts               # الأداء
```

### **د) صفحات الإدارة (3 صفحات)**
```
📁 frontend\src\app\admin\
├── 📄 security\page.tsx                # إعدادات الأمان
├── 📄 monitoring\page.tsx               # لوحة المراقبة
└── 📄 payments\page.tsx                 # إدارة المدفوعات
```

---

## 3️⃣ **خطوات التطبيق**

### **الخطوة 1: تطبيق الجداول في Supabase**

```bash
# 1. افتح Supabase Dashboard
https://app.supabase.com/project/wnqifmvgvlmxgswhcwnc

# 2. اذهب إلى SQL Editor

# 3. انسخ محتوى الملف:
setup-database-complete.sql

# 4. الصقه في SQL Editor واضغط Run

# 5. يجب أن تظهر رسالة:
✅ تم إنشاء جميع جداول الأمان والأداء بنجاح! (10 جداول)
```

### **الخطوة 2: تثبيت الحزم المطلوبة**

```bash
cd D:\2\معتصم\frontend

# تثبيت حزم الأمان والأداء
npm install bcryptjs chart.js react-chartjs-2 helmet jsonwebtoken csrf

# أو استخدم الـ batch file
./install-security-packages.bat
```

### **الخطوة 3: تحديث متغيرات البيئة**

```bash
# في .env.local
NEXT_PUBLIC_SUPABASE_URL=https://wnqifmvgvlmxgswhcwnc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your-secret-key-here
ENCRYPTION_KEY=your-encryption-key
```

---

## 4️⃣ **كيفية الاستخدام**

### **أ) في React Components:**

```typescript
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';

export default function MyComponent() {
  const { security, payments, metrics, rateLimit } = useSecurityMonitoring();

  // استخدام السجلات الأمنية
  useEffect(() => {
    security.logEvent('login_attempt', 'low', { 
      user: 'test@example.com' 
    });
  }, []);

  // إنشاء طلب دفع
  const handlePayment = async () => {
    await payments.createRequest({
      studentName: 'أحمد محمد',
      studentPhone: '01012345678',
      courseName: 'دورة البرمجة',
      amount: 299,
      vodafoneNumber: '01098765432'
    });
  };

  return (
    <div>
      {/* عرض السجلات */}
      {security.logs.map(log => (
        <div key={log.id}>{log.event_type}</div>
      ))}
      
      {/* عرض المقاييس */}
      <div>CPU: {metrics.cpu}%</div>
      <div>Memory: {metrics.memory}%</div>
      
      {/* حالة Rate Limit */}
      <div>الطلبات المتبقية: {rateLimit.status?.remaining}</div>
    </div>
  );
}
```

### **ب) استدعاء API مباشرة:**

```javascript
// تسجيل حدث أمني
fetch('/api/security/logs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventType: 'suspicious_activity',
    severity: 'high',
    details: { ip: '192.168.1.1', action: 'SQL injection attempt' }
  })
});

// إنشاء طلب دفع
fetch('/api/payments/request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    studentName: 'سارة أحمد',
    studentPhone: '01123456789',
    courseName: 'دورة التصميم',
    amount: 199,
    vodafoneNumber: '01098765432'
  })
});

// تتبع الأداء
fetch('/api/monitoring/performance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pagePath: '/courses',
    loadTime: 1500,
    fcp: 800,
    lcp: 1200
  })
});
```

---

## 5️⃣ **API Endpoints**

### **Security APIs**

| Endpoint | Method | الوصف |
|----------|--------|-------|
| `/api/security/logs` | GET | جلب السجلات الأمنية |
| `/api/security/logs` | POST | تسجيل حدث أمني |
| `/api/security/rate-limit` | GET | فحص حالة Rate Limit |

### **Payment APIs**

| Endpoint | Method | الوصف |
|----------|--------|-------|
| `/api/payments/request` | GET | جلب طلبات الدفع |
| `/api/payments/request` | POST | إنشاء طلب دفع |
| `/api/payments/request` | PUT | الموافقة/رفض طلب |

### **Monitoring APIs**

| Endpoint | Method | الوصف |
|----------|--------|-------|
| `/api/monitoring/metrics` | GET | جلب المقاييس |
| `/api/monitoring/metrics` | POST | تسجيل مقياس |
| `/api/monitoring/performance` | POST | تتبع أداء صفحة |

---

## 6️⃣ **أمثلة عملية**

### **مثال 1: صفحة تسجيل دخول آمنة**

```typescript
import { hashPassword, verifyPassword } from '@/lib/security/password-utils';
import { checkRateLimit } from '@/lib/database/security-db';
import { logSecurityEvent } from '@/lib/database/security-db';

async function handleLogin(email: string, password: string) {
  // فحص Rate Limit
  const { allowed } = await checkRateLimit(
    email, 
    '/login', 
    5,  // 5 محاولات
    15  // خلال 15 دقيقة
  );
  
  if (!allowed) {
    await logSecurityEvent('rate_limit', 'medium', { email }, null, true);
    throw new Error('Too many login attempts');
  }
  
  // جلب المستخدم
  const user = await getUserByEmail(email);
  
  if (!user) {
    await logSecurityEvent('login_attempt', 'low', { 
      email, 
      success: false,
      reason: 'User not found' 
    });
    throw new Error('Invalid credentials');
  }
  
  // التحقق من كلمة المرور
  const isValid = await verifyPassword(password, user.password);
  
  if (!isValid) {
    await logSecurityEvent('login_attempt', 'medium', { 
      email, 
      success: false,
      reason: 'Wrong password' 
    });
    throw new Error('Invalid credentials');
  }
  
  // تسجيل دخول ناجح
  await logSecurityEvent('login_attempt', 'low', { 
    email, 
    success: true 
  }, user.id);
  
  return user;
}
```

### **مثال 2: معالجة دفعة فودافون كاش**

```typescript
import { createPaymentRequest, approvePaymentRequest } from '@/lib/database/security-db';

// الطالب يرسل طلب
async function submitPayment(courseId: string) {
  const request = await createPaymentRequest({
    studentId: currentUser.id,
    courseId,
    studentName: currentUser.name,
    studentPhone: currentUser.phone,
    courseName: 'دورة JavaScript',
    amount: 299,
    vodafoneNumber: '01098765432',
    whatsappMessage: `
      تم التحويل
      الاسم: ${currentUser.name}
      المبلغ: 299 جنيه
      الكورس: دورة JavaScript
    `
  });
  
  // فتح WhatsApp
  window.open(`https://wa.me/201098765432?text=${encodeURIComponent(request.whatsappMessage)}`);
  
  return request;
}

// الأدمن يوافق
async function approvePayment(requestId: string) {
  const result = await approvePaymentRequest(
    requestId,
    currentAdmin.id,
    'تم التحقق من التحويل'
  );
  
  // إرسال إشعار للطالب
  await sendNotification(result.student_id, 'تم تفعيل اشتراكك!');
  
  return result;
}
```

### **مثال 3: Dashboard مراقبة**

```typescript
import { useSystemMetrics } from '@/hooks/useSecurityMonitoring';
import { Line } from 'react-chartjs-2';

export function MetricsDashboard() {
  const { metrics, history, recordMetric } = useSystemMetrics(true);
  
  // تسجيل مقاييس دورية
  useEffect(() => {
    const interval = setInterval(async () => {
      // جمع البيانات
      const cpuUsage = await getCPUUsage();
      const memoryUsage = await getMemoryUsage();
      
      // تسجيلها
      await recordMetric('cpu', cpuUsage, 'percentage');
      await recordMetric('memory', memoryUsage, 'percentage');
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // بيانات الرسم البياني
  const chartData = {
    labels: history.map(h => new Date(h.recorded_at).toLocaleTimeString()),
    datasets: [
      {
        label: 'CPU Usage',
        data: history.filter(h => h.metric_type === 'cpu').map(h => h.value),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)'
      }
    ]
  };
  
  return (
    <div className="dashboard">
      <h1>System Metrics</h1>
      
      {/* المقاييس الحالية */}
      <div className="metrics-grid">
        <div>CPU: {metrics.cpu?.toFixed(1)}%</div>
        <div>Memory: {metrics.memory?.toFixed(1)}%</div>
        <div>API Requests: {metrics.api_requests}</div>
        <div>Errors: {metrics.api_errors}</div>
      </div>
      
      {/* الرسم البياني */}
      <Line data={chartData} />
    </div>
  );
}
```

---

## 🎯 **الخلاصة**

**تم إنشاء نظام ربط كامل ومتطور يشمل:**

| المكون | الحالة | الوظيفة |
|--------|---------|---------|
| **قاعدة البيانات** | ✅ جاهزة | 10 جداول جديدة |
| **API Routes** | ✅ جاهزة | 5 endpoints |
| **React Hooks** | ✅ جاهزة | 5 hooks مخصصة |
| **Middleware** | ✅ جاهز | حماية شاملة |
| **TypeScript Types** | ✅ جاهزة | أنواع محددة |
| **صفحات الإدارة** | ✅ جاهزة | 3 صفحات |

**الخطوة الوحيدة المتبقية:** تطبيق ملف `setup-database-complete.sql` في Supabase SQL Editor!

---

**تم بواسطة:** AI Assistant  
**التاريخ:** 2024-11-09  
**الحالة:** ✅ جاهز للإطلاق
