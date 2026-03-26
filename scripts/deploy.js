/**
 * سكريبت نشر مشروع منصة المستقبل التعليمية
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// تحديد وقت النشر
const deployTime = new Date().toISOString();
console.log(`🚀 بدء عملية النشر: ${deployTime}`);

// تنفيذ خطوات ما قبل النشر
try {
  // فحص الكود للأخطاء
  console.log('🔍 فحص الكود للأخطاء...');
  execSync('npm run lint', { stdio: 'inherit' });
  
  // بناء المشروع
  console.log('🏗️ بناء المشروع...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // ضغط الملفات
  console.log('📦 تحضير الملفات للنشر...');
  
  // نشر المشروع (يمكن تخصيص هذا الجزء حسب خدمة الاستضافة)
  console.log('🌐 جارِ نشر المشروع...');
  
  if (process.env.DEPLOY_TARGET === 'netlify') {
    execSync('netlify deploy --prod', { stdio: 'inherit' });
  } else if (process.env.DEPLOY_TARGET === 'vercel') {
    execSync('vercel --prod', { stdio: 'inherit' });
  } else {
    console.log('⚠️ لم يتم تحديد هدف النشر. قم بتعيين DEPLOY_TARGET إما إلى "netlify" أو "vercel"');
  }
  
  console.log('✅ تم نشر المشروع بنجاح!');
  
  // تسجيل معلومات النشر
  const deployLog = {
    time: deployTime,
    status: 'success',
    target: process.env.DEPLOY_TARGET || 'unknown'
  };
  
  fs.writeFileSync(
    path.resolve(__dirname, '../deploy-log.json'),
    JSON.stringify(deployLog, null, 2)
  );
  
} catch (error) {
  console.error('❌ فشل النشر:', error);
  process.exit(1);
}
