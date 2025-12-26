'use client';

import React, { useEffect, useRef, useState } from 'react';
import { achievementsService, CourseProgress, Achievement } from '@/services/achievements.service';
import { FaTrophy, FaMedal, FaStar, FaLock, FaCheckCircle, FaChartLine } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface CourseAchievementsProps {
  userId: string;
  courseId?: string;
  hideEmptyMessage?: boolean;
}

export default function CourseAchievements({ userId, courseId, hideEmptyMessage }: CourseAchievementsProps) {
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<CourseProgress | null>(null);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  const fetchInFlightRef = useRef(false);
  const checkInFlightRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    // التحقق من الإنجازات الجديدة كل دقيقة
    const interval = setInterval(checkNewAchievements, 60000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [userId, courseId]);

  const fetchData = async () => {
    if (!userId) return;
    if (fetchInFlightRef.current) return;
    fetchInFlightRef.current = true;
    try {
      if (mountedRef.current) setLoading(true);
      const progress = await achievementsService.getUserCourseProgress(userId);
      
      // فلترة حسب الكورس إذا تم تحديده
      if (courseId) {
        const filtered = progress.filter(p => p.course_id === courseId);
        if (!mountedRef.current) return;
        setCourseProgress(filtered);
        if (filtered.length > 0) {
          setSelectedCourse(filtered[0]);
        }
      } else {
        if (!mountedRef.current) return;
        setCourseProgress(progress);
      }
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
    } finally {
      fetchInFlightRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  };

  const checkNewAchievements = async () => {
    if (!userId) return;
    if (checkInFlightRef.current) return;
    checkInFlightRef.current = true;
    try {
      const newAchs = await achievementsService.checkAndGrantAchievements(userId, courseId);
      if (!mountedRef.current) return;
      if (newAchs.length > 0) {
        setNewAchievements(newAchs);
        fetchData();
        setTimeout(() => {
          if (mountedRef.current) setNewAchievements([]);
        }, 5000);
      }
    } finally {
      checkInFlightRef.current = false;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'from-green-400 to-green-600';
    if (progress >= 60) return 'from-blue-400 to-blue-600';
    if (progress >= 40) return 'from-yellow-400 to-yellow-600';
    if (progress >= 20) return 'from-orange-400 to-orange-600';
    return 'from-red-400 to-red-600';
  };

  const getAchievementIcon = (category: string) => {
    switch (category) {
      case 'excellence': return <FaTrophy className="text-yellow-500" />;
      case 'completion': return <FaMedal className="text-green-500" />;
      case 'participation': return <FaStar className="text-blue-500" />;
      default: return <FaCheckCircle className="text-purple-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* إشعار الإنجازات الجديدة */}
      <AnimatePresence>
        {newAchievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-4 rounded-lg shadow-lg"
          >
            <div className="flex items-center gap-3">
              <FaTrophy className="text-3xl" />
              <div>
                <h3 className="font-bold text-lg">🎉 مبروك! حصلت على إنجازات جديدة!</h3>
                <div className="flex gap-2 mt-2">
                  {newAchievements.map(ach => (
                    <span key={ach.id} className="bg-white/20 px-3 py-1 rounded-full text-sm">
                      {ach.title} (+{ach.points} نقطة)
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* قائمة الكورسات مع الإنجازات */}
      {courseProgress.map(course => (
        <motion.div
          key={course.course_id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
        >
          {/* رأس الكورس */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {course.course_title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {course.completed_lessons} من {course.total_lessons} درس مكتمل
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{course.points_earned}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">نقطة مكتسبة</div>
              </div>
            </div>

            {/* شريط التقدم */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">التقدم</span>
                <span className="text-sm font-bold text-primary">{Math.round(course.progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full bg-gradient-to-r ${getProgressColor(course.progress)} transition-all duration-500`}
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            </div>

            {/* الإحصائيات */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <FaCheckCircle className="text-2xl text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {course.achievements_earned.length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">إنجاز محقق</div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <FaChartLine className="text-2xl text-green-600 dark:text-green-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {Math.round((course.completed_lessons / course.total_lessons) * 100)}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">معدل الإكمال</div>
              </div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <FaTrophy className="text-2xl text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {course.next_achievement ? course.next_achievement.points : 0}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">نقاط الإنجاز التالي</div>
              </div>
            </div>
          </div>

          {/* الإنجازات المحققة */}
          <div className="p-6">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaTrophy className="text-yellow-500" />
              الإنجازات المحققة ({course.achievements_earned.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {course.achievements_earned.map(ua => (
                <motion.div
                  key={ua.id}
                  whileHover={{ scale: 1.05 }}
                  className="relative p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg border border-yellow-300 dark:border-yellow-700"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">
                      {getAchievementIcon(ua.achievement?.category || 'learning')}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white">
                        {ua.achievement?.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {ua.achievement?.description}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(ua.earned_at).toLocaleDateString('ar-EG')}
                        </span>
                        <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                          +{ua.achievement?.points} نقطة
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* شارة الإكمال */}
                  <div className="absolute -top-2 -right-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <FaCheckCircle className="text-white text-sm" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* الإنجاز التالي */}
            {course.next_achievement && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <FaLock className="text-gray-400" />
                  الإنجاز التالي
                </h4>
                <div className="flex items-start gap-3">
                  <div className="text-3xl opacity-50">
                    {getAchievementIcon(course.next_achievement.category)}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-700 dark:text-gray-300">
                      {course.next_achievement.title}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {course.next_achievement.description}
                    </p>
                    <div className="mt-2">
                      <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                        +{course.next_achievement.points} نقطة عند الإكمال
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      ))}

      {/* رسالة فارغة */}
      {courseProgress.length === 0 && !hideEmptyMessage && (
        <div className="text-center py-12">
          <FaTrophy className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
            لا توجد كورسات مسجلة حالياً
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            ابدأ بالتسجيل في كورس لتحصل على الإنجازات والنقاط
          </p>
        </div>
      )}
    </div>
  );
}
