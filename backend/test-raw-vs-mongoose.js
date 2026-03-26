// مقارنة Raw MongoDB vs Mongoose
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');

async function compareRawVsMongoose() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/edufutura';
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    
    // 1. Raw MongoDB query
    console.log('1️⃣ Raw MongoDB (collection.find):');
    const rawCourses = await db.collection('courses').find({ isActive: true }).toArray();
    console.log(`   Result: ${rawCourses.length} courses\n`);
    
    // 2. Count via Mongoose collection
    console.log('2️⃣ Via db.collection().countDocuments:');
    const rawCount = await db.collection('courses').countDocuments({ isActive: true });
    console.log(`   Result: ${rawCount} courses\n`);
    
    // 3. Check collection name
    console.log('3️⃣ Collections in database:');
    const collections = await db.listCollections().toArray();
    collections.forEach(c => {
      console.log(`   - ${c.name}`);
    });
    console.log('');
    
    // 4. Check if 'Course' model is using different collection
    console.log('4️⃣ Checking Mongoose model collection name:');
    const CourseModel = mongoose.models.Course || mongoose.model('Course', new mongoose.Schema({}, {collection: 'courses'}));
    console.log(`   Collection: ${CourseModel.collection.name}\n`);
    
    // 5. Mongoose query
    console.log('5️⃣ Mongoose query (Course.find):');
    const mongooseCourses = await CourseModel.find({ isActive: true }).lean();
    console.log(`   Result: ${mongooseCourses.length} courses\n`);
    
    // 6. Mongoose countDocuments
    console.log('6️⃣ Mongoose countDocuments:');
    const mongooseCount = await CourseModel.countDocuments({ isActive: true });
    console.log(`   Result: ${mongooseCount} courses\n`);
    
    console.log('==========================================');
    console.log('📊 Comparison:');
    console.log(`   Raw MongoDB: ${rawCourses.length}`);
    console.log(`   Mongoose: ${mongooseCourses.length}`);
    console.log('==========================================\n');
    
    if (rawCourses.length !== mongooseCourses.length) {
      console.log('⚠️  MISMATCH! Mongoose is filtering differently!\n');
      
      // Find which courses are missing
      const rawIds = rawCourses.map(c => c._id.toString());
      const mongooseIds = mongooseCourses.map(c => c._id.toString());
      
      const missingIds = rawIds.filter(id => !mongooseIds.includes(id));
      console.log(`❌ ${missingIds.length} courses missing in Mongoose result:\n`);
      
      for (const id of missingIds.slice(0, 5)) {
        const course = rawCourses.find(c => c._id.toString() === id);
        console.log(`   - ${course.title}`);
        console.log(`     isActive: ${course.isActive}`);
        console.log(`     isPublished: ${course.isPublished}`);
      }
    } else {
      console.log('✅ Results match!');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
  }
}

compareRawVsMongoose();
