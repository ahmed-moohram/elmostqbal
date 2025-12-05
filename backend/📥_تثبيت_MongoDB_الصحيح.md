# 📥 تثبيت MongoDB بشكل صحيح

## 🔽 التحميل

### الرابط الرسمي:
https://www.mongodb.com/try/download/community

### الإعدادات المطلوبة:
- **Version:** 6.0.x أو أحدث
- **Platform:** Windows
- **Package:** MSI

---

## 📦 خطوات التثبيت

### 1. شغل المُثبت
- انقر نقراً مزدوجاً على `.msi`
- اختر **"Complete"** installation

### 2. إعدادات Service
✅ **مهم جداً:**
- ☑️ **Install MongoDB as a Service**
- ☑️ **Run service as Network Service user**

### 3. MongoDB Compass (اختياري)
- يمكنك تثبيته (برنامج GUI لرؤية البيانات)
- أو تخطيه

### 4. أكمل التثبيت
- اضغط **Next** → **Install**
- انتظر حتى ينتهي

---

## ✅ التحقق من التثبيت

### افتح PowerShell كـ Administrator:

```powershell
# تحقق من MongoDB Service
Get-Service MongoDB

# يجب أن يكون:
# Status: Running ✅
```

### إذا كان متوقف:
```powershell
Start-Service MongoDB
```

---

## 🧪 اختبار الاتصال

### 1. افتح MongoDB Shell:
```powershell
mongosh
```

### 2. يجب أن تشاهد:
```
Current Mongosh Log ID: ...
Connecting to: mongodb://127.0.0.1:27017/
MongoDB server version: 6.0.x
```

### 3. جرب أوامر:
```javascript
show dbs
use edufutura
db.test.insertOne({ name: "test" })
db.test.find()
```

---

## 🔧 إعداد Backend

### 1. تأكد من ملف .env:
```env
MONGODB_URI=mongodb://localhost:27017/edufutura
PORT=5000
JWT_SECRET=your-secret-key-here
```

### 2. شغل Backend:
```bash
cd backend
npm run dev
```

### 3. يجب أن تشاهد:
```
✅ Connected to MongoDB
🚀 Server running on port 5000
```

---

## 🐛 إذا واجهت مشاكل

### مشكلة: Service لا يبدأ
**الحل:**
```powershell
# كـ Administrator
sc delete MongoDB
# ثم أعد التثبيت
```

### مشكلة: Port 27017 مستخدم
**الحل:**
```powershell
# اعثر على العملية
netstat -ano | findstr :27017

# أوقفها
taskkill /PID <PID_NUMBER> /F
```

### مشكلة: مجلد Data معطوب
**الحل:**
```powershell
# احذف مجلد Data (سيُنشأ من جديد)
Remove-Item -Path "C:\Program Files\MongoDB\Server\6.0\data" -Recurse -Force
```

---

## 📊 مسارات مهمة

بعد التثبيت:
```
MongoDB:
C:\Program Files\MongoDB\Server\6.0\

Data:
C:\Program Files\MongoDB\Server\6.0\data\

Logs:
C:\Program Files\MongoDB\Server\6.0\log\

Config:
C:\Program Files\MongoDB\Server\6.0\bin\mongod.cfg
```

---

## ⚡ نصيحة: MongoDB Atlas

إذا استمرت المشاكل، استخدم **MongoDB Atlas** (Cloud):
- ✅ لا تثبيت
- ✅ لا مشاكل صلاحيات
- ✅ مجاني
- ✅ 5 دقائق فقط

راجع ملف: `⚡_الحل_السريع.md`

---

## ✅ قائمة التحقق

- [ ] تحميل MongoDB Community
- [ ] تثبيت كـ Service
- [ ] التحقق من Service يعمل
- [ ] اختبار بـ mongosh
- [ ] تحديث .env
- [ ] تشغيل Backend
- [ ] التأكد من الاتصال

---

**الوقت المتوقع: 10-15 دقيقة 🚀**
