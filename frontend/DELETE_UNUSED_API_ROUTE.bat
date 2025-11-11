@echo off
chcp 65001 >nul
echo ==========================================
echo 🗑️ حذف API Route غير المستخدم
echo ==========================================
echo.

cd /d "%~dp0"

echo [1] حذف /api/auth/login...
echo.

rmdir /S /Q "src\app\api\auth\login" 2>nul && echo ✅ تم حذف src\app\api\auth\login

echo.
echo ==========================================
echo ✅ تم الحذف بنجاح!
echo ==========================================
echo.
echo 💡 تم حذف API route غير مستخدم:
echo    - /api/auth/login (غير مستخدم في الكود)
echo.
echo 💡 تم الإبقاء على:
echo    - /api/auth/register (مستخدم في AuthContext)
echo.
pause
