@echo off
chcp 65001 > nul
title رفع المشروع على GitHub
color 0A

echo ==========================================
echo     رفع المشروع على GitHub بالـ Terminal
echo ==========================================
echo.

set /p username="ادخل اسم المستخدم على GitHub: "
echo.

echo 📂 الانتقال لمجلد المشروع...
cd /d D:\2\معتصم
echo.

echo 🔧 تهيئة Git...
git init
echo.

echo 📝 إضافة جميع الملفات...
git add .
echo.

echo 💾 عمل Commit...
git commit -m "feat: Educational Platform with Real-time Notifications and Certificates"
echo.

echo 🔗 ربط مع GitHub...
git remote add origin https://github.com/%username%/educational-platform.git
echo.

echo 🚀 رفع المشروع...
git branch -M main
git push -u origin main
echo.

echo ==========================================
echo ✅ تم رفع المشروع بنجاح!
echo 🔗 الرابط: https://github.com/%username%/educational-platform
echo ==========================================
echo.

pause
