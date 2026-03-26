# ========================================
# سكريبت رفع المشروع على GitHub
# ========================================

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "       رفع المشروع على GitHub            " -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# التحقق من وجود Git
$gitInstalled = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitInstalled) {
    Write-Host "❌ Git غير مثبت على جهازك!" -ForegroundColor Red
    Write-Host "📥 يرجى تحميل Git من: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# التحقق من وجود .env وحذفه
$envFiles = @(".env", ".env.local", "frontend\.env", "frontend\.env.local")
foreach ($envFile in $envFiles) {
    if (Test-Path $envFile) {
        Write-Host "⚠️  تم العثور على $envFile - سيتم حذفه من Git" -ForegroundColor Yellow
        git rm --cached $envFile -f 2>$null
    }
}

# التحقق من تهيئة Git
if (-not (Test-Path ".git")) {
    Write-Host "📝 تهيئة Git repository..." -ForegroundColor Cyan
    git init
    Write-Host "✅ تم تهيئة Git" -ForegroundColor Green
}

# إضافة الملفات
Write-Host ""
Write-Host "📂 إضافة الملفات..." -ForegroundColor Cyan
git add .

# عرض الملفات المضافة
Write-Host ""
Write-Host "📋 الملفات التي سيتم رفعها:" -ForegroundColor Yellow
git status --short

# التحقق من الملفات الحساسة
Write-Host ""
Write-Host "🔍 فحص الملفات الحساسة..." -ForegroundColor Cyan
$sensitiveFiles = git ls-files | Select-String -Pattern "(\.env|\.env\.local|secret|password|key\.json)"
if ($sensitiveFiles) {
    Write-Host "⚠️  تحذير: تم العثور على ملفات قد تحتوي بيانات حساسة:" -ForegroundColor Red
    $sensitiveFiles | ForEach-Object { Write-Host "   - $_" -ForegroundColor Yellow }
    
    $continue = Read-Host "هل تريد المتابعة؟ (y/n)"
    if ($continue -ne 'y') {
        Write-Host "❌ تم إلغاء العملية" -ForegroundColor Red
        exit 1
    }
}

# عمل Commit
Write-Host ""
$commitMessage = Read-Host "📝 اكتب رسالة الـ Commit (اتركها فارغة للرسالة الافتراضية)"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "feat: Educational Platform with Real-time Notifications, Certificates, and PDF Library"
}

Write-Host "💾 عمل Commit..." -ForegroundColor Cyan
git commit -m "$commitMessage"
Write-Host "✅ تم عمل Commit" -ForegroundColor Green

# إعداد Remote
Write-Host ""
Write-Host "🌐 إعداد GitHub Remote..." -ForegroundColor Cyan
$remoteExists = git remote -v | Select-String "origin"

if ($remoteExists) {
    Write-Host "📌 Remote موجود بالفعل:" -ForegroundColor Yellow
    git remote -v
    
    $changeRemote = Read-Host "هل تريد تغيير الـ Remote؟ (y/n)"
    if ($changeRemote -eq 'y') {
        git remote remove origin
        $remoteExists = $false
    }
}

if (-not $remoteExists) {
    Write-Host ""
    Write-Host "📝 أدخل معلومات GitHub Repository:" -ForegroundColor Cyan
    $username = Read-Host "اسم المستخدم على GitHub"
    $reponame = Read-Host "اسم الـ Repository (اتركه فارغ لـ educational-platform)"
    
    if ([string]::IsNullOrWhiteSpace($reponame)) {
        $reponame = "educational-platform"
    }
    
    $remoteUrl = "https://github.com/$username/$reponame.git"
    Write-Host "🔗 إضافة Remote: $remoteUrl" -ForegroundColor Yellow
    git remote add origin $remoteUrl
}

# تغيير اسم الـ Branch إلى main
Write-Host ""
Write-Host "🌿 تغيير الـ Branch إلى main..." -ForegroundColor Cyan
git branch -M main

# الرفع إلى GitHub
Write-Host ""
Write-Host "🚀 رفع المشروع إلى GitHub..." -ForegroundColor Cyan
Write-Host "⏳ قد يطلب منك اسم المستخدم وكلمة المرور..." -ForegroundColor Yellow

$pushSuccess = $false
try {
    git push -u origin main 2>&1 | Write-Host
    $pushSuccess = $LASTEXITCODE -eq 0
} catch {
    $pushSuccess = $false
}

if (-not $pushSuccess) {
    Write-Host ""
    Write-Host "⚠️  فشل الرفع، جرب pull أولاً..." -ForegroundColor Yellow
    
    $tryPull = Read-Host "هل تريد محاولة pull ثم push؟ (y/n)"
    if ($tryPull -eq 'y') {
        git pull origin main --allow-unrelated-histories
        git push origin main
    }
}

# النتيجة النهائية
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
if ($pushSuccess -or $LASTEXITCODE -eq 0) {
    Write-Host "✅ تم رفع المشروع بنجاح!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 رابط المشروع:" -ForegroundColor Cyan
    Write-Host "   https://github.com/$username/$reponame" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 الخطوات التالية:" -ForegroundColor Cyan
    Write-Host "   1. افتح الرابط في المتصفح" -ForegroundColor White
    Write-Host "   2. أضف وصف للمشروع" -ForegroundColor White
    Write-Host "   3. أضف Topics مثل: nextjs, typescript, supabase" -ForegroundColor White
    Write-Host "   4. شارك الرابط مع الآخرين!" -ForegroundColor White
} else {
    Write-Host "❌ حدث خطأ في رفع المشروع" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 حلول مقترحة:" -ForegroundColor Yellow
    Write-Host "   1. تأكد من إنشاء Repository على GitHub" -ForegroundColor White
    Write-Host "   2. تأكد من اسم المستخدم واسم الـ Repository" -ForegroundColor White
    Write-Host "   3. تأكد من اتصال الإنترنت" -ForegroundColor White
    Write-Host "   4. جرب استخدام Personal Access Token بدلاً من كلمة المرور" -ForegroundColor White
    Write-Host "      https://github.com/settings/tokens" -ForegroundColor Cyan
}
Write-Host "==========================================" -ForegroundColor Cyan

# انتظار الضغط على أي مفتاح
Write-Host ""
Write-Host "اضغط أي مفتاح للخروج..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
