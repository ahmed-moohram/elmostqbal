"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiClient, API_BASE_URL } from '@/lib/api';

interface CourseProgress {
  courseId: string;
  completedVideos: string[];
  totalVideos: number;
  progressPercentage: number;
  lastWatchedVideo?: string;
  lastWatchedAt?: Date;
  totalWatchTime: number;
}

interface QuizResult {
  quizId: string;
  courseId: string;
  score: number;
  totalQuestions: number;
  passed: boolean;
  completedAt: Date;
}

interface ProgressContextType {
  coursesProgress: Record<string, CourseProgress>;
  quizResults: QuizResult[];
  isLoading: boolean;
  markVideoAsCompleted: (courseId: string, videoId: string) => Promise<void>;
  updateWatchTime: (courseId: string, videoId: string, watchTime: number) => void;
  saveQuizResult: (result: QuizResult) => Promise<void>;
  getCourseProgress: (courseId: string) => CourseProgress | null;
  refreshProgress: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [coursesProgress, setCoursesProgress] = useState<Record<string, CourseProgress>>({});
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // تحميل التقدم من الخادم
  useEffect(() => {
    // جلب التقدم من Supabase فقط
    loadProgress();
  }, [user]);

  const loadProgress = async () => {
    setIsLoading(true);
    try {
      // جلب بيانات المستخدم
      const userData = localStorage.getItem('user');
      if (!userData) {
        setIsLoading(false);
        return;
      }
      
      const user = JSON.parse(userData);
      
      // استخدام Supabase لجلب التقدم
      const { createClient } = await import('@supabase/supabase-js');
      const SUPABASE_URL = 'https://wnqifmvgvlmxgswhcwnc.supabase.co';
      const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWlmbXZndmxteGdzd2hjd25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MzYwNTUsImV4cCI6MjA3ODAxMjA1NX0.LqWhTZYmr7nu-dIy2uBBqntOxoWM-waluYIR9bipC9M';
      
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      
      // جلب تقدم الدروس
      const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id);
      
      // جلب نتائج الاختبارات
      const { data: quizData } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', user.id);
      
      // تحويل البيانات للصيغة المطلوبة
      const coursesProgressMap: any = {};
      if (progressData) {
        progressData.forEach((item: any) => {
          if (!coursesProgressMap[item.course_id]) {
            coursesProgressMap[item.course_id] = {
              completedLessons: [],
              currentLesson: '',
              isCompleted: false,
              percentComplete: 0
            };
          }
          if (item.is_completed) {
            coursesProgressMap[item.course_id].completedLessons.push(item.lesson_id);
          }
        });
      }
      
      setCoursesProgress(coursesProgressMap);
      setQuizResults(quizData || []);
      
    } catch (error) {
      console.error('❌ خطأ في تحميل التقدم:', error);
      // لا نستخدم بيانات محلية
      setCoursesProgress({});
      setQuizResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLocalProgress = () => {
    try {
      const stored = localStorage.getItem('coursesProgress');
      if (stored) {
        setCoursesProgress(JSON.parse(stored));
      }
      
      const storedQuizzes = localStorage.getItem('quizResults');
      if (storedQuizzes) {
        setQuizResults(JSON.parse(storedQuizzes));
      }
    } catch (error) {
      console.error('Error loading local progress:', error);
    }
  };

  const saveLocalProgress = (progress: Record<string, CourseProgress>) => {
    try {
      localStorage.setItem('coursesProgress', JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving local progress:', error);
    }
  };

  const markVideoAsCompleted = async (courseId: string, videoId: string) => {
    const currentProgress = coursesProgress[courseId] || {
      courseId,
      completedVideos: [],
      totalVideos: 0,
      progressPercentage: 0,
      totalWatchTime: 0,
    };

    if (!currentProgress.completedVideos.includes(videoId)) {
      const updatedProgress = {
        ...currentProgress,
        completedVideos: [...currentProgress.completedVideos, videoId],
        lastWatchedVideo: videoId,
        lastWatchedAt: new Date(),
        progressPercentage: Math.round(
          ((currentProgress.completedVideos.length + 1) / currentProgress.totalVideos) * 100
        ),
      };

      const newProgress = {
        ...coursesProgress,
        [courseId]: updatedProgress,
      };

      setCoursesProgress(newProgress);
      saveLocalProgress(newProgress);

      // إرسال للخادم إذا كان المستخدم مسجل
      if (token) {
        try {
          await fetch(`${API_BASE_URL}/api/students/progress`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              courseId,
              videoId,
              action: 'complete',
            }),
          });
        } catch (error) {
          console.error('Error syncing progress:', error);
        }
      }
    }
  };

  const updateWatchTime = (courseId: string, videoId: string, watchTime: number) => {
    const currentProgress = coursesProgress[courseId] || {
      courseId,
      completedVideos: [],
      totalVideos: 0,
      progressPercentage: 0,
      totalWatchTime: 0,
    };

    const updatedProgress = {
      ...currentProgress,
      totalWatchTime: currentProgress.totalWatchTime + watchTime,
      lastWatchedVideo: videoId,
      lastWatchedAt: new Date(),
    };

    const newProgress = {
      ...coursesProgress,
      [courseId]: updatedProgress,
    };

    setCoursesProgress(newProgress);
    saveLocalProgress(newProgress);
  };

  const saveQuizResult = async (result: QuizResult) => {
    const updatedResults = [...quizResults, result];
    setQuizResults(updatedResults);
    
    try {
      localStorage.setItem('quizResults', JSON.stringify(updatedResults));
    } catch (error) {
      console.error('Error saving quiz result:', error);
    }

    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/students/quiz-results`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(result),
        });
      } catch (error) {
        console.error('Error syncing quiz result:', error);
      }
    }
  };

  const getCourseProgress = (courseId: string): CourseProgress | null => {
    return coursesProgress[courseId] || null;
  };

  const refreshProgress = async () => {
    if (user && token) {
      await loadProgress();
    } else {
      loadLocalProgress();
    }
  };

  const value = {
    coursesProgress,
    quizResults,
    isLoading,
    markVideoAsCompleted,
    updateWatchTime,
    saveQuizResult,
    getCourseProgress,
    refreshProgress,
  };

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}
