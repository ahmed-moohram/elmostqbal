const mongoose = require('mongoose');

async function checkCourses() {
  try {
    await mongoose.connect('mongodb://localhost:27017/edufutura');
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const coursesCollection = db.collection('courses');
    
    // عدد كل الدورات
    const totalCourses = await coursesCollection.countDocuments({});
    console.log('📊 إجمالي الدورات في DB:', totalCourses);
    
    // عدد الدورات النشطة
    const activeCourses = await coursesCollection.countDocuments({ isActive: true });
    console.log('✅ الدورات النشطة (isActive: true):', activeCourses);
    
    // عدد الدورات المنشورة
    const publishedCourses = await coursesCollection.countDocuments({ 
      isActive: true, 
      isPublished: true 
    });
    console.log('📢 الدورات المنشورة (isPublished: true):', publishedCourses);
    
    // عدد الدورات غير المنشورة
    const unpublishedCourses = await coursesCollection.countDocuments({ 
      isActive: true, 
      isPublished: false 
    });
    console.log('⏸️ الدورات غير المنشورة (isPublished: false):', unpublishedCourses);
    
    console.log('\n📋 تفاصيل الدورات:\n');
    
    // جلب كل الدورات
    const courses = await coursesCollection.find({ isActive: true }).toArray();
    
    courses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title}`);
      console.log(`   - ID: ${course._id}`);
      console.log(`   - isActive: ${course.isActive}`);
      console.log(`   - isPublished: ${course.isPublished || false}`);
      console.log(`   - السعر: ${course.paymentOptions?.[0]?.price || 'N/A'} جنيه`);
      console.log(`   - الأقسام: ${course.sections?.length || 0}`);
      console.log('');
    });
    
    if (unpublishedCourses > 0) {
      console.log('⚠️ ملاحظة: يوجد دورات غير منشورة!');
      console.log('💡 لعرضها في الصفحة الرئيسية، يجب نشرها من صفحة الأدمن.');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

checkCourses();
