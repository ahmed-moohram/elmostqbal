'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaLock, FaClock, FaStar, FaRoute, FaTrophy, FaFire } from 'react-icons/fa';
import Link from 'next/link';

interface PathStep {
  id: string;
  title: string;
  description: string;
  duration: number;
  isCompleted: boolean;
  isLocked: boolean;
  courseId?: string;
  prerequisite?: string;
  points: number;
}

export default function LearningPath() {
  const [steps] = useState<PathStep[]>([
    {
      id: '1',
      title: 'أساسيات البرمجة',
      description: 'تعلم المفاهيم الأساسية للبرمجة وحل المشكلات',
      duration: 8,
      isCompleted: true,
      isLocked: false,
      courseId: 'basics-101',
      points: 100
    },
    {
      id: '2',
      title: 'HTML & CSS',
      description: 'بناء صفحات الويب وتنسيقها',
      duration: 12,
      isCompleted: true,
      isLocked: false,
      prerequisite: '1',
      courseId: 'html-css',
      points: 150
    },
    {
      id: '3',
      title: 'JavaScript الأساسي',
      description: 'تعلم أساسيات جافاسكريبت والبرمجة التفاعلية',
      duration: 16,
      isCompleted: false,
      isLocked: false,
      prerequisite: '2',
      courseId: 'js-basics',
      points: 200
    },
    {
      id: '4',
      title: 'React.js',
      description: 'بناء تطبيقات ويب حديثة باستخدام React',
      duration: 20,
      isCompleted: false,
      isLocked: false,
      prerequisite: '3',
      courseId: 'react-basics',
      points: 250
    },
    {
      id: '5',
      title: 'Next.js و TypeScript',
      description: 'تطوير تطبيقات متقدمة مع أفضل الممارسات',
      duration: 24,
      isCompleted: false,
      isLocked: true,
      prerequisite: '4',
      courseId: 'nextjs-ts',
      points: 300
    },
    {
      id: '6',
      title: 'مشروع التخرج',
      description: 'بناء مشروع كامل من الصفر',
      duration: 30,
      isCompleted: false,
      isLocked: true,
      prerequisite: '5',
      points: 500
    }
  ]);

  const completedSteps = steps.filter(s => s.isCompleted).length;
  const totalSteps = steps.length;
  const progress = (completedSteps / totalSteps) * 100;
  const totalPoints = steps.reduce((sum, step) => sum + (step.isCompleted ? step.points : 0), 0);
  const maxPoints = steps.reduce((sum, step) => sum + step.points, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <FaRoute />
              مسارك التعليمي
            </h2>
            <p className="text-white/80">مسار Full Stack Developer</p>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-2 text-3xl font-bold mb-1">
              <FaTrophy className="text-yellow-300" />
              {totalPoints}
            </div>
            <p className="text-sm text-white/80">من {maxPoints} نقطة</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{completedSteps} من {totalSteps} مكتملة</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-green-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <FaCheckCircle className="text-2xl text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedSteps}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">دورة مكتملة</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-blue-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <FaClock className="text-2xl text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {steps.reduce((sum, s) => sum + (s.isCompleted ? s.duration : 0), 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">ساعة تعليمية</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-orange-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <FaFire className="text-2xl text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">7</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">أيام متتالية</p>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Path */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-700" />

        <div className="space-y-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Step Circle */}
              <div className={`absolute right-3 w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                step.isCompleted 
                  ? 'bg-green-500' 
                  : step.isLocked 
                  ? 'bg-gray-400 dark:bg-gray-600' 
                  : 'bg-primary'
              }`}>
                {step.isCompleted ? (
                  <FaCheckCircle className="text-white text-sm" />
                ) : step.isLocked ? (
                  <FaLock className="text-white text-xs" />
                ) : (
                  <div className="w-3 h-3 bg-white rounded-full" />
                )}
              </div>

              {/* Step Card */}
              <div className={`mr-12 ${step.isLocked ? 'opacity-60' : ''}`}>
                <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border-2 transition-all ${
                  step.isCompleted 
                    ? 'border-green-500' 
                    : step.isLocked 
                    ? 'border-gray-300 dark:border-gray-700' 
                    : 'border-primary hover:shadow-xl'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {step.title}
                        </h3>
                        {step.isCompleted && (
                          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs font-bold">
                            مكتمل
                          </span>
                        )}
                        {step.isLocked && (
                          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-bold flex items-center gap-1">
                            <FaLock className="text-xs" /> مقفل
                          </span>
                        )}
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {step.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <FaClock />
                          {step.duration} ساعة
                        </div>
                        <div className="flex items-center gap-1">
                          <FaStar className="text-yellow-500" />
                          {step.points} نقطة
                        </div>
                      </div>
                    </div>

                    {!step.isLocked && (
                      <div>
                        <Link href={`/courses/${step.courseId}`}>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-6 py-3 rounded-xl font-bold transition-colors ${
                              step.isCompleted
                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                : 'bg-primary hover:bg-primary-dark text-white'
                            }`}
                          >
                            {step.isCompleted ? 'مراجعة' : 'ابدأ الآن'}
                          </motion.button>
                        </Link>
                      </div>
                    )}
                  </div>

                  {step.prerequisite && !step.isCompleted && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        📌 يتطلب إتمام: {steps.find(s => s.id === step.prerequisite)?.title}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Completion Reward */}
      {progress === 100 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 text-white text-center"
        >
          <FaTrophy className="text-6xl mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">مبروك! أكملت المسار التعليمي</h3>
          <p className="mb-4">حصلت على شارة Full Stack Developer</p>
          <button className="px-8 py-3 bg-white text-orange-500 rounded-xl font-bold hover:bg-gray-100 transition-colors">
            احصل على شهادتك
          </button>
        </motion.div>
      )}
    </div>
  );
}
