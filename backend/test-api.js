const http = require('http');

function makeRequest(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

const testAPI = async () => {
  try {
    console.log('🔍 اختبار API...\n');

    // 1. محاولة تسجيل الدخول
    console.log('1️⃣ محاولة تسجيل الدخول...');
    const loginResponse = await makeRequest('/api/auth/login', 'POST', {
      studentPhone: 'admin',
      password: 'admin123'
    });
    
    if (loginResponse.status !== 200) {
      console.error('❌ فشل تسجيل الدخول:', loginResponse.data);
      return;
    }
    
    console.log('✅ تسجيل الدخول نجح!');
    console.log('User:', loginResponse.data.user);
    
    const token = loginResponse.data.token;
    
    // 2. اختبار الإحصائيات
    console.log('\n2️⃣ محاولة جلب الإحصائيات...');
    const statsResponse = await makeRequest('/api/admin/stats', 'GET', null, token);
    
    if (statsResponse.status !== 200) {
      console.error('❌ فشل جلب الإحصائيات:');
      console.error('Status:', statsResponse.status);
      console.error('Data:', statsResponse.data);
      return;
    }
    
    console.log('✅ الإحصائيات نجحت!');
    console.log('Stats:', JSON.stringify(statsResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
};

testAPI();
