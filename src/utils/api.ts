import { apiClient } from '@/lib/api';

export interface CourseProgress {
  completedLessons: string[];
  currentLesson: string;
  percentComplete: number;
}

export interface ApiError {
  message: string;
  status: number;
}

// Error handler helper
const handleApiError = (error: unknown): never => {
  const apiError: ApiError = {
    message: (error as any)?.response?.data?.message || (error as any)?.message || 'حدث خطأ غير متوقع',
    status: (error as any)?.response?.status || 500
  };
  throw apiError;
};

// Course related API calls with caching
const courseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 دقائق

export const courseApi = {
  getCourseById: async (id: string | number): Promise<any> => {
    try {
      // تحقق من الكاش أولاً
      const cacheKey = `course_${id}`;
      const cached = courseCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }

      const response = await apiClient.get(`/courses/${id}`);
      
      // استخراج الكورس من الاستجابة
      const courseData = response.data.course || response.data;
      
      // حفظ في الكاش
      courseCache.set(cacheKey, {
        data: courseData,
        timestamp: Date.now()
      });
      
      return courseData;
    } catch (error) {
      console.error('Error fetching course:', error);
      return handleApiError(error);
    }
  },

  getAllCourses: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/courses');
      // إرجاع البيانات كاملة (courses + pagination)
      return response.data;
    } catch (error) {
      console.error('Error fetching courses:', error);
      return handleApiError(error);
    }
  },

  enrollInCourse: async (courseId: string | number) => {
    try {
      const response = await apiClient.post(`/courses/${courseId}/enroll`);
      // مسح الكاش بعد التسجيل
      courseCache.delete(`course_${courseId}`);
      return response.data;
    } catch (error) {
      console.error('Error enrolling in course:', error);
      return handleApiError(error);
    }
  },

  getCourseProgress: async (courseId: string | number): Promise<CourseProgress> => {
    try {
      const response = await apiClient.get(`/courses/progress?courseId=${courseId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching course progress:', error);
      return handleApiError(error);
    }
  },

  markLessonComplete: async (courseId: string | number, lessonId: string) => {
    try {
      const response = await apiClient.post(`/courses/${courseId}/lessons/${lessonId}/complete`);
      return response.data;
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      return handleApiError(error);
    }
  },
};
