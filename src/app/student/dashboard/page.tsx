"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProgress } from '@/contexts/ProgressContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaBook,
  FaChartLine,
  FaGraduationCap,
  FaPlay,
  FaCheckCircle,
} from 'react-icons/fa';
import CourseAchievements from '@/components/CourseAchievements';

interface EnrolledCourse {
  id: string;
  title: string;
  thumbnail: string;
  progress: number;
  totalVideos: number;
  completedVideos: number;
  lastWatched?: Date;
  instructor: string;
}

export default function StudentDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { coursesProgress, quizResults } = useProgress();
  const router = useRouter();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalWatchTime: 0,
    currentStreak: 0,
    totalPoints: 0,
  });
  const [weeklyProgress, setWeeklyProgress] = useState(0);
  const formatTimeAgo = (dateInput: any) => {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'الآن';
    if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    const diffDays = Math.floor(diffHours / 24);
    return `منذ ${diffDays} يوم`;
  };

  const recentQuizActivities = ([...(quizResults || [])] as any[])
    .map((quiz: any) => {
      const when = quiz.completedAt || quiz.completed_at || quiz.submitted_at;
      if (!when) return null;
      const date = new Date(when);
      if (isNaN(date.getTime())) return null;
      return {
        icon: <FaCheckCircle className="text-green-500" />,
        title: quiz.passed ? 'أكملت اختبار' : 'محاولة اختبار',
        description: 'اختبار تم حله في أحد الكورسات',
        time: formatTimeAgo(date),
        date,
      };
    })
    .filter((item: any) => item !== null)
    .sort((a: any, b: any) => b.date.getTime() - a.date.getTime())
    .slice(0, 3);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?redirect=/student/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user?.role !== 'student') {
      router.replace('/');
      return;
    }
    loadStudentData();
  }, [user, coursesProgress]);

  const loadStudentData = async () => {
    try {
      if (!user?.id) return;

      // جلب الكورسات المسجل فيها من الـ API
      const { getDashboardData } = await import('@/services/supabase-service');
      const result = await getDashboardData(user.id);

      if (result.success && result.data) {
        const active = Array.isArray(result.data.activeCourses)
          ? result.data.activeCourses
          : [];

        const courses: EnrolledCourse[] = active
          .filter((e: any) => e.course)
          .map((e: any) => {
            const course = e.course || {};
            // استخدام البيانات الحقيقية من API
            const totalLessons = 
              typeof e.total_lessons === 'number' ? e.total_lessons :
              typeof e.lessons_count === 'number' ? e.lessons_count :
              typeof course.total_lessons === 'number' ? course.total_lessons :
              typeof course.lessons_count === 'number' ? course.lessons_count :
              0;
            
            // استخدام عدد الدروس المكتملة الحقيقي
            const completedLessons = 
              typeof e.completed_lessons === 'number' ? e.completed_lessons :
              typeof e.completed_lessons_count === 'number' ? e.completed_lessons_count :
              0;
            
            // استخدام التقدم الحقيقي من API
            const progress = typeof e.progress === 'number' ? e.progress : 0;
            
            // التأكد من أن completedVideos لا يتجاوز totalLessons
            const completedVideos = Math.min(completedLessons, totalLessons);

            return {
              id: String(course.id),
              title: course.title || 'كورس بدون اسم',
              thumbnail: course.thumbnail || '/placeholder-course.jpg',
              progress,
              totalVideos: totalLessons,
              completedVideos,
              lastWatched: e.updated_at || e.enrolled_at || e.last_accessed,
              instructor: course.instructor_name || 'مدرس',
            };
          });

        setEnrolledCourses(courses);

        // حساب الإحصائيات العامة
        // نعتبر الكورس مكتمل فقط عندما تصل نسبة التقدم إلى 100%
        const totalCompleted = courses.filter((c) => (c.progress || 0) >= 100).length;
        const totalTime = Object.values(coursesProgress).reduce(
          (sum, course: any) => sum + (course.totalWatchTime || 0),
          0
        );
        const totalQuizPoints = quizResults.reduce(
          (sum: number, quiz: any) => sum + (quiz.score || 0),
          0
        );

        setStats({
          totalCourses: courses.length,
          completedCourses: totalCompleted,
          totalWatchTime: Math.floor(totalTime / 3600),
          currentStreak: 0,
          totalPoints: totalQuizPoints,
        });

        // حساب تقدم هذا الأسبوع بشكل مبسط من متوسط تقدم الكورسات
        if (courses.length === 0) {
          setWeeklyProgress(0);
        } else {
          const sumProgress = courses.reduce(
            (sum, c) => sum + (c.progress || 0),
            0
          );
          const avgProgress = Math.round(sumProgress / courses.length);
          setWeeklyProgress(avgProgress);
        }
      } else {
        setEnrolledCourses([]);
      }
    } catch (error) {
      console.error('Error loading student data:', error);
      setEnrolledCourses([]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'student') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-12">
      <div className="container-custom">
        {/* الترحيب */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            مرحباً، {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            استمر في رحلتك التعليمية واحصل على أفضل النتائج
          </p>
        </motion.div>

        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-2 gap-4 mb-8 max-w-2xl">
          <StatsCard
            icon={<FaBook />}
            title="الكورسات"
            value={stats.totalCourses}
            color="bg-blue-500"
          />
          <StatsCard
            icon={<FaCheckCircle />}
            title="مكتملة"
            value={stats.completedCourses}
            color="bg-green-500"
          />
        </div>

        {/* التقدم العام */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-primary to-accent rounded-2xl p-6 mb-8 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold mb-1">تقدمك هذا الأسبوع</h3>
              <p className="text-white/80 text-sm">أنت تتقدم بشكل ممتاز!</p>
            </div>
            <div className="text-4xl">
              <FaChartLine />
            </div>
          </div>
          <div className="bg-white/20 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${weeklyProgress}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="bg-white h-full rounded-full"
            />
          </div>
          <p className="text-sm mt-2 text-white/90">{weeklyProgress}% من هدفك الأسبوعي</p>
          <p className="text-xs mt-1 text-white/85">
            أنهيت {stats.completedCourses} من {stats.totalCourses} كورس، المتبقي {Math.max(stats.totalCourses - stats.completedCourses, 0)} كورس
          </p>
        </motion.div>

        {/* الكورسات المسجل فيها */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">كورساتي</h2>
            <Link
              href="/courses"
              className="text-primary hover:text-primary-dark font-medium text-sm"
            >
              استكشف المزيد ←
            </Link>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-bold mb-2">لم تسجل في أي كورس بعد</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                ابدأ رحلتك التعليمية بالتسجيل في أحد الكورسات المتاحة
              </p>
              <Link
                href="/courses"
                className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors"
              >
                استكشف الكورسات
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <CourseCard course={course} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {user?.id && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">إنجازاتك في الكورسات</h2>
            <CourseAchievements userId={user.id} hideEmptyMessage />
          </div>
        )}

        {/* نشاط حديث */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
        >
          <h2 className="text-xl font-bold mb-4">النشاط الأخير</h2>
          {recentQuizActivities.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              لا يوجد نشاط حديث حتى الآن. ابدأ بمشاهدة الدروس أو حل الاختبارات ليظهر نشاطك هنا.
            </p>
          ) : (
            <div className="space-y-4">
              {recentQuizActivities.map((activity: any, index: number) => (
                <ActivityItem
                  key={index}
                  icon={activity.icon}
                  title={activity.title}
                  description={activity.description}
                  time={activity.time}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// مكون بطاقة الإحصائيات
function StatsCard({
  icon,
  title,
  value,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
    >
      <div className={`${color} w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
    </motion.div>
  );
}

// مكون بطاقة الكورس
function CourseCard({ course }: { course: EnrolledCourse }) {
  return (
    <Link href={`/courses/${course.id}`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
        <div className="relative h-40 bg-gray-200 dark:bg-gray-700">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
            {course.progress}%
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {course.instructor}
          </p>
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-gray-600 dark:text-gray-400">
              {course.completedVideos}/{course.totalVideos} فيديو
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {course.progress >= 90 ? '✅ مكتمل' : '⏳ جاري'}
            </span>
          </div>
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${course.progress}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

// مكون عنصر النشاط
function ActivityItem({
  icon,
  title,
  description,
  time,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <div className="text-2xl mt-1">{icon}</div>
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <span className="text-xs text-gray-500">{time}</span>
    </div>
  );
}
