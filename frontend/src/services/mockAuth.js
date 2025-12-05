/**
 * خدمة المصادقة التجريبية (للعمل بدون خادم)
 * Mock Authentication Service
 */

// بيانات المستخدمين التجريبية
const MOCK_USERS = [
  {
    id: '1',
    email: 'student@test.com',
    password: '123456',
    name: 'محمد أحمد',
    role: 'student',
    phone: '01000000001',
    avatar: '/images/avatar1.jpg',
    grade: 'الصف الثالث الثانوي'
  },
  {
    id: '2',
    email: 'teacher@test.com',
    password: '123456',
    name: 'د. أحمد محمد',
    role: 'teacher',
    phone: '01000000002',
    avatar: '/images/avatar2.jpg',
    specialization: 'رياضيات'
  },
  {
    id: '3',
    email: 'admin@test.com',
    password: 'admin123',
    name: 'مدير النظام',
    role: 'admin',
    phone: '01000000003',
    avatar: '/images/avatar3.jpg'
  },
  // مستخدم تجريبي بسيط
  {
    id: '4',
    email: 'test@test.com',
    password: '123',
    name: 'مستخدم تجريبي',
    role: 'student',
    phone: '01234567890',
    avatar: '/images/default-avatar.jpg',
    grade: 'الصف الثالث الثانوي'
  }
];

// بيانات الكورسات التجريبية
const MOCK_COURSES = [
  {
    id: '1',
    title: 'الرياضيات - الصف الثالث الثانوي',
    instructor: 'د. أحمد محمد',
    price: 500,
    thumbnail: '/images/math-course.jpg',
    rating: 4.8,
    students: 1250,
    lessons: 45,
    duration: '20 ساعة',
    level: 'متقدم',
    category: 'رياضيات',
    description: 'كورس شامل للرياضيات للثانوية العامة',
    isEnrolled: true,
    progress: 65
  },
  {
    id: '2',
    title: 'الفيزياء - الصف الثالث الثانوي',
    instructor: 'د. محمد علي',
    price: 450,
    thumbnail: '/images/physics-course.jpg',
    rating: 4.7,
    students: 980,
    lessons: 38,
    duration: '18 ساعة',
    level: 'متقدم',
    category: 'فيزياء',
    description: 'شرح مفصل لمنهج الفيزياء',
    isEnrolled: true,
    progress: 40
  },
  {
    id: '3',
    title: 'الكيمياء - الصف الثالث الثانوي',
    instructor: 'د. سارة أحمد',
    price: 400,
    thumbnail: '/images/chemistry-course.jpg',
    rating: 4.9,
    students: 1100,
    lessons: 42,
    duration: '22 ساعة',
    level: 'متقدم',
    category: 'كيمياء',
    description: 'منهج الكيمياء كامل مع التجارب',
    isEnrolled: false,
    progress: 0
  },
  {
    id: '4',
    title: 'اللغة العربية - النحو والبلاغة',
    instructor: 'أ. محمود السيد',
    price: 350,
    thumbnail: '/images/arabic-course.jpg',
    rating: 4.6,
    students: 850,
    lessons: 35,
    duration: '15 ساعة',
    level: 'متوسط',
    category: 'لغة عربية',
    description: 'شرح قواعد النحو والبلاغة',
    isEnrolled: true,
    progress: 80
  }
];

// دالة تسجيل الدخول التجريبية
export const mockLogin = async (email, password) => {
  // محاكاة تأخير الشبكة
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // البحث عن المستخدم
  const user = MOCK_USERS.find(u => 
    (u.email === email || u.phone === email) && u.password === password
  );
  
  if (user) {
    // إنشاء توكن وهمي
    const token = btoa(JSON.stringify({ userId: user.id, role: user.role }));
    
    // حفظ في localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('isLoggedIn', 'true');
    
    return {
      success: true,
      user: {
        ...user,
        password: undefined // لا نرجع كلمة المرور
      },
      token
    };
  } else {
    throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  }
};

// دالة التسجيل التجريبية
export const mockRegister = async (userData) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // التحقق من عدم وجود المستخدم
  const existingUser = MOCK_USERS.find(u => 
    u.email === userData.email || u.phone === userData.phone
  );
  
  if (existingUser) {
    throw new Error('البريد الإلكتروني أو رقم الهاتف مسجل بالفعل');
  }
  
  // إنشاء مستخدم جديد
  const newUser = {
    id: Date.now().toString(),
    ...userData,
    avatar: '/images/default-avatar.jpg',
    role: 'student'
  };
  
  MOCK_USERS.push(newUser);
  
  // تسجيل دخول تلقائي
  return mockLogin(userData.email, userData.password);
};

// دالة تسجيل الخروج
export const mockLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('isLoggedIn');
  return { success: true };
};

// دالة الحصول على المستخدم الحالي
export const mockGetCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
};

// دالة التحقق من تسجيل الدخول
export const mockIsAuthenticated = () => {
  return localStorage.getItem('isLoggedIn') === 'true';
};

// دالة جلب الكورسات
export const mockGetCourses = async (filters = {}) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  let courses = [...MOCK_COURSES];
  
  // تطبيق الفلاتر
  if (filters.category) {
    courses = courses.filter(c => c.category === filters.category);
  }
  
  if (filters.enrolled !== undefined) {
    courses = courses.filter(c => c.isEnrolled === filters.enrolled);
  }
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    courses = courses.filter(c => 
      c.title.toLowerCase().includes(searchLower) ||
      c.instructor.toLowerCase().includes(searchLower) ||
      c.category.toLowerCase().includes(searchLower)
    );
  }
  
  return courses;
};

// دالة جلب كورس واحد
export const mockGetCourse = async (courseId) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const course = MOCK_COURSES.find(c => c.id === courseId);
  
  if (!course) {
    throw new Error('الكورس غير موجود');
  }
  
  // إضافة تفاصيل إضافية
  return {
    ...course,
    sections: [
      {
        id: '1',
        title: 'الوحدة الأولى: المقدمة',
        lessons: [
          { id: '1', title: 'مقدمة عن المادة', duration: '15:30', completed: true },
          { id: '2', title: 'الأساسيات', duration: '22:45', completed: true },
          { id: '3', title: 'التطبيقات العملية', duration: '18:20', completed: false }
        ]
      },
      {
        id: '2',
        title: 'الوحدة الثانية: المفاهيم المتقدمة',
        lessons: [
          { id: '4', title: 'المفهوم الأول', duration: '25:15', completed: false },
          { id: '5', title: 'المفهوم الثاني', duration: '30:00', completed: false }
        ]
      }
    ],
    requirements: [
      'معرفة أساسية بالمادة',
      'جهاز كمبيوتر أو هاتف ذكي',
      'اتصال بالإنترنت'
    ],
    whatYouWillLearn: [
      'فهم المفاهيم الأساسية',
      'التطبيق العملي',
      'حل المسائل المعقدة',
      'الاستعداد للامتحانات'
    ]
  };
};

// دالة التسجيل في كورس
export const mockEnrollCourse = async (courseId) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const course = MOCK_COURSES.find(c => c.id === courseId);
  
  if (!course) {
    throw new Error('الكورس غير موجود');
  }
  
  course.isEnrolled = true;
  course.progress = 0;
  
  return {
    success: true,
    message: 'تم التسجيل في الكورس بنجاح'
  };
};

// دالة جلب الإشعارات
export const mockGetNotifications = async () => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return [
    {
      id: '1',
      title: 'درس جديد متاح',
      message: 'تم إضافة درس جديد في كورس الرياضيات',
      time: 'منذ ساعة',
      read: false,
      type: 'info'
    },
    {
      id: '2',
      title: 'تذكير بالواجب',
      message: 'لديك واجب في الفيزياء ينتهي غداً',
      time: 'منذ 3 ساعات',
      read: false,
      type: 'warning'
    },
    {
      id: '3',
      title: 'تهانينا!',
      message: 'لقد أكملت 50% من كورس اللغة العربية',
      time: 'أمس',
      read: true,
      type: 'success'
    }
  ];
};

// دالة جلب الإحصائيات
export const mockGetStats = async () => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return {
    enrolledCourses: 3,
    completedLessons: 28,
    totalProgress: 62,
    studyTime: 45, // بالساعات
    certificates: 1,
    upcomingEvents: 2
  };
};

// تصدير كل الدوال
export default {
  login: mockLogin,
  register: mockRegister,
  logout: mockLogout,
  getCurrentUser: mockGetCurrentUser,
  isAuthenticated: mockIsAuthenticated,
  getCourses: mockGetCourses,
  getCourse: mockGetCourse,
  enrollCourse: mockEnrollCourse,
  getNotifications: mockGetNotifications,
  getStats: mockGetStats
};
