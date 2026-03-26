// اختبار فوري لإنشاء دورة

async function quickTest() {
  try {
    // استخدام التوكن الموجود
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGU4NDQ4NjlhMmM5YTg3OWUwZTllYWUiLCJpYXQiOjE3NjAxMTA5NDAsImV4cCI6MTc2MDE5NzM0MH0.RH5vYoWbMjCpQH7d4u4RLfPUlQzB8bOJmZhHfQ-WPWo';
    
    console.log('🚀 محاولة إنشاء دورة...\n');
    
    const courseData = {
      title: 'Test Course ' + Date.now(),
      slug: 'test-' + Date.now(),
      description: 'وصف تفصيلي للدورة يجب أن يكون أكثر من عشرين حرف على الأقل',
      shortDescription: 'دورة تجريبية',
      category: 'رياضيات',
      level: 'beginner',
      language: 'ar',
      thumbnail: '/test.jpg',
      paymentOptions: [{
        type: 'onetime',
        price: 99,
        currency: 'EGP'
      }],
      sections: [{
        title: 'المقدمة',
        order: 0,
        lessons: [{
          title: 'الدرس الأول',
          description: 'وصف',
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
    
    const response = await fetch('http://localhost:5000/api/courses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(courseData)
    });
    
    console.log('Status:', response.status, response.statusText);
    
    const text = await response.text();
    console.log('\nResponse:', text);
    
    if (response.ok) {
      console.log('\n✅✅✅ نجح! تم إنشاء الدورة! ✅✅✅');
    } else {
      console.log('\n❌ فشل! راجع الخطأ أعلاه');
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

quickTest();
