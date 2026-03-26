@echo off
chcp 65001 >nul
echo ==========================================
echo 🗑️ حذف الملفات المكررة
echo ==========================================
echo.

cd /d "%~dp0"

echo [1] حذف الملفات...
echo.

del /F "src\app\admin\page.tsx.clean" 2>nul && echo ✅ حذف page.tsx.clean
del /F "src\app\admin\page.tsx.final" 2>nul && echo ✅ حذف page.tsx.final
del /F "src\app\admin\page.tsx.new" 2>nul && echo ✅ حذف admin page.tsx.new
del /F "src\app\courses\[id]\page.tsx.new" 2>nul && echo ✅ حذف courses page.tsx.new
del /F "src\app\courses\[id]\page.tsx.temp" 2>nul && echo ✅ حذف page.tsx.temp
del /F "src\app\courses\[id]\page.tsx.fixed" 2>nul && echo ✅ حذف page.tsx.fixed
del /F "src\app\courses\[id]\page_fixed.tsx" 2>nul && echo ✅ حذف page_fixed.tsx
del /F "src\app\courses\[id]\payment\page_fixed.tsx" 2>nul && echo ✅ حذف payment page_fixed.tsx
del /F "src\app\register\page_original.tsx" 2>nul && echo ✅ حذف page_original.tsx
del /F "src\app\register\page_with_eye.tsx" 2>nul && echo ✅ حذف page_with_eye.tsx
del /F "src\components\NightSkyEffect.tsx.new" 2>nul && echo ✅ حذف NightSkyEffect.tsx.new
del /F "src\components\admin\AdvancedDashboard.tsx.fixed" 2>nul && echo ✅ حذف AdvancedDashboard.tsx.fixed

echo.
echo ==========================================
echo ✅ تم حذف جميع الملفات المكررة!
echo ==========================================
echo.

echo [2] تحقق من git status...
git status

echo.
echo ==========================================
echo 💡 لتأكيد التغييرات:
echo    git add .
echo    git commit -m "Remove duplicate files"
echo ==========================================
echo.
pause
