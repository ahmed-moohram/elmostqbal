'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { FaUser, FaCalendar, FaBook, FaGraduationCap, FaHistory, FaCertificate, FaCreditCard, FaEdit, FaCamera, FaLock, FaCog, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

// نموذج واجهة بيانات المستخدم
interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage: string;
  joinDate: string;
  activeCourses: number;
  completedCourses: number;
  certificates: number;
  progress: number;
}

// نموذج واجهة للدورة المسجلة
interface EnrolledCourse {
  id: string;
  title: string;
  image: string;
  instructor: string;
  progress: number;
  lastAccessed: string;
  nextLesson: string;
  completionDate?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeCourses, setActiveCourses] = useState<EnrolledCourse[]>([]);
  const [completedCourses, setCompletedCourses] = useState<EnrolledCourse[]>([]);
  const [activeTab, setActiveTab] = useState('courses');
  const [dashboardPath, setDashboardPath] = useState('/');
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // تعيين مسار Dashboard حسب الدور
    if (authUser) {
      const path = authUser.role === 'student' ? '/student/dashboard' : 
                   authUser.role === 'admin' ? '/admin' : 
                   '/teachers/dashboard';
      setDashboardPath(path);
    }
    
    // جلب بيانات المستخدم الحقيقية من Supabase
    const fetchUserData = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) return;
        
        const user = JSON.parse(userData);
        const { getUserProfile, getUserEnrollments } = await import('@/services/supabase-service');
        
        // جلب بيانات المستخدم
        const profileResult = await getUserProfile(user.id);
        
        if (profileResult.success && profileResult.data) {
          const userInfo = profileResult.data;
          
          // جلب الدورات المسجلة
          const enrollmentsResult = await getUserEnrollments(user.id);
          
          let enrolledCoursesData: any[] = [];
          if (enrollmentsResult.success && enrollmentsResult.data) {
            enrolledCoursesData = enrollmentsResult.data.map((enrollment: any) => ({
              ...enrollment.course,
              progress: enrollment.progress,
              completed: enrollment.status === 'completed'
            }));
          }
          
          // تحويل البيانات لتنسيق الصفحة
          const activeCoursesList = enrolledCoursesData.filter(c => !c.completed).map(course => ({
            id: course._id || course.id,
            title: course.title,
            image: course.thumbnail || course.image || '/placeholder-course.jpg',
            instructor: course.instructor?.name || 'غير محدد',
            progress: course.progress || 0,
            lastAccessed: course.lastAccessed || 'غير محدد',
            nextLesson: course.nextLesson || 'الدرس الأول'
          }));
          
          const completedCoursesList = enrolledCoursesData.filter(c => c.completed).map(course => ({
            id: course._id || course.id,
            title: course.title,
            image: course.thumbnail || course.image || '/placeholder-course.jpg',
            instructor: course.instructor?.name || 'غير محدد',
            progress: 100,
            lastAccessed: course.completedAt || '',
            nextLesson: '',
            completionDate: course.completedAt
          }));
          
          // تحديث بيانات المستخدم
          setUser({
            id: userInfo.id,
            name: userInfo.name,
            email: userInfo.email,
            phone: userInfo.phone,
            profileImage: userInfo.avatar || '/placeholder-profile.jpg',
            joinDate: new Date(userInfo.createdAt).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' }),
            activeCourses: activeCoursesList.length,
            completedCourses: completedCoursesList.length,
            certificates: completedCoursesList.length,
            progress: activeCoursesList.length > 0 
              ? Math.round(activeCoursesList.reduce((sum, c) => sum + c.progress, 0) / activeCoursesList.length)
              : 0
          });
          
          console.log('✅ تم جلب بيانات المستخدم من قاعدة البيانات');
          setActiveCourses(activeCoursesList);
          setCompletedCourses(completedCoursesList);
        } else {
          throw new Error('فشل في جلب بيانات المستخدم');
        }
      } catch (error) {
        console.error('❌ خطأ في جلب بيانات المستخدم:', error);
        toast.error('حدث خطأ في تحميل البيانات');
        
        // استخدام بيانات AuthContext كـ fallback
        if (authUser) {
          const fallbackUser: UserProfile = {
            id: authUser.id,
            name: authUser.name,
            email: authUser.email || '',
            phone: authUser.phone || '',
            profileImage: authUser.image || '/placeholder-profile.jpg',
            joinDate: 'غير محدد',
            activeCourses: 0,
            completedCourses: 0,
            certificates: 0,
            progress: 0
          };
          setUser(fallbackUser);
          setActiveCourses([]);
          setCompletedCourses([]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchUserData();
    }
  }, [router, isAuthenticated, authUser]);
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">حدث خطأ أثناء تحميل الملف الشخصي</p>
      </div>
    );
  }

  return (
    <main className="pt-20 pb-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        {/* Header with back button */}
        <div className="mb-6">
          <Link 
            href={dashboardPath}
            className="inline-flex items-center text-primary hover:text-primary-dark transition gap-2"
          >
            <FaArrowLeft /> رجوع للوحة التحكم
          </Link>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header - معلومات الملف الشخصي */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6 mb-8">
            <div className="md:flex items-start justify-between mb-6">
              <div className="flex items-center gap-6 flex-1">
                <div className="relative">
                  <div className="relative w-32 h-32">
                    <Image
                      src={user.profileImage || '/placeholder-avatar.png'}
                      alt={user.name}
                      fill
                      className="object-cover rounded-full border-4 border-primary"
                    />
                    <button className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full hover:bg-primary/90 transition shadow-lg">
                      <FaCamera />
                    </button>
                  </div>
                </div>
                
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2 dark:text-white">{user.name}</h1>
                    <div className="text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <span>{user.email}</span>
                      {user.phone && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{user.phone}</span>
                        </>
                      )}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 mb-4 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <FaUser className="text-primary" />
                        <span>{authUser?.role === 'student' ? 'طالب' : authUser?.role === 'teacher' ? 'مدرس' : 'مسؤول'}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <FaCalendar className="text-primary" />
                        <span>انضم {user.joinDate}</span>
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Link
                    href={authUser?.role === 'student' ? '/student/settings' : authUser?.role === 'admin' ? '/admin/settings' : '/teachers/settings'}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 font-semibold"
                  >
                    <FaEdit />
                    تعديل الملف الشخصي
                  </Link>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <FaBook className="text-blue-600 dark:text-blue-400 text-2xl" />
                    <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">{user.activeCourses}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 text-center font-medium">دورات نشطة</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <FaGraduationCap className="text-green-600 dark:text-green-400 text-2xl" />
                    <span className="font-bold text-2xl text-green-600 dark:text-green-400">{user.completedCourses}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 text-center font-medium">دورات مكتملة</p>
                </div>
                
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <FaCertificate className="text-yellow-600 dark:text-yellow-400 text-2xl" />
                    <span className="font-bold text-2xl text-yellow-600 dark:text-yellow-400">{user.certificates}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 text-center font-medium">شهادات</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                  <div className="mb-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500" 
                        style={{ width: `${user.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 text-center font-medium">التقدم: {user.progress}%</p>
                </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="mb-6">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => handleTabChange('courses')}
                className={`px-4 py-2 font-medium rounded-t-lg ${
                  activeTab === 'courses'
                    ? 'bg-white text-primary border-b-2 border-primary'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                دوراتي
              </button>
              <button
                onClick={() => handleTabChange('certificates')}
                className={`px-4 py-2 font-medium rounded-t-lg ${
                  activeTab === 'certificates'
                    ? 'bg-white text-primary border-b-2 border-primary'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                الشهادات
              </button>
              <button
                onClick={() => handleTabChange('payments')}
                className={`px-4 py-2 font-medium rounded-t-lg ${
                  activeTab === 'payments'
                    ? 'bg-white text-primary border-b-2 border-primary'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                المدفوعات
              </button>
              <Link
                href={authUser?.role === 'student' ? '/student/settings' : authUser?.role === 'admin' ? '/admin/settings' : '/teachers/settings'}
                className="px-4 py-2 font-medium rounded-t-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2"
              >
                <FaCog /> الإعدادات
              </Link>
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="bg-white rounded-xl shadow-soft p-6">
            {activeTab === 'courses' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">دوراتي التعليمية</h2>
                
                {activeCourses.length > 0 && (
                  <>
                    <h3 className="text-xl font-semibold mb-4">الدورات النشطة</h3>
                    <div className="space-y-4 mb-8">
                      {activeCourses.map(course => (
                        <Link href={`/courses/${course.id}`} key={course.id} className="block">
                          <div className="border border-gray-200 rounded-lg hover:shadow-md transition p-4">
                            <div className="md:flex items-center">
                              <div className="relative w-full md:w-32 h-24 md:h-20 mb-4 md:mb-0">
                                <Image
                                  src={course.image || '/placeholder-course.png'}
                                  alt={course.title}
                                  fill
                                  className="object-cover rounded-lg"
                                />
                              </div>
                              <div className="md:mr-4 flex-1">
                                <h4 className="font-bold text-lg">{course.title}</h4>
                                <p className="text-gray-600 text-sm mb-2">المدرس: {course.instructor}</p>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                  <div 
                                    className="bg-primary h-2.5 rounded-full" 
                                    style={{ width: `${course.progress}%` }}
                                  ></div>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                  <span>التقدم: {course.progress}%</span>
                                  <span>آخر نشاط: {course.lastAccessed}</span>
                                </div>
                              </div>
                              <div className="md:mr-4 mt-4 md:mt-0">
                                <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition">
                                  متابعة التعلم
                                </button>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
                
                {completedCourses.length > 0 && (
                  <>
                    <h3 className="text-xl font-semibold mb-4">الدورات المكتملة</h3>
                    <div className="space-y-4">
                      {completedCourses.map(course => (
                        <Link href={`/courses/${course.id}`} key={course.id} className="block">
                          <div className="border border-gray-200 rounded-lg hover:shadow-md transition p-4 bg-green-50">
                            <div className="md:flex items-center">
                              <div className="relative w-full md:w-32 h-24 md:h-20 mb-4 md:mb-0">
                                <Image
                                  src={course.image || '/placeholder-course.png'}
                                  alt={course.title}
                                  fill
                                  className="object-cover rounded-lg"
                                />
                              </div>
                              <div className="md:mr-4 flex-1">
                                <h4 className="font-bold text-lg">{course.title}</h4>
                                <p className="text-gray-600 text-sm mb-2">المدرس: {course.instructor}</p>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                  <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '100%' }}></div>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                  <span>مكتمل: 100%</span>
                                  <span>تاريخ الإكمال: {course.completionDate}</span>
                                </div>
                              </div>
                              <div className="md:mr-4 mt-4 md:mt-0">
                                <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">
                                  مراجعة الدورة
                                </button>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
                
                {activeCourses.length === 0 && (
                  <div className="text-center py-12">
                    <FaBook className="text-5xl mx-auto text-gray-400 mb-4" />
                    <p className="text-xl font-medium text-gray-600 dark:text-gray-300 mb-6">لم تشترك في أي دورات بعد</p>
                    <Link 
                      href="/courses" 
                      className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition inline-block"
                    >
                      استكشف الدورات
                    </Link>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'certificates' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">شهاداتي</h2>
                <div className="text-center py-12">
                  <FaCertificate className="text-5xl mx-auto text-gray-400 mb-4" />
                  <p className="text-xl font-medium text-gray-600 dark:text-gray-300 mb-6">لا توجد شهادات حتى الآن</p>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">أكمل دوراتك للحصول على شهادات</p>
                  <Link 
                    href="/courses" 
                    className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition inline-block"
                  >
                    تصفح الدورات
                  </Link>
                </div>
              </div>
            )}
            
            {activeTab === 'payments' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 dark:text-white">سجل المدفوعات</h2>
                
                {/* رسالة توضيحية عن طريقة الدفع */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaCreditCard className="text-white text-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">💳 طريقة الدفع</h3>
                      <p className="text-blue-800 dark:text-blue-200 mb-3">
                        الدفع متاح عبر <strong>فودافون كاش</strong> فقط
                      </p>
                      <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border border-blue-100 dark:border-blue-900">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          📱 <strong>رقم فودافون كاش:</strong> <span className="font-mono text-blue-600 dark:text-blue-400">01XXXXXXXXX</span>
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          💡 بعد الدفع، سيتم تفعيل الدورة تلقائياً
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-4 dark:text-white">سجل المدفوعات</h3>
                  <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <table className="w-full text-sm text-right">
                      <thead className="text-xs uppercase bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700">
                        <tr>
                          <th className="px-6 py-4 text-gray-700 dark:text-gray-300 font-semibold">التاريخ</th>
                          <th className="px-6 py-4 text-gray-700 dark:text-gray-300 font-semibold">الدورة</th>
                          <th className="px-6 py-4 text-gray-700 dark:text-gray-300 font-semibold">المبلغ</th>
                          <th className="px-6 py-4 text-gray-700 dark:text-gray-300 font-semibold">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 dark:text-gray-300">اليوم</td>
                          <td className="px-6 py-4 dark:text-gray-300 font-medium">الرياضيات للمرحلة الإعدادية</td>
                          <td className="px-6 py-4 font-bold text-lg text-green-600 dark:text-green-400">999 ج.م</td>
                          <td className="px-6 py-4">
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium px-3 py-1.5 rounded-full inline-flex items-center gap-1">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              مدفوع
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  )
}