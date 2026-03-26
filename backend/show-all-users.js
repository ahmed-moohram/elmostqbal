// عرض كل المستخدمين
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function showAllUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/edufutura');
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    const allUsers = await usersCollection.find({}).toArray();
    
    console.log(`📊 Total users: ${allUsers.length}\n`);
    console.log('==========================================');
    
    for (let i = 0; i < allUsers.length; i++) {
      const user = allUsers[i];
      console.log(`\n${i + 1}. ${user.name || 'No Name'}`);
      console.log(`   Phone: "${user.studentPhone}"`);
      console.log(`   Email: ${user.email || 'No Email'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password Hash: ${user.password.substring(0, 30)}...`);
      
      // Test with Admin@123
      const passwordMatch = await bcrypt.compare('Admin@123', user.password);
      console.log(`   Test Password (Admin@123): ${passwordMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
    }
    
    console.log('\n==========================================');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

showAllUsers();
