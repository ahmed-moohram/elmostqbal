const mongoose = require('mongoose');

async function checkUser() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edufutura';
    await mongoose.connect(MONGODB_URI);
    
    // استخدام نفس الـ schema من الباك اند
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({ studentPhone: '01111111111' });
    
    console.log('🔍 البحث عن المستخدم برقم: 01111111111');
    console.log('\nالنتيجة:');
    console.log('========');
    
    if (user) {
      console.log('✅ المستخدم موجود!');
      console.log('\nالبيانات:');
      console.log('ID:', user._id);
      console.log('Name:', user.name);
      console.log('Phone:', user.studentPhone);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Password (hashed):', user.password ? user.password.substring(0, 20) + '...' : 'N/A');
    } else {
      console.log('❌ المستخدم غير موجود');
      
      // البحث عن أي مستخدمين
      const allUsers = await usersCollection.find({}).limit(5).toArray();
      console.log('\n📋 المستخدمين المتاحين:');
      allUsers.forEach(u => {
        console.log(`  - ${u.studentPhone} (${u.name})`);
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

checkUser();
