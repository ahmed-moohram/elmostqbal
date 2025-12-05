const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function fixAdminPassword() {
  try {
    await mongoose.connect('mongodb://localhost:27017/edufutura');
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // البحث عن المدير الأساسي
    const admin = await usersCollection.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('❌ لا يوجد مستخدم admin');
      await mongoose.disconnect();
      return;
    }
    
    console.log('✅ وجد المستخدم:');
    console.log('   - الاسم:', admin.name);
    console.log('   - الهاتف:', admin.studentPhone);
    console.log('   - Email:', admin.email);
    console.log('');
    
    // تشفير كلمة مرور جديدة
    const newPassword = 'Admin@123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // تحديث كلمة المرور
    await usersCollection.updateOne(
      { _id: admin._id },
      { $set: { password: hashedPassword } }
    );
    
    console.log('✅ تم تحديث كلمة المرور بنجاح!');
    console.log('📱 الهاتف:', admin.studentPhone);
    console.log('🔑 كلمة المرور الجديدة: Admin@123');
    console.log('');
    
    // التحقق
    const isMatch = await bcrypt.compare(newPassword, hashedPassword);
    console.log('🔐 اختبار كلمة المرور:', isMatch ? '✅ صحيحة' : '❌ خاطئة');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    await mongoose.disconnect();
  }
}

fixAdminPassword();
