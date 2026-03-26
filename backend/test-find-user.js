// اختبار البحث عن المستخدم
const mongoose = require('mongoose');

async function testFindUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/edufutura');
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    const phone = '01111111111';
    
    console.log('🔍 Searching for phone:', phone);
    console.log('==========================================\n');
    
    // 1. Raw DB query
    console.log('1️⃣ Raw DB Query:');
    const userRaw = await usersCollection.findOne({ studentPhone: phone });
    console.log('   Result:', userRaw ? `FOUND - ${userRaw.name}` : 'NOT FOUND');
    if (userRaw) {
      console.log('   Phone field:', `"${userRaw.studentPhone}"`, 'Length:', userRaw.studentPhone.length);
      console.log('   Email:', userRaw.email);
      console.log('   Role:', userRaw.role);
    }
    console.log('');
    
    // 2. Check all users
    console.log('2️⃣ All users in DB:');
    const allUsers = await usersCollection.find({}).toArray();
    allUsers.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.name}`);
      console.log(`      Phone: "${u.studentPhone}" (Length: ${u.studentPhone.length})`);
      console.log(`      Email: ${u.email}`);
      console.log(`      Match with "${phone}": ${u.studentPhone === phone}`);
    });
    console.log('');
    
    // 3. Check for whitespace issues
    console.log('3️⃣ Checking for whitespace issues:');
    const firstUser = allUsers[0];
    if (firstUser) {
      const phoneValue = firstUser.studentPhone;
      console.log('   Original:', `"${phoneValue}"`);
      console.log('   Trimmed:', `"${phoneValue.trim()}"`);
      console.log('   Needs trim:', phoneValue !== phoneValue.trim());
    }
    console.log('');
    
    // 4. Fix whitespace if needed
    console.log('4️⃣ Fixing any whitespace issues...');
    const fixResult = await usersCollection.updateMany(
      {},
      [{ $set: { studentPhone: { $trim: { input: "$studentPhone" } } } }]
    );
    console.log('   Modified:', fixResult.modifiedCount);
    console.log('');
    
    // 5. Test again
    console.log('5️⃣ Testing after fix:');
    const userAfter = await usersCollection.findOne({ studentPhone: phone });
    console.log('   Result:', userAfter ? `FOUND - ${userAfter.name}` : 'NOT FOUND');
    
    await mongoose.disconnect();
    console.log('\n✅ Test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

testFindUser();
