"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import VideoPlayer from '../../../components/VideoPlayer';
import { FaPlay, FaLock, FaSpinner, FaStar, FaCheck } from 'react-icons/fa';
import { courseApi } from '../../../utils/api';
import { toast } from 'react-hot-toast';
import { Course } from '../../../types/course';
import GlowingText from '../../../components/GlowingText';

interface CourseProgress {
  completedLessons: string[];
  currentLesson: string;
  percentComplete: number;
}

function CoursePage() {
  const router = useRouter();
  const params = useParams();
  // تحويل معرف الدورة إلى نص للتوافق مع واجهة API
  const courseId = params?.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [progress, setProgress] = useState<CourseProgress | null>(null);

  const fetchCourse = async () => {
    try {
      setIsLoading(true);
      const [courseData, progressData] = await Promise.all([
        courseApi.getCourseById(courseId),
        courseApi.getCourseProgress(courseId)
      ]);
      
      setCourse(courseData);
      setProgress(progressData);
      setActiveLesson(progressData.currentLesson || String(courseData.lessons[0]?.id) || null);
    } catch (error: unknown) {
      console.error('Error fetching course:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء استرداد بيانات الكورس';
      setError(errorMessage);
      toast.error('حدث خطأ أثناء تحميل الكورس');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrollment = async () => {
    if (!course) return;
    
    try {
      setIsEnrolling(true);
      await courseApi.enrollInCourse(course.id);
      toast.success('تم التسجيل في الكورس بنجاح');
      await fetchCourse();
    } catch (error: unknown) {
      console.error('Error enrolling in course:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء التسجيل في الكورس';
      toast.error(errorMessage);
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleLessonComplete = async (lessonId: string) => {
    if (!course) return;
    
    try {
      await courseApi.markLessonComplete(course.id, lessonId);
      toast.success('تم إكمال الدرس بنجاح');
      const updatedProgress = await courseApi.getCourseProgress(course.id);
      setProgress(updatedProgress);
    } catch (error: unknown) {
      console.error('Error marking lesson as complete:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث حالة الدرس';
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">حدث خطأ</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* قسم الصورة والتفاصيل الأساسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="relative h-[400px] rounded-lg overflow-hidden">
          <Image
            src={course.image}
            alt={course.title}
            fill
            className="object-cover"
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-4">
            {course.title} - <GlowingText text="المستقبل" />
          </h1>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-yellow-500">{course.rating}</span>
            <span>({course.studentsCount} طالب)</span>
          </div>
          <p className="text-gray-600 mb-6">{course.description}</p>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 line-through">{course.price} جنيه</span>
              <span className="text-blue-600 font-bold">{course.discountPrice} جنيه</span>
            </div>
            <button 
              className={`px-4 py-2 ${course.enrolled ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded flex items-center gap-2`}
              onClick={handleEnrollment}
              disabled={isEnrolling}
            >
              {isEnrolling ? (
                <>
                  <FaSpinner className="animate-spin" />
                  جاري التسجيل...
                </>
              ) : course.enrolled ? (
                'تم التسجيل'
              ) : (
                'اشترك الآن'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* قسم معلومات المدرس */}
      <div className="bg-white rounded-lg p-6 mb-8 shadow">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full overflow-hidden">
            <Image
              src={course.instructor.image}
              alt={course.instructor.name}
              width={64}
              height={64}
              className="object-cover"
            />
          </div>
          <div>
            <h3 className="font-semibold">{course.instructor.name}</h3>
            <p className="text-gray-600">{course.instructor.title}</p>
          </div>
        </div>
        <p className="text-gray-600">{course.instructor.bio}</p>
      </div>

      {/* قسم المتطلبات والميزات */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-xl font-semibold mb-4">المتطلبات</h3>
          <ul className="space-y-2">
            {course.requirements.map((req, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="text-blue-500">•</span>
                {req}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-xl font-semibold mb-4">المميزات</h3>
          <ul className="space-y-2">
            {course.features.map((feat, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="text-blue-500">•</span>
                {feat}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* قسم الدروس */}
      <div className="bg-white rounded-lg p-6 shadow">
        <h3 className="text-xl font-semibold mb-4">الدروس</h3>
        <div className="space-y-4">
          {course.lessons.map((lesson) => (
            <div
              key={lesson.id}
              className={`p-4 rounded-lg cursor-pointer ${
                activeLesson === String(lesson.id) ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => setActiveLesson(String(lesson.id))}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {progress?.completedLessons.includes(String(lesson.id)) ? (
                    <FaCheck className="text-green-500" />
                  ) : course.enrolled ? (
                    <FaPlay className="text-blue-500" />
                  ) : (
                    <FaLock className="text-gray-400" />
                  )}
                  <div>
                    <h4 className="font-medium">{lesson.title}</h4>
                    <p className="text-gray-600">{lesson.duration}</p>
                  </div>
                </div>
                {activeLesson === String(lesson.id) && course.enrolled && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500">جاري التشغيل</span>
                    <div className="w-4 h-4 rounded-full border-2 border-blue-500 animate-spin" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* قسم مشغل الفيديو */}
      {course.enrolled && activeLesson && (
        <div className="mt-8">
          <VideoPlayer
            courseId={String(course.id)}
            lessonId={activeLesson || ''}
            src={`/api/videos/${course.id}/${activeLesson}`}
            title={course.lessons.find(l => String(l.id) === activeLesson)?.title || ''}
            poster={course.image}
          />
        </div>
      )}
    </div>
  );
}

export default CoursePage;
