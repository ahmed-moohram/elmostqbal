// فحص حالة جميع الدورات
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');

async function checkCoursesStatus() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/edufutura';
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const coursesCollection = db.collection('courses');
    
    // Get all courses
    const allCourses = await coursesCollection.find({}).toArray();
    
    console.log(`📚 Total courses in DB: ${allCourses.length}\n`);
    
    // Categorize by status
    const active = allCourses.filter(c => c.isActive !== false);
    const inactive = allCourses.filter(c => c.isActive === false);
    const published = allCourses.filter(c => c.isPublished === true);
    const unpublished = allCourses.filter(c => c.isPublished !== true);
    
    console.log('📊 Summary:');
    console.log(`   Active: ${active.length}`);
    console.log(`   Inactive: ${inactive.length}`);
    console.log(`   Published: ${published.length}`);
    console.log(`   Unpublished: ${unpublished.length}`);
    console.log('');
    
    // Show active courses
    console.log('✅ Active Courses:');
    active.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.title}`);
      console.log(`      Published: ${c.isPublished || false}`);
      console.log(`      isActive: ${c.isActive !== false ? 'true' : 'false'}`);
    });
    console.log('');
    
    // Show inactive courses
    if (inactive.length > 0) {
      console.log('❌ Inactive Courses (will NOT show):');
      inactive.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.title}`);
      });
      console.log('');
    }
    
    // Make all courses active
    console.log('💡 Fix: Making all courses active...');
    const result = await coursesCollection.updateMany(
      { isActive: false },
      { $set: { isActive: true } }
    );
    console.log(`   ✅ Updated ${result.modifiedCount} courses\n`);
    
    // Check again
    const activeAfter = await coursesCollection.countDocuments({ isActive: true });
    console.log(`📊 After fix: ${activeAfter} active courses\n`);
    
    await mongoose.disconnect();
    console.log('✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

checkCoursesStatus();
