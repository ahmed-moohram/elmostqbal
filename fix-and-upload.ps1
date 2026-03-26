# سكريبت إصلاح ورفع المشروع
Write-Host "🔧 إصلاح ورفع المشروع على GitHub..." -ForegroundColor Green
Write-Host ""

# التأكد من المجلد الصحيح
cd D:\2\معتصم

# حذف remote القديم إن وجد
Write-Host "🗑️ حذف الإعدادات القديمة..." -ForegroundColor Yellow
git remote remove origin 2>$null

# إضافة remote جديد
Write-Host "🔗 إضافة رابط GitHub..." -ForegroundColor Yellow
git remote add origin https://github.com/mohraamahmed/educational-platform.git

# التأكد من وجود commits
$hasCommits = git rev-parse HEAD 2>$null
if (-not $hasCommits) {
    Write-Host "📝 عمل Commit..." -ForegroundColor Yellow
    git add .
    git commit -m "Initial commit: Educational Platform"
}

# الرفع
Write-Host "🚀 رفع المشروع..." -ForegroundColor Green
git branch -M main
git push -u origin main

Write-Host ""
Write-Host "=================================" -ForegroundColor Green
Write-Host "✅ تم! تفقد مشروعك على:" -ForegroundColor Green
Write-Host "https://github.com/mohraamahmed/educational-platform" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Green
