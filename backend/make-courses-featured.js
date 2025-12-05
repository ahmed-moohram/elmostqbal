// جعل بعض الدورات مميزة
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');

async function makeCoursesFeatured() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/edufutura';
    
    console.log('📡 Connecting to MongoDB...\n');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected!\n');
    
    const db = mongoose.connection.db;
    const coursesCollection = db.collection('courses');
    
    // Get all published and active courses
    const courses = await coursesCollection.find({
      isActive: true,
      isPublished: true
    }).toArray();
    
    console.log(`📚 Found ${courses.length} published courses\n`);
    
    if (courses.length === 0) {
      console.log('⚠️  No published courses found!');
      console.log('💡 Tip: Publish some courses first using the admin panel\n');
      
      // Show all courses status
      const allCourses = await coursesCollection.find({ isActive: true }).toArray();
      console.log(`📊 Total active courses: ${allCourses.length}`);
      allCourses.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.title}`);
        console.log(`      Published: ${c.isPublished || false}`);
        console.log(`      Featured: ${c.isFeatured || false}`);
      });
      
      await mongoose.disconnect();
      return;
    }
    
    // Make first 3 courses featured
    const coursesToFeature = courses.slice(0, Math.min(3, courses.length));
    
    console.log('⭐ Making courses featured:\n');
    
    for (const course of coursesToFeature) {
      await coursesCollection.updateOne(
        { _id: course._id },
        { $set: { isFeatured: true } }
      );
      console.log(`✅ ${course.title} → Featured`);
    }
    
    // Make remaining courses non-featured
    const remainingCourses = courses.slice(Math.min(3, courses.length));
    for (const course of remainingCourses) {
      await coursesCollection.updateOne(
        { _id: course._id },
        { $set: { isFeatured: false } }
      );
    }
    
    console.log('\n==========================================');
    console.log('✅ Done!');
    console.log(`⭐ Featured courses: ${coursesToFeature.length}`);
    console.log(`📚 Total published courses: ${courses.length}`);
    console.log('==========================================\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

makeCoursesFeatured();
