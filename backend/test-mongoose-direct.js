// اختبار Mongoose model مباشرة
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');

async function testMongooseDirect() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/edufutura';
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    
    // Import Course model
    const Course = require('./dist/models/Course').default;
    
    console.log('1️⃣ Mongoose Model Test:\n');
    
    // Query 1: Simple find
    console.log('Query: { isActive: true }');
    const courses1 = await Course.find({ isActive: true });
    console.log(`   Result: ${courses1.length} courses\n`);
    
    // Query 2: With countDocuments
    const total1 = await Course.countDocuments({ isActive: true });
    console.log(`countDocuments: ${total1}\n`);
    
    // Query 3: With lean
    const courses2 = await Course.find({ isActive: true }).lean();
    console.log(`With .lean(): ${courses2.length} courses\n`);
    
    // Query 4: With select
    const courses3 = await Course.find({ isActive: true })
      .select('title isPublished isActive')
      .lean();
    console.log(`With .select(): ${courses3.length} courses\n`);
    
    // Query 5: With sort
    const courses4 = await Course.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();
    console.log(`With .sort(): ${courses4.length} courses\n`);
    
    // Query 6: Full query from controller
    const courses5 = await Course.find({ isActive: true })
      .select('title description price thumbnail category rating studentsCount isPublished isActive paymentOptions')
      .populate('instructor', 'name')
      .sort({ createdAt: -1 })
      .lean();
    console.log(`Full query: ${courses5.length} courses\n`);
    
    // Show first 5
    console.log('📋 First 5 courses:');
    courses5.slice(0, 5).forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.title}`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
  }
}

testMongooseDirect();
