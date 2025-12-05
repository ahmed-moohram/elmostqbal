# سكريبت سريع للرفع بعد إنشاء Repository

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   رفع المشروع السريع على GitHub" -ForegroundColor Yellow  
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# السؤال عن اسم المستخدم
$username = Read-Host "ادخل اسم المستخدم على GitHub"
$reponame = Read-Host "ادخل اسم Repository (اتركه فارغ لـ educational-platform)"

if ([string]::IsNullOrWhiteSpace($reponame)) {
    $reponame = "educational-platform"
}

Write-Host ""
Write-Host "🔧 بدء عملية الرفع..." -ForegroundColor Green
Write-Host ""

# تنفيذ الأوامر
Write-Host "📁 تهيئة Git..." -ForegroundColor Cyan
git init

Write-Host ""
Write-Host "📝 إضافة الملفات..." -ForegroundColor Cyan
git add .

Write-Host ""
Write-Host "💾 عمل Commit..." -ForegroundColor Cyan
git commit -m "feat: Educational Platform with Real-time Notifications, Certificates, and PDF Library"

Write-Host ""
Write-Host "🔗 ربط مع GitHub..." -ForegroundColor Cyan
git remote add origin "https://github.com/$username/$reponame.git"

Write-Host ""
Write-Host "🚀 رفع المشروع..." -ForegroundColor Cyan
git branch -M main
git push -u origin main

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "✅ تم! مشروعك الآن على:" -ForegroundColor Green
Write-Host "https://github.com/$username/$reponame" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "اضغط أي مفتاح للخروج..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
