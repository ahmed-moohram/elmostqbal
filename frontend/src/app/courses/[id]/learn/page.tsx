'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FaChevronLeft, FaChevronRight, FaPlay, FaClock, FaCheckCircle, FaRegCircle, FaBookmark, FaDownload, FaRegStar, FaStar, FaList, FaBars, FaRegComment, FaRegFileAlt, FaChevronDown, FaChevronUp, FaAngleDown, FaAngleUp, FaQuestion, FaBook, FaShare, FaRegCheckCircle } from 'react-icons/fa';
import VideoPlayer from '@/components/VideoPlayer';
import useCourseProgress from '../../../../hooks/useCourseProgress';
import { coursesService } from '../../../../services/api';
import studySessionTracker from '../../../../utils/studySessionTracker';

// نموذج بيانات الدرس
interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: 'video' | 'quiz' | 'assignment';
  videoUrl?: string;
  resources?: {
    name: string;
    url: string;
    type: string;
    size: string;
  }[];
  notes?: string;
  completed?: boolean;
  quizQuestions?: {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
}

// نموذج بيانات السؤال في الاختبار
interface Question {
  id: string;
  text: string;
    options: string[];
  correctAnswer: string;
}

// نموذج درس من نوع اختبار (كويز)
interface QuizLesson extends Lesson {
  questions: Question[];
}

// نموذج بيانات الوحدة
interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

// نموذج بيانات الدورة
interface Course {
  id: string;
  title: string;
  instructor: {
    name: string;
    image: string;
  };
  modules: Module[];
  progress: number;
  expiryDate?: string; // تاريخ انتهاء صلاحية الكورس
  isExpired?: boolean; // هل انتهت صلاحية الكورس
}

// بيانات الدورة (ستأتي من API في النظام الحقيقي)
const mockCourse: Course = {
  id: '1',
  title: 'الرياضيات للصف الثالث الثانوي',
  instructor: {
    name: 'د. أحمد محمود',
    image: '/placeholder-profile.jpg',
  },
  expiryDate: '2025-12-31', // تاريخ انتهاء الصلاحية
  isExpired: false,
  modules: [
    {
      id: 'm1',
      title: 'التفاضل',
      lessons: [
        {
          id: 'l1',
          title: 'مقدمة في التفاضل',
          description: 'شرح المفاهيم الأساسية في التفاضل وتعريف المشتقة وطرق حسابها',
          duration: '45 دقيقة',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          type: 'video',
          notes: 'مذكرات مهمة عن المشتقات',
          resources: [
            {
              name: 'ملخص التفاضل',
              url: '/files/calculus-summary.pdf',
              type: 'PDF',
              size: '2.5 MB'
            },
            {
              name: 'تمارين إضافية',
              url: '/files/extra-exercises.pdf',
              type: 'PDF',
              size: '1.8 MB'
            }
          ],
          completed: true
        },
        {
          id: 'l2',
          title: 'تطبيقات المشتقة',
          description: 'شرح تطبيقات المشتقة في إيجاد النهايات العظمى والصغرى وحل المسائل',
          duration: '55 دقيقة',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          type: 'video',
          resources: [
            {
              name: 'أوراق عمل',
              url: '/files/worksheets.pdf',
              type: 'PDF',
              size: '1.2 MB'
            }
          ],
          completed: true
        },
        {
          id: 'l3',
          title: 'اختبار على التفاضل',
          description: 'اختبار شامل على الدروس السابقة',
          duration: '30 دقيقة',
          videoUrl: '',
          type: 'quiz',
          quizQuestions: [
            {
              id: 1,
              question: 'مشتقة الدالة f(x) = x² هي:',
              options: ['f\'(x) = x', 'f\'(x) = 2x', 'f\'(x) = 2', 'f\'(x) = x²'],
              correctAnswer: 1
            },
            {
              id: 2,
              question: 'مشتقة الدالة f(x) = sin(x) هي:',
              options: ['f\'(x) = cos(x)', 'f\'(x) = -sin(x)', 'f\'(x) = -cos(x)', 'f\'(x) = tan(x)'],
              correctAnswer: 0
            },
            {
              id: 3,
              question: 'إذا كانت f(x) = 3x³ - 2x² + 5x - 1، فإن f\'(2) تساوي:',
              options: ['27', '28', '29', '30'],
              correctAnswer: 2
            }
          ],
          completed: false
        }
      ]
    },
    {
      id: 'm2',
      title: 'التكامل',
      lessons: [
        {
          id: 'l4',
          title: 'مفهوم التكامل',
          description: 'شرح مفهوم التكامل كعملية عكسية للتفاضل وتطبيقاته',
          duration: '50 دقيقة',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          type: 'video',
          resources: [
            {
              name: 'ملخص التكامل',
              url: '/files/integration-summary.pdf',
              type: 'PDF',
              size: '3.1 MB'
            }
          ],
          completed: false
        },
        {
          id: 'l5',
          title: 'طرق التكامل',
          description: 'شرح الطرق المختلفة للتكامل مثل التكامل بالتعويض والتكامل بالأجزاء',
          duration: '65 دقيقة',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          type: 'video',
          completed: false
        },
        {
          id: 'l6',
          title: 'واجب التكامل',
          description: 'واجب تطبيقي على دروس التكامل',
          duration: '40 دقيقة',
          videoUrl: '',
          type: 'assignment',
          completed: false
        }
      ]
    }
  ],
  progress: 38
};

export default function CourseLearnPage() {
  const params = useParams();
  const courseId = params?.id as string;
  const router = useRouter();
  
  // State variables
  const [course, setCourse] = useState<Course | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showModules, setShowModules] = useState<Record<string, boolean>>({});
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentLessonId, setCurrentLessonId] = useState<string>('');
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  
  // استخدام hook الخاص بتقدم الدورة
  const {
    progress,
    completedLessons,
    isLessonCompleted,
    currentPosition,
    startStudySession,
    endStudySession,
    updateLessonStatus,
    trackVideoProgress
  } = useCourseProgress(courseId, currentLessonId);
  
  // تحميل بيانات الدورة
  useEffect(() => {
    async function fetchCourseData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // التحقق من اشتراك الطالب أولاً
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          setError('يجب تسجيل الدخول أولاً');
          setIsLoading(false);
          router.replace('/login');
          return;
        }
        
        const user = JSON.parse(userStr);
        const studentPhone = user.phone;
        
        // فحص إذا كان الطالب مشترك ومعتمد من الأدمن
        const enrolledCoursesStr = localStorage.getItem(`student_${studentPhone}_courses`);
        let isEnrolled = false;
        
        if (enrolledCoursesStr) {
          try {
            const enrolledCourses = JSON.parse(enrolledCoursesStr);
            isEnrolled = enrolledCourses.includes(courseId);
          } catch (e) {
            console.error('Error checking enrollment:', e);
          }
        }
        
        if (!isEnrolled) {
          setError('ليس لديك صلاحية للوصول لهذا الكورس. يرجى التسجيل أو انتظار موافقة المدرس/الأدمن.');
          setIsLoading(false);
          setTimeout(() => {
            router.replace(`/courses/${courseId}`);
          }, 2000);
          return;
        }
        
        // استدعاء API للحصول على بيانات الدورة
        const courseData = await coursesService.getCourseContent(courseId);
        
        if (courseData) {
          // التحقق من انتهاء صلاحية الكورس
          if (courseData.expiryDate) {
            const expiryDate = new Date(courseData.expiryDate);
            const today = new Date();
            courseData.isExpired = today > expiryDate;
          }
          
          setCourse(courseData);
          
          // إذا انتهت الصلاحية، لا نعرض المحتوى
          if (courseData.isExpired) {
            setError(`انتهت صلاحية هذا الكورس في ${new Date(courseData.expiryDate!).toLocaleDateString('ar-EG')}`);
            setIsLoading(false);
            return;
          }
          
          // افتراضيًا، أظهر جميع الوحدات مفتوحة
          const modulesState: Record<string, boolean> = {};
          courseData.modules.forEach((module: Module) => {
            modulesState[module.id] = true;
          });
          setShowModules(modulesState);
          
          // تحميل أول درس إذا لم يكن هناك درس محدد
          if (!currentLessonId && courseData.modules.length > 0 && courseData.modules[0].lessons.length > 0) {
            loadLesson(courseData.modules[0].lessons[0].id);
          }
        }
      } catch (err) {
        console.error('خطأ في تحميل بيانات الدورة:', err);
        setError('حدث خطأ أثناء تحميل محتوى الدورة');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchCourseData();
  }, [courseId, currentLessonId]);
  
  // بدء جلسة دراسة جديدة عند فتح الصفحة
  useEffect(() => {
    if (courseId) {
      startStudySession();
      
      // إنهاء الجلسة عند مغادرة الصفحة
      return () => {
        endStudySession();
      };
    }
  }, [courseId, startStudySession, endStudySession]);
  
  // تبديل حالة عرض الوحدة
  const toggleModule = (moduleId: string) => {
    setShowModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };
  
  // تحميل درس محدد
  const loadLesson = (lessonId: string) => {
    if (!course) return;
    
    let foundLesson: Lesson | null = null;
    
    for (const module of course.modules) {
      const lesson = module.lessons.find(l => l.id === lessonId);
      if (lesson) {
        foundLesson = lesson;
        break;
      }
    }
    
    if (foundLesson) {
      setCurrentLesson(foundLesson);
      setCurrentLessonId(lessonId);
      setQuizSubmitted(false);
      setUserAnswers({});
    }
  };
  
  // تحديث حالة الدرس كمكتمل
  const markAsComplete = async () => {
    if (!courseId || !currentLessonId) return;
    
    await updateLessonStatus(currentLessonId, { completed: true });
  };
  
  // تتبع تقدم الفيديو
  const handleVideoProgress = useCallback((progress: number, currentTime: number, duration: number) => {
    if (courseId && currentLessonId) {
      trackVideoProgress(currentTime, duration, progress);
    }
  }, [courseId, currentLessonId, trackVideoProgress]);
  
  // تقديم الاختبار
  const submitQuiz = async () => {
    if (!course || !currentLesson || currentLesson.type !== 'quiz') return;
    
    setQuizSubmitted(true);
    
    // حساب الإجابات الصحيحة
    let correctAnswers = 0;
    const quiz = currentLesson as QuizLesson;
    
    quiz.questions.forEach(question => {
      if (userAnswers[question.id] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    
    // حساب النتيجة وتخزينها
    const score = Math.round((correctAnswers / quiz.questions.length) * 100);
    setQuizScore(score);
    
    // إذا اجتاز الطالب الاختبار بنسبة 70% أو أكثر، نعتبر الدرس مكتملًا
    if (score >= 70) {
      await updateLessonStatus(currentLessonId, { completed: true });
    }
  };
  
  // تعامل مع إجابة الطالب
  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500">جاري تحميل محتوى الدورة...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-2xl mx-4"
        >
          {course?.isExpired ? (
            <>
              <div className="w-24 h-24 mx-auto mb-6 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <FaClock className="text-5xl text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4 text-center">
                انتهت صلاحية الكورس ⏰
              </h2>
              <p className="text-lg text-red-600 dark:text-red-400 mb-6 text-center">{error}</p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
                  💡 للحصول على صلاحية جديدة، يرجى التواصل مع المدرس أو إدارة المنصة
                </p>
              </div>
              <div className="flex gap-4 justify-center flex-wrap">
                <button
                  onClick={() => router.replace(`/courses/${courseId}`)}
                  className="bg-primary text-white px-8 py-3 rounded-xl hover:bg-primary/90 transition font-semibold shadow-lg"
                >
                  العودة للدورة
                </button>
                <button
                  onClick={() => router.replace('/courses')}
                  className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-8 py-3 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition font-semibold"
                >
                  تصفح الدورات
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-red-500 text-center mb-4 text-5xl">
                <FaRegCircle />
              </div>
              <h2 className="text-xl font-bold mb-4 text-center dark:text-white">حدثت مشكلة</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">{error}</p>
              <div className="flex justify-center">
                <button 
                  onClick={() => router.replace(`/courses/${courseId}`)}
                  className="btn-primary"
                >
                  العودة للدورة
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-500 mb-4">لم يتم العثور على محتوى</p>
          <button 
            onClick={() => router.replace(`/courses/${courseId}`)}
            className="btn-primary"
          >
            العودة للدورة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-3 px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <button 
              onClick={() => router.replace(`/courses/${courseId}`)}
              className="btn-outline p-2 ml-4"
            >
              العودة للدورة
            </button>
            <h1 className="text-xl font-bold dark:text-white">{course.title}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <div className="flex items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">تقدمك: {progress}%</span>
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 p-2 rounded-lg transition"
            >
              <FaBars className="dark:text-white" />
            </button>
          </div>
        </div>
        
        {/* تاريخ انتهاء الصلاحية */}
        {course.expiryDate && !course.isExpired && (
          <div className="mt-3 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2">
            <FaClock className="text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-800 dark:text-blue-300">
              صلاحية الكورس حتى: <strong>{new Date(course.expiryDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
            </span>
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* الشريط الجانبي - محتويات الدورة */}
        {showSidebar && (
          <aside className="w-full md:w-80 bg-gray-50 border-l border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-xl font-bold mb-4">محتويات الدورة</h2>
              
              <div className="mb-4">
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 ml-2">التقدم العام: {progress}%</span>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-primary h-2.5 rounded-full" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
                {course.modules.map(module => (
                  <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full p-3 flex items-center justify-between bg-gray-100 hover:bg-gray-200 transition"
                  >
                    <h3 className="font-medium text-gray-800">{module.title}</h3>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 ml-2">
                        {module.lessons.filter(lesson => completedLessons.includes(lesson.id)).length}/{module.lessons.length}
                      </span>
                      {showModules[module.id] ? <FaAngleUp /> : <FaAngleDown />}
                    </div>
                    </button>
                    
                    {showModules[module.id] && (
                      <div className="bg-gray-50 p-1">
                        {module.lessons.map(lesson => (
                          <button
                            key={lesson.id}
                            onClick={() => loadLesson(lesson.id)}
                            className={`w-full flex items-center p-3 rounded-lg text-right transition ${
                              currentLessonId === lesson.id 
                                ? 'bg-primary/10 text-primary' 
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            <div className="ml-3">
                            {completedLessons.includes(lesson.id) ? (
                                <FaCheckCircle className="text-green-500" />
                              ) : (
                                <FaRegCircle className="text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 text-right">
                              <p className={`${currentLessonId === lesson.id ? 'font-medium' : ''}`}>
                                {lesson.title}
                              </p>
                              <div className="flex items-center text-xs text-gray-500">
                                {lesson.type === 'video' && <FaPlay className="ml-1" />}
                              {lesson.type === 'quiz' && <FaQuestion className="ml-1" />}
                                {lesson.type === 'assignment' && <FaRegFileAlt className="ml-1" />}
                                <span>{lesson.duration}</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </aside>
        )}
        
        {/* المحتوى الرئيسي */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-white">
            {currentLesson.type === 'video' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col"
              >
                {/* مشغل الفيديو */}
                <div className="aspect-video bg-black relative">
                  <VideoPlayer 
                    src={currentLesson.videoUrl}
                    courseId={courseId}
                    lessonId={currentLessonId}
                    savedTime={currentPosition}
                    onProgress={handleVideoProgress}
                  />
                </div>
                
                <div className="p-6 flex-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold">{currentLesson.title}</h2>
                      <div className="flex items-center text-gray-500 mt-1">
                        <FaClock className="ml-1" />
                        <span>{currentLesson.duration}</span>
                        {isLessonCompleted && (
                          <span className="mr-4 text-green-500 flex items-center">
                            <FaCheckCircle className="ml-1" />
                            تم الإكمال
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {!isLessonCompleted && (
                        <button
                          onClick={markAsComplete}
                        className="mt-4 md:mt-0 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center transition"
                        >
                        <FaRegCheckCircle className="ml-2" />
                        تمييز كمكتمل
                        </button>
                      )}
                  </div>
                  
                  <div className="bg-gray-100 rounded-lg p-4 mb-6">
                    <p className="text-gray-700">
                      {currentLesson.description}
                    </p>
                  </div>
                  
                  {currentLesson.resources && currentLesson.resources.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold mb-4">الموارد التعليمية</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentLesson.resources.map((resource, index) => (
                          <div key={index} className="border rounded-lg p-4 flex items-center">
                            <div className="bg-primary/10 p-3 rounded-lg mr-4">
                              <FaBook className="text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium mb-1">{resource.name}</p>
                              <div className="flex items-center text-sm text-gray-500">
                                <span>{resource.type}</span>
                                <span className="mx-2">•</span>
                                <span>{resource.size}</span>
                              </div>
                            </div>
                            <button className="p-2 text-primary hover:text-primary-dark transition">
                              <FaDownload />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                      <button 
                      className="flex items-center text-gray-600 hover:text-primary transition"
                      onClick={() => {
                        // نسخ رابط الدرس
                        navigator.clipboard.writeText(window.location.href);
                      }}
                    >
                      <FaShare className="ml-2" />
                      مشاركة
                      </button>
                    
                    <div className="flex gap-4">
                      <button className="btn-outline">الدرس السابق</button>
                      <button className="btn-primary">الدرس التالي</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {currentLesson.type === 'quiz' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">{currentLesson.title}</h2>
                  <div className="flex items-center">
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded-lg">{currentLesson.duration}</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                  <p className="text-gray-700 mb-4">
                    {currentLesson.description}
                  </p>
                </div>
                
                  <div className="space-y-6">
                  {(currentLesson as QuizLesson).questions?.map((question, qIndex) => (
                    <div 
                      key={question.id} 
                      className="bg-white rounded-lg border border-gray-200 p-6"
                    >
                      <h3 className="text-lg font-medium mb-4 flex items-center">
                        <span className="inline-block w-6 h-6 text-center rounded-full bg-primary text-white ml-2">
                          {qIndex + 1}
                        </span>
                        {question.text}
                            </h3>
                      
                            <div className="space-y-2">
                              {question.options.map((option, oIndex) => (
                                <label 
                                  key={oIndex} 
                                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                              userAnswers[question.id] === option
                                      ? 'border-primary bg-primary/5'
                                      : 'border-gray-200 hover:bg-gray-50'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`question-${question.id}`}
                              checked={userAnswers[question.id] === option}
                              onChange={() => handleAnswerSelect(question.id, option)}
                                    className="ml-2"
                                  />
                                  <span>{option}</span>
                            
                            {quizSubmitted && userAnswers[question.id] === option && (
                              <>
                                {option === question.correctAnswer ? (
                                  <span className="ml-auto text-green-500 flex items-center">
                                    <FaCheckCircle className="ml-1" />
                                    إجابة صحيحة
                                  </span>
                                ) : (
                                  <span className="ml-auto text-red-500 flex items-center">
                                    <FaRegCircle className="ml-1" />
                                    إجابة خاطئة
                                  </span>
                                )}
                              </>
                            )}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                </div>
                
                <div className="mt-6 flex justify-between items-center">
                  {quizSubmitted ? (
                    <div className="w-full bg-gray-100 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold">النتيجة:</h3>
                        <span className={`text-lg font-bold ${
                          quizScore >= 70 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {quizScore}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full">
                        <div 
                          className={`h-2 rounded-full ${
                            quizScore >= 70 ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${quizScore}%` }}
                        ></div>
                      </div>
                      <p className="mt-3 text-center">
                        {quizScore >= 70 
                          ? 'أحسنت! لقد نجحت في الاختبار' 
                          : 'حاول مرة أخرى للحصول على درجة أعلى'}
                      </p>
                    </div>
                  ) : (
                    <button 
                      onClick={submitQuiz}
                      className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg transition"
                    >
                      تسليم الإجابات
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
} 