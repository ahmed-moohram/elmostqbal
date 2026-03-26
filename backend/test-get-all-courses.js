// اختبار جلب كل الدورات كـ Admin
async function testGetAllCourses() {
  try {
    console.log('🧪 Testing Get All Courses as Admin\n');
    
    // 1. Login
    console.log('1️⃣ Login...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentPhone: 'admin',
        password: 'Admin@123'
      })
    });
    
    const loginData = await loginRes.json();
    if (!loginData.token) {
      console.log('❌ Login failed');
      return;
    }
    
    console.log('✅ Login successful\n');
    const token = loginData.token;
    
    // 2. Get courses WITHOUT token (as guest)
    console.log('2️⃣ Getting courses WITHOUT token (as guest)...');
    const guestRes = await fetch('http://localhost:5000/api/courses', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const guestData = await guestRes.json();
    console.log(`   Guest sees: ${guestData.courses.length} courses`);
    console.log(`   (Only published courses)\n`);
    
    // 3. Get courses WITH token (as admin)
    console.log('3️⃣ Getting courses WITH token (as admin)...');
    const adminRes = await fetch('http://localhost:5000/api/courses', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const adminData = await adminRes.json();
    console.log(`   Admin sees: ${adminData.courses.length} courses`);
    console.log(`   (All active courses)\n`);
    
    // 4. Show comparison
    console.log('==========================================');
    console.log('📊 Comparison:');
    console.log(`   Guest: ${guestData.courses.length} courses (published only)`);
    console.log(`   Admin: ${adminData.courses.length} courses (all active)`);
    console.log('==========================================\n');
    
    // 5. Show first 5 admin courses
    console.log('📋 First 5 Admin Courses:');
    adminData.courses.slice(0, 5).forEach((course, i) => {
      console.log(`   ${i + 1}. ${course.title}`);
      console.log(`      Published: ${course.isPublished || false}`);
      console.log(`      Active: ${course.isActive !== false}`);
    });
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testGetAllCourses();
