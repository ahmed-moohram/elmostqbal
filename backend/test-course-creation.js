// استخدام fetch المدمج في Node.js 18+

async function testCourseCreation() {
  try {
    console.log('🔐 تسجيل الدخول...');
    
    // 1. Login to get token
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentPhone: '01111111111',
        password: 'Test@123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginData.token) {
      console.error('❌ فشل تسجيل الدخول:', loginData);
      return;
    }
    
    console.log('✅ تم تسجيل الدخول بنجاح');
    console.log('👤 المستخدم:', loginData.user.email);
    console.log('🔑 Token:', loginData.token.substring(0, 20) + '...');
    
    // 2. Create course
    console.log('\n📝 إنشاء دورة تجريبية...');
    
    const courseData = {
      title: 'دورة تجريبية - اختبار',
      slug: 'test-course-' + Date.now(),
      description: 'هذا وصف تجريبي للدورة لاختبار إنشاء الدورات في النظام',
      shortDescription: 'دورة تجريبية للاختبار',
      category: 'رياضيات',
      level: 'beginner',
      language: 'ar',
      thumbnail: '/test-thumbnail.jpg',
      previewVideo: '',
      paymentOptions: [{
        type: 'onetime',
        price: 100,
        currency: 'EGP'
      }],
      sections: [{
        title: 'المقدمة',
        description: 'مقدمة الدورة',
        order: 0,
        lessons: [{
          title: 'الدرس الأول',
          description: 'وصف الدرس الأول',
          videoUrl: 'https://youtube.com/watch?v=test',
          duration: 10,
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
    
    const courseResponse = await fetch('http://localhost:5000/api/courses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      },
      body: JSON.stringify(courseData)
    });
    
    const courseResult = await courseResponse.json();
    
    if (!courseResponse.ok) {
      console.error('❌ فشل إنشاء الدورة:');
      console.error('Status:', courseResponse.status);
      console.error('Error:', courseResult);
      return;
    }
    
    console.log('✅ تم إنشاء الدورة بنجاح!');
    console.log('📚 معرف الدورة:', courseResult.course._id);
    console.log('📖 عنوان الدورة:', courseResult.course.title);
    console.log('\n🎉 الاختبار نجح بالكامل!');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
  }
}

testCourseCreation();
