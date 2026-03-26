// اختبار User model مباشرة
const mongoose = require('mongoose');

async function testUserModel() {
  try {
    await mongoose.connect('mongodb://localhost:27017/edufutura');
    console.log('✅ Connected\n');
    
    // استيراد User model
    const UserSchema = require('./dist/models/User').User;
    
    if (!UserSchema) {
      console.log('❌ User model not found in dist');
      console.log('Trying direct import...\n');
      
      // البحث المباشر
      const db = mongoose.connection.db;
      const usersCollection = db.collection('users');
      
      const user = await usersCollection.findOne({ studentPhone: '01111111111' });
      
      if (user) {
        console.log('✅ User found in DB:');
        console.log('   Name:', user.name);
        console.log('   Phone:', user.studentPhone);
        console.log('   Email:', user.email);
        console.log('   Role:', user.role);
        console.log('   Password (hash):', user.password.substring(0, 20) + '...');
        
        // Test password
        const bcrypt = require('bcryptjs');
        const match = await bcrypt.compare('Admin@123', user.password);
        console.log('\n   Password Match:', match ? '✅ YES' : '❌ NO');
        
      } else {
        console.log('❌ User not found');
      }
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
  }
}

testUserModel();
