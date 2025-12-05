const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function fixUserPassword() {
  try {
    const MONGODB_URI = 'mongodb://localhost:27017/edufutura';
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // تشفير كلمة المرور بنفس طريقة الباك اند
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Test@123', salt);
    
    // تحديث كلمة المرور
    await usersCollection.updateOne(
      { studentPhone: '01111111111' },
      { $set: { password: hashedPassword } }
    );
    
    console.log('✅ تم تحديث كلمة المرور بنجاح');
    
    // التحقق
    const user = await usersCollection.findOne({ studentPhone: '01111111111' });
    const isMatch = await bcrypt.compare('Test@123', user.password);
    
    console.log('🔐 اختبار كلمة المرور:', isMatch ? '✅ صحيحة' : '❌ خاطئة');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

fixUserPassword();
