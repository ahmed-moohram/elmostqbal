// اختبار بسيط لجلب الدورات
async function testGetCourses() {
  try {
    console.log('🔍 Testing GET /api/courses...\n');
    
    const response = await fetch('http://localhost:5000/api/courses');
    
    console.log('Status:', response.status, response.statusText);
    
    const data = await response.json();
    
    console.log('\nResponse:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\nCourses count:', data.courses?.length || 0);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testGetCourses();
