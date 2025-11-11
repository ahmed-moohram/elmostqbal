// اختبار جلب كل الدورات بدون limit
async function testGetUnlimited() {
  try {
    console.log('🧪 Testing Get Unlimited Courses\n');
    
    // Login
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentPhone: 'admin',
        password: 'Admin@123'
      })
    });
    
    const loginData = await loginRes.json();
    const token = loginData.token;
    
    // Get with limit=100
    console.log('📊 Getting courses with limit=100...');
    const res = await fetch('http://localhost:5000/api/courses?limit=100', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    
    console.log(`✅ Found: ${data.courses.length} courses`);
    console.log(`📊 Total in DB: ${data.pagination.total}\n`);
    
    console.log('📋 All Courses:');
    data.courses.forEach((course, i) => {
      console.log(`   ${i + 1}. ${course.title}`);
      console.log(`      Published: ${course.isPublished || false}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testGetUnlimited();
