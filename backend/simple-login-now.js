// اختبار login بسيط جداً
async function simpleLogin() {
  try {
    console.log('🔐 Testing Login with "admin"...\n');
    
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        studentPhone: 'admin',
        password: 'Admin@123'
      })
    });
    
    console.log('Status:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('\nResponse:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.token) {
      console.log('\n✅✅✅ SUCCESS! Login worked!');
      console.log('Token:', data.token.substring(0, 40) + '...');
      console.log('User:', data.user.name, '|', data.user.role);
    } else {
      console.log('\n❌ FAILED!');
      console.log('Error:', data.error);
      console.log('Message:', data.message);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

simpleLogin();
