# سكريبت حذف الملفات الكبيرة
Write-Host "🗑️ حذف الملفات الكبيرة من Git..." -ForegroundColor Yellow
Write-Host ""

cd D:\2\معتصم

# حذف ملف الفيديو من Git
Write-Host "📹 حذف ملف الفيديو الكبير..." -ForegroundColor Red
git rm --cached "md/2025-05-13 22-42-51.mp4" 2>$null

# البحث عن ملفات كبيرة أخرى
Write-Host "🔍 البحث عن ملفات كبيرة أخرى..." -ForegroundColor Cyan
$largeFiles = Get-ChildItem -Recurse -File | Where-Object {$_.Length -gt 100MB}

if ($largeFiles) {
    Write-Host "⚠️ تم العثور على ملفات كبيرة:" -ForegroundColor Yellow
    foreach ($file in $largeFiles) {
        $sizeMB = [math]::Round($file.Length / 1MB, 2)
        Write-Host "   - $($file.FullName) ($sizeMB MB)" -ForegroundColor Red
        
        # حذف من Git
        $relativePath = $file.FullName.Replace("$PWD\", "").Replace("\", "/")
        git rm --cached $relativePath 2>$null
    }
}

# حذف كل ملفات الفيديو
Write-Host "🎬 حذف كل ملفات الفيديو..." -ForegroundColor Yellow
git rm --cached "*.mp4" -r 2>$null
git rm --cached "*.avi" -r 2>$null
git rm --cached "*.mov" -r 2>$null
git rm --cached "*.mkv" -r 2>$null

# تحديث .gitignore
Write-Host "📝 تحديث .gitignore..." -ForegroundColor Green
Add-Content -Path ".gitignore" -Value @"

# Large files
*.mp4
*.avi
*.mov
*.mkv
*.zip
*.rar
md/
"@

# عمل commit جديد
Write-Host "💾 عمل Commit..." -ForegroundColor Green
git add .gitignore
git commit -m "Remove large video files and update gitignore"

# الرفع مرة أخرى
Write-Host "🚀 رفع المشروع..." -ForegroundColor Green
git push -u origin main

Write-Host ""
Write-Host "=================================" -ForegroundColor Green
Write-Host "✅ تم حذف الملفات الكبيرة!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
