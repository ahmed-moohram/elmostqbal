# 🔧 **إصلاح مشكلة Vercel - Root Directory**

## **❌ الخطأ:**
```
Error: No Next.js version detected
```

## **✅ الحل السريع:**

### **الخيار 1: تعديل الإعدادات**

1. افتح مشروعك في Vercel
2. **Settings** → **General**
3. **Root Directory:** غيره من `./` إلى `frontend`
4. **Save**
5. **Deployments** → **Redeploy**

### **الخيار 2: مشروع جديد**

1. **Delete Project** (من Settings)
2. **New Project**
3. عند الإعدادات:
   ```
   Framework Preset: Next.js
   Root Directory: frontend  ← اكتب هذا
   ```
4. **Deploy**

---

## **📁 تأكد من هيكل المشروع:**

المشروع الصحيح:
```
github.com/mohraamahmed/test/
├── frontend/              ← Root Directory
│   ├── package.json       ← يحتوي "next"
│   ├── next.config.js
│   ├── src/
│   │   └── app/
│   └── public/
├── backend/
├── sql/
└── README.md
```

---

## **⚠️ أخطاء شائعة:**

| الخطأ | السبب | الحل |
|-------|-------|------|
| No Next.js detected | Root Directory خطأ | غيره لـ `frontend` |
| Build failed | Framework خطأ | غيره لـ `Next.js` |
| Module not found | Dependencies ناقصة | تأكد من package.json |

---

## **📋 Checklist:**

- [ ] Root Directory = `frontend`
- [ ] Framework = `Next.js`
- [ ] package.json موجود في `frontend/`
- [ ] next موجود في dependencies

---

## **🎯 النتيجة المتوقعة:**

بعد الإصلاح:
```
✅ Installing dependencies
✅ Building application
✅ Generating static pages
✅ Deployed successfully!

رابط: https://test.vercel.app
```
