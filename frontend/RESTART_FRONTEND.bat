@echo off
echo ========================================
echo Cleaning and Restarting Frontend
echo ========================================

cd /d "d:\2\معتصم\frontend"

echo Stopping node processes...
taskkill /F /IM node.exe 2>nul

timeout /t 2 /nobreak >nul

echo Cleaning .next folder...
rmdir /s /q .next 2>nul

echo Starting Next.js dev server...
npm run dev

pause
