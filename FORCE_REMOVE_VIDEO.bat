@echo off
chcp 65001 > nul
title حذف الملف الكبير نهائياً
color 0C

echo ==========================================
echo     حذف ملف الفيديو من كل تاريخ Git
echo ==========================================
echo.
echo ⚠️  تحذير: سيتم حذف الملف من كل التاريخ
echo    الملف: md/2025-05-13 22-42-51.mp4
echo.
pause

echo.
echo 🗑️ حذف الملف من التاريخ...
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch 'md/2025-05-13 22-42-51.mp4'" --prune-empty --tag-name-filter cat -- --all

echo.
echo 🗑️ حذف مجلد md كامل...
git filter-branch --force --index-filter "git rm -r --cached --ignore-unmatch md/" --prune-empty --tag-name-filter cat -- --all

echo.
echo 🚀 رفع المشروع بقوة...
git push origin main --force

echo.
echo ==========================================
echo ✅ تم حذف الملف ورفع المشروع!
echo ==========================================
pause
