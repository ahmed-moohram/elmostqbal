@echo off
chcp 65001 > nul
title Copy Frontend and Upload
color 0A

echo ==========================================
echo    Copy Frontend to New Location
echo ==========================================
echo.

echo Copying frontend folder (excluding .git, node_modules, .next)...
robocopy "D:\2\معتصم\frontend" "D:\almostkbal" /E /XD .git node_modules .next /NFL /NDL /NJH /NJS /nc /ns /np

echo.
echo Done! Now uploading to GitHub...
cd /d D:\almostkbal

echo.
echo Removing old .git...
rmdir /s /q .git 2>nul

echo.
echo Initializing Git...
git init

echo.
echo Adding files...
git add .

echo.
echo Committing...
git commit -m "Frontend: Educational Platform"

echo.
echo Adding remote...
git remote add origin https://github.com/mohraamahmed/almostkbal.git

echo.
echo Pushing to GitHub...
git branch -M main
git push -u origin main

echo.
echo ==========================================
echo Success! Frontend uploaded from D:\almostkbal
echo GitHub: https://github.com/mohraamahmed/almostkbal
echo ==========================================
pause
