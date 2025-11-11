@echo off
chcp 65001 > nul
title رفع Frontend فقط
color 0A

echo ==========================================
echo       رفع مجلد Frontend فقط على GitHub
echo ==========================================
echo.

set /p reponame="ادخل اسم Repository (اتركه فارغ لـ educational-platform): "
if "%reponame%"=="" set reponame=educational-platform

echo.
cd /d D:\2\معتصم\frontend

echo 🔧 تهيئة Git في مجلد frontend...
git init

echo.
echo 📝 إضافة الملفات...
git add .

echo.
echo 💾 عمل Commit...
git commit -m "Frontend: Educational Platform with Real-time Features"

echo.
echo 🔗 إضافة GitHub...
git remote add origin https://github.com/mohraamahmed/%reponame%.git

echo.
echo 🚀 رفع Frontend...
git branch -M main
git push -u origin main

echo.
echo ==========================================
echo ✅ تم رفع Frontend بنجاح!
echo 🔗 الرابط: https://github.com/mohraamahmed/%reponame%
echo.
echo 📌 الآن افتح Vercel واستورد هذا Repository
echo    لن تحتاج تحديد Root Directory!
echo ==========================================
pause
