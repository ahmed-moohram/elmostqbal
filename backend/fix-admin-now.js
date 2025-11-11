// تحديث كلمة مرور المستخدم admin
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function fixAdmin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/edufutura');
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // 1. Find admin user
    console.log('🔍 Searching for admin user...');
    const admin = await usersCollection.findOne({ studentPhone: 'admin' });
    
    if (!admin) {
      console.log('❌ Admin user not found!');
      await mongoose.disconnect();
      return;
    }
    
    console.log('✅ Admin found:', admin.name || admin.email);
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);
    
    // 2. Update password
    console.log('\n🔐 Updating password...');
    const newPassword = 'Admin@123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    await usersCollection.updateOne(
      { studentPhone: 'admin' },
      { 
        $set: { 
          password: hashedPassword,
          role: 'admin'
        } 
      }
    );
    
    console.log('✅ Password updated!');
    console.log('\n📝 Login credentials:');
    console.log('   Phone: admin');
    console.log('   Password: Admin@123');
    
    // 3. Test password
    const updatedAdmin = await usersCollection.findOne({ studentPhone: 'admin' });
    const passwordMatch = await bcrypt.compare(newPassword, updatedAdmin.password);
    console.log('\n✅ Password verification:', passwordMatch ? 'SUCCESS' : 'FAILED');
    
    await mongoose.disconnect();
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

fixAdmin();
