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
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50"
        >
          {/* رأس الكورس المحسّن */}
          <div className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 p-6 text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
            <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  {course.course_title}
                </h2>
                  <p className="text-white/90 flex items-center gap-2">
                    <FaCheckCircle className="text-green-300" />
                  {course.completed_lessons} من {course.total_lessons} درس مكتمل
                </p>
              </div>
                <div className="text-center bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/30">
                  <div className="text-4xl font-bold">{course.points_earned}</div>
                  <div className="text-sm text-white/90 mt-1">نقطة مكتسبة</div>
              </div>
            </div>

              {/* شريط التقدم المحسّن */}
            <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg font-semibold">التقدم الإجمالي</span>
                  <span className="text-2xl font-bold">{Math.round(course.progress)}%</span>
              </div>
                <div className="w-full bg-white/20 backdrop-blur-sm rounded-full h-4 overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${course.progress}%` }}
                    transition={{ duration: 1.5, delay: 0.2 }}
                    className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(course.progress)} shadow-lg`}
                />
              </div>
            </div>

              {/* الإحصائيات المحسّنة */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <FaCheckCircle className="text-2xl text-green-300 mx-auto mb-2" />
                  <div className="text-xl font-bold">{course.achievements_earned.length}</div>
                  <div className="text-xs text-white/80 mt-1">إنجاز محقق</div>
                </div>
                <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <FaChartLine className="text-2xl text-blue-300 mx-auto mb-2" />
                  <div className="text-xl font-bold">
                    {course.total_lessons > 0 ? Math.round((course.completed_lessons / course.total_lessons) * 100) : 0}%
              </div>
                  <div className="text-xs text-white/80 mt-1">معدل الإكمال</div>
                </div>
                <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <FaTrophy className="text-2xl text-yellow-300 mx-auto mb-2" />
                  <div className="text-xl font-bold">
                    {course.next_achievement ? course.next_achievement.points : 0}
              </div>
                  <div className="text-xs text-white/80 mt-1">نقاط التالي</div>
                </div>
              </div>
            </div>
          </div>

          {/* الإنجازات المحققة المحسّنة */}
          <div className="p-6 bg-gray-50 dark:bg-gray-900/50">
            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl">
                <FaTrophy className="text-white text-xl" />
              </div>
              الإنجازات المحققة 
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                {course.achievements_earned.length}
              </span>
            </h3>
            
            {course.achievements_earned.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {course.achievements_earned.map(ua => (
                <motion.div
                  key={ua.id}
                    whileHover={{ scale: 1.03, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="relative p-5 bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 dark:from-yellow-900/30 dark:via-orange-900/30 dark:to-amber-900/30 rounded-2xl border-2 border-yellow-300 dark:border-yellow-700 shadow-lg hover:shadow-xl transition-all"
                >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl flex-shrink-0">
                      {getAchievementIcon(ua.achievement?.category || 'learning')}
                    </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                        {ua.achievement?.title}
                      </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {ua.achievement?.description}
                      </p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded">
                          {new Date(ua.earned_at).toLocaleDateString('ar-EG')}
                        </span>
                          <span className="text-sm font-bold bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full">
                          +{ua.achievement?.points} نقطة
                        </span>
                      </div>
                    </div>
                  </div>
                    {/* شارة الإكمال المحسّنة */}
                    <div className="absolute -top-3 -right-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                        <FaCheckCircle className="text-white text-lg" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                <FaTrophy className="text-5xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">لم تحقق أي إنجازات في هذا الكورس بعد</p>
              </div>
            )}

            {/* الإنجاز التالي المحسّن */}
            {course.next_achievement && (
              <div className="mt-6 p-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-dashed border-gray-400 dark:border-gray-600">
                <h4 className="font-bold text-xl text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <div className="p-2 bg-gray-300 dark:bg-gray-700 rounded-lg">
                    <FaLock className="text-gray-600 dark:text-gray-400" />
                  </div>
                  الإنجاز التالي
                </h4>
                <div className="flex items-start gap-4">
                  <div className="text-4xl opacity-40 flex-shrink-0">
                    {getAchievementIcon(course.next_achievement.category)}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                      {course.next_achievement.title}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {course.next_achievement.description}
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-full text-sm font-bold shadow-lg">
                      <FaStar className="text-yellow-300" />
                        +{course.next_achievement.points} نقطة عند الإكمال
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
