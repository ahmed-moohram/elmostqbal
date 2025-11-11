// فحص آخر عملية في قاعدة البيانات
const mongoose = require('mongoose');

async function checkLatestLogs() {
  try {
    await mongoose.connect('mongodb://localhost:27017/edufutura');
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    
    // فحص الدورات
    const coursesCollection = db.collection('courses');
    const allCourses = await coursesCollection.find({}).sort({ createdAt: -1 }).limit(5).toArray();
    
    console.log('📊 آخر 5 دورات في DB:');
    console.log('==========================================');
    
    if (allCourses.length === 0) {
      console.log('❌ لا توجد دورات في قاعدة البيانات!\n');
      
      // فحص collections الموجودة
      const collections = await db.listCollections().toArray();
      console.log('📋 Collections الموجودة في DB:');
      collections.forEach(c => console.log(`   - ${c.name}`));
      console.log('');
      
    } else {
      allCourses.forEach((course, i) => {
        console.log(`\n${i + 1}. ${course.title || 'No Title'}`);
        console.log(`   ID: ${course._id}`);
        console.log(`   Created: ${course.createdAt || 'N/A'}`);
        console.log(`   isActive: ${course.isActive}`);
        console.log(`   isPublished: ${course.isPublished || false}`);
        console.log(`   Instructor: ${course.instructor}`);
        console.log(`   Sections: ${course.sections?.length || 0}`);
        console.log(`   Price: ${course.paymentOptions?.[0]?.price || course.price || 'N/A'}`);
      });
    }
    
    console.log('\n==========================================\n');
    
    // فحص المستخدمين
    const usersCollection = db.collection('users');
    const adminUsers = await usersCollection.find({ role: 'admin' }).toArray();
    
    console.log('👥 مستخدمين Admin:');
    adminUsers.forEach(u => {
      console.log(`   - ${u.name} (${u.studentPhone}) - ${u.email}`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    await mongoose.disconnect();
  }
}

checkLatestLogs();
