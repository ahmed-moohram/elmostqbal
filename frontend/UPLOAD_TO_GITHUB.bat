@echo off
chcp 65001 > nul
title رفع Frontend على GitHub
color 0B

echo ==========================================
echo       رفع Frontend على GitHub
echo ==========================================
echo.
echo ⚠️  تأكد من إنشاء Repository على GitHub أولاً!
echo 📝 Repository name: almostkbal
echo 👤 Username: mohraamahmed
echo.
echo الرابط: https://github.com/new
echo.
pause

echo.
echo 🗑️ حذف Git القديم...
rmdir /s /q .git 2>nul

echo.
echo 🔧 تهيئة Git جديد...
git init

echo.
echo 📝 إضافة الملفات...
git add .

echo.
echo 💾 عمل Commit...
git commit -m "Frontend: Educational Platform with Real-time Features"

echo.
echo 🔗 إضافة GitHub...
git remote add origin https://github.com/mohraamahmed/almostkbal.git

echo.
echo 🚀 رفع المشروع...
git branch -M main
git push -u origin main

echo.
echo ==========================================
echo ✅ تم رفع Frontend بنجاح!
echo 🔗 https://github.com/mohraamahmed/almostkbal
echo.
echo 📌 الخطوة التالية:
echo    افتح Vercel واستورد almostkbal
echo ==========================================
pause
