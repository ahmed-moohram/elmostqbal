'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaUsers, FaClock, FaPlay, FaCheckCircle, FaRegBookmark, FaBookmark, FaShoppingCart, FaLock, FaUnlock } from 'react-icons/fa';
import VideoPlayer from './VideoPlayer';

interface Instructor {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatar: string;
  rating: number;
  coursesCount: number;
  studentsCount: number;
}

interface Lesson {
  id: string;
  title: string;
  duration: number;
  videoUrl?: string;
  isFree: boolean;
  isCompleted?: boolean;
}

interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Review {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  rating: number;
  date: string;
  comment: string;
}

interface CourseDetailProps {
  course: {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    coverImage?: string;
    instructor: Instructor;
    rating: number;
    ratingCount: number;
    studentsCount: number;
    totalDuration: number;
    price: number;
    discountPrice?: number;
    level: string;
    lastUpdated: string;
    language: string;
    objectives: string[];
    requirements: string[];
    tags: string[];
    sections: Section[];
    previewVideo?: string;
    reviews: Review[];
    isEnrolled?: boolean;
    progress?: number;
  };
}

const CourseDetail = ({ course }: CourseDetailProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'instructor' | 'reviews'>('overview');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(course.sections[0]?.id || null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(course.previewVideo || null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  
  // تحويل المدة الإجمالية إلى ساعات ودقائق
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours > 0 ? hours + ' ساعة ' : ''}${mins > 0 ? mins + ' دقيقة' : ''}`;
  };

  // حساب نسبة الخصم
  const discountPercentage = course.discountPrice && course.price > 0 
    ? Math.round(((course.price - course.discountPrice) / course.price) * 100) 
    : 0;

  // ترجمة المستوى إلى العربية
  const levelMapping: Record<string, string> = {
    'beginner': 'مبتدئ',
    'intermediate': 'متوسط',
    'advanced': 'متقدم',
    'all-levels': 'جميع المستويات'
  };

  // تشغيل درس
  const playLesson = (videoUrl?: string) => {
    if (videoUrl) {
      setActiveVideoUrl(videoUrl);
    } else {
      // إذا كان الدرس مقفل، يمكن عرض رسالة أو توجيه المستخدم للتسجيل
      alert('يرجى التسجيل في الدورة للوصول إلى هذا الدرس');
    }
  };

  // التبديل بين حالة المفضلة
  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // يمكن إضافة طلب API هنا لحفظ حالة المفضلة
  };

  // حساب إجمالي عدد الدروس
  const totalLessons = course.sections.reduce((total, section) => total + section.lessons.length, 0);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
      {/* صورة الغلاف والفيديو */}
      <div className="relative h-[400px] overflow-hidden">
        {activeVideoUrl ? (
          <VideoPlayer 
            src={activeVideoUrl} 
            poster={course.coverImage || course.thumbnail}
            title={course.title}
            className="h-full"
          />
        ) : (
          <div className="relative w-full h-full">
            <Image 
              src={course.coverImage || course.thumbnail} 
              alt={course.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            
            {course.previewVideo && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveVideoUrl(course.previewVideo!)}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/80 hover:bg-white w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
              >
                <FaPlay className="text-primary ml-1 text-2xl" />
              </motion.button>
            )}
          </div>
        )}
      </div>
      
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* التفاصيل الرئيسية والمحتوى */}
          <div className="lg:col-span-2">
            {/* عنوان الدورة وتفاصيل أساسية */}
            <div className="mb-8">
              <div className="flex justify-between items-start">
                <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleBookmark}
                  className="text-2xl text-gray-400 hover:text-primary"
                >
                  {isBookmarked ? <FaBookmark className="text-primary" /> : <FaRegBookmark />}
                </motion.button>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                <div className="flex items-center gap-1">
                  <FaStar className="text-yellow-500" />
                  <span>{course.rating}</span>
                  <span className="text-gray-500">({course.ratingCount} تقييم)</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <FaUsers className="text-primary" />
                  <span>{course.studentsCount} طالب</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <FaClock className="text-secondary" />
                  <span>{formatDuration(course.totalDuration)}</span>
                </div>
                
                <div className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {levelMapping[course.level] || course.level}
                </div>
                
                <div className="text-gray-500">
                  آخر تحديث: {course.lastUpdated}
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-6">
                <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-primary">
                  <Image 
                    src={course.instructor.avatar} 
                    alt={course.instructor.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-bold">{course.instructor.name}</div>
                  <div className="text-sm text-gray-500">{course.instructor.title}</div>
                </div>
              </div>
            </div>
            
            {/* التبويبات */}
            <div className="mb-8">
              <div className="flex overflow-x-auto space-x-1 border-b border-gray-200 dark:border-gray-700 mb-6">
                {['overview', 'curriculum', 'instructor', 'reviews'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2 whitespace-nowrap font-medium transition-colors border-b-2 ${
                      activeTab === tab 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab === 'overview' && 'نظرة عامة'}
                    {tab === 'curriculum' && 'المنهج الدراسي'}
                    {tab === 'instructor' && 'المدرس'}
                    {tab === 'reviews' && 'التقييمات'}
                  </button>
                ))}
              </div>
              
              {/* محتوى التبويب النشط */}
              <div className="py-2">
                <AnimatePresence mode="wait">
                  {activeTab === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="prose dark:prose-invert max-w-none mb-8">
                        <h3 className="text-xl font-bold mb-4">وصف الدورة</h3>
                        <p className="whitespace-pre-line">{course.description}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-bold mb-4">الوسوم</h3>
                        <div className="flex flex-wrap gap-2">
                          {course.tags.map((tag, index) => (
                            <span key={index} className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-sm">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {activeTab === 'curriculum' && (
                    <motion.div
                      key="curriculum"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="mb-4">
                        <h3 className="text-xl font-bold">محتوى الدورة</h3>
                        <div className="text-sm text-gray-500 mt-1">
                          {course.sections.length} قسم • {totalLessons} درس • {formatDuration(course.totalDuration)} إجمالي المدة
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {course.sections.map((section) => (
                          <div key={section.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <button
                              onClick={() => setActiveSectionId(activeSectionId === section.id ? null : section.id)}
                              className="w-full flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750"
                            >
                              <div className="font-medium">{section.title}</div>
                              <div className="text-sm text-gray-500">{section.lessons.length} دروس</div>
                            </button>
                            
                            <AnimatePresence>
                              {activeSectionId === section.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {section.lessons.map((lesson) => (
                                      <div key={lesson.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <div className="flex justify-between items-center">
                                          <div className="flex items-center gap-3">
                                            <button
                                              onClick={() => playLesson(lesson.isFree || course.isEnrolled ? lesson.videoUrl : undefined)}
                                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                lesson.isFree || course.isEnrolled
                                                  ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                                              }`}
                                            >
                                              {lesson.isCompleted ? (
                                                <FaCheckCircle />
                                              ) : (
                                                lesson.isFree || course.isEnrolled ? <FaPlay /> : <FaLock />
                                              )}
                                            </button>
                                            <div>
                                              <div className="font-medium">{lesson.title}</div>
                                              <div className="text-xs text-gray-500 flex items-center gap-2">
                                                <span className="flex items-center gap-1">
                                                  <FaClock className="text-gray-400" />
                                                  {Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, '0')}
                                                </span>
                                                {lesson.isFree && !course.isEnrolled && (
                                                  <span className="bg-secondary/20 text-secondary px-1.5 py-0.5 rounded text-xs">مجاني</span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          
                                          {!course.isEnrolled && !lesson.isFree && (
                                            <FaLock className="text-gray-400" />
                                          )}
                                          {lesson.isFree && !course.isEnrolled && (
                                            <FaUnlock className="text-secondary" />
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  
                  {activeTab === 'instructor' && (
                    <motion.div
                      key="instructor"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="relative h-32 w-32 rounded-xl overflow-hidden border-2 border-primary/20">
                          <Image 
                            src={course.instructor.avatar} 
                            alt={course.instructor.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold mb-2">{course.instructor.name}</h3>
                          <div className="text-primary mb-4">{course.instructor.title}</div>
                          
                          <div className="flex gap-6 mb-6">
                            <div>
                              <div className="font-bold text-2xl">{course.instructor.rating}</div>
                              <div className="text-sm text-gray-500">التقييم</div>
                            </div>
                            <div>
                              <div className="font-bold text-2xl">{course.instructor.coursesCount}</div>
                              <div className="text-sm text-gray-500">الدورات</div>
                            </div>
                            <div>
                              <div className="font-bold text-2xl">{course.instructor.studentsCount}</div>
                              <div className="text-sm text-gray-500">الطلاب</div>
                            </div>
                          </div>
                          
                          <div className="prose dark:prose-invert max-w-none">
                            <p>{course.instructor.bio}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {activeTab === 'reviews' && (
                    <motion.div
                      key="reviews"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="mb-8">
                        <h3 className="text-xl font-bold mb-4">تقييمات الطلاب</h3>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-5xl font-bold">{course.rating}</div>
                            <div className="flex text-yellow-500 justify-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <FaStar 
                                  key={star} 
                                  className={star <= Math.round(course.rating) ? 'text-yellow-500' : 'text-gray-300'} 
                                />
                              ))}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">{course.ratingCount} تقييم</div>
                          </div>
                          
                          <div className="flex-1">
                            {[5, 4, 3, 2, 1].map((rating) => {
                              // حساب نسبة التقييمات لكل نجمة (هذا مثال، يمكن استبداله بالبيانات الفعلية)
                              const percentage = Math.round(
                                (course.reviews.filter((r) => Math.round(r.rating) === rating).length / course.reviews.length) * 100
                              ) || 0;
                              
                              return (
                                <div key={rating} className="flex items-center gap-2 mb-1">
                                  <div className="flex items-center gap-1 w-12">
                                    <span>{rating}</span>
                                    <FaStar className="text-yellow-500" />
                                  </div>
                                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-yellow-500"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <div className="w-12 text-sm text-gray-500">{percentage}%</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        {course.reviews.map((review) => (
                          <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <div className="relative h-10 w-10 rounded-full overflow-hidden">
                                  <Image 
                                    src={review.user.avatar} 
                                    alt={review.user.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div>
                                  <div className="font-medium">{review.user.name}</div>
                                  <div className="text-xs text-gray-500">{review.date}</div>
                                </div>
                              </div>
                              <div className="flex text-yellow-500">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <FaStar 
                                    key={star} 
                                    className={star <= review.rating ? 'text-yellow-500' : 'text-gray-300'} 
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          {/* بطاقة التسجيل والشراء */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="card-premium overflow-hidden"
              >
                {course.isEnrolled ? (
                  <div>
                    <div className="mb-6">
                      <div className="text-center mb-4">
                        <div className="text-xl font-bold mb-2">تقدمك في الدورة</div>
                        <div className="text-sm text-gray-500 mb-4">استمر في التعلم من حيث توقفت</div>
                      </div>
                      
                      <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-accent"
                          style={{ width: `${course.progress || 0}%` }}
                        />
                      </div>
                      <div className="text-sm text-gray-500 text-center">
                        {course.progress || 0}% مكتمل
                      </div>
                    </div>
                    
                    <button className="btn-primary w-full mb-4">
                      <FaPlay className="mr-2" /> استكمال الدورة
                    </button>
                    
                    <div className="text-center text-sm text-gray-500">
                      تم التسجيل في {course.lastUpdated}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-6">
                      {discountPercentage > 0 ? (
                        <div className="flex items-end justify-center mb-4">
                          <div className="text-3xl font-bold text-primary">{course.discountPrice} ج.م</div>
                          <div className="text-gray-400 line-through ml-2">{course.price} ج.م</div>
                          <div className="bg-secondary/20 text-secondary text-xs px-2 py-1 rounded-full font-bold mr-2">
                            خصم {discountPercentage}%
                          </div>
                        </div>
                      ) : (
                        <div className="text-3xl font-bold text-primary text-center mb-4">{course.price} ج.م</div>
                      )}
                      
                      <div className="text-center text-sm text-gray-500 mb-4">
                        عرض محدود - ينتهي خلال 2 يوم
                      </div>
                    </div>
                    
                    <button className="btn-primary w-full mb-4 flex items-center justify-center">
                      <FaShoppingCart className="mr-2" /> اشترك الآن
                    </button>
                    
                    <button className="btn-outline w-full mb-6">
                      إضافة إلى السلة
                    </button>
                    
                    <div className="text-center text-sm text-gray-500 mb-4">
                      استرداد الأموال خلال 30 يوم
                    </div>
                  </div>
                )}
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="text-lg font-bold mb-4">تتضمن هذه الدورة</div>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <FaPlay className="text-primary" />
                      <span>{formatDuration(course.totalDuration)} من الفيديو</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FaUsers className="text-primary" />
                      <span>{course.studentsCount} طالب</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FaClock className="text-primary" />
                      <span>وصول مدى الحياة</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FaCheckCircle className="text-primary" />
                      <span>شهادة إتمام</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail; 