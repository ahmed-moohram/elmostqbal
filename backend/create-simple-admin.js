const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createSimpleAdmin = async () => {
  try {
    console.log('🔄 جاري إنشاء admin بسيط...');

    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);

    const User = mongoose.connection.collection('users');

    // حذف admin القديم برقم "admin" إن وجد
    await User.deleteOne({ studentPhone: 'admin' });
    
    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // إنشاء admin جديد برقم "admin"
    const admin = {
      name: 'Admin',
      fatherName: 'Administrator',
      studentPhone: 'admin',
      parentPhone: 'admin',
      email: 'admin@edufutura.com',
      password: hashedPassword,
      role: 'admin',
      image: '/admin-profile.jpg',
      profilePicture: '/admin-profile.jpg',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await User.insertOne(admin);
    
    console.log('✅ تم إنشاء admin بنجاح!');
    console.log('');
    console.log('═══════════════════════════════');
    console.log('📱 رقم الهاتف: admin');
    console.log('🔑 كلمة المرور: admin123');
    console.log('═══════════════════════════════');
    console.log('');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createSimpleAdmin();
