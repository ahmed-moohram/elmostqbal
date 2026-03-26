/**
 * Script لتنظيف قاعدة البيانات من جميع البيانات الوهمية
 * استخدمه قبل رفع المنصة للإنتاج
 */

const mongoose = require('mongoose');
require('dotenv').config();

const cleanDatabase = async () => {
  try {
    console.log('🔄 جاري الاتصال بقاعدة البيانات...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edufutura');
    
    console.log('✅ تم الاتصال بنجاح\n');

    // حذف جميع البيانات ماعدا Admin
    const collections = [
      { name: 'students', displayName: 'الطلاب' },
      { name: 'teachers', displayName: 'المدرسين' },
      { name: 'courses', displayName: 'الدورات' },
      { name: 'enrollmentrequests', displayName: 'طلبات الاشتراك' },
      { name: 'achievements', displayName: 'الإنجازات' },
      { name: 'devices', displayName: 'الأجهزة' },
      { name: 'sections', displayName: 'الأقسام' },
      { name: 'assignments', displayName: 'الواجبات' },
      { name: 'questions', displayName: 'الأسئلة' },
      { name: 'livesessions', displayName: 'الجلسات المباشرة' },
      { name: 'messages', displayName: 'الرسائل' },
      { name: 'ratings', displayName: 'التقييمات' },
      { name: 'certificates', displayName: 'الشهادات' },
      { name: 'books', displayName: 'الكتب' }
    ];

    console.log('⚠️  سيتم حذف البيانات التالية:\n');

    for (const collection of collections) {
      const count = await mongoose.connection.collection(collection.name).countDocuments();
      if (count > 0) {
        console.log(`   - ${collection.displayName}: ${count} سجل`);
      }
    }

    console.log('\n⚠️  ملاحظة: سيتم الاحتفاظ بحساب Admin فقط\n');
    console.log('⏳ انتظر 5 ثوان للإلغاء (Ctrl+C)...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🗑️  جاري حذف البيانات...\n');

    let totalDeleted = 0;

    for (const collection of collections) {
      const result = await mongoose.connection.collection(collection.name).deleteMany({});
      if (result.deletedCount > 0) {
        console.log(`   ✅ ${collection.displayName}: تم حذف ${result.deletedCount} سجل`);
        totalDeleted += result.deletedCount;
      }
    }

    // حذف جميع المستخدمين ماعدا Admin
    const usersResult = await mongoose.connection.collection('users').deleteMany({
      role: { $ne: 'admin' }
    });
    
    if (usersResult.deletedCount > 0) {
      console.log(`   ✅ المستخدمين (غير Admin): تم حذف ${usersResult.deletedCount} سجل`);
      totalDeleted += usersResult.deletedCount;
    }

    console.log(`\n✅ تم حذف ${totalDeleted} سجل بنجاح!`);
    console.log('✅ قاعدة البيانات جاهزة للإنتاج\n');

    // عرض الإحصائيات النهائية
    console.log('📊 الإحصائيات النهائية:');
    const adminCount = await mongoose.connection.collection('users').countDocuments({ role: 'admin' });
    console.log(`   - Admin: ${adminCount} حساب`);
    
    for (const collection of collections) {
      const count = await mongoose.connection.collection(collection.name).countDocuments();
      if (count > 0) {
        console.log(`   - ${collection.displayName}: ${count} سجل`);
      }
    }

    console.log('\n🎉 تم تنظيف قاعدة البيانات بنجاح!');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

// تشغيل Script
cleanDatabase();
