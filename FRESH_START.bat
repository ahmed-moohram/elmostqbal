@echo off
chcp 65001 > nul
title بداية جديدة - رفع المشروع
color 0A

echo ==========================================
echo        بداية جديدة لرفع المشروع
echo ==========================================
echo.
echo سيتم:
echo 1. حذف ملفات Git القديمة
echo 2. حذف الملفات الكبيرة
echo 3. إعادة الرفع من الصفر
echo.
pause

cd /d D:\2\معتصم

echo.
echo 🗑️ حذف Git القديم...
rmdir /s /q .git 2>nul

echo.
echo 🗑️ حذف مجلد md (يحتوي الفيديو)...
rmdir /s /q md 2>nul

echo.
echo 🔧 تهيئة Git جديد...
git init

echo.
echo 📝 إضافة الملفات...
git add .

echo.
echo 💾 عمل Commit...
git commit -m "Initial commit - Educational Platform (without large files)"

echo.
echo 🔗 إضافة GitHub...
git remote add origin https://github.com/mohraamahmed/test.git

echo.
echo 🌿 تحويل لـ main...
git branch -M main

echo.
echo 🚀 رفع المشروع...
git push -u origin main --force

echo.
echo ==========================================
echo ✅ تم رفع المشروع بنجاح!
echo ==========================================
pause
