// اختبار كامل لإنشاء دورة

async function fullTest() {
  try {
    console.log('🚀 بدء الاختبار الكامل...\n');
    
    // ========================================
    // 1. تسجيل الدخول
    // ========================================
    console.log('1️⃣ تسجيل الدخول...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentPhone: '01111111111',
        password: 'Admin@123'
      })
    });
    
    const loginData = await loginRes.json();
    
    if (!loginData.token) {
      console.error('❌ فشل تسجيل الدخول:', loginData);
      return;
    }
    
    console.log('✅ تم تسجيل الدخول بنجاح');
    console.log('👤 المستخدم:', loginData.user.email);
    console.log('🔑 Token:', loginData.token.substring(0, 30) + '...\n');
    
    const token = loginData.token;
    
    // ========================================
    // 2. إنشاء دورة
    // ========================================
    console.log('2️⃣ إنشاء دورة جديدة...');
    
    const courseData = {
      title: '🎓 دورة اختبار كاملة - ' + new Date().toLocaleTimeString('ar-EG'),
      slug: 'test-full-' + Date.now(),
      description: 'هذا وصف تفصيلي كامل للدورة التعليمية الجديدة لاختبار النظام بشكل كامل',
      shortDescription: 'دورة تجريبية كاملة للاختبار',
      category: 'برمجة',
      level: 'beginner',
      language: 'ar',
      thumbnail: '/test-thumbnail.jpg',
      previewVideo: 'https://www.youtube.com/watch?v=test123',
      paymentOptions: [{
        type: 'onetime',
        price: 150,
        currency: 'EGP'
      }],
      sections: [{
        title: 'المقدمة الأساسية',
        description: 'مقدمة شاملة عن الدورة',
        order: 0,
        lessons: [{
          title: 'الدرس الأول - البداية',
          description: 'شرح تفصيلي للدرس الأول',
          videoUrl: 'https://www.youtube.com/watch?v=test123',
          duration: 15,
          order: 0,
          isPreview: true
        }]
      }],
      isPublished: false,
      isActive: true,
      accessibility: {
        hasLifetimeAccess: true,
        hasCertificate: true
      }
    };
    
    console.log('📦 بيانات الدورة:');
    console.log('   - العنوان:', courseData.title);
    console.log('   - الوصف:', courseData.description.substring(0, 50) + '...');
    console.log('   - السعر:', courseData.paymentOptions[0].price, 'جنيه');
    console.log('   - الأقسام:', courseData.sections.length);
    console.log('   - الدروس:', courseData.sections[0].lessons.length);
    console.log('');
    
    const createRes = await fetch('http://localhost:5000/api/courses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(courseData)
    });
    
    console.log('📊 Status:', createRes.status, createRes.statusText);
    
    const createResult = await createRes.json();
    
    if (!createRes.ok) {
      console.error('\n❌ فشل إنشاء الدورة!');
      console.error('Error:', createResult.error);
      console.error('Message:', createResult.message);
      if (createResult.validationErrors) {
        console.error('\nValidation Errors:');
        createResult.validationErrors.forEach(err => {
          console.error(`  - ${err.field}: ${err.message}`);
        });
      }
      return;
    }
    
    console.log('✅ تم إنشاء الدورة بنجاح!');
    console.log('📚 ID:', createResult.course._id);
    console.log('📖 العنوان:', createResult.course.title);
    console.log('');
    
    const courseId = createResult.course._id;
    
    // ========================================
    // 3. التحقق من الدورة في DB
    // ========================================
    console.log('3️⃣ التحقق من الدورة في قاعدة البيانات...');
    
    const mongoose = require('mongoose');
    await mongoose.connect('mongodb://localhost:27017/edufutura');
    
    const db = mongoose.connection.db;
    const coursesCollection = db.collection('courses');
    
    const courseInDB = await coursesCollection.findOne({ _id: new mongoose.Types.ObjectId(courseId) });
    
    if (courseInDB) {
      console.log('✅ الدورة موجودة في DB');
      console.log('   - ID:', courseInDB._id);
      console.log('   - العنوان:', courseInDB.title);
      console.log('   - isActive:', courseInDB.isActive);
      console.log('   - isPublished:', courseInDB.isPublished);
      console.log('   - السعر:', courseInDB.paymentOptions?.[0]?.price || 'N/A');
      console.log('');
    } else {
      console.log('❌ الدورة غير موجودة في DB!');
    }
    
    // ========================================
    // 4. جلب الدورات (كأدمن)
    // ========================================
    console.log('4️⃣ جلب الدورات (كأدمن)...');
    
    const getRes = await fetch('http://localhost:5000/api/courses', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const getData = await getRes.json();
    
    console.log('✅ تم جلب الدورات');
    console.log('📊 عدد الدورات:', getData.courses.length);
    
    if (getData.courses.length > 0) {
      console.log('\n📋 الدورات:');
      getData.courses.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.title}`);
        console.log(`      - ID: ${c._id}`);
        console.log(`      - منشورة: ${c.isPublished ? 'نعم' : 'لا'}`);
      });
    }
    
    await mongoose.disconnect();
    
    console.log('\n✅✅✅ الاختبار نجح بالكامل! ✅✅✅');
    
  } catch (error) {
    console.error('\n❌ خطأ في الاختبار:', error.message);
    console.error(error.stack);
  }
}

fullTest();
