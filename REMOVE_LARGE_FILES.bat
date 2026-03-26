@echo off
chcp 65001 > nul
title حذف الملفات الكبيرة
color 0E

echo ==========================================
echo       حذف الملفات الكبيرة من المشروع
echo ==========================================
echo.
echo ⚠️  سيتم حذف ملف الفيديو الكبير:
echo    md/2025-05-13 22-42-51.mp4 (283.94 MB)
echo.
echo هذا لن يحذف الملف من جهازك، فقط من Git
echo.
pause

powershell.exe -ExecutionPolicy Bypass -File remove-large-files.ps1

pause
