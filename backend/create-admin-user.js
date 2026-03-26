const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/edufutura');
    console.log('✅ Connected to MongoDB\n');
    
    const UserSchema = new mongoose.Schema({
      name: String,
      fatherName: String,
      studentPhone: { type: String, unique: true },
      parentPhone: String,
      email: String,
      password: String,
      role: String,
      isVerified: Boolean
    });
    
    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    
    // حذف المستخدم القديم إن وجد
    await User.deleteOne({ studentPhone: '01234567890' });
    
    // إنشاء كلمة مرور مشفرة
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);
    
    // إنشاء مستخدم admin جديد
    const admin = new User({
      name: 'مدير الاختبار',
      fatherName: 'الاختبار',
      studentPhone: '01234567890',
      parentPhone: '01234567890',
      email: 'testadmin@edufutura.com',
      password: hashedPassword,
      role: 'admin',
      isVerified: true
    });
    
    await admin.save();
    
    console.log('✅ تم إنشاء مستخدم الاختبار بنجاح!');
    console.log('📱 الهاتف: 01234567890');
    console.log('🔑 كلمة المرور: Admin@123');
    console.log('👤 الدور: admin');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    await mongoose.disconnect();
  }
}

createAdminUser();
