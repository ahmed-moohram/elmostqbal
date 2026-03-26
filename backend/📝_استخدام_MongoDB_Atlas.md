# 🌐 استخدام MongoDB Atlas (Cloud Database)

## لماذا Atlas أفضل؟
- ✅ لا تحتاج تثبيت MongoDB محلياً
- ✅ مجاني للمشاريع الصغيرة
- ✅ لا مشاكل صلاحيات
- ✅ أسرع وأكثر موثوقية

---

## خطوات الإعداد (5 دقائق)

### 1. إنشاء حساب
1. اذهب إلى: https://www.mongodb.com/cloud/atlas/register
2. سجل حساب جديد (مجاني)
3. اختر **"Shared" (Free)**

### 2. إنشاء Cluster
1. اضغط **"Build a Database"**
2. اختر **"M0 Sandbox (FREE)"**
3. اختر **Region قريب منك**
4. اضغط **"Create"**

### 3. إنشاء Database User
1. اضغط **"Database Access"** من القائمة اليسرى
2. اضغط **"Add New Database User"**
3. اختر:
   - Username: `admin`
   - Password: **انسخه واحفظه!**
4. اضغط **"Add User"**

### 4. السماح بالوصول
1. اضغط **"Network Access"** من القائمة
2. اضغط **"Add IP Address"**
3. اضغط **"Allow Access from Anywhere"** (0.0.0.0/0)
4. اضغط **"Confirm"**

### 5. الحصول على Connection String
1. اضغط **"Database"** من القائمة
2. اضغط **"Connect"** على الـ Cluster
3. اختر **"Connect your application"**
4. انسخ الـ **Connection String**

سيكون شكله:
```
mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### 6. تحديث .env
افتح ملف `.env` في مجلد `backend` وعدّل:

```env
MONGODB_URI=mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/edufutura?retryWrites=true&w=majority
```

**ملاحظة:** استبدل:
- `YOUR_PASSWORD` بكلمة المرور الحقيقية
- `xxxxx` بالـ cluster الخاص بك

---

## ✅ انتهى!

الآن:
```bash
cd backend
npm run dev
```

**سيعمل بدون مشاكل! 🎉**
