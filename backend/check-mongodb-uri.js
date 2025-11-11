// فحص MongoDB URI المستخدم
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

console.log('🔍 Checking MongoDB Configuration\n');
console.log('==========================================');
console.log('MONGODB_URI from .env:', process.env.MONGODB_URI || 'NOT SET');
console.log('Default URI:', 'mongodb://127.0.0.1:27017/edufutura');
console.log('==========================================\n');

// الآن دعني أتصل بالـ URI المستخدم في Backend
const mongoose = require('mongoose');

async function checkDatabases() {
  try {
    // 1. Connect to the URI used by backend
    const backendUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/edufutura';
    console.log('📡 Connecting to Backend URI:', backendUri);
    
    await mongoose.connect(backendUri);
    console.log('✅ Connected!\n');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    const users = await usersCollection.find({}).toArray();
    
    console.log(`👥 Users in Backend Database: ${users.length}`);
    users.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.name} | Phone: ${u.studentPhone} | Email: ${u.email}`);
    });
    
    await mongoose.disconnect();
    
    // 2. Now connect to localhost
    console.log('\n==========================================');
    console.log('📡 Connecting to localhost URI: mongodb://localhost:27017/edufutura');
    
    await mongoose.connect('mongodb://localhost:27017/edufutura');
    console.log('✅ Connected!\n');
    
    const db2 = mongoose.connection.db;
    const usersCollection2 = db2.collection('users');
    
    const users2 = await usersCollection2.find({}).toArray();
    
    console.log(`👥 Users in localhost Database: ${users2.length}`);
    users2.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.name} | Phone: ${u.studentPhone} | Email: ${u.email}`);
    });
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

checkDatabases();
