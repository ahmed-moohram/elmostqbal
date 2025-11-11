import axios from 'axios';

// استخدام Supabase مباشرة - لا حاجة لخادم محلي
const API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wnqifmvgvlmxgswhcwnc.supabase.co';
const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE !== 'false'; // افتراضياً true

// إعداد axios مع معالجة أفضل للأخطاء
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 ثواني timeout
  validateStatus: function (status) {
    return status >= 200 && status < 500; // لا ترمي خطأ إلا للأخطاء الخادم
  }
});

// إضافة معترض لإضافة التوكن إلى رؤوس الطلبات
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// إضافة معترض للاستجابة للتعامل مع أخطاء المصادقة وأخطاء الاتصال
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // خطأ 401: غير مصرح، تسجيل الخروج
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // خطأ 404: صفحة غير موجودة، عادة ما يكون واجهة برمجة تطبيقات غير مكتملة
    if (error.response && error.response.status === 404) {
      console.warn(`API Endpoint not found: ${error.config.url}`);
      
      // توفير بيانات وهمية لبعض الطلبات المعروفة للسماح بتطوير الواجهة
      if (error.config.url.includes('/students/me/notifications')) {
        return Promise.resolve({ 
          data: { 
            notifications: [], 
            unreadCount: 0 
          } 
        });
      }
      
      if (error.config.url.includes('/students/me/courses')) {
        return Promise.resolve({ 
          data: [] 
        });
      }
      
      if (error.config.url.includes('/students/me/progress')) {
        return Promise.resolve({ 
          data: { 
            overall: 0, 
            courses: [] 
          } 
        });
      }
      
      if (error.config.url.includes('/students/me/events')) {
        return Promise.resolve({ 
          data: [] 
        });
      }
      
      if (error.config.url.includes('/students/me/study-time')) {
        return Promise.resolve({ 
          data: { 
            total: 0, 
            weeklyIncrease: 0 
          } 
        });
      }
      
      if (error.config.url.includes('/students/me/analytics')) {
        return Promise.resolve({ 
          data: { 
            recentActivity: [],
            certificates: [] 
          } 
        });
      }
      
      if (error.config.url.includes('/students/me/recommendations')) {
        return Promise.resolve({ 
          data: [] 
        });
      }
    }
    
    return Promise.reject(error);
  }
);

// خدمات المصادقة
export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

// خدمات إدارة الدورات
export const coursesService = {
  getAllCourses: async () => {
    const response = await api.get('/courses');
    return response.data;
  },
  
  // الحصول على دورة محددة بالمعرف
  getCourseById: async (courseId) => {
    const response = await api.get(`/courses/${courseId}`);
    // استخراج الكورس من الاستجابة
    return response.data.course || response.data;
  },
  
  // الحصول على دورات الطالب
  getStudentCourses: async () => {
    const response = await api.get('/students/me/courses');
    return response.data;
  },
  
  // الحصول على الدورات المميزة
  getFeaturedCourses: async () => {
    const response = await api.get('/courses/featured');
    return response.data;
  },
  
  // الحصول على محتوى الدورة
  getCourseContent: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/content`);
    return response.data;
  },
  
  // التسجيل في دورة
  enrollCourse: async (courseId) => {
    const response = await api.post(`/courses/${courseId}/enroll`);
    return response.data;
  }
};

// خدمات تقدم الطالب
export const progressService = {
  // الحصول على تقدم الطالب في جميع الدورات
  getOverallProgress: async () => {
    const response = await api.get('/students/me/progress');
    return response.data;
  },
  
  // الحصول على تقدم الطالب في دورة محددة
  getCourseProgress: async (courseId) => {
    const response = await api.get(`/students/me/courses/${courseId}/progress`);
    return response.data;
  },
  
  // تحديث تقدم الطالب في دورة
  updateCourseProgress: async (courseId, progressData) => {
    const response = await api.put(`/students/me/courses/${courseId}/progress`, progressData);
    return response.data;
  },
  
  // تحديث حالة درس (مكتمل أو غير مكتمل)
  updateLessonStatus: async (courseId, lessonId, status) => {
    const response = await api.put(`/students/me/courses/${courseId}/lessons/${lessonId}`, { status });
    return response.data;
  },
  
  // تسجيل وقت المشاهدة للفيديو
  trackVideoProgress: async (courseId, lessonId, progressData) => {
    const response = await api.post(`/students/me/courses/${courseId}/lessons/${lessonId}/track`, progressData);
    return response.data;
  },
  
  // الحصول على آخر موضع مشاهدة للفيديو
  getVideoProgress: async (courseId, lessonId) => {
    const response = await api.get(`/students/me/courses/${courseId}/lessons/${lessonId}/progress`);
    return response.data;
  }
};

// خدمات الاختبارات والتقييمات
export const quizService = {
  // الحصول على اختبار محدد
  getQuiz: async (courseId, quizId) => {
    const response = await api.get(`/courses/${courseId}/quizzes/${quizId}`);
    return response.data;
  },
  
  // تقديم إجابات الاختبار
  submitQuizAnswers: async (courseId, quizId, answers) => {
    const response = await api.post(`/courses/${courseId}/quizzes/${quizId}/submit`, { answers });
    return response.data;
  },
  
  // الحصول على نتائج الاختبارات السابقة
  getQuizResults: async (courseId) => {
    const response = await api.get(`/students/me/courses/${courseId}/quiz-results`);
    return response.data;
  }
};

// خدمات الإشعارات
export const notificationService = {
  // الحصول على جميع الإشعارات
  getNotifications: async () => {
    const response = await api.get('/students/me/notifications');
    return response.data;
  },
  
  // تحديد إشعار كمقروء
  markAsRead: async (notificationId) => {
    const response = await api.put(`/students/me/notifications/${notificationId}/read`);
    return response.data;
  },
  
  // تحديد جميع الإشعارات كمقروءة
  markAllAsRead: async () => {
    const response = await api.put('/students/me/notifications/read-all');
    return response.data;
  }
};

// خدمات الأحداث والتقويم
export const eventsService = {
  // الحصول على أحداث الطالب
  getStudentEvents: async () => {
    const response = await api.get('/students/me/events');
    return response.data;
  },
  
  // الحصول على الأحداث القادمة
  getUpcomingEvents: async () => {
    const response = await api.get('/students/me/events/upcoming');
    return response.data;
  },
  
  // إضافة حدث للتقويم الشخصي
  addEvent: async (eventData) => {
    const response = await api.post('/students/me/events', eventData);
    return response.data;
  }
};

// خدمات المحفوظات وساعات التعلم
export const studyTimeService = {
  // الحصول على إجمالي ساعات التعلم
  getTotalStudyTime: async () => {
    const response = await api.get('/students/me/study-time');
    return response.data;
  },
  
  // الحصول على سجل ساعات التعلم (بتصفية حسب الفترة)
  getStudyTimeHistory: async (params) => {
    const response = await api.get('/students/me/study-time/history', { params });
    return response.data;
  },
  
  // تسجيل جلسة تعلم جديدة
  logStudySession: async (sessionData) => {
    const response = await api.post('/students/me/study-time/log', sessionData);
    return response.data;
  }
};

// خدمات التحليلات وإحصائيات التعلم
export const analyticsService = {
  // الحصول على إحصائيات التعلم للطالب
  getStudentAnalytics: async () => {
    const response = await api.get('/students/me/analytics');
    return response.data;
  },
  
  // الحصول على توصيات التعلم المخصصة
  getLearningRecommendations: async () => {
    const response = await api.get('/students/me/recommendations');
    return response.data;
  }
};

// تصدير مثيل API الأساسي للاستخدام المباشر عند الحاجة
export default api; 