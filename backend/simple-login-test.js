// اختبار بسيط جداً للـ login

async function simpleLoginTest() {
  try {
    console.log('🔐 اختبار تسجيل الدخول البسيط...\n');
    
    const loginData = {
      studentPhone: '01111111111',
      password: 'Admin@123'
    };
    
    console.log('📤 إرسال طلب login:');
    console.log('   - studentPhone:', loginData.studentPhone);
    console.log('   - password:', loginData.password);
    console.log('');
    
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });
    
    console.log('📊 Status:', response.status, response.statusText);
    console.log('');
    
    const result = await response.json();
    
    console.log('📋 Response:');
    console.log(JSON.stringify(result, null, 2));
    console.log('');
    
    if (result.token) {
      console.log('✅✅✅ نجح! تم الحصول على Token! ✅✅✅');
      console.log('🔑 Token:', result.token.substring(0, 50) + '...');
    } else {
      console.log('❌ فشل! لا يوجد Token');
      console.log('Error:', result.error);
      console.log('Message:', result.message);
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

simpleLoginTest();
