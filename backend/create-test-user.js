const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  try {
    // الاتصال بقاعدة البيانات
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edufutura';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create User model
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
    await User.deleteOne({ studentPhone: '01111111111' });
    
    // إنشاء كلمة مرور مشفرة
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Test@123', salt);
    
    // إنشاء مستخدم admin للاختبار
    const testUser = new User({
      name: 'Test Admin',
      fatherName: 'Test',
      studentPhone: '01111111111',
      parentPhone: '01111111111',
      email: 'testadmin@test.com',
      password: hashedPassword,
      role: 'admin',
      isVerified: true
    });
    
    await testUser.save();
    
    console.log('✅ Test user created successfully!');
    console.log('📱 Phone: 01111111111');
    console.log('🔑 Password: Test@123');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestUser();
