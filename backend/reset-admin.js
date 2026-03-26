const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const resetAdmin = async () => {
  try {
    console.log('🔄 جاري إعادة إنشاء حساب الأدمن...');

    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/educational-platform';
    await mongoose.connect(mongoUri);

    const User = mongoose.connection.collection('users');

    // حذف الأدمن الحالي إن وجد
    await User.deleteMany({role: 'admin'});
    console.log('🗑️ تم حذف الأدمن الحالي');

    // تشفير كلمة المرور الجديدة
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('🔐 تم تشفير كلمة المرور الجديدة');

    // إنشاء أدمن جديد ببيانات بسيطة
    const newAdmin = {
      name: 'Admin',
      fatherName: 'Admin',
      studentPhone: 'admin',
      parentPhone: 'admin',
      password: hashedPassword,
      role: 'admin',
      image: '/admin-profile.jpg',
      purchasedBooks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    };

    await User.insertOne(newAdmin);
    console.log('✅ تم إنشاء حساب أدمن جديد بنجاح!');
    console.log('');
    console.log('═══════════════════════════════');
    console.log('📱 اسم المستخدم: admin');
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

resetAdmin();
