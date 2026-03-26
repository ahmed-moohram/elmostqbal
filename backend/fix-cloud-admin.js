// تحديث كلمة مرور admin في Cloud Database
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function fixCloudAdmin() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/edufutura';
    console.log('📡 Connecting to Cloud Database...\n');
    
    await mongoose.connect(uri);
    console.log('✅ Connected!\n');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Find admin user
    const admin = await usersCollection.findOne({ studentPhone: 'admin' });
    
    if (!admin) {
      console.log('❌ Admin user not found!');
      await mongoose.disconnect();
      return;
    }
    
    console.log('✅ Admin found:', admin.name);
    console.log('   Email:', admin.email);
    
    // Update password
    console.log('\n🔐 Updating password to: Admin@123');
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
    
    console.log('✅ Password updated!\n');
    
    // Test
    const updatedAdmin = await usersCollection.findOne({ studentPhone: 'admin' });
    const passwordMatch = await bcrypt.compare(newPassword, updatedAdmin.password);
    console.log('✅ Password verification:', passwordMatch ? 'SUCCESS ✅' : 'FAILED ❌');
    
    console.log('\n==========================================');
    console.log('📝 Login Credentials:');
    console.log('   Phone: admin');
    console.log('   Password: Admin@123');
    console.log('==========================================\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

fixCloudAdmin();
