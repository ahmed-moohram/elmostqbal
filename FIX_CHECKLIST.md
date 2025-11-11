# ✅ **قائمة المهام - إصلاح المنصة**

---

## 🔴 **حرجة - افعلها الآن (30 دقيقة):**

### **المهمة 1: أنشئ `.env.local`**
```bash
cd D:\2\معتصم\frontend

# أنشئ الملف
echo NEXT_PUBLIC_SUPABASE_URL=https://wnqifmvgvlmxgswhcwnc.supabase.co > .env.local
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWlmbXZndmxteGdzd2hjd25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MzYwNTUsImV4cCI6MjA3ODAxMjA1NX0.LqWhTZYmr7nu-dIy2uBBqntOxoWM-waluYIR9bipC9M >> .env.local
echo SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWlmbXZndmxteGdzd2hjd25jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDgxMzI3MiwiZXhwIjoyMDQ2Mzg5MjcyfQ.UJa6LivB3H79x95cU8Y7Kt6YJqEpZNNCQ-Y7Hfcwxls >> .env.local
echo JWT_SECRET=your_super_secret_jwt_key_change_in_production >> .env.local

# تحقق
cat .env.local
```
- [ ] تم إنشاء .env.local
- [ ] تحقّقت من المحتوى

---

### **المهمة 2: شغّل SQL في Supabase**
```
1. افتح: https://supabase.com
2. اذهب إلى SQL Editor
3. افتح: ADD_MISSING_COLUMNS_ONLY.sql
4. انسخ المحتوى كاملاً
5. الصق في SQL Editor
6. RUN ✅
```
- [ ] تم تشغيل SQL
- [ ] تحقّقت من إضافة الأعمدة

---

### **المهمة 3: احذف الملفات المكررة**
```bash
cd D:\2\معتصم\frontend\src

# احذف
find . -name "*.clean" -delete
find . -name "*.final" -delete
find . -name "*.new" -delete
find . -name "*.temp" -delete
find . -name "*_fixed.tsx" -delete
find . -name "*_original.tsx" -delete
find . -name "*_with_eye.tsx" -delete

# Windows PowerShell:
Get-ChildItem -Recurse -Include *.clean,*.final,*.new,*.temp,*_fixed.tsx,*_original.tsx,*_with_eye.tsx | Remove-Item
```
- [ ] تم حذف الملفات
- [ ] تحقّقت من git status

---

### **المهمة 4: Push التحديثات**
```bash
cd D:\2\معتصم\frontend

git add .
git commit -m "Add env file, remove duplicates, fix Supabase key"
git push origin main
```
- [ ] تم Push
- [ ] تحقّقت من GitHub

---

### **المهمة 5: أضف Environment Variables في Vercel**
```
1. vercel.com → مشروعك
2. Settings → Environment Variables
3. أضف:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - JWT_SECRET
4. اختر: Production + Preview + Development
5. Save
6. Deployments → Redeploy
```
- [ ] تم إضافة المتغيرات
- [ ] تم Redeploy
- [ ] انتظرت "Ready"

---

## ⚠️ **متوسطة - افعلها هذا الأسبوع (2 ساعة):**

### **المهمة 6: فعّل React Strict Mode**
```javascript
// في next.config.js
reactStrictMode: true, // ✅ غيّر من false
```
- [ ] تم التغيير
- [ ] تم الاختبار

---

### **المهمة 7: قيّد الصور**
```javascript
// في next.config.js
remotePatterns: [
  {
    protocol: 'https',
    hostname: 'wnqifmvgvlmxgswhcwnc.supabase.co',
  },
],
```
- [ ] تم التغيير
- [ ] تم الاختبار

---

### **المهمة 8: احذف API Routes غير المستخدمة**
```bash
rm D:\2\معتصم\frontend\src\app\api\auth\login\route.ts
rm D:\2\معتصم\frontend\src\app\api\auth\register\route.ts
```
**أو** حدّثهم ليستخدموا Supabase
- [ ] تم الحذف/التحديث

---

### **المهمة 9: استخدم Supabase Auth الحقيقي**
```javascript
// في AuthContext.tsx
// بدلاً من:
localStorage.setItem('token', ...);

// استخدم:
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});
```
- [ ] تم التحديث
- [ ] تم الاختبار

---

### **المهمة 10: نظّف console.error**
```javascript
// استبدل console.error بـ:
import logger from '@/lib/logger';
logger.error('Message', error);
```
- [ ] أنشأت logger
- [ ] استبدلت 50% على الأقل

---

## 💡 **تحسينات - الشهر القادم:**

### **المهمة 11: Error Boundary**
```javascript
// أنشئ components/ErrorBoundary.tsx
```
- [ ] تم الإنشاء
- [ ] تم التطبيق

---

### **المهمة 12: Middleware**
```javascript
// أنشئ middleware.ts
```
- [ ] تم الإنشاء
- [ ] تم الاختبار

---

### **المهمة 13: React Query**
```bash
npm install @tanstack/react-query
```
- [ ] تم التثبيت
- [ ] تم التطبيق في صفحة واحدة

---

### **المهمة 14: RLS Policies**
```sql
-- في Supabase SQL Editor
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);
```
- [ ] تم تفعيل RLS
- [ ] تم إنشاء Policies

---

### **المهمة 15: Server Components**
```javascript
// حوّل بعض الصفحات إلى Server Components
// (احذف "use client")
```
- [ ] حوّلت 5 صفحات على الأقل

---

### **المهمة 16: Image Optimization**
```javascript
// راجع كل استخدامات next/image
// أضف width, height, priority
```
- [ ] تم المراجعة
- [ ] تم التحسين

---

### **المهمة 17: Zod Validation**
```bash
npm install zod
```
- [ ] تم التثبيت
- [ ] تم التطبيق في forms

---

### **المهمة 18: Code Splitting**
```javascript
// استخدم dynamic imports للـ components الكبيرة
const AdminPanel = dynamic(() => import('@/components/AdminPanel'));
```
- [ ] تم التطبيق

---

### **المهمة 19: Memoization**
```javascript
// أضف useMemo, useCallback حيث ضروري
```
- [ ] تم المراجعة
- [ ] تم التطبيق

---

### **المهمة 20: TypeScript Types**
```bash
npm install @types/react@18.2.0 --save-dev
```
- [ ] تم التحديث
- [ ] تم حل الـ conflicts

---

## 📊 **التقدم:**

```
الحرجة:    0/5  (0%)
المتوسطة:  0/5  (0%)
التحسينات: 0/10 (0%)

الإجمالي:  0/20 (0%)
```

---

## 🎯 **الهدف:**

```
✅ الأسبوع الأول:  5/5  حرجة
✅ الأسبوع الثاني: 5/5  متوسطة
✅ الشهر الأول:    10/10 تحسينات

النتيجة: منصة احترافية 10/10 🎉
```

---

**ابدأ الآن من المهمة 1!**
