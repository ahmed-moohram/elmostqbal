// فحص قاعدة البيانات والبيانات الموجودة
const mongoose = require('mongoose');
require('dotenv').config();

const checkDatabase = async () => {
  try {
    console.log('🔍 جاري الاتصال بقاعدة البيانات...');
    
    // الاتصال بـ MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/educational-platform';
    await mongoose.connect(mongoUri);
    
    console.log('✅ تم الاتصال بنجاح!');
    console.log('📊 جاري فحص البيانات...\n');
    
    // فحص المجموعات (Collections)
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log(`📁 عدد المجموعات: ${collections.length}`);
    console.log('المجموعات الموجودة:');
    collections.forEach(coll => console.log(`  - ${coll.name}`));
    console.log('');
    
    // فحص الدورات
    const Course = mongoose.connection.collection('courses');
    const coursesCount = await Course.countDocuments();
    console.log(`📚 عدد الدورات: ${coursesCount}`);
    
    if (coursesCount > 0) {
      const sampleCourse = await Course.findOne();
      console.log('📖 مثال على دورة:');
      console.log(JSON.stringify(sampleCourse, null, 2).substring(0, 500) + '...');
    } else {
      console.log('⚠️ لا توجد دورات في قاعدة البيانات!');
      console.log('💡 يجب إضافة دورات من لوحة التحكم');
    }
    
    console.log('');
    
    // فحص المستخدمين
    const User = mongoose.connection.collection('users');
    const usersCount = await User.countDocuments();
    console.log(`👥 عدد المستخدمين: ${usersCount}`);
    
    // فحص الطلاب
    const Student = mongoose.connection.collection('students');
    const studentsCount = await Student.countDocuments();
    console.log(`🎓 عدد الطلاب: ${studentsCount}`);
    
    // فحص المدرسين
    const Teacher = mongoose.connection.collection('teachers');
    const teachersCount = await Teacher.countDocuments();
    console.log(`👨‍🏫 عدد المدرسين: ${teachersCount}`);
    
    console.log('\n✅ انتهى الفحص!');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

checkDatabase();
