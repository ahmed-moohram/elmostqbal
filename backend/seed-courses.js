// إضافة دورات تجريبية لقاعدة البيانات
const mongoose = require('mongoose');
require('dotenv').config();

const sampleCourses = [
  {
    title: 'الرياضيات للثانوية العامة 2024',
    slug: 'mathematics-secondary-2024',
    shortDescription: 'دورة شاملة لمنهج الرياضيات كامل',
    description: 'دورة شاملة تغطي منهج الرياضيات للثانوية العامة بشرح مبسط وأمثلة عملية. تشمل الجبر والهندسة والتفاضل والتكامل.',
    category: 'رياضيات',
    level: 'متقدم',
    price: 1200,
    discountPrice: 999,
    image: '/images/courses/math.jpg',
    thumbnail: '/images/courses/math-thumb.jpg',
    instructor: null, // سيتم ربطه بمدرس لاحقاً
    duration: '120 ساعة',
    studentsCount: 1450,
    rating: 4.9,
    isPremium: true,
    isActive: true,
    isFeatured: true,
    requirements: ['معرفة أساسية بالرياضيات', 'حاسوب أو هاتف ذكي', 'اتصال بالإنترنت'],
    whatYouWillLearn: [
      'فهم عميق لجميع أجزاء المنهج',
      'حل المسائل بطرق مبتكرة',
      'الاستعداد الكامل للامتحان النهائي',
      'تطبيقات عملية على المفاهيم'
    ],
    sections: [
      {
        title: 'الجبر',
        order: 1,
        lessons: [
          {
            title: 'المعادلات من الدرجة الأولى',
            type: 'video',
            duration: 45,
            order: 1,
            isFree: true
          },
          {
            title: 'المعادلات من الدرجة الثانية',
            type: 'video',
            duration: 60,
            order: 2,
            isFree: false
          }
        ]
      },
      {
        title: 'الهندسة',
        order: 2,
        lessons: [
          {
            title: 'الهندسة المستوية',
            type: 'video',
            duration: 50,
            order: 1,
            isFree: false
          }
        ]
      }
    ],
    paymentOptions: [
      {
        type: 'full',
        price: 1200,
        discountPrice: 999,
        label: 'الدفع الكامل',
        features: ['وصول كامل للدورة', 'شهادة إتمام', 'دعم فني']
      },
      {
        type: 'installment',
        price: 400,
        installments: 3,
        label: 'التقسيط (3 أشهر)',
        features: ['وصول كامل للدورة', 'شهادة إتمام']
      }
    ],
    tags: ['رياضيات', 'ثانوية عامة', 'جبر', 'هندسة'],
    certificateAvailable: true,
    allowDownloads: true
  },
  {
    title: 'الفيزياء المتقدمة للجامعات',
    slug: 'physics-advanced-university',
    shortDescription: 'دورة متقدمة في الفيزياء',
    description: 'دورة شاملة تغطي أساسيات ومتقدمات الفيزياء للطلاب الجامعيين مع تجارب معملية وأمثلة تطبيقية.',
    category: 'فيزياء',
    level: 'متقدم',
    price: 1500,
    discountPrice: 1299,
    image: '/images/courses/physics.jpg',
    thumbnail: '/images/courses/physics-thumb.jpg',
    instructor: null,
    duration: '100 ساعة',
    studentsCount: 920,
    rating: 4.8,
    isPremium: true,
    isActive: true,
    isFeatured: true,
    requirements: ['معرفة أساسية بالفيزياء', 'معرفة بالرياضيات'],
    whatYouWillLearn: [
      'الميكانيكا الكلاسيكية',
      'الكهرومغناطيسية',
      'الفيزياء الحديثة',
      'التطبيقات العملية'
    ],
    sections: [
      {
        title: 'الميكانيكا',
        order: 1,
        lessons: [
          {
            title: 'قوانين نيوتن',
            type: 'video',
            duration: 40,
            order: 1,
            isFree: true
          }
        ]
      }
    ],
    paymentOptions: [
      {
        type: 'full',
        price: 1500,
        discountPrice: 1299,
        label: 'الدفع الكامل',
        features: ['وصول كامل للدورة', 'شهادة إتمام', 'دعم فني']
      }
    ],
    tags: ['فيزياء', 'جامعة', 'ميكانيكا'],
    certificateAvailable: true,
    allowDownloads: true
  },
  {
    title: 'الكيمياء الشاملة للثانوية',
    slug: 'chemistry-complete-secondary',
    shortDescription: 'منهج الكيمياء كامل بشرح مبسط',
    description: 'دورة تغطي منهج الكيمياء للثانوية العامة بشرح مبسط وتجارب عملية وحل جميع أسئلة الامتحانات السابقة.',
    category: 'كيمياء',
    level: 'متوسط',
    price: 1100,
    discountPrice: 950,
    image: '/images/courses/chemistry.jpg',
    thumbnail: '/images/courses/chemistry-thumb.jpg',
    instructor: null,
    duration: '90 ساعة',
    studentsCount: 850,
    rating: 4.7,
    isPremium: true,
    isActive: true,
    isFeatured: true,
    requirements: ['معرفة أساسية بالكيمياء'],
    whatYouWillLearn: [
      'الكيمياء العضوية',
      'الكيمياء غير العضوية',
      'الكيمياء الفيزيائية',
      'التجارب العملية'
    ],
    sections: [
      {
        title: 'الكيمياء العضوية',
        order: 1,
        lessons: [
          {
            title: 'الهيدروكربونات',
            type: 'video',
            duration: 45,
            order: 1,
            isFree: true
          }
        ]
      }
    ],
    paymentOptions: [
      {
        type: 'full',
        price: 1100,
        discountPrice: 950,
        label: 'الدفع الكامل',
        features: ['وصول كامل للدورة', 'شهادة إتمام']
      }
    ],
    tags: ['كيمياء', 'ثانوية عامة', 'عضوية'],
    certificateAvailable: true,
    allowDownloads: false
  }
];

const seedCourses = async () => {
  try {
    console.log('🔍 جاري الاتصال بقاعدة البيانات...');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/educational-platform';
    await mongoose.connect(mongoUri);
    
    console.log('✅ تم الاتصال بنجاح!');
    
    // حذف الدورات القديمة إن وجدت
    const Course = mongoose.connection.collection('courses');
    const existingCount = await Course.countDocuments();
    
    if (existingCount > 0) {
      console.log(`⚠️ يوجد ${existingCount} دورات حالياً`);
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      // في حالة الاستخدام من السكريبت مباشرة، سنضيف بدون حذف
      console.log('📝 سيتم إضافة الدورات الجديدة بدون حذف القديمة...');
    }
    
    console.log('📚 جاري إضافة الدورات التجريبية...');
    
    const result = await Course.insertMany(sampleCourses);
    
    console.log(`✅ تم إضافة ${result.insertedCount} دورات بنجاح!`);
    console.log('\n📋 الدورات المضافة:');
    sampleCourses.forEach((course, index) => {
      console.log(`  ${index + 1}. ${course.title}`);
    });
    
    console.log('\n🎉 تم! يمكنك الآن رؤية الدورات في التطبيق');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedCourses();
