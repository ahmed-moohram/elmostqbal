// Debug: فحص الـ query مباشرة
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');

async function debugQuery() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/edufutura';
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const coursesCollection = db.collection('courses');
    
    // Query 1: isActive: true (what admin should see)
    console.log('1️⃣ Query: { isActive: true }');
    const q1 = await coursesCollection.find({ isActive: true }).toArray();
    console.log(`   Result: ${q1.length} courses\n`);
    
    // Query 2: isActive: true AND isPublished: true
    console.log('2️⃣ Query: { isActive: true, isPublished: true }');
    const q2 = await coursesCollection.find({ isActive: true, isPublished: true }).toArray();
    console.log(`   Result: ${q2.length} courses\n`);
    
    // Query 3: isActive not false
    console.log('3️⃣ Query: { isActive: { $ne: false } }');
    const q3 = await coursesCollection.find({ isActive: { $ne: false } }).toArray();
    console.log(`   Result: ${q3.length} courses\n`);
    
    // Query 4: All courses
    console.log('4️⃣ Query: {}');
    const q4 = await coursesCollection.find({}).toArray();
    console.log(`   Result: ${q4.length} courses\n`);
    
    // Check isActive field
    console.log('📊 isActive field check:');
    console.log(`   isActive: true → ${q1.length}`);
    console.log(`   isActive: false → ${q4.length - q3.length}`);
    console.log(`   isActive: undefined → ${q3.length - q1.length}\n`);
    
    // Show all courses with isActive status
    console.log('📋 All Courses:');
    q4.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.title.substring(0, 30)}`);
      console.log(`      isActive: ${c.isActive === undefined ? 'undefined' : c.isActive}`);
      console.log(`      isPublished: ${c.isPublished === undefined ? 'undefined' : c.isPublished}`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

debugQuery();
