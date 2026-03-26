import { useState, useEffect, useCallback } from 'react';
import { progressService } from '../services/api';
import studySessionTracker from '../utils/studySessionTracker';

/**
 * Hook مخصص لإدارة تقدم الطالب في الدورات
 * 
 * @param {string} courseId معرف الدورة
 * @param {string} lessonId معرف الدرس (اختياري)
 * @returns {Object} متغيرات وعمليات تتبع التقدم
 */
export default function useCourseProgress(courseId, lessonId = null) {
  const [progress, setProgress] = useState(0);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [totalLessons, setTotalLessons] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
  const [studyTime, setStudyTime] = useState(0);
  
  // دالة لتحميل تقدم الدورة من الخادم
  const loadCourseProgress = useCallback(async () => {
    if (!courseId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await progressService.getCourseProgress(courseId);
      
      if (data) {
        setProgress(data.progress || 0);
        setCompletedLessons(data.completedLessons || []);
        setTotalLessons(data.totalLessons || 0);
        setStudyTime(data.totalStudyTime || 0);
        
        if (lessonId) {
          const lessonProgress = data.lessons?.find(l => l.id === lessonId);
          if (lessonProgress) {
            setCurrentPosition(lessonProgress.currentTime || 0);
            setIsLessonCompleted(lessonProgress.completed || false);
          }
        }
      }
    } catch (err) {
      console.error('خطأ في تحميل تقدم الدورة:', err);
      setError('حدث خطأ أثناء تحميل بيانات تقدمك في الدورة');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, lessonId]);
  
  // تحميل تقدم الدورة عند تغيير courseId أو lessonId
  useEffect(() => {
    loadCourseProgress();
  }, [courseId, lessonId, loadCourseProgress]);
  
  // تحديث حالة درس (إكمال أو إلغاء إكمال)
  const updateLessonStatus = useCallback(async (lessonId, status) => {
    if (!courseId || !lessonId) return;
    
    try {
      const result = await progressService.updateLessonStatus(courseId, lessonId, status);
      
      // تحديث الحالة المحلية بناءً على استجابة الخادم
      if (result) {
        setProgress(result.courseProgress || progress);
        
        if (status.completed) {
          if (!completedLessons.includes(lessonId)) {
            setCompletedLessons([...completedLessons, lessonId]);
          }
          setIsLessonCompleted(true);
        } else {
          setCompletedLessons(completedLessons.filter(id => id !== lessonId));
          setIsLessonCompleted(false);
        }
      }
      
      return result;
    } catch (err) {
      console.error('خطأ في تحديث حالة الدرس:', err);
      setError('حدث خطأ أثناء تحديث حالة الدرس');
      return null;
    }
  }, [courseId, progress, completedLessons]);
  
  // تتبع تقدم مشاهدة الفيديو
  const trackVideoProgress = useCallback(async (time, duration, progress) => {
    if (!courseId || !lessonId) return;
    
    try {
      const isCompleted = progress > 95;
      
      const result = await progressService.trackVideoProgress(courseId, lessonId, {
        currentTime: time,
        duration,
        progress,
        completed: isCompleted
      });
      
      // تحديث الحالة المحلية إذا اكتمل الدرس
      if (isCompleted && !isLessonCompleted) {
        setIsLessonCompleted(true);
        
        if (!completedLessons.includes(lessonId)) {
          setCompletedLessons([...completedLessons, lessonId]);
        }
        
        if (result?.courseProgress) {
          setProgress(result.courseProgress);
        }
      }
      
      return result;
    } catch (err) {
      console.error('خطأ في تتبع تقدم الفيديو:', err);
      return null;
    }
  }, [courseId, lessonId, completedLessons, isLessonCompleted]);
  
  // بدء جلسة تعلم جديدة
  const startStudySession = useCallback(() => {
    if (!courseId) return null;
    
    return studySessionTracker.startSession({
      courseId,
      lessonId,
      progress
    });
  }, [courseId, lessonId, progress]);
  
  // إنهاء جلسة التعلم الحالية
  const endStudySession = useCallback(() => {
    return studySessionTracker.endSession();
  }, []);
  
  // الحصول على مدة الدراسة الحالية المنسقة
  const getFormattedStudyTime = useCallback(() => {
    const activeSession = studySessionTracker.getActiveSession();
    const currentSessionTime = activeSession?.currentDuration || 0;
    
    return studySessionTracker.formatStudyTime(studyTime + currentSessionTime);
  }, [studyTime]);
  
  return {
    progress,
    completedLessons,
    totalLessons,
    currentPosition,
    isLoading,
    error,
    isLessonCompleted,
    studyTime,
    loadCourseProgress,
    updateLessonStatus,
    trackVideoProgress,
    startStudySession,
    endStudySession,
    getFormattedStudyTime
  };
} 