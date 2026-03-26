// اختبار مباشر لإنشاء دورة
async function directCreateTest() {
  try {
    console.log('🚀 Direct POST Test - Creating Course\n');
    
    // 1. Login first
    console.log('1. Login...');
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
      console.error('❌ Login failed:', loginData);
      return;
    }
    
    console.log('✅ Login successful');
    console.log('Token:', loginData.token.substring(0, 30) + '...\n');
    
    const token = loginData.token;
    
    // 2. Create course
    console.log('2. Creating course...');
    
    const courseData = {
      title: 'TEST DIRECT COURSE ' + new Date().toLocaleTimeString(),
      slug: 'test-direct-' + Date.now(),
      description: 'This is a test description for direct course creation',
      shortDescription: 'Test course',
      category: 'برمجة',
      level: 'beginner',
      language: 'ar',
      thumbnail: '/test.jpg',
      previewVideo: 'https://youtube.com/test',
      paymentOptions: [{
        type: 'onetime',
        price: 100,
        currency: 'EGP'
      }],
      sections: [{
        title: 'Test Section',
        description: 'Test section description',
        order: 0,
        lessons: [{
          title: 'Test Lesson',
          description: 'Test lesson description',
          videoUrl: 'https://youtube.com/test',
          duration: 10,
          order: 0,
          isPreview: false
        }]
      }],
      isPublished: false,
      isActive: true,
      accessibility: {
        hasLifetimeAccess: true,
        hasCertificate: true
      }
    };
    
    console.log('Course data prepared');
    console.log('Title:', courseData.title);
    console.log('Sections:', courseData.sections.length);
    console.log('\nSending POST request...\n');
    
    const createRes = await fetch('http://localhost:5000/api/courses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(courseData)
    });
    
    console.log('Response Status:', createRes.status, createRes.statusText);
    
    const createData = await createRes.json();
    
    console.log('\nResponse Body:');
    console.log(JSON.stringify(createData, null, 2));
    
    if (createRes.ok) {
      console.log('\n✅✅✅ SUCCESS! Course created! ✅✅✅');
      console.log('Course ID:', createData.course?._id);
    } else {
      console.log('\n❌ FAILED!');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

directCreateTest();
