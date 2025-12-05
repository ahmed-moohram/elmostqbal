// اختبار كامل ومعالجة المشاكل
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function completeFix() {
  try {
    console.log('🔧 Complete Fix & Test\n');
    console.log('==========================================\n');
    
    // 1. Connect to DB (use same URI as backend)
    require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/edufutura';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    console.log('📡 Using:', mongoUri.includes('mongodb+srv') ? 'Cloud Database (Atlas)' : 'Local Database');
    console.log('');
    
    const db = mongoose.connection.db;
    
    // 2. Check users
    console.log('1️⃣ Checking users...');
    const usersCollection = db.collection('users');
    const allUsers = await usersCollection.find({}).toArray();
    
    console.log(`   Total users: ${allUsers.length}`);
    allUsers.forEach(u => {
      console.log(`   - ${u.name} | Phone: ${u.studentPhone} | Email: ${u.email} | Role: ${u.role}`);
    });
    console.log('');
    
    // 3. Create/Update admin user
    console.log('2️⃣ Ensuring admin user...');
    
    const adminPhone = 'admin';
    const adminPassword = 'Admin@123';
    
    let admin = await usersCollection.findOne({ studentPhone: adminPhone });
    
    if (!admin) {
      console.log('   Creating new admin user...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      await usersCollection.insertOne({
        name: 'Test Admin',
        fatherName: 'Admin',
        studentPhone: adminPhone,
        parentPhone: adminPhone,
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'admin',
        isVerified: true,
        createdAt: new Date()
      });
      
      console.log('   ✅ Admin user created');
    } else {
      console.log('   Admin exists, updating password...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      await usersCollection.updateOne(
        { studentPhone: adminPhone },
        { $set: { password: hashedPassword, role: 'admin' } }
      );
      
      console.log('   ✅ Admin password updated');
    }
    
    admin = await usersCollection.findOne({ studentPhone: adminPhone });
    const passwordMatch = await bcrypt.compare(adminPassword, admin.password);
    
    console.log('   Phone:', adminPhone);
    console.log('   Password:', adminPassword);
    console.log('   Password Match:', passwordMatch ? '✅' : '❌');
    console.log('');
    
    // 4. Check courses
    console.log('3️⃣ Checking courses...');
    const coursesCollection = db.collection('courses');
    const allCourses = await coursesCollection.find({}).toArray();
    
    console.log(`   Total courses: ${allCourses.length}`);
    if (allCourses.length > 0) {
      allCourses.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.title} | Active: ${c.isActive} | Published: ${c.isPublished}`);
      });
    } else {
      console.log('   No courses found');
    }
    console.log('');
    
    // 5. Test Login via API (if server is running)
    console.log('4️⃣ Testing login API...');
    try {
      const loginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentPhone: adminPhone,
          password: adminPassword
        })
      });
      
      if (loginRes.ok) {
        const loginData = await loginRes.json();
        console.log('   ✅ Login successful!');
        console.log('   Token:', loginData.token.substring(0, 30) + '...');
        console.log('   User:', loginData.user.name, '|', loginData.user.role);
        
        const token = loginData.token;
        
        // 6. Test Create Course
        console.log('\n5️⃣ Testing course creation...');
        
        const courseData = {
          title: 'FULL TEST COURSE ' + new Date().toLocaleTimeString('ar-EG'),
          slug: 'full-test-' + Date.now(),
          description: 'وصف تفصيلي كامل للدورة التجريبية لاختبار النظام بشكل شامل',
          shortDescription: 'دورة تجريبية شاملة',
          category: 'برمجة',
          level: 'beginner',
          language: 'ar',
          thumbnail: '/test.jpg',
          previewVideo: 'https://youtube.com/test',
          paymentOptions: [{
            type: 'onetime',
            price: 199,
            currency: 'EGP'
          }],
          sections: [{
            title: 'القسم الأول',
            description: 'وصف القسم الأول',
            order: 0,
            lessons: [{
              title: 'الدرس الأول',
              description: 'وصف الدرس الأول',
              videoUrl: 'https://youtube.com/watch?v=test',
              duration: 15,
              order: 0,
              isPreview: true
            }]
          }],
          isPublished: true,
          isActive: true,
          accessibility: {
            hasLifetimeAccess: true,
            hasCertificate: true
          }
        };
        
        const createRes = await fetch('http://localhost:5000/api/courses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(courseData)
        });
        
        console.log('   Status:', createRes.status, createRes.statusText);
        
        const createData = await createRes.json();
        
        if (createRes.ok) {
          console.log('   ✅ Course created!');
          console.log('   Course ID:', createData.course._id);
          console.log('   Title:', createData.course.title);
          
          // 7. Verify in DB
          console.log('\n6️⃣ Verifying in database...');
          const dbCourse = await coursesCollection.findOne({ _id: new mongoose.Types.ObjectId(createData.course._id) });
          if (dbCourse) {
            console.log('   ✅ Course found in DB!');
            console.log('   Title:', dbCourse.title);
            console.log('   isActive:', dbCourse.isActive);
            console.log('   isPublished:', dbCourse.isPublished);
          } else {
            console.log('   ❌ Course NOT found in DB!');
          }
          
        } else {
          console.log('   ❌ Course creation failed!');
          console.log('   Error:', createData.message);
          if (createData.validationErrors) {
            console.log('   Validation errors:', createData.validationErrors);
          }
        }
        
      } else {
        const loginData = await loginRes.json();
        console.log('   ❌ Login failed!');
        console.log('   Error:', loginData.message);
      }
      
    } catch (apiError) {
      console.log('   ⚠️ Server not running or API error');
      console.log('   Error:', apiError.message);
      console.log('\n   💡 Please start the server with: npm run dev');
    }
    
    await mongoose.disconnect();
    
    console.log('\n==========================================');
    console.log('✅ Fix & Test Complete!\n');
    
    console.log('📝 Summary:');
    console.log(`   - Users in DB: ${allUsers.length}`);
    console.log(`   - Courses in DB: ${allCourses.length}`);
    console.log(`   - Admin ready: ✅`);
    console.log(`   - Login: Phone: ${adminPhone}, Password: ${adminPassword}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
  }
}

completeFix();
