// إضافة slug للدورات الموجودة
const mongoose = require('mongoose');
require('dotenv').config();

const fixCourses = async () => {
  try {
    console.log('🔍 جاري الاتصال بقاعدة البيانات...');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/educational-platform';
    await mongoose.connect(mongoUri);
    
    console.log('✅ تم الاتصال بنجاح!');
    
    const Course = mongoose.connection.collection('courses');
    const courses = await Course.find({}).toArray();
    
    console.log(`📚 عدد الدورات: ${courses.length}`);
    
    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      // إنشاء slug من العنوان أو استخدام ID
      let slug = course.slug;
      
      if (!slug) {
        // إنشاء slug بسيط من العنوان مع رقم فريد
        if (course.title.includes('رياضيات')) {
          slug = `mathematics-${course._id.toString().slice(-6)}`;
        } else if (course.title.includes('فيزياء')) {
          slug = `physics-${course._id.toString().slice(-6)}`;
        } else if (course.title.includes('كيمياء')) {
          slug = `chemistry-${course._id.toString().slice(-6)}`;
        } else {
          // استخدام ID كـ slug
          slug = course._id.toString();
        }
        
        // تحديث الدورة
        await Course.updateOne(
          { _id: course._id },
          { $set: { slug: slug } }
        );
        
        console.log(`✅ تم إضافة slug للدورة: ${course.title} → ${slug}`);
      } else {
        console.log(`ℹ️ الدورة لديها slug بالفعل: ${course.title} → ${slug}`);
      }
    }
    
    console.log('\n🎉 تم! جميع الدورات لديها slug الآن');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

fixCourses();
