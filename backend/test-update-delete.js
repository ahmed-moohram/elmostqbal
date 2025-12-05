// اختبار UPDATE و DELETE
async function testUpdateDelete() {
  try {
    console.log('🧪 Testing UPDATE & DELETE\n');
    console.log('==========================================\n');
    
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
      console.log('❌ Login failed:', loginData.message);
      return;
    }
    
    console.log('✅ Login successful');
    console.log('Token:', loginData.token.substring(0, 30) + '...\n');
    
    const token = loginData.token;
    
    // 2. Get courses
    console.log('2️⃣ Getting courses...');
    const coursesRes = await fetch('http://localhost:5000/api/courses', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const coursesData = await coursesRes.json();
    console.log(`Found ${coursesData.courses.length} courses`);
    
    if (coursesData.courses.length === 0) {
      console.log('❌ No courses to test with!');
      return;
    }
    
    const testCourse = coursesData.courses[0];
    console.log(`Test course: ${testCourse.title} (ID: ${testCourse._id})\n`);
    
    // 3. Test PATCH (toggle publish)
    console.log('3️⃣ Testing PATCH (toggle publish)...');
    const newPublishStatus = !testCourse.isPublished;
    
    const patchRes = await fetch(`http://localhost:5000/api/courses/${testCourse._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        isPublished: newPublishStatus
      })
    });
    
    console.log('PATCH Status:', patchRes.status, patchRes.statusText);
    
    if (patchRes.ok) {
      const patchData = await patchRes.json();
      console.log('✅ PATCH Success!');
      console.log('isPublished:', testCourse.isPublished, '→', patchData.course.isPublished);
    } else {
      const errorData = await patchRes.json();
      console.log('❌ PATCH Failed!');
      console.log('Error:', errorData.message);
    }
    
    console.log('');
    
    // 4. Test DELETE
    console.log('4️⃣ Testing DELETE...');
    console.log('⚠️  This will soft-delete the course (set isActive = false)');
    
    const deleteRes = await fetch(`http://localhost:5000/api/courses/${testCourse._id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('DELETE Status:', deleteRes.status, deleteRes.statusText);
    
    if (deleteRes.ok) {
      const deleteData = await deleteRes.json();
      console.log('✅ DELETE Success!');
      console.log('Message:', deleteData.message);
    } else {
      const errorData = await deleteRes.json();
      console.log('❌ DELETE Failed!');
      console.log('Error:', errorData.message);
    }
    
    console.log('\n==========================================');
    console.log('✅ Test Complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testUpdateDelete();
