# =============================================
# PowerShell Script للإعداد السريع للمنصة
# =============================================

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "     إعداد المنصة التعليمية - Quick Setup     " -ForegroundColor Yellow
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# الخطوة 1: إنشاء ملف .env
Write-Host "[1/4] إنشاء ملف البيئة .env..." -ForegroundColor Green

$envContent = @"
# =============================================
# Supabase Configuration
# =============================================
NEXT_PUBLIC_SUPABASE_URL=https://wnqifmvgvlmxgswhcwnc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWlmbXZndmxteGdzd2hjd25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MzYwNTUsImV4cCI6MjA3ODAxMjA1NX0.LqWhTZYmr7nu-dIy2uBBqntOxoWM-waluYIR9bipC9M
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWlmbXZndmxteGdzd2hjd25jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQzNjA1NSwiZXhwIjoyMDc4MDEyMDU1fQ.OlrWLS7bjUqVh7rarNxa3cX9XrV-n-O24aiMvCs5sCU

# =============================================
# Authentication
# =============================================
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2024
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-change-this-in-production-2024

# =============================================
# Database
# =============================================
DATABASE_URL=postgresql://postgres:password@db.wnqifmvgvlmxgswhcwnc.supabase.co:5432/postgres

# =============================================
# API Configuration
# =============================================
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_USE_SUPABASE=true

# =============================================
# Payment Configuration (Vodafone Cash)
# =============================================
NEXT_PUBLIC_VODAFONE_NUMBER=01070333143
NEXT_PUBLIC_VODAFONE_NAME=MR

# =============================================
# Application Settings
# =============================================
NEXT_PUBLIC_APP_NAME=المنصة التعليمية
NEXT_PUBLIC_APP_URL=http://localhost:3000

# =============================================
# Environment
# =============================================
NODE_ENV=development
"@

$envPath = ".\frontend\.env"
$envContent | Out-File -FilePath $envPath -Encoding UTF8
Write-Host "✅ تم إنشاء ملف .env بنجاح" -ForegroundColor Green
Write-Host ""

# الخطوة 2: التحقق من Node.js
Write-Host "[2/4] التحقق من Node.js..." -ForegroundColor Green
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js موجود: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js غير مثبت! قم بتحميله من: https://nodejs.org" -ForegroundColor Red
    Write-Host "اضغط أي مفتاح للخروج..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}
Write-Host ""

# الخطوة 3: تثبيت الحزم
Write-Host "[3/4] تثبيت حزم npm..." -ForegroundColor Green
Set-Location -Path ".\frontend"
Write-Host "جاري التثبيت... (قد يستغرق 2-3 دقائق)" -ForegroundColor Yellow
npm install --silent 2>$null
Write-Host "✅ تم تثبيت الحزم بنجاح" -ForegroundColor Green
Write-Host ""

# الخطوة 4: عرض التعليمات
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "           ✅ الإعداد اكتمل بنجاح!            " -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 الخطوات التالية:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣ افتح Supabase Dashboard:" -ForegroundColor White
Write-Host "   https://app.supabase.com/project/wnqifmvgvlmxgswhcwnc" -ForegroundColor Cyan
Write-Host ""
Write-Host "2️⃣ اذهب إلى SQL Editor ونفذ بالترتيب:" -ForegroundColor White
Write-Host "   • SAFE_USERS_TABLE.sql" -ForegroundColor Gray
Write-Host "   • SAFE_COMPLETE_SETUP.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣ لتشغيل المشروع:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "4️⃣ افتح المتصفح:" -ForegroundColor White
Write-Host "   http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "        🚀 المنصة جاهزة للعمل!              " -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# سؤال المستخدم
$response = Read-Host "هل تريد تشغيل المشروع الآن؟ (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host ""
    Write-Host "🚀 جاري تشغيل المشروع..." -ForegroundColor Green
    Write-Host "افتح المتصفح على: http://localhost:3000" -ForegroundColor Yellow
    Write-Host ""
    npm run dev
} else {
    Write-Host ""
    Write-Host "يمكنك تشغيل المشروع لاحقاً بـ:" -ForegroundColor Yellow
    Write-Host "cd frontend" -ForegroundColor Cyan
    Write-Host "npm run dev" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "اضغط أي مفتاح للخروج..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
