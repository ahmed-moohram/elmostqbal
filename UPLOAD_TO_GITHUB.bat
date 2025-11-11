@echo off
chcp 65001 > nul
title رفع المشروع على GitHub
color 0B

echo ==========================================
echo         رفع المشروع على GitHub
echo ==========================================
echo.

REM تشغيل PowerShell Script
powershell.exe -ExecutionPolicy Bypass -File upload-to-github.ps1

pause
