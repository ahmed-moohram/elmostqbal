# فحص الملفات الكبيرة قبل الرفع
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "     فحص الملفات الكبيرة في المشروع" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

cd D:\2\معتصم

# البحث عن الملفات الكبيرة
Write-Host "🔍 البحث عن ملفات أكبر من 100MB..." -ForegroundColor Yellow
Write-Host ""

$largeFiles = @()
Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_.Length -gt 100MB) {
        $largeFiles += $_
        $sizeMB = [math]::Round($_.Length / 1MB, 2)
        $relativePath = $_.FullName.Replace("$PWD\", "")
        Write-Host "❌ $relativePath ($sizeMB MB)" -ForegroundColor Red
    }
}

if ($largeFiles.Count -eq 0) {
    Write-Host "✅ لا توجد ملفات كبيرة! يمكنك الرفع بأمان." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️ تم العثور على $($largeFiles.Count) ملف كبير" -ForegroundColor Yellow
    Write-Host ""
    
    $choice = Read-Host "هل تريد حذف هذه الملفات من Git؟ (y/n)"
    if ($choice -eq 'y') {
        foreach ($file in $largeFiles) {
            $relativePath = $file.FullName.Replace("$PWD\", "").Replace("\", "/")
            Write-Host "🗑️ حذف: $relativePath" -ForegroundColor Yellow
            git rm --cached $relativePath -f 2>$null
            Remove-Item $file.FullName -Force -Confirm:$false
        }
        
        Write-Host ""
        Write-Host "💾 عمل Commit..." -ForegroundColor Green
        git add .
        git commit -m "Remove large files"
        
        Write-Host "✅ تم حذف الملفات الكبيرة!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "للرفع استخدم: git push -u origin main" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
