const mongoose = require('mongoose');
require('dotenv').config();

const testAdmin = async () => {
  try {
    console.log('🔍 جاري التحقق من Admin...\n');

    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);

    const User = mongoose.connection.collection('users');

    // البحث عن admin
    const admin = await User.findOne({ studentPhone: 'admin' });
    
    if (admin) {
      console.log('✅ Admin موجود:');
      console.log('  - Name:', admin.name);
      console.log('  - StudentPhone:', admin.studentPhone);
      console.log('  - Role:', admin.role);
      console.log('  - Email:', admin.email);
      console.log('  - Has Password:', !!admin.password);
    } else {
      console.log('❌ Admin غير موجود!');
    }
    
    // عرض جميع المستخدمين
    const allUsers = await User.find({}).toArray();
    console.log('\n📊 إجمالي المستخدمين:', allUsers.length);
    console.log('\n👥 المستخدمون:');
    allUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.studentPhone}) - Role: ${user.role}`);
    });

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

testAdmin();
