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
    currentStreak: 5,
    totalPoints: 0,
  });

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
      const token = localStorage.getItem('token');
      if (!token) return;

      // جلب الكورسات المسجل فيها من الـ API
      const response = await fetch('/api/courses/enrolled/my-courses', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const courses = data.courses || [];
        
        setEnrolledCourses(courses);

        // حساب الإحصائيات
        const totalCompleted = courses.filter((c: EnrolledCourse) => c.progress >= 90).length;
        const totalTime = Object.values(coursesProgress).reduce(
          (sum, course) => sum + (course.totalWatchTime || 0),
          0
        );
        const totalQuizPoints = quizResults.reduce((sum, quiz) => sum + quiz.score, 0);

        setStats({
          totalCourses: courses.length,
          completedCourses: totalCompleted,
          totalWatchTime: Math.floor(totalTime / 3600), // ساعات
          currentStreak: 5,
          totalPoints: totalQuizPoints,
        });
      } else {
        console.error('Failed to fetch enrolled courses');
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
              animate={{ width: '68%' }}
              transition={{ duration: 1, delay: 0.5 }}
              className="bg-white h-full rounded-full"
            />
          </div>
          <p className="text-sm mt-2 text-white/90">68% من هدفك الأسبوعي</p>
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

        {/* نشاط حديث */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
        >
          <h2 className="text-xl font-bold mb-4">النشاط الأخير</h2>
          <div className="space-y-4">
            <ActivityItem
              icon={<FaPlay className="text-blue-500" />}
              title="بدأت مشاهدة"
              description="الدرس الخامس - معادلات الدرجة الثانية"
              time="منذ ساعة"
            />
            <ActivityItem
              icon={<FaCheckCircle className="text-green-500" />}
              title="أكملت"
              description="اختبار الفصل الثالث - الفيزياء"
              time="منذ 3 ساعات"
            />
            <ActivityItem
              icon={<FaCheckCircle className="text-yellow-500" />}
              title="حصلت على إنجاز"
              description="شارة المثابرة - 5 أيام متتالية"
              time="أمس"
            />
          </div>
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
