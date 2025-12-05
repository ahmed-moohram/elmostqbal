/**
 * سكريبت لاستبدال جميع router.push بـ router.replace
 * لجعل جميع التنقلات فورية بدون انتظار
 */

const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  // Admin files
  'src/app/admin/page.tsx',
  'src/app/admin/profile/page.tsx',
  'src/app/admin/courses/new/page.tsx',
  'src/app/admin/courses/new/enhanced-page.tsx',
  
  // Teacher files
  'src/app/teachers/dashboard/page.tsx',
  'src/app/teachers/profile/page.tsx',
  'src/app/teachers/settings/page.tsx',
  'src/app/teachers/upload/page.tsx',
  'src/app/teachers/courses/create/page.tsx',
  
  // Student files
  'src/app/student/profile/page.tsx',
  'src/app/student/settings/page.tsx',
  
  // Course files
  'src/app/courses/[id]/page.tsx',
  'src/app/courses/[id]/learn/page.tsx',
  'src/app/courses/[id]/payment/page.tsx',
  'src/app/courses/[id]/checkout/page.tsx',
  
  // Other
  'src/app/page.tsx',
  'src/components/Navbar.tsx',
];

console.log('🔄 بدء استبدال router.push بـ router.replace...\n');

let totalFiles = 0;
let totalReplacements = 0;

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  الملف غير موجود: ${file}`);
    return;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // استبدال router.push بـ router.replace
    content = content.replace(/router\.push\(/g, 'router.replace(');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      const count = (originalContent.match(/router\.push\(/g) || []).length;
      console.log(`✅ ${file} - ${count} استبدال`);
      totalFiles++;
      totalReplacements += count;
    }
  } catch (error) {
    console.error(`❌ خطأ في ${file}:`, error.message);
  }
});

console.log(`\n✅ تم الانتهاء!`);
console.log(`📊 الإحصائيات:`);
console.log(`   - الملفات المحدثة: ${totalFiles}`);
console.log(`   - إجمالي الاستبدالات: ${totalReplacements}`);
console.log(`\n🚀 الآن جميع التنقلات فورية!`);
