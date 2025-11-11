# 🖥️ **أوامر Terminal لرفع المشروع على GitHub**

## **📋 الأوامر الأساسية (انسخ والصق بالترتيب):**

```bash
# 1. افتح Terminal/PowerShell في مجلد المشروع
cd D:\2\معتصم

# 2. تهيئة Git
git init

# 3. إضافة كل الملفات
git add .

# 4. عمل Commit
git commit -m "Initial commit: Educational Platform with Real-time Features"

# 5. إضافة GitHub Remote (استبدل USERNAME باسم المستخدم)
git remote add origin https://github.com/USERNAME/educational-platform.git

# 6. رفع المشروع
git branch -M main
git push -u origin main
```

---

## **🔄 أوامر بديلة (في حالة وجود مشاكل):**

### **إذا ظهرت رسالة "remote origin already exists":**
```bash
git remote remove origin
git remote add origin https://github.com/USERNAME/educational-platform.git
git push -u origin main
```

### **إذا ظهرت رسالة "failed to push":**
```bash
git pull origin main --allow-unrelated-histories
git push origin main
```

### **إذا طلب Authentication:**
```bash
# استخدم Personal Access Token بدلاً من كلمة المرور
# Username: اسمك على GitHub
# Password: Personal Access Token (ليس كلمة المرور العادية)
```

---

## **📝 نسخة كاملة للـ Copy/Paste:**

```bash
cd D:\2\معتصم
git init
git add .
git commit -m "feat: Educational Platform with Certificates and Notifications"
git remote add origin https://github.com/YOUR_USERNAME/educational-platform.git
git branch -M main
git push -u origin main
```

---

## **🚀 أوامر متقدمة:**

### **لعرض الحالة:**
```bash
git status
```

### **لعرض الملفات المضافة:**
```bash
git ls-files
```

### **لعرض السجل:**
```bash
git log --oneline
```

### **لحذف ملف من Git (ليس من الجهاز):**
```bash
git rm --cached .env
```

### **لإضافة ملفات محددة:**
```bash
git add frontend/
git add README.md
git add .gitignore
```

### **لعمل Commit بوصف تفصيلي:**
```bash
git commit -m "feat: Add real-time notifications" -m "- Implemented Supabase realtime
- Added notification component
- Created notification hook"
```

---

## **🔐 إنشاء Personal Access Token:**

### **الخطوات:**
1. افتح: https://github.com/settings/tokens
2. اضغط: `Generate new token (classic)`
3. أعطه اسم: `Upload Token`
4. اختر Expiration: `30 days`
5. اختر Scopes:
   - ✅ **repo** (كل الصلاحيات تحته)
6. اضغط: `Generate token`
7. **انسخ التوكن فوراً** (لن يظهر مرة أخرى)

### **استخدام التوكن:**
```bash
# عند طلب المصادقة:
Username: YOUR_GITHUB_USERNAME
Password: ghp_xxxxxxxxxxxxxxxxxxxx  # التوكن وليس كلمة المرور
```

---

## **⚡ سكريبت سريع (كل الأوامر مرة واحدة):**

### **لـ PowerShell:**
```powershell
# احفظ هذا في ملف upload.ps1
$username = Read-Host "Enter GitHub username"
cd D:\2\معتصم
git init
git add .
git commit -m "Initial commit: Educational Platform"
git remote add origin "https://github.com/$username/educational-platform.git"
git branch -M main
git push -u origin main
Write-Host "✅ Done! Check: https://github.com/$username/educational-platform" -ForegroundColor Green
```

### **لـ CMD/Bash:**
```bash
#!/bin/bash
echo "Enter GitHub username:"
read username
cd /d/2/معتصم
git init
git add .
git commit -m "Initial commit: Educational Platform"
git remote add origin "https://github.com/$username/educational-platform.git"
git branch -M main
git push -u origin main
echo "✅ Done! Check: https://github.com/$username/educational-platform"
```

---

## **🛠️ حل المشاكل الشائعة:**

### **"git is not recognized":**
```bash
# Git غير مثبت، حمله من:
https://git-scm.com/download/win
```

### **"Permission denied":**
```bash
# استخدم Personal Access Token
# أو استخدم SSH بدلاً من HTTPS:
git remote set-url origin git@github.com:USERNAME/educational-platform.git
```

### **"Large files detected":**
```bash
# احذف الملفات الكبيرة
git rm --cached frontend/node_modules -r
git rm --cached "*.mp4"
git commit -m "Remove large files"
```

### **"Updates were rejected":**
```bash
# Force push (احذر! سيمسح ما على GitHub)
git push -u origin main --force
```

---

## **📊 الأوامر الأساسية لاستخدام Git يومياً:**

### **رفع تحديث جديد:**
```bash
git add .
git commit -m "وصف التحديث"
git push
```

### **جلب التحديثات من GitHub:**
```bash
git pull
```

### **إنشاء Branch جديد:**
```bash
git checkout -b feature/new-feature
```

### **الرجوع لـ main:**
```bash
git checkout main
```

### **دمج Branch:**
```bash
git merge feature/new-feature
```

---

## **🎯 الخلاصة السريعة:**

**انسخ هذا واستبدل USERNAME فقط:**

```bash
cd D:\2\معتصم && git init && git add . && git commit -m "Initial commit" && git remote add origin https://github.com/USERNAME/educational-platform.git && git branch -M main && git push -u origin main
```

**كل شيء في سطر واحد!** 🚀
