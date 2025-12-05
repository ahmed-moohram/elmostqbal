# 📤 **دليل رفع المشروع على GitHub**

## **1️⃣ إنشاء Repository جديد على GitHub**

1. افتح [GitHub.com](https://github.com)
2. اضغط على **"New repository"** أو **"+"**
3. املأ البيانات:
   - **Repository name:** `educational-platform`
   - **Description:** منصة تعليمية متكاملة مع نظام الدفع والشهادات
   - **Public/Private:** اختر حسب رغبتك
   - **لا تختر** "Initialize this repository with a README" (لأن لدينا README)
4. اضغط **"Create repository"**

---

## **2️⃣ تجهيز المشروع للرفع**

### **تأكد من وجود هذه الملفات:**
✅ `.gitignore` - لإخفاء الملفات الحساسة  
✅ `README.md` - شرح المشروع  
✅ `LICENSE` - رخصة المشروع  
✅ `.env.example` - مثال لمتغيرات البيئة  

### **تأكد من عدم وجود:**
❌ `.env` أو `.env.local` - **مهم جداً!**  
❌ `node_modules/` - محجوب بواسطة `.gitignore`  
❌ أي مفاتيح API حقيقية  

---

## **3️⃣ أوامر Git للرفع**

افتح **PowerShell** أو **Git Bash** في مجلد المشروع:

```bash
# 1. تهيئة Git (إذا لم يكن مهيئ)
git init

# 2. إضافة الملفات
git add .

# 3. عمل Commit
git commit -m "Initial commit: Educational Platform with Real-time Features"

# 4. إضافة Remote (استبدل USERNAME باسم المستخدم)
git remote add origin https://github.com/USERNAME/educational-platform.git

# 5. رفع المشروع
git branch -M main
git push -u origin main
```

---

## **4️⃣ في حالة وجود مشاكل**

### **مشكلة: fatal: remote origin already exists**
```bash
git remote remove origin
git remote add origin https://github.com/USERNAME/educational-platform.git
```

### **مشكلة: رفض Push**
```bash
git pull origin main --allow-unrelated-histories
git push origin main
```

### **مشكلة: ملفات كبيرة**
```bash
# استخدم Git LFS للملفات الكبيرة
git lfs track "*.pdf"
git lfs track "*.mp4"
git add .gitattributes
```

---

## **5️⃣ حماية البيانات الحساسة**

### **قبل الرفع، تأكد من:**

1. **فحص الملفات المرفوعة:**
```bash
git status
```

2. **التأكد من عدم وجود .env:**
```bash
git ls-files | grep -E "\.env"
```

3. **إذا وجدت ملفات حساسة:**
```bash
git rm --cached .env
git rm --cached .env.local
git commit -m "Remove sensitive files"
```

---

## **6️⃣ إضافة Secrets في GitHub**

1. اذهب إلى **Settings** في Repository
2. اختر **Secrets and variables** > **Actions**
3. أضف المتغيرات:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `DATABASE_URL`

---

## **7️⃣ إعداد GitHub Pages (اختياري)**

1. اذهب إلى **Settings** > **Pages**
2. اختر **Source:** Deploy from a branch
3. اختر **Branch:** main
4. اختر **Folder:** /docs أو /root
5. احفظ

---

## **8️⃣ إضافة الـ Badges للـ README**

أضف هذه الـ badges في بداية README.md:

```markdown
![GitHub stars](https://img.shields.io/github/stars/USERNAME/educational-platform)
![GitHub forks](https://img.shields.io/github/forks/USERNAME/educational-platform)
![GitHub issues](https://img.shields.io/github/issues/USERNAME/educational-platform)
![GitHub license](https://img.shields.io/github/license/USERNAME/educational-platform)
```

---

## **9️⃣ نصائح مهمة**

### **📌 قبل كل Push:**
1. احذف ملفات `.env`
2. احذف `node_modules` (سيتم تثبيتها تلقائياً)
3. تأكد من عدم وجود بيانات حساسة

### **📌 استخدم Branches:**
```bash
# إنشاء branch جديد للمميزات
git checkout -b feature/new-feature

# العمل والـ commit
git add .
git commit -m "Add new feature"

# الدمج مع main
git checkout main
git merge feature/new-feature
```

### **📌 الـ Commit Messages الجيدة:**
- ✅ `feat: Add real-time notifications`
- ✅ `fix: Resolve payment integration issue`
- ✅ `docs: Update README with new features`
- ❌ `updated files`
- ❌ `fix`

---

## **🎉 مبروك!**

الآن مشروعك مرفوع على GitHub ويمكن:
- مشاركته مع الآخرين
- العمل عليه من أي مكان
- استقبال مساهمات
- عرضه في Portfolio

---

## **🔗 روابط مفيدة**

- [GitHub Docs](https://docs.github.com)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- [GitHub Desktop](https://desktop.github.com) - واجهة رسومية
- [GitKraken](https://www.gitkraken.com) - واجهة احترافية

---

**تم إعداد الدليل بواسطة:** Cascade AI  
**التاريخ:** 2024-11-09
