// Test API and watch Backend logs
async function testAPIWithLogs() {
  try {
    console.log('🧪 Testing API - Check Backend Terminal for logs!\n');
    console.log('==========================================\n');
    
    // 1. Login
    console.log('1️⃣ Logging in as admin...');
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
    console.log('✅ Login successful');
    console.log(`User: ${loginData.user.name} (${loginData.user.role})\n`);
    
    // 2. Get courses WITH token as admin
    console.log('2️⃣ Getting courses WITH admin token...');
    console.log('⏳ Check Backend Terminal NOW!\n');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const res = await fetch('http://localhost:5000/api/courses', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    
    console.log('==========================================');
    console.log('📊 API Response:');
    console.log(`   Courses: ${data.courses.length}`);
    console.log(`   Total: ${data.pagination.total}`);
    console.log(`   Page: ${data.pagination.page}`);
    console.log(`   Limit: ${data.pagination.limit}`);
    console.log('==========================================\n');
    
    console.log('📋 Courses received:');
    data.courses.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.title}`);
      console.log(`      Published: ${c.isPublished || false}`);
    });
    
    console.log('\n⚠️  NOW CHECK BACKEND LOGS ABOVE!');
    console.log('   Look for:');
    console.log('   [GET COURSES] START');
    console.log('   [USER] ...');
    console.log('   [IS ADMIN] ...');
    console.log('   [QUERY] ...');
    console.log('   [FOUND] ...\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPIWithLogs();
