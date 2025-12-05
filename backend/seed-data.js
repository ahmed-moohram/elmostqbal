const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seedData = async () => {
  try {
    console.log('🌱 جاري إضافة البيانات التجريبية...\n');

    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/edufutura';
    await mongoose.connect(mongoUri);

    const User = mongoose.connection.collection('users');
    const Course = mongoose.connection.collection('courses');

    // حذف البيانات القديمة (ماعدا Admin)
    await User.deleteMany({ role: { $ne: 'admin' } });
    await Course.deleteMany({});
    console.log('🗑️  تم حذف البيانات القديمة\n');

    // تشفير كلمة مرور موحدة للجميع
    const hashedPassword = await bcrypt.hash('123456', 10);

    // ==================== إضافة مدرسين ====================
    console.log('👨‍🏫 إضافة مدرسين...');
    const teachers = [
      {
        name: 'أحمد محمود',
        fatherName: 'محمود',
        studentPhone: '01012345678',
        parentPhone: '01012345678',
        phone: '01012345678',
        specialty: 'الرياضيات',
        password: hashedPassword,
        role: 'teacher',
        email: 'ahmed@teacher.com',
        image: 'https://i.pravatar.cc/150?img=12',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'فاطمة حسن',
        fatherName: 'حسن',
        studentPhone: '01123456789',
        parentPhone: '01123456789',
        phone: '01123456789',
        specialty: 'العلوم',
        password: hashedPassword,
        role: 'teacher',
        email: 'fatma@teacher.com',
        image: 'https://i.pravatar.cc/150?img=20',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'محمد علي',
        fatherName: 'علي',
        studentPhone: '01234567890',
        parentPhone: '01234567890',
        phone: '01234567890',
        specialty: 'البرمجة',
        password: hashedPassword,
        role: 'teacher',
        email: 'mohamed@teacher.com',
        image: 'https://i.pravatar.cc/150?img=33',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    const insertedTeachers = [];
    for (const teacher of teachers) {
      const result = await User.insertOne(teacher);
      insertedTeachers.push({ _id: result.insertedId, ...teacher });
    }
    console.log(`✅ تم إضافة ${insertedTeachers.length} مدرسين\n`);

    // ==================== إضافة طلاب ====================
    console.log('👨‍🎓 إضافة طلاب...');
    const students = [
      {
        name: 'علي أحمد',
        fatherName: 'أحمد',
        studentPhone: '01555555555',
        parentPhone: '01555555556',
        password: hashedPassword,
        role: 'student',
        gradeLevel: 'الصف الأول الثانوي',
        schoolName: 'مدرسة النور',
        city: 'القاهرة',
        email: 'ali@student.com',
        image: 'https://i.pravatar.cc/150?img=8',
        enrolledCourses: [],
        purchasedBooks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'سارة محمد',
        fatherName: 'محمد',
        studentPhone: '01666666666',
        parentPhone: '01666666667',
        password: hashedPassword,
        role: 'student',
        gradeLevel: 'الصف الثاني الثانوي',
        schoolName: 'مدرسة الأمل',
        city: 'الإسكندرية',
        email: 'sara@student.com',
        image: 'https://i.pravatar.cc/150?img=23',
        enrolledCourses: [],
        purchasedBooks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'يوسف خالد',
        fatherName: 'خالد',
        studentPhone: '01777777777',
        parentPhone: '01777777778',
        password: hashedPassword,
        role: 'student',
        gradeLevel: 'الصف الثالث الثانوي',
        schoolName: 'مدرسة المستقبل',
        city: 'الجيزة',
        email: 'youssef@student.com',
        image: 'https://i.pravatar.cc/150?img=15',
        enrolledCourses: [],
        purchasedBooks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'نور الدين',
        fatherName: 'عبد الله',
        studentPhone: '01888888888',
        parentPhone: '01888888889',
        password: hashedPassword,
        role: 'student',
        gradeLevel: 'الصف الأول الثانوي',
        schoolName: 'مدرسة التفوق',
        city: 'القاهرة',
        email: 'noor@student.com',
        image: 'https://i.pravatar.cc/150?img=52',
        enrolledCourses: [],
        purchasedBooks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'ليلى سعيد',
        fatherName: 'سعيد',
        studentPhone: '01999999999',
        parentPhone: '01999999990',
        password: hashedPassword,
        role: 'student',
        gradeLevel: 'الصف الثاني الثانوي',
        schoolName: 'مدرسة النجاح',
        city: 'المنصورة',
        email: 'laila@student.com',
        image: 'https://i.pravatar.cc/150?img=47',
        enrolledCourses: [],
        purchasedBooks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    const insertedStudents = [];
    for (const student of students) {
      const result = await User.insertOne(student);
      insertedStudents.push({ _id: result.insertedId, ...student });
    }
    console.log(`✅ تم إضافة ${insertedStudents.length} طلاب\n`);

    // ==================== إضافة كورسات ====================
    console.log('📚 إضافة كورسات مع فيديوهات...');
    
    const courses = [
      {
        title: 'أساسيات الرياضيات - الصف الأول الثانوي',
        description: 'كورس شامل يغطي جميع أساسيات الرياضيات للصف الأول الثانوي بطريقة مبسطة وسهلة',
        shortDescription: 'تعلم أساسيات الرياضيات بطريقة مبسطة',
        instructor: insertedTeachers[0]._id,
        instructorName: 'أحمد محمود',
        category: 'الرياضيات',
        level: 'beginner',
        price: 299,
        thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
        previewVideo: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        rating: 4.8,
        enrolledStudents: 0,
        sections: [
          {
            title: 'المقدمة والأساسيات',
            description: 'نبدأ بالأساسيات والمفاهيم الأولية',
            order: 0,
            lessons: [
              {
                title: 'مقدمة عن الرياضيات',
                description: 'فهم أهمية الرياضيات في حياتنا اليومية',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duration: 15,
                order: 0,
                isPreview: true
              },
              {
                title: 'الأعداد الحقيقية',
                description: 'شرح تفصيلي للأعداد الحقيقية وخواصها',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duration: 25,
                order: 1,
                isPreview: false
              }
            ]
          },
          {
            title: 'الجبر',
            description: 'دراسة المعادلات والمتباينات',
            order: 1,
            lessons: [
              {
                title: 'المعادلات الخطية',
                description: 'حل المعادلات الخطية بطرق مختلفة',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duration: 30,
                order: 0,
                isPreview: false
              },
              {
                title: 'المعادلات التربيعية',
                description: 'طرق حل المعادلات التربيعية',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duration: 35,
                order: 1,
                isPreview: false
              }
            ]
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'علوم الطبيعة والحياة',
        description: 'استكشف عجائب العلوم من خلال تجارب عملية وشروحات مبسطة',
        shortDescription: 'اكتشف أسرار العلوم بطريقة ممتعة',
        instructor: insertedTeachers[1]._id,
        instructorName: 'فاطمة حسن',
        category: 'العلوم',
        level: 'intermediate',
        price: 349,
        thumbnail: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800',
        previewVideo: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        rating: 4.9,
        enrolledStudents: 0,
        sections: [
          {
            title: 'الفيزياء الأساسية',
            description: 'مفاهيم الفيزياء الأساسية',
            order: 0,
            lessons: [
              {
                title: 'الحركة والسرعة',
                description: 'فهم قوانين الحركة',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duration: 20,
                order: 0,
                isPreview: true
              },
              {
                title: 'القوة والطاقة',
                description: 'شرح مفاهيم القوة والطاقة',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duration: 28,
                order: 1,
                isPreview: false
              }
            ]
          },
          {
            title: 'الكيمياء',
            description: 'أساسيات الكيمياء',
            order: 1,
            lessons: [
              {
                title: 'الذرة والجزيء',
                description: 'بنية الذرة والجزيئات',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duration: 22,
                order: 0,
                isPreview: false
              }
            ]
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'البرمجة للمبتدئين - Python',
        description: 'ابدأ رحلتك في عالم البرمجة مع لغة Python من الصفر حتى الاحتراف',
        shortDescription: 'تعلم البرمجة من الصفر',
        instructor: insertedTeachers[2]._id,
        instructorName: 'محمد علي',
        category: 'البرمجة',
        level: 'beginner',
        price: 399,
        thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
        previewVideo: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        rating: 5.0,
        enrolledStudents: 0,
        sections: [
          {
            title: 'البداية مع Python',
            description: 'تثبيت Python والبدء بالأساسيات',
            order: 0,
            lessons: [
              {
                title: 'تثبيت Python وإعداد البيئة',
                description: 'خطوات تثبيت Python على جهازك',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duration: 12,
                order: 0,
                isPreview: true
              },
              {
                title: 'أول برنامج لك - Hello World',
                description: 'كتابة وتشغيل أول برنامج',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duration: 18,
                order: 1,
                isPreview: true
              },
              {
                title: 'المتغيرات وأنواع البيانات',
                description: 'فهم المتغيرات وأنواعها في Python',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duration: 25,
                order: 2,
                isPreview: false
              }
            ]
          },
          {
            title: 'هياكل التحكم',
            description: 'الشروط والحلقات',
            order: 1,
            lessons: [
              {
                title: 'الجمل الشرطية - If/Else',
                description: 'استخدام الشروط في البرمجة',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duration: 30,
                order: 0,
                isPreview: false
              },
              {
                title: 'الحلقات - Loops',
                description: 'For و While loops',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duration: 32,
                order: 1,
                isPreview: false
              }
            ]
          },
          {
            title: 'الدوال والوحدات',
            description: 'إنشاء واستخدام الدوال',
            order: 2,
            lessons: [
              {
                title: 'إنشاء الدوال',
                description: 'كيفية كتابة الدوال في Python',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duration: 28,
                order: 0,
                isPreview: false
              }
            ]
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'اللغة الإنجليزية - المستوى المتوسط',
        description: 'حسّن مهاراتك في اللغة الإنجليزية مع دروس تفاعلية ومحادثات عملية',
        shortDescription: 'أتقن اللغة الإنجليزية بسهولة',
        instructor: insertedTeachers[0]._id,
        instructorName: 'أحمد محمود',
        category: 'اللغات',
        level: 'intermediate',
        price: 279,
        thumbnail: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800',
        previewVideo: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        rating: 4.7,
        enrolledStudents: 0,
        sections: [
          {
            title: 'Grammar Basics',
            description: 'القواعد الأساسية',
            order: 0,
            lessons: [
              {
                title: 'Present Tenses',
                description: 'الأزمنة الحاضرة',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duration: 20,
                order: 0,
                isPreview: true
              },
              {
                title: 'Past Tenses',
                description: 'الأزمنة الماضية',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duration: 22,
                order: 1,
                isPreview: false
              }
            ]
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'التاريخ الإسلامي',
        description: 'رحلة في التاريخ الإسلامي من البداية حتى العصر الحديث',
        shortDescription: 'اكتشف تاريخنا الإسلامي العظيم',
        instructor: insertedTeachers[1]._id,
        instructorName: 'فاطمة حسن',
        category: 'التاريخ',
        level: 'all-levels',
        price: 249,
        thumbnail: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800',
        previewVideo: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        rating: 4.9,
        enrolledStudents: 0,
        sections: [
          {
            title: 'العصر النبوي',
            description: 'السيرة النبوية',
            order: 0,
            lessons: [
              {
                title: 'مولد النبي ﷺ',
                description: 'قصة مولد الرسول الكريم',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duration: 18,
                order: 0,
                isPreview: true
              }
            ]
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    const insertedCourses = [];
    for (const course of courses) {
      const result = await Course.insertOne(course);
      insertedCourses.push({ _id: result.insertedId, ...course });
    }
    console.log(`✅ تم إضافة ${insertedCourses.length} كورسات\n`);

    // ==================== تسجيل طلاب في كورسات ====================
    console.log('📝 تسجيل الطلاب في الكورسات...');
    
    // الطالب الأول يسجل في 3 كورسات
    await User.updateOne(
      { _id: insertedStudents[0]._id },
      { $set: { enrolledCourses: [insertedCourses[0]._id, insertedCourses[2]._id, insertedCourses[3]._id] } }
    );
    
    // الطالب الثاني يسجل في كورسين
    await User.updateOne(
      { _id: insertedStudents[1]._id },
      { $set: { enrolledCourses: [insertedCourses[1]._id, insertedCourses[4]._id] } }
    );
    
    // الطالب الثالث يسجل في كورس واحد
    await User.updateOne(
      { _id: insertedStudents[2]._id },
      { $set: { enrolledCourses: [insertedCourses[2]._id] } }
    );

    console.log('✅ تم تسجيل الطلاب في الكورسات\n');

    // تحديث عدد الطلاب المسجلين في كل كورس
    await Course.updateOne({ _id: insertedCourses[0]._id }, { $set: { enrolledStudents: 1 } });
    await Course.updateOne({ _id: insertedCourses[1]._id }, { $set: { enrolledStudents: 1 } });
    await Course.updateOne({ _id: insertedCourses[2]._id }, { $set: { enrolledStudents: 2 } });
    await Course.updateOne({ _id: insertedCourses[3]._id }, { $set: { enrolledStudents: 1 } });
    await Course.updateOne({ _id: insertedCourses[4]._id }, { $set: { enrolledStudents: 1 } });

    // ==================== النتيجة النهائية ====================
    console.log('═══════════════════════════════════════════════');
    console.log('🎉 تم إضافة جميع البيانات التجريبية بنجاح!');
    console.log('═══════════════════════════════════════════════\n');
    
    console.log('📊 الإحصائيات:');
    console.log(`   👨‍🏫 المدرسين: ${insertedTeachers.length}`);
    console.log(`   👨‍🎓 الطلاب: ${insertedStudents.length}`);
    console.log(`   📚 الكورسات: ${insertedCourses.length}`);
    console.log(`   🎥 مجموع الفيديوهات: ~${insertedCourses.reduce((sum, c) => sum + c.sections.reduce((s, sec) => s + sec.lessons.length, 0), 0)}\n`);
    
    console.log('🔐 بيانات تسجيل الدخول:');
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   👑 Admin:');
    console.log('      الهاتف: admin');
    console.log('      الباسورد: admin123\n');
    console.log('   👨‍🏫 المدرسين:');
    console.log('      الهاتف: 01012345678');
    console.log('      الباسورد: 123456\n');
    console.log('   👨‍🎓 الطلاب:');
    console.log('      الهاتف: 01555555555');
    console.log('      الباسورد: 123456\n');
    console.log('═══════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedData();
