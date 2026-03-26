# 🔑 **إعداد Environment Variables في Vercel**

---

## ❌ **المشكلة:**
```
Invalid API key
→ Vercel لا يملك الـ Supabase Keys
→ يستخدم القيم الافتراضية القديمة
```

---

## ✅ **الحل (3 دقائق):**

### **الخطوة 1: افتح إعدادات المشروع**

```
1. اذهب إلى: https://vercel.com
2. سجل دخول
3. اختر مشروعك: almostkbal
4. اضغط Settings (في الأعلى)
```

---

### **الخطوة 2: أضف Environment Variables**

```
Settings → Environment Variables
→ اضغط "Add New"
```

---

### **الخطوة 3: أضف هذه المتغيرات:**

#### **المتغير 1: NEXT_PUBLIC_SUPABASE_URL**
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://wnqifmvgvlmxgswhcwnc.supabase.co
Environment: Production, Preview, Development (اختر الكل)
```

#### **المتغير 2: NEXT_PUBLIC_SUPABASE_ANON_KEY**
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWlmbXZndmxteGdzd2hjd25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MzYwNTUsImV4cCI6MjA3ODAxMjA1NX0.LqWhTZYmr7nu-dIy2uBBqntOxoWM-waluYIR9bipC9M
Environment: Production, Preview, Development (اختر الكل)
```

#### **المتغير 3: SUPABASE_SERVICE_ROLE_KEY**
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWlmbXZndmxteGdzd2hjd25jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDgxMzI3MiwiZXhwIjoyMDQ2Mzg5MjcyfQ.UJa6LivB3H79x95cU8Y7Kt6YJqEpZNNCQ-Y7Hfcwxls
Environment: Production, Preview, Development (اختر الكل)
```

---

### **الخطوة 4: أعد نشر المشروع**

بعد إضافة المتغيرات:

```
1. Deployments → اختر آخر deployment
2. اضغط ... (ثلاث نقاط)
3. اضغط "Redeploy"
4. أو:
   - Deployments → اضغط "Redeploy" مباشرة
```

---

## 📸 **الشرح بالصور:**

### **1. Settings → Environment Variables:**
```
┌─────────────────────────────────────┐
│ Settings                            │
│ ├─ General                          │
│ ├─ Domains                          │
│ ├─ Environment Variables ← هنا     │
│ ├─ Git                              │
│ └─ Advanced                         │
└─────────────────────────────────────┘
```

### **2. Add New:**
```
┌─────────────────────────────────────┐
│ Environment Variables               │
│                                     │
│ [+ Add New] ← اضغط هنا              │
└─────────────────────────────────────┘
```

### **3. أدخل القيم:**
```
┌─────────────────────────────────────┐
│ Key: NEXT_PUBLIC_SUPABASE_URL      │
│ Value: https://wnq...              │
│ Environments:                       │
│ ☑ Production                       │
│ ☑ Preview                          │
│ ☑ Development                      │
│                                     │
│ [Add] ← اضغط                       │
└─────────────────────────────────────┘
```

---

## 🎯 **المتغيرات المطلوبة (ملخص):**

| المتغير | القيمة | ضروري |
|---------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://wnqifmvgvlmxgswhcwnc.supabase.co | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | eyJhbGc... (الـ key الطويل) | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJhbGc... (service role key) | ✅ |

---

## ⚡ **بعد الإضافة:**

```
1. Save
2. Redeploy
3. انتظر 2-3 دقائق
4. افتح الموقع
5. جرب التسجيل → سيعمل! ✅
```

---

## 🔍 **تحقق من النجاح:**

```
1. افتح موقعك
2. افتح Console في المتصفح (F12)
3. اذهب لصفحة التسجيل
4. لو لم يظهر "Invalid API key" = نجح! ✅
```

---

## 💡 **ملاحظات مهمة:**

```
✅ اختر Production + Preview + Development
✅ احفظ بعد كل متغير
✅ أعد النشر بعد الانتهاء
✅ انتظر انتهاء البناء قبل الاختبار
```

---

## 🚀 **الخطوات السريعة:**

```
1. vercel.com → المشروع
2. Settings → Environment Variables
3. أضف 3 متغيرات (أعلاه)
4. Deployments → Redeploy
5. انتظر 3 دقائق
6. اختبر التسجيل ✅
```

---

**⏱️ 3 دقائق = المشكلة محلولة!**
