"use client";

import { useEffect, useState, ReactNode } from "react";
import { FaChalkboardTeacher, FaBookOpen, FaUserGraduate, FaBook } from "react-icons/fa";
import Sidebar from "../../components/Sidebar";
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FaGraduationCap, FaCalendarAlt, FaCertificate, FaChartLine, FaPlay, FaCheckCircle, FaClock, FaRegClock, FaRegCalendarAlt, FaRegStar, FaRegBell, FaRegFileAlt } from 'react-icons/fa';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import './dashboard-style.css';

// Import only the NoSSR component
const NoSSR = ({ children }: { children: ReactNode }) => <>{children}</>;

// Custom Progress Circle component to avoid TypeScript errors
const ProgressCircle = dynamic(
  () => import('../../components/ProgressCircle'), 
  { 
    ssr: false,
    loading: () => (
      <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center animate-pulse">
        <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse"></div>
      </div>
    )
  }
);

// Helper function for progress calculation
const calculateOverallProgress = (courses: any[]) => {
  if (courses.length === 0) return 0;
  const totalProgress = courses.reduce((sum, course) => sum + (typeof course.progress === 'number' ? course.progress : 0), 0);
  return Math.round(totalProgress / courses.length);
};

interface Course {
  id: string;
  title: string;
  thumbnail: string;
  instructor: string;
  progress: number;
  lastAccessed: string;
  nextLesson: string;
  totalLessons: number;
  completedLessons: number;
}

interface Certificate {
  id: string;
  title: string;
  issueDate: string;
  image: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  type: 'course' | 'certificate' | 'announcement' | 'reminder';
}

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'live' | 'deadline' | 'exam';
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState({ name: "", studentPhone: "" });
  const [activeCourses, setActiveCourses] = useState<Course[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [studyTimeHistory, setStudyTimeHistory] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(true);

  // Get API URL from environment variables
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    // Hide welcome animation after 2 seconds
    const timer = setTimeout(() => {
      setShowWelcomeAnimation(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError("");

      // Check if user is logged in
      const userData = localStorage.getItem('user');
      if (!userData) {
        router.push('/login');
        return;
      }

      try {
        // Get user data
        const user = JSON.parse(userData);
        setUser(user);

        if (user?.role === 'student') {
          router.replace('/student/dashboard');
          return;
        }

        // استخدام Supabase
        const { getDashboardData } = await import('@/services/supabase-service');
        const result = await getDashboardData(user.id);
        
        if (result.success && result.data) {
          setActiveCourses(result.data.activeCourses || []);
          setCertificates(result.data.certificates || []);
          setOverallProgress(result.data.overallProgress || 0);

          // تحديث البيانات الأخرى
          setTotalStudyTime(result.data.points || 0);

          // الأحداث/الجلسات القادمة من Supabase
          const events = Array.isArray(result.data.upcomingEvents) ? result.data.upcomingEvents : [];
          const formattedEvents = events.map((event: any) => {
            const dateObj = event.date ? new Date(event.date) : null;
            const formattedDate = dateObj
              ? dateObj.toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' })
              : event.date;
            const formattedTime = dateObj
              ? dateObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
              : (event.time || '');

            return {
              id: String(event.id),
              title: event.title || 'حدث قادم',
              date: formattedDate,
              time: formattedTime,
              type: event.type || 'exam',
            } as UpcomingEvent;
          });

          setUpcomingEvents(formattedEvents);

          setRecentActivity([
            { id: 1, action: 'أكملت درس', course: 'Python للمبتدئين', time: '10 دقائق' },
            { id: 2, action: 'حصلت على شهادة', course: 'أساسيات البرمجة', time: 'أمس' }
          ]);
          
          setRecommendations([
            { id: 1, title: 'تطوير تطبيقات الويب', category: 'البرمجة', level: 'متوسط' },
            { id: 2, title: 'الذكاء الاصطناعي', category: 'التقنية', level: 'متقدم' }
          ]);
        } else {
          console.warn('⚠️ لا توجد بيانات');
          setActiveCourses([]);
          setOverallProgress(0);
        }

        // البيانات الأخرى محملة بالفعل من Supabase أو كبيانات تجريبية
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError("حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [apiUrl, router]);

  // Function to format study time
  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} ساعة ${mins > 0 ? `و ${mins} دقيقة` : ''}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
          <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-block rounded-full h-16 w-16 bg-red-100 flex items-center justify-center">
            <FaRegBell className="text-red-500 text-3xl" />
          </div>
          <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            onClick={() => window.location.reload()}
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar 
        user={{ 
          name: user?.name || 'طالب العلم', 
          image: '/default-avatar.png' 
        }}
        onLogout={() => {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          router.push('/login');
        }}
      />
      
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20">
        <div className="container mx-auto px-4 py-6">
          
          {/* Welcome Header */}
          <AnimatePresence>
            {showWelcomeAnimation && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="welcome-animation"
              >
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">مرحباً بك في منصة التعلم</h1>
                <p className="text-gray-600 dark:text-gray-300">استعد للتعلم والنمو معنا</p>
              </motion.div>
            )}
          </AnimatePresence>
          
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            مرحباً، {user.name || 'طالب العلم'}
          </h1>
          
          {/* Dashboard Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
              <div className="flex items-center">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                  <FaBookOpen className="text-blue-500 dark:text-blue-400 text-xl" />
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm">الدورات النشطة</h3>
                  <p className="text-2xl font-semibold text-gray-800 dark:text-white">{activeCourses.length}</p>
                </div>
              </div>
            </div>
            
            {false && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
              <div className="flex items-center">
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                  <FaCertificate className="text-green-500 dark:text-green-400 text-xl" />
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm">الشهادات</h3>
                  <p className="text-2xl font-semibold text-gray-800 dark:text-white">{certificates.length}</p>
                </div>
              </div>
            </div>
            )}
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
              <div className="flex items-center">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                  <FaChartLine className="text-purple-500 dark:text-purple-400 text-xl" />
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm">التقدم الإجمالي</h3>
                  <p className="text-2xl font-semibold text-gray-800 dark:text-white">{overallProgress}%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
              <div className="flex items-center">
                <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full">
                  <FaClock className="text-amber-500 dark:text-amber-400 text-xl" />
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm">وقت الدراسة</h3>
                  <p className="text-2xl font-semibold text-gray-800 dark:text-white">{formatStudyTime(totalStudyTime)}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Active Courses Section */}
          <section className="mb-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">دوراتك النشطة</h2>
              <Link href="/courses" className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary transition-colors">
                عرض الكل
              </Link>
            </div>
            
            {activeCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeCourses.map((course) => (
                  <Link href={`/courses/${course.id}`} key={course.id}>
                    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md cursor-pointer">
                      <div className="relative h-40 w-full">
                        <Image 
                          src={course.thumbnail || '/placeholder-course.jpg'} 
                          alt={course.title} 
                          layout="fill" 
                          objectFit="cover"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{course.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">بواسطة {course.instructor}</p>
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center space-x-1 rtl:space-x-reverse">
                            <FaRegClock className="text-gray-500 dark:text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">آخر نشاط: {course.lastAccessed}</span>
                          </div>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {course.completedLessons}/{course.totalLessons} دروس
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
                <FaBookOpen className="mx-auto text-3xl text-gray-400 dark:text-gray-600 mb-4" />
                <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">لا توجد دورات نشطة</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">لم تسجل في أي دورة بعد. استكشف الدورات المتاحة وابدأ رحلة التعلم الخاصة بك.</p>
                <Link href="/courses" className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                  استكشف الدورات
                </Link>
              </div>
            )}
          </section>
          
          {/* Certificates Section */}
          {false && (
          <section className="mb-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">شهاداتك</h2>
              <Link href="/certificates" className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary transition-colors">
                عرض الكل
              </Link>
            </div>
            
            {certificates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map((certificate) => (
                  <div key={certificate.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md">
                    <div className="relative h-40 w-full">
                      <Image 
                        src={certificate.image || '/placeholder-certificate.jpg'} 
                        alt={certificate.title} 
                        layout="fill" 
                        objectFit="cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{certificate.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">تاريخ الإصدار: {certificate.issueDate}</p>
                      <button className="mt-3 w-full px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm">
                        تحميل الشهادة
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
                <FaCertificate className="mx-auto text-3xl text-gray-400 dark:text-gray-600 mb-4" />
                <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">لا توجد شهادات بعد</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">أكمل دوراتك للحصول على شهادات تثبت إنجازاتك.</p>
              </div>
            )}
          </section>
          )}
          
          {/* Upcoming Events Section */}
          <section className="mb-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">الأحداث القادمة</h2>
            </div>
            
            {upcomingEvents.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <div className="flex items-start">
                        <div className={`p-2 rounded-full mr-3 ${
                          event.type === 'live' ? 'bg-green-100 dark:bg-green-900/30' : 
                          event.type === 'deadline' ? 'bg-red-100 dark:bg-red-900/30' : 
                          'bg-blue-100 dark:bg-blue-900/30'
                        }`}>
                          {event.type === 'live' ? (
                            <FaPlay className="text-green-500 dark:text-green-400" />
                          ) : event.type === 'deadline' ? (
                            <FaRegClock className="text-red-500 dark:text-red-400" />
                          ) : (
                            <FaRegFileAlt className="text-blue-500 dark:text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 dark:text-white">{event.title}</h4>
                          <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                            <FaRegCalendarAlt className="mr-1" />
                            <span>{event.date}</span>
                            <span className="mx-2">•</span>
                            <FaRegClock className="mr-1" />
                            <span>{event.time}</span>
                          </div>
                        </div>
                        <button className="px-3 py-1 text-xs rounded-lg bg-primary/10 text-primary dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors">
                          {event.type === 'live' ? 'انضم الآن' : 
                           event.type === 'deadline' ? 'إضافة تذكير' : 
                           'عرض التفاصيل'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
                <FaCalendarAlt className="mx-auto text-3xl text-gray-400 dark:text-gray-600 mb-4" />
                <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">لا توجد أحداث قادمة</h3>
                <p className="text-gray-500 dark:text-gray-400">سيتم عرض الأحداث القادمة هنا عندما تكون متاحة.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
