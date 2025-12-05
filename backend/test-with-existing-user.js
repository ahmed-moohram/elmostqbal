// اختبار مع المستخدم الموجود في قاعدة البيانات

async function testWithExistingUser() {
  try {
    console.log('🔐 محاولة تسجيل الدخول بالمستخدم الأساسي...');
    
    // محاولة مع المستخدم الأساسي
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentPhone: '01111111111',
        password: 'Test@123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('\n📋 استجابة Login:', JSON.stringify(loginData, null, 2));
    
    if (!loginData.token) {
      console.error('\n❌ فشل تسجيل الدخول');
      return;
    }
    
    console.log('\n✅ تم تسجيل الدخول بنجاح!');
    console.log('👤 المستخدم:', loginData.user.email);
    console.log('🔑 Token:', loginData.token.substring(0, 30) + '...');
    
    // الآن جرب إنشاء دورة
    console.log('\n📝 محاولة إنشاء دورة...\n');
    
    const courseData = {
      title: '🎓 دورة اختبار - ' + new Date().toLocaleTimeString('ar-EG'),
      slug: 'test-' + Date.now(),
      description: 'وصف تفصيلي للدورة - يجب أن يكون أكثر من 20 حرف لاجتياز validation',
      shortDescription: 'دورة تجريبية قصيرة',
      category: 'رياضيات',
      level: 'beginner',
      language: 'ar',
      thumbnail: '/test.jpg',
      paymentOptions: [{
        type: 'onetime',
        price: 99
      }],
      sections: [{
        title: 'المقدمة',
        order: 0,
        lessons: [{
          title: 'الدرس الأول',
          description: 'وصف الدرس',
          videoUrl: 'https://youtube.com/watch?v=test',
          duration: 5,
          order: 0,
          isPreview: true
        }]
      }],
      isPublished: false,
      isActive: true,
      accessibility: {
        hasLifetimeAccess: true,
        hasCertificate: false
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
    
    console.log('📊 Status:', courseResponse.status);
    console.log('📋 Response:', JSON.stringify(courseResult, null, 2));
    
    if (!courseResponse.ok) {
      console.error('\n❌ فشل إنشاء الدورة!');
      return;
    }
    
    console.log('\n✅✅✅ نجح! تم إنشاء الدورة! ✅✅✅');
    console.log('📚 ID:', courseResult.course._id);
    console.log('📖 العنوان:', courseResult.course.title);
    
  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
  }
}

testWithExistingUser();
