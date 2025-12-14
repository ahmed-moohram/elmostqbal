"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import ProtectedVideoPlayer from '@/components/ProtectedVideoPlayer';
import { FaPlay, FaLock, FaStar, FaCheck, FaUsers, FaClock, FaBookOpen, FaChartLine, FaTrophy, FaAward, FaComments, FaUserGraduate, FaQuestionCircle } from 'react-icons/fa';
import { ImSpinner9 } from 'react-icons/im';
import { toast } from 'react-hot-toast';
import VideoProtection from '@/components/VideoProtection';
import CourseChat from '@/components/CourseChat';
import { achievementsService } from '@/services/achievements.service';
import RatingDisplay from '@/components/Ratings/RatingDisplay';

interface CourseProgress {
  completedLessons: string[];
  currentLesson: string;
  isCompleted: boolean;
  percentComplete: number;
}

function CoursePage() {
  const router = useRouter();
  const params = useParams();
  // استخدام معرف الدورة كنص لضمان التوافق مع واجهة API
  const courseId = params?.id as string;

  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [studentInfo, setStudentInfo] = useState<{id: string; name: string; phone: string} | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [userIP, setUserIP] = useState<string>('');
  const [videoProgress, setVideoProgress] = useState<{[key: string]: number}>({});
  const [videoCompleted, setVideoCompleted] = useState<{[key: string]: boolean}>({});
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [teacherInfo, setTeacherInfo] = useState<{id: string; name: string; avatar: string; phone?: string} | null>(null);

  // تحذير عند فتح أداة المطوّر (الكونسول) في صفحة الكورس
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (process.env.NODE_ENV !== 'production') return;

    let handled = false;

    const checkDevtools = () => {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      const threshold = 160; // فرق كافٍ لاعتبار أن أدوات المطوّر مفتوحة

      const isOpen = widthDiff > threshold || heightDiff > threshold;

      if (isOpen && !handled) {
        handled = true;
        try {
          toast.error('يمنع فتح أداة المطوّر (الكونسول) أثناء مشاهدة الكورس. سيتم إعادة تحميل الصفحة.');
        } catch (e) {
          console.warn('Devtools warning toast failed:', e);
        }

        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    };

    const intervalId = window.setInterval(checkDevtools, 1500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  // استخراج معلومات الطالب
  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        const info = {
          id: String(user.id || ''),
          name: user.name || 'طالب',
          phone: user.studentPhone || user.phone || '0100000000',
        };
        setStudentInfo(info);
        try {
          localStorage.setItem('studentInfo', JSON.stringify({
            id: info.id,
            name: info.name,
            phone: info.phone,
          }));
        } catch (storageErr) {
          console.error('Error saving studentInfo to localStorage:', storageErr);
        }
      } catch (e) {
        console.error('Error parsing user data for studentInfo:', e);
      }
    }
  }, []);

  // التحقق من الاشتراك
  useEffect(() => {
    const checkEnrollment = async () => {
      // التحقق من localStorage أولاً (cache)
      const cachedEnrollment = localStorage.getItem(`enrollment_${courseId}`);
      let isCurrentlyEnrolled = cachedEnrollment === 'true';
      
      // التحقق الدوري من قاعدة البيانات
      let phone: string | null = null;
      const studentInfo = localStorage.getItem('studentInfo');
      if (studentInfo) {
        try {
          const parsed = JSON.parse(studentInfo);
          phone = parsed.phone || null;
        } catch (e) {
          console.error('Error parsing studentInfo:', e);
        }
      }

      if (!phone) {
        const userJson = localStorage.getItem('user');
        if (userJson) {
          try {
            const user = JSON.parse(userJson);
            phone = user.studentPhone || user.phone || null;
          } catch (e) {
            console.error('Error parsing user data when checking enrollment:', e);
          }
        }
      }

      if (phone && courseId) {
        try {
          // جلب طلبات الدفع المقبولة لهذا الطالب
          const response = await fetch(`/api/payment-request?studentPhone=${encodeURIComponent(phone)}`);
          const requests = await response.json();
          
          if (Array.isArray(requests)) {
            // التحقق من وجود طلب مقبول ومُفَعَّل لهذا الكورس (is_active !== false)
            const approvedRequest = requests.find(
              (req: any) =>
                req.course_id === courseId &&
                req.status === 'approved' &&
                req.is_active !== false
            );

            if (approvedRequest) {
              // أول مرة يتم فيها تفعيل الاشتراك لهذا الكورس على هذا الجهاز
              if (!cachedEnrollment) {
                toast.success('🎉 مرحباً! تم تفعيل اشتراكك في الكورس');

                // التأكد من وجود صف في جدول enrollments لهذا الطالب وهذا الكورس
                try {
                  const userJson = localStorage.getItem('user');
                  if (userJson) {
                    const user = JSON.parse(userJson);
                    const userId = user.id;

                    if (userId && courseId) {
                      const { default: supabase } = await import('@/lib/supabase-client');
                      const { error: enrollSyncError } = await supabase
                        .from('enrollments')
                        .upsert(
                          {
                            user_id: userId,
                            course_id: courseId,
                            progress: 0,
                            is_active: true,
                            enrolled_at: new Date().toISOString(),
                          },
                          { onConflict: 'user_id,course_id' }
                        );

                      if (enrollSyncError) {
                        console.error('❌ خطأ في مزامنة الاشتراك مع جدول enrollments:', enrollSyncError);
                      }
                    }
                  }
                } catch (syncError) {
                  console.error('❌ خطأ غير متوقع أثناء مزامنة الاشتراك مع جدول enrollments:', syncError);
                }
              }

              isCurrentlyEnrolled = true;
              localStorage.setItem(`enrollment_${courseId}`, 'true');
            } else {
              isCurrentlyEnrolled = false;
            }
          }
        } catch (error) {
          console.error('Error checking enrollment:', error);
        }
      }
      
      // التحقق القديم من localStorage (للتوافق)
      if (!isCurrentlyEnrolled) {
        const oldEnrollmentStatus = localStorage.getItem(`enrolled_${courseId}`);
        if (oldEnrollmentStatus === 'true') {
          isCurrentlyEnrolled = true;
        }
      }

      setIsEnrolled(isCurrentlyEnrolled);

      if (!isCurrentlyEnrolled) {
        localStorage.removeItem(`enrollment_${courseId}`);
      }
    };

    checkEnrollment();
    
    // التحقق الدوري كل 15 ثانية للطلبات المعلقة
    const interval = setInterval(checkEnrollment, 15000);
    
    return () => clearInterval(interval);
  }, [courseId]);

  const fetchCourse = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 جلب بيانات الكورس:', courseId);
      
      // التحقق من صحة الـ ID (يجب أن يكون UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(courseId)) {
        console.error('❌ ID غير صالح:', courseId);
        console.log('💡 الـ ID يجب أن يكون UUID مثل: 123e4567-e89b-12d3-a456-426614174000');
        setError(`ID الكورس غير صالح: "${courseId}"`);
        setIsLoading(false);
        return;
      }
      
      // استخدام عميل Supabase الموحد
      const { default: supabase } = await import('@/lib/supabase-client');
      
      // جلب الكورس من Supabase
      console.log('🔄 محاولة جلب الكورس بـ ID صالح:', courseId);
      
      const { data: courseData, error: fetchError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      console.log('📊 نتيجة البحث:', { 
        found: !!courseData, 
        error: fetchError?.message,
        code: fetchError?.code,
        details: fetchError?.details
      });
      
      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          console.error('⚠️ لم يتم العثور على كورس بهذا الـ ID:', courseId);
          
          // محاولة جلب أول 3 كورسات للتأكد من الاتصال
          const { data: testCourses } = await supabase
            .from('courses')
            .select('id, title')
            .limit(3);
          
          console.log('📋 كورسات موجودة كمثال:', testCourses);
          throw new Error(`الكورس غير موجود. ID المطلوب: ${courseId}`);
        } else {
          console.error('❌ خطأ في قاعدة البيانات:', fetchError);
          throw new Error('خطأ في الاتصال بقاعدة البيانات');
        }
      }
      
      if (!courseData) {
        console.error('⚠️ لا توجد بيانات للكورس');
        throw new Error('الكورس غير موجود');
      }
      
      console.log('✅ تم جلب بيانات الكورس:', courseData);

      // محاولة جلب اسم المدرس الحقيقي إن لم يكن instructor_name موجوداً
      let instructorName: string | null = courseData.instructor_name || null;
      let instructorAvatar: string | null = courseData.instructor_avatar || null;
      let instructorPhone: string | null = courseData.instructor_phone || courseData.vodafone_cash || null;

      if (!instructorName && courseData.instructor_id) {
        try {
          const { data: instructorUser, error: instructorError } = await supabase
            .from('users')
            .select('name, avatar_url, phone')
            .eq('id', courseData.instructor_id)
            .maybeSingle();

          if (!instructorError && instructorUser) {
            instructorName = instructorUser.name || instructorName;
            instructorAvatar = instructorUser.avatar_url || instructorAvatar;
            instructorPhone = instructorPhone || instructorUser.phone || null;
          } else if (instructorError) {
            console.warn('⚠️ تعذر جلب بيانات المدرس من جدول users:', instructorError);
          }
        } catch (instErr) {
          console.warn('⚠️ خطأ غير متوقع أثناء جلب بيانات المدرس:', instErr);
        }
      }

      // قيم افتراضية آمنة في حال غياب أي بيانات
      if (!instructorName) instructorName = 'المدرس';
      if (!instructorAvatar) instructorAvatar = '/default-instructor.svg';
      if (!instructorPhone) instructorPhone = '01012345678';

      // جلب الأقسام والدروس عبر section_id فقط
      const { data: sections, error: sectionsError } = await supabase
        .from('sections')
        .select('id, title, order_index, created_at')
        .eq('course_id', courseId);

      if (sectionsError) {
        console.warn('⚠️ خطأ في جلب الأقسام:', sectionsError);
      }

      // جلب الامتحانات لهذا الكورس عبر واجهة /api/exams حتى نستخدم نفس المنطق والصلاحيات
      let exams: any[] = [];
      try {
        const examsRes = await fetch(`/api/exams?courseId=${courseId}`);
        if (examsRes.ok) {
          const examsJson = await examsRes.json();
          // واجهة /api/exams ترجع حالياً مصفوفة مباشرة، لكن ندعم أيضاً شكل { exams: [] } احتياطياً
          exams = Array.isArray(examsJson)
            ? examsJson
            : Array.isArray(examsJson?.exams)
            ? examsJson.exams
            : [];
        } else {
          console.warn('⚠️ فشل جلب الامتحانات عبر /api/exams:', examsRes.status);
        }
      } catch (ex) {
        console.warn('⚠️ خطأ غير متوقع أثناء جلب الامتحانات عبر /api/exams:', ex);
      }

      // إخفاء الامتحانات المعطلة فقط، والباقي يظهر للطلاب
      exams = exams.filter((exam: any) => exam.isActive !== false);

      let sectionsWithLessons: any[] = [];
      if (sections && sections.length > 0) {
        sections.sort((a: any, b: any) => {
          const ao = a.order_index ?? 0;
          const bo = b.order_index ?? 0;
          if (ao !== bo) return ao - bo;
          const ad = a.created_at ? Date.parse(a.created_at) : 0;
          const bd = b.created_at ? Date.parse(b.created_at) : 0;
          return ad - bd;
        });

        for (const section of sections) {
          const { data: sectionLessons, error: sectionLessonsError } = await supabase
            .from('lessons')
            .select('*')
            .eq('section_id', section.id);
          if (sectionLessonsError) {
            console.warn('⚠️ خطأ في جلب دروس القسم:', { sectionId: section.id, error: sectionLessonsError });
            continue;
          }

          // ترتيب دروس القسم حسب order_index (القديم والجديد)
          const orderedSectionLessons = (sectionLessons || []).sort((a: any, b: any) => {
            const ao = a.order_index ?? a.order ?? 0;
            const bo = b.order_index ?? b.order ?? 0;
            return ao - bo;
          });

          // الامتحانات التابعة لهذا القسم
          const sectionExams = exams.filter(
            (exam: any) => exam.sectionId && exam.sectionId === String(section.id),
          );

          // دمج الدروس والامتحانات في قائمة واحدة موحّدة بحسب orderIndex
          const unifiedItems = [
            ...orderedSectionLessons.map((lesson: any) => ({
              type: 'lesson' as const,
              id: String(lesson.id),
              title: lesson.title,
              description: lesson.description,
              duration: lesson.duration_minutes || lesson.duration || 0,
              videoUrl: lesson.video_url || '',
              isFree: !!lesson.is_free,
              isPreview: !!lesson.is_preview || !!lesson.is_free,
              orderIndex: lesson.order_index ?? lesson.order ?? 0,
            })),
            ...sectionExams.map((exam: any) => ({
              type: 'exam' as const,
              id: exam.id,
              title: exam.title,
              duration: exam.duration,
              orderIndex: exam.orderIndex ?? 0,
            })),
          ].sort((a, b) => {
            if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
            // عند تساوي الترتيب نفضّل ظهور الدرس أولاً ثم الامتحان
            if (a.type === b.type) return 0;
            return a.type === 'lesson' ? -1 : 1;
          });

          sectionsWithLessons.push({
            id: String(section.id),
            title: section.title || 'قسم',
            // نبقي مصفوفة الدروس كما هي لاستخدامها في حساب التقدم وتشغيل الفيديو
            lessons: orderedSectionLessons.map((lesson: any) => ({
              id: lesson.id,
              title: lesson.title,
              description: lesson.description,
              duration: lesson.duration_minutes || lesson.duration || 0,
              videoUrl: lesson.video_url || '',
              isFree: !!lesson.is_free,
              isPreview: !!lesson.is_preview || !!lesson.is_free,
            })),
            // العناصر الموحّدة (دروس + امتحانات) لعرضها في واجهة الطالب
            items: unifiedItems,
          });
        }

        // إضافة قسم خاص لأي امتحانات لا ترتبط بأي قسم (section_id فارغ أو لا يطابق الأقسام الحالية)
        const sectionIdsSet = new Set(sections.map((s: any) => String(s.id)));
        const orphanExams = exams.filter(
          (exam: any) => !exam.sectionId || !sectionIdsSet.has(String(exam.sectionId)),
        );

        if (orphanExams.length > 0) {
          sectionsWithLessons.push({
            id: 'general-exams',
            title: 'امتحانات عامة للكورس',
            lessons: [],
            items: orphanExams
              .map((exam: any, index: number) => ({
                type: 'exam' as const,
                id: exam.id,
                title: exam.title,
                duration: exam.duration,
                orderIndex: exam.orderIndex || index + 1,
              }))
              .sort((a, b) => a.orderIndex - b.orderIndex),
          });
        }
      }
      
      // تحويل البيانات لتناسب الشكل المطلوب (بدون أي قيم تقييم وهمية)
      const formattedCourse = {
        ...courseData,
        id: courseData.id,
        title: courseData.title,
        description: courseData.description,
        price: courseData.price,
        thumbnail: courseData.thumbnail || '/placeholder-course.png',
        instructor: {
          name: instructorName,
          image: instructorAvatar || '/default-instructor.svg'
        },
        // التقييم والعدد يعتمدان فقط على قيم الجدول، وإذا لم توجد = 0
        rating: courseData.rating ?? 0,
        ratingCount: (courseData as any).rating_count ?? 0,
        // عدد الطلاب يعتمد على الحقل المخصص إن وجد وإلا 0
        studentsCount:
          (courseData as any).students_count ??
          (courseData as any).enrollment_count ??
          0,
        level: courseData.level,
        category: courseData.category,
        sections: sectionsWithLessons,
      };
      
      console.log('📂 الأقسام المحولة:', formattedCourse.sections);
      console.log('📊 عدد الأقسام:', formattedCourse.sections.length);
      
      setCourse(formattedCourse);
      
      // حفظ بيانات الكورس الحالي في localStorage
      const currentCourseData = {
        id: courseData.id,
        title: courseData.title,
        price: courseData.price,
        instructor_name: instructorName,
        instructor_phone: instructorPhone
      };
      localStorage.setItem('currentCourse', JSON.stringify(currentCourseData));
      console.log('💾 تم حفظ بيانات الكورس:', currentCourseData);
      
      // تعيين معلومات المدرس
      // نستخدم instructor_id (هو معرّف المستخدم المدرس) حتى يتطابق مع teacherId المستخدم في لوحة المدرس
      setTeacherInfo({
        id: courseData.instructor_id || courseData.teacher_id || '1',
        name: instructorName || 'أ. محمد أحمد',
        avatar: instructorAvatar || '/teacher-avatar.jpg',
        phone: instructorPhone || '01012345678' // رقم فودافون كاش
      });
      
      // حساب التقدم من localStorage
      const progressStr = localStorage.getItem(`course_${courseId}_progress`);
      let courseProgress: CourseProgress = {
        completedLessons: [],
        currentLesson: '',
        isCompleted: false,
        percentComplete: 0
      };
      
      if (progressStr) {
        const savedProgress = JSON.parse(progressStr);
        const totalLessons = formattedCourse.sections?.reduce((sum: number, section: any) => sum + section.lessons.length, 0) || 0;
        const completedCount = savedProgress.completedLessons?.length || 0;
        courseProgress = {
          ...savedProgress,
          percentComplete: totalLessons > 0 ? Math.min(Math.round((completedCount / totalLessons) * 100), 100) : 0
        };
      }
      
      setProgress(courseProgress);
      setIsLoading(false);
      
    } catch (error) {
      console.error('❌ خطأ في جلب الكورس:', error);
      setError('فشل في تحميل بيانات الكورس');
      setIsLoading(false);
    }
  };
  
  // استدعاء fetchCourse عند تحميل الصفحة
  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const handleEnrollment = async () => {
    if (!courseId) {
      toast.error('معرّف الكورس غير معروف، حدّث الصفحة وحاول مرة أخرى');
      return;
    }

    try {
      setIsEnrolling(true);
      console.log('➡️ التحويل إلى صفحة الدفع للكورس:', courseId);
      router.push(`/courses/${courseId}/payment`);
    } catch (err) {
      console.error('❌ خطأ أثناء التحويل لصفحة الدفع، سيتم استخدام تحويل مباشر:', err);
      if (typeof window !== 'undefined') {
        window.location.href = `/courses/${courseId}/payment`;
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  const motivationalMessages = [
    'استمر، كل خطوة تقرّبك من هدفك! 💪',
    'رائع! تعلمت شيئاً جديداً الآن 👏',
    'كل فيديو تشاهده يبني مستقبلك خطوة بخطوة 🚀',
    'ما شاء الله، محافظ على مجهودك! استمر 🌟',
    'إصرارك اليوم هو نجاحك غداً ✅'
  ];

  const handleLessonComplete = async (lessonId: string, isAuto = false) => {
    if (!course || !progress || !isEnrolled) return;
    
    // تحقق إذا الدرس مكتمل قبل كده
    if (progress.completedLessons.includes(lessonId)) {
      if (!isAuto) {
        toast('✅ هذا الدرس مكتمل بالفعل', { icon: 'ℹ️' });
      }
      return;
    }
    
    const totalLessons = course.sections.reduce((sum: number, section: any) => sum + section.lessons.length, 0);
    const newCompletedLessons = [...progress.completedLessons, lessonId];
    const percentComplete = Math.min(Math.round((newCompletedLessons.length / totalLessons) * 100), 100);
    
    const newProgress = {
      ...progress,
      completedLessons: newCompletedLessons,
      percentComplete,
      isCompleted: percentComplete === 100
    };
    
    setProgress(newProgress);
    
    // حفظ في localStorage
    localStorage.setItem(`course_${courseId}_progress`, JSON.stringify(newProgress));
    
    const randomMsg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    const baseMsg = isAuto
      ? '🎉 تم إكمال الدرس تلقائياً بعد مشاهدة معظم الفيديو'
      : '✅ أحسنت! تم إكمال الدرس بنجاح';

    toast.success(`${baseMsg}
${randomMsg}`);
    
    // حفظ تقدم الدرس في قاعدة البيانات وتفعيل نظام الإنجازات
    try {
      const userJson = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (userJson) {
        const user = JSON.parse(userJson);
        const userId = user.id;

        if (userId) {
          // استخدام Supabase لتسجيل التقدم في جدول lesson_progress
          const { default: supabase } = await import('@/lib/supabase-client');

          const { error: progressError } = await supabase
            .from('lesson_progress')
            .upsert(
              {
                user_id: userId,
                lesson_id: lessonId,
                is_completed: true,
                completed_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,lesson_id' }
            );

          if (progressError) {
            console.error('❌ خطأ في حفظ تقدم الدرس في Supabase:', progressError);
          } else {
            // بعد حفظ التقدم، التحقق من الإنجازات ومنح الجديدة إن وجدت
            try {
              const newAchievements = await achievementsService.checkAndGrantAchievements(userId, courseId);
              if (newAchievements && newAchievements.length > 0) {
                const titles = newAchievements.map(a => a.title).join('، ');
                toast.success(`🏆 مبروك! حصلت على إنجازات جديدة في هذا الكورس: ${titles}`);
              }
            } catch (achError) {
              console.error('❌ خطأ في تفعيل نظام الإنجازات:', achError);
            }

            // تحديث نسبة التقدم في جدول enrollments حتى تظهر في لوحة تحكم الطالب والإنجازات
            try {
              const { error: enrollmentError } = await supabase
                .from('enrollments')
                .update({
                  progress: percentComplete,
                  last_accessed: new Date().toISOString(),
                  completed_at: percentComplete === 100 ? new Date().toISOString() : null,
                  is_active: true,
                })
                .eq('user_id', userId)
                .eq('course_id', courseId);

              if (enrollmentError) {
                console.error('❌ خطأ في تحديث تقدم الكورس في enrollments:', enrollmentError);
              }
            } catch (enrollErr) {
              console.error('❌ خطأ غير متوقع أثناء تحديث جدول enrollments:', enrollErr);
            }
          }
        }
      }
    } catch (e) {
      console.error('❌ خطأ غير متوقع أثناء حفظ التقدم وتفعيل الإنجازات:', e);
    }
    
    // الانتقال للدرس التالي تلقائياً بعد 3 ثواني
    if (isAuto) {
      setTimeout(() => {
        const currentLessonIndex = course.sections
          .flatMap((section: any) => section.lessons || [])
          .findIndex((lesson: any) => String(lesson.id) === lessonId);
        
        const allLessons = course.sections.flatMap((section: any) => section.lessons || []);
        if (currentLessonIndex < allLessons.length - 1) {
          const nextLesson = allLessons[currentLessonIndex + 1];
          setActiveLesson(String(nextLesson.id));
          toast(`📚 الانتقال إلى: ${nextLesson.title}`, { icon: '📖' });
        } else if (percentComplete === 100) {
          toast.success('🏆 مبروك! لقد أكملت جميع دروس الكورس');
        }
      }, 3000);
    }
  };
  
  // تتبع مشاهدة الفيديو
  const startVideoTracking = (lessonId: string, duration: number) => {
    if (videoCompleted[lessonId]) return; // إذا كان مكتملاً بالفعل، لا تتبع
    
    // استرجاع التقدم المحفوظ
    const savedProgress = localStorage.getItem(`lesson_progress_${lessonId}`);
    const savedWatchTime = savedProgress ? parseInt(savedProgress) : 0;
    
    const requiredWatchTime = duration * 60 * 0.8; // 80% من مدة الفيديو بالثواني
    let watchedTime = videoProgress[lessonId] || savedWatchTime;
    
    const interval = setInterval(() => {
      if (activeLesson !== lessonId || !isVideoPlaying) {
        clearInterval(interval);
        return;
      }
      
      watchedTime += 1;
      setVideoProgress(prev => ({ ...prev, [lessonId]: watchedTime }));
      
      // حفظ التقدم كل 5 ثواني
      if (watchedTime % 5 === 0) {
        localStorage.setItem(`lesson_progress_${lessonId}`, watchedTime.toString());
      }
      
      // عرض التقدم كل 10 ثواني
      if (watchedTime % 10 === 0) {
        const progressPercent = Math.min(Math.round((watchedTime / requiredWatchTime) * 100), 100);
        console.log(`⏱️ تقدم المشاهدة: ${progressPercent}% (${watchedTime}/${requiredWatchTime} ثانية)`);
      }
      
      // إكمال الدرس عند مشاهدة 80%
      if (watchedTime >= requiredWatchTime && !videoCompleted[lessonId]) {
        setVideoCompleted(prev => ({ ...prev, [lessonId]: true }));
        handleLessonComplete(lessonId, true);
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  };

  useEffect(() => {
    fetchCourse();
    
    // الحصول على IP المستخدم
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setUserIP(data.ip))
      .catch(() => setUserIP('Unknown'));
    
    // تحميل YouTube Player API
    if (typeof window !== 'undefined' && !(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
    
    // حماية ضد أدوات المطور
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // منع F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.keyCode === 123 || // F12
        (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
        (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl+Shift+J
        (e.ctrlKey && e.keyCode === 85) // Ctrl+U
      ) {
        e.preventDefault();
        toast.error('🚫 عذراً، هذا الإجراء محظور لحماية المحتوى');
        return false;
      }
    };
    
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };
    
    // إضافة مستمعي الأحداث
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);
    
    // تنظيف عند إلغاء التحميل
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, [courseId]);

  // تشخيص البيانات عند تحميل الكورس
  useEffect(() => {
    if (course && course.sections) {
      console.log('🔍 [DEBUG] Course loaded:', course);
      console.log('🔍 [DEBUG] Sections:', course.sections);
      console.log('🔍 [DEBUG] Number of sections:', course.sections.length);
      if (course.sections.length > 0) {
        console.log('🔍 [DEBUG] First section:', course.sections[0]);
        console.log('🔍 [DEBUG] First section lessons:', course.sections[0].lessons);
      }
    }
  }, [course]);
  
  // تفعيل تتبع الفيديو عند تغيير الدرس أو حالة التشغيل
  useEffect(() => {
    if (activeLesson && isVideoPlaying && course && isEnrolled) {
      const selectedLesson = course.sections
        ?.flatMap((section: any) => section.lessons || [])
        ?.find((lesson: any) => String(lesson.id) === activeLesson);
      
      if (selectedLesson) {
        const cleanup = startVideoTracking(activeLesson, selectedLesson.duration || 10);
        return cleanup;
      }
    }
  }, [activeLesson, isVideoPlaying, isEnrolled, course]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-2xl w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4 text-red-600">⚠️ الكورس غير موجود</h2>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 mb-2">لم نتمكن من العثور على الكورس المطلوب.</p>
              <p className="text-sm text-gray-600">ID المطلوب: <code className="bg-gray-100 px-2 py-1 rounded">{courseId}</code></p>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-gray-700">💡 جرب الآتي:</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>تأكد من أن الكورس منشور وليس مسودة</li>
                <li>تحقق من صحة ID الكورس</li>
                <li>افتح Console (F12) لمشاهدة التفاصيل</li>
              </ul>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => router.replace('/courses')}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                العودة للكورسات
              </button>
              <button
                onClick={() => window.open(`/debug-course/${courseId}`, '_blank')}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                🔍 تشخيص المشكلة
              </button>
            </div>
            
            <div className="mt-4">
              <a 
                href="/course-helper" 
                target="_blank"
                className="text-sm text-blue-600 hover:underline"
              >
                هل تحتاج مساعدة إضافية؟ ← افتح أداة المساعدة الشاملة
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* تفعيل الحماية المتقدمة */}
      <VideoProtection />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-purple-600 rounded-2xl p-8 mb-8 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          {course.isBestseller && (
            <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
              <FaTrophy /> الأكثر مبيعاً
            </span>
          )}
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{course.category}</span>
        </div>
        <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
        <p className="text-lg text-blue-100 mb-6">{course.description}</p>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <FaStar className="text-yellow-300 text-2xl mx-auto mb-2" />
            <div className="text-2xl font-bold">{course.rating}</div>
            <div className="text-sm text-blue-100">{course.ratingCount} تقييم</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <FaUsers className="text-blue-200 text-2xl mx-auto mb-2" />
            <div className="text-2xl font-bold">{course.studentsCount}</div>
            <div className="text-sm text-blue-100">طالب</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <FaAward className="text-green-300 text-2xl mx-auto mb-2" />
            <div className="text-xl font-bold">{course.level}</div>
            <div className="text-sm text-blue-100">المستوى</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold">{course.price} ج.م</span>
              {course.discountPrice && (
                <>
                  <span className="text-xl line-through opacity-70">{course.discountPrice} ج.م</span>
                  <span className="bg-red-500 px-3 py-1 rounded-full text-sm font-bold">
                    خصم {Math.round(((course.discountPrice - course.price) / course.discountPrice) * 100)}%
                  </span>
                </>
              )}
            </div>
          </div>
          {isEnrolled ? (
            <div className="bg-white/20 text-white px-6 py-3 rounded-xl font-bold text-lg flex items-center gap-2">
              <FaCheck className="text-green-300" />
              <span>تم تفعيل اشتراكك في هذا الكورس</span>
            </div>
          ) : (
            <button 
              className="bg-white text-primary px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition shadow-lg flex items-center gap-2"
              onClick={handleEnrollment}
              disabled={isEnrolling}
            >
              {isEnrolling ? (
                <>
                  <ImSpinner9 className="animate-spin" />
                  جاري التسجيل...
                </>
              ) : (
                <>
                  <FaCheck /> اشترك الآن
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* قسم معلومات المدرس */}
      <div className="bg-white rounded-xl p-6 mb-8 shadow-lg border border-gray-100">
        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FaAward className="text-primary" /> {course.instructor.name}
        </h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
            {course.instructor.name.charAt(0)}
          </div>
          <div>
            <h4 className="text-xl font-bold">{course.instructor.name}</h4>
            <p className="text-gray-600">{course.instructor.bio}</p>
          </div>
        </div>
      </div>

      {/* قسم التقييمات الحقيقية للكورس */}
      <div className="mb-8">
        <RatingDisplay
          targetType="course"
          targetId={courseId}
          averageRating={course.rating || 0}
          totalRatings={course.ratingCount || 0}
        />
      </div>

      {/* قسم المتطلبات والميزات */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 shadow-lg border border-blue-100">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FaBookOpen className="text-primary" /> المتطلبات
          </h3>
          <ul className="space-y-3">
            {course.requirements?.map((req, index) => (
              <li key={index} className="flex items-start gap-3">
                <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                <span className="text-gray-700">{req}</span>
              </li>
            )) || <li className="text-gray-500">لا توجد متطلبات خاصة</li>}
          </ul>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-6 shadow-lg border border-purple-100">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FaTrophy className="text-yellow-500" /> المميزات
          </h3>
          <ul className="space-y-3">
            {course.features?.map((feat, index) => (
              <li key={index} className="flex items-start gap-3">
                <FaStar className="text-yellow-500 mt-1 flex-shrink-0" />
                <span className="text-gray-700">{feat}</span>
              </li>
            )) || <li className="text-gray-500">جاري تحديث المميزات</li>}
          </ul>
        </div>
      </div>

      {/* قسم الدروس والامتحانات بنظام موحد */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-8">
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <FaBookOpen className="text-primary" /> محتوى الدورة
        </h3>
        <div className="space-y-4">
          {course?.sections && Array.isArray(course.sections) && course.sections.length > 0 ? (
            course.sections.map((section: any, sIndex: number) => (
              <div
                key={section.id}
                className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary transition"
              >
                <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-b border-gray-200">
                  <h4 className="font-bold text-lg flex items-center gap-2">
                    <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                      {sIndex + 1}
                    </span>
                    {section.title}
                    <span className="text-sm text-gray-500 mr-auto">
                      ({section.items?.filter((i: any) => i.type === 'lesson').length || 0} دروس)
                    </span>
                  </h4>
                </div>

                <div className="p-2">
                  {section.items?.map((item: any, index: number) => {
                    if (item.type === 'lesson') {
                      const isActive = activeLesson === String(item.id);
                      const isCompleted = progress?.completedLessons.includes(String(item.id));

                      return (
                        <div
                          key={`lesson-${item.id}`}
                          className={`p-4 rounded-lg cursor-pointer transition ${
                            isActive ? 'bg-primary text-white shadow-md' : 'hover:bg-gray-50'
                          } mb-2`}
                          onClick={() => {
                            setActiveLesson(String(item.id));
                            setIsVideoPlaying(false);
                            if (!isCompleted) {
                              toast(`🎬 بدء الدرس: ${item.title}`, {
                                icon: '📺',
                                duration: 3000,
                              });
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  isActive ? 'bg-white/20' : 'bg-gray-100'
                                }`}
                              >
                                {item.isPreview ? (
                                  <FaPlay className={isActive ? 'text-white' : 'text-primary'} />
                                ) : isCompleted ? (
                                  <FaCheck className="text-green-500" />
                                ) : (
                                  <FaLock className={isActive ? 'text-white/70' : 'text-gray-400'} />
                                )}
                              </div>
                              <div className="flex-1">
                                <h5 className={`font-semibold ${isActive ? 'text-white' : 'text-gray-800'}`}>
                                  {index + 1}. {item.title}
                                </h5>
                                <div className="flex items-center gap-3 mt-1">
                                  <span
                                    className={`text-sm flex items-center gap-1 ${
                                      isActive ? 'text-white/80' : 'text-gray-600'
                                    }`}
                                  >
                                    <FaClock className="text-xs" /> {item.duration} دقيقة
                                  </span>
                                  {item.isPreview && (
                                    <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                                      معاينة مجانية
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {isActive && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">جاري التشغيل</span>
                                <div className="w-3 h-3 rounded-full border-2 border-white animate-spin border-t-transparent" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    if (item.type === 'exam') {
                      return (
                        <div
                          key={`exam-${item.id}`}
                          className="p-4 rounded-lg cursor-pointer transition bg-purple-50 hover:bg-purple-100 mb-2 border border-purple-200 flex items-center justify-between"
                          onClick={() => {
                            router.push(`/courses/${courseId}/exams`);
                            toast(`📝 فتح امتحان: ${item.title}`, {
                              icon: '📝',
                              duration: 2500,
                            });
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                              <FaQuestionCircle className="text-white" />
                            </div>
                            <div>
                              <h5 className="font-semibold text-purple-900">امتحان: {item.title}</h5>
                              {item.duration > 0 && (
                                <p className="text-xs text-purple-700 mt-1 flex items-center gap-1">
                                  <FaClock className="text-[10px]" /> مدة الامتحان: {item.duration} دقيقة
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-purple-800 bg-purple-100 px-3 py-1 rounded-full">
                            اضغط لفتح صفحة الامتحان
                          </span>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">لا توجد أقسام متاحة</p>
          )}
        </div>
      </div>

      {/* قسم مشغل الفيديو */}
      {activeLesson && (
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FaPlay className="text-primary" /> 
            {(() => {
              const selectedLesson = course?.sections
                ?.flatMap((section: any) => section.lessons || [])
                ?.find((lesson: any) => String(lesson.id) === activeLesson);
              return selectedLesson?.title || 'مشغل الفيديو';
            })()}
          </h3>
          {!isEnrolled ? (
            /* مكون الفيديو المحمي للغير مشتركين */
            <div className="mb-8">
              <ProtectedVideoPlayer
                courseId={courseId}
                courseName={course?.title || ''}
                coursePrice={course?.price || 0}
                teacherName={teacherInfo?.name || 'المدرس'}
                teacherPhone={teacherInfo?.phone}
                lessonId={(() => {
                  const selectedLesson = course?.sections
                    ?.flatMap((section: any) => section.lessons || [])
                    ?.find((lesson: any) => String(lesson.id) === activeLesson);
                  return selectedLesson ? String(selectedLesson.id) : '';
                })()}
                useAccessCode={true}
                videoUrl={(() => {
                  const selectedLesson = course?.sections
                    ?.flatMap((section: any) => section.lessons || [])
                    ?.find((lesson: any) => String(lesson.id) === activeLesson);
                  return selectedLesson?.videoUrl || '';
                })()}
                isEnrolled={(() => {
                  const selectedLesson = course?.sections
                    ?.flatMap((section: any) => section.lessons || [])
                    ?.find((lesson: any) => String(lesson.id) === activeLesson);
                  return !!selectedLesson?.isPreview || isEnrolled;
                })()}
                onEnroll={handleEnrollment}
              />
            </div>
          ) : (
            /* الفيديو العادي للمشتركين */
            <div 
              className="aspect-video bg-black rounded-lg overflow-hidden mb-8 relative select-none"
              onContextMenu={(e) => {
                e.preventDefault();
                toast.error('🚫 النقر الأيمن محظور على الفيديو');
                return false;
              }}
              onDragStart={(e) => e.preventDefault()}
              style={{ 
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}
            >
            {/* طبقة حماية شفافة فوق الفيديو */}
            <div 
              className="absolute inset-0 z-30 pointer-events-none"
              style={{ 
                background: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.03) 35px, rgba(255,255,255,.03) 70px)' 
              }}
            />
            
            {/* العلامة المائية - أعلى يسار */}
            {(
              <>
                <div className="absolute top-4 left-4 text-white/80 text-sm font-bold z-40 select-none pointer-events-none animate-pulse">
                  <div>{studentInfo?.name || 'مستخدم'}</div>
                  <div>{studentInfo?.phone || userIP}</div>
                  <div className="text-[11px]">{new Date().toLocaleString('ar-EG')}</div>
                </div>
                
                {/* العلامة المائية - أعلى يمين */}
                <div className="absolute top-4 right-4 text-white/80 text-sm font-bold z-40 select-none pointer-events-none">
                  <div className="text-right text-red-400/80">⚠️ محمي</div>
                  <div className="text-right">{studentInfo?.name || 'مستخدم'}</div>
                  <div className="text-right">{studentInfo?.phone || userIP}</div>
                </div>
                
                {/* العلامة المائية - أسفل يسار */}
                <div className="absolute bottom-4 left-4 text-white/80 text-sm font-bold z-40 select-none pointer-events-none">
                  <div className="text-yellow-400/80">🔒 محتوى محمي</div>
                  <div>{studentInfo?.name || 'مستخدم'}</div>
                  <div>{studentInfo?.phone || userIP}</div>
                </div>
                
                {/* العلامة المائية - أسفل يمين */}
                <div className="absolute bottom-4 right-4 text-white/80 text-sm font-bold z-40 select-none pointer-events-none animate-pulse">
                  <div className="text-right">Course ID: {courseId?.substring(0, 8)}</div>
                  <div className="text-right">{studentInfo?.name || 'مستخدم'}</div>
                  <div className="text-right">{studentInfo?.phone || userIP}</div>
                </div>
                
                {/* العلامة المائية - المنتصف (مائلة) */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/40 text-4xl font-bold rotate-[-30deg] z-40 select-none pointer-events-none whitespace-nowrap drop-shadow-md">
                  {studentInfo?.name || 'محتوى محمي'} • {studentInfo?.phone || userIP}
                </div>
                
                {/* علامات مائية إضافية متحركة */}
                <div className="absolute top-1/3 left-1/4 text-white/40 text-xl font-bold rotate-[45deg] z-40 select-none pointer-events-none animate-pulse">
                  🔐 PROTECTED
                </div>
                <div className="absolute bottom-1/3 right-1/4 text-white/40 text-xl font-bold rotate-[-45deg] z-40 select-none pointer-events-none animate-pulse">
                  © {new Date().getFullYear()}
                </div>
              </>
            )}
            
            {/* مشغل YouTube الفعلي */}
            {(() => {
              // البحث عن الدرس المحدد للحصول على رابط الفيديو
              const selectedLesson = course?.sections
                ?.flatMap((section: any) => section.lessons || [])
                ?.find((lesson: any) => String(lesson.id) === activeLesson);
              
              console.log('🎬 الدرس المحدد:', selectedLesson);
              console.log('🔗 رابط الفيديو:', selectedLesson?.videoUrl);
              
              if (selectedLesson?.videoUrl) {
                const url = selectedLesson.videoUrl;

                // محاولة دعم روابط Google Drive
                try {
                  if (url.includes('drive.google.com')) {
                    const parsed = new URL(url);
                    let fileId = '';

                    const pathParts = parsed.pathname.split('/').filter(Boolean);
                    const dIndex = pathParts.indexOf('d');
                    if (dIndex !== -1 && pathParts[dIndex + 1]) {
                      fileId = pathParts[dIndex + 1];
                    }

                    if (!fileId) {
                      const idParam = parsed.searchParams.get('id');
                      if (idParam) {
                        fileId = idParam;
                      }
                    }

                    if (fileId) {
                      const driveUrl = `https://drive.google.com/file/d/${fileId}/preview`;
                      return (
                        <>
                          <iframe
                            width="100%"
                            height="100%"
                            src={driveUrl}
                            title={selectedLesson.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                            allowFullScreen={false}
                            className="absolute inset-0 w-full h-full pointer-events-auto"
                            style={{ zIndex: 1 }}
                          />
                          <div 
                            className="absolute inset-0 z-10" 
                            style={{ pointerEvents: 'none', background: 'transparent' }}
                            onContextMenu={(e) => e.preventDefault()}
                          />
                        </>
                      );
                    }
                  }
                } catch (e) {}

                // استخراج معرف فيديو YouTube من الرابط
                const getYouTubeId = (innerUrl: string) => {
                  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
                  const match = innerUrl.match(regex);
                  return match ? match[1] : null;
                };
                
                const videoId = getYouTubeId(url);
                console.log('📺 معرف فيديو YouTube:', videoId);
                
                if (videoId) {
                  return (
                    <>
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&controls=1&disablekb=1&fs=0&loop=1&playlist=${videoId}`}
                        title={selectedLesson.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen={false}
                        className="absolute inset-0 w-full h-full pointer-events-auto"
                        style={{ zIndex: 1 }}
                      />
                      {/* طبقة حماية شفافة فوق الـ iframe */}
                      <div 
                        className="absolute inset-0 z-10" 
                        style={{ pointerEvents: 'none', background: 'transparent' }}
                        onContextMenu={(e) => e.preventDefault()}
                      />
                    </>
                  );
                } else {
                  return (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-white">
                        <FaPlay className="text-6xl mb-4 mx-auto opacity-50" />
                        <p className="text-xl">رابط الفيديو غير صحيح</p>
                        <p className="text-sm opacity-70 mt-2">{selectedLesson.videoUrl}</p>
                      </div>
                    </div>
                  );
                }
              } else {
                return (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-white">
                      <FaPlay className="text-6xl mb-4 mx-auto opacity-50" />
                      <p className="text-xl">لا يوجد فيديو لهذا الدرس</p>
                    </div>
                  </div>
                );
              }
            })()}

            {/* شريط قفل في أعلى الفيديو لمنع الضغط على أزرار المشاركة ونسخ الرابط */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-black/55 flex items-center justify-end px-4 pointer-events-auto z-50 select-none">
              <FaLock className="text-white/85 text-xl" />
            </div>
          </div>
          )}
          {/* معلومات التقدم والتحكم */}
          {isEnrolled && (
            <div className="mt-6 space-y-4">
              {/* شريط التقدم في المشاهدة */}
              {activeLesson && (() => {
                const selectedLesson = course?.sections
                  ?.flatMap((section: any) => section.lessons || [])
                  ?.find((lesson: any) => String(lesson.id) === activeLesson);
                const duration = selectedLesson?.duration || 10;
                const requiredTime = duration * 60 * 0.8; // 80% بالثواني
                const watchedTime = videoProgress[activeLesson] || 0;
                const watchProgress = Math.min(Math.round((watchedTime / requiredTime) * 100), 100);
                const isCompleted = videoCompleted[activeLesson] || progress?.completedLessons.includes(activeLesson);
                
                return (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {isCompleted ? (
                          <span className="text-green-600">✅ تم إكمال هذا الدرس</span>
                        ) : (
                          `تقدم المشاهدة: ${watchProgress}%`
                        )}
                      </span>
                      <span className="text-xs text-gray-500">
                        {Math.floor(watchedTime / 60)}:{(watchedTime % 60).toString().padStart(2, '0')} / {duration}:00 دقيقة
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          isCompleted 
                            ? 'bg-green-500' 
                            : watchProgress >= 80 
                              ? 'bg-blue-600' 
                              : 'bg-primary'
                        }`}
                        style={{ width: `${isCompleted ? 100 : watchProgress}%` }}
                      />
                    </div>
                    
                    {!isCompleted && watchProgress < 80 && (
                      <p className="text-xs text-gray-500 mt-2">
                        🎯 شاهد 80% من الفيديو لإكمال الدرس تلقائياً
                      </p>
                    )}
                    {!isCompleted && watchProgress >= 80 && watchProgress < 100 && (
                      <p className="text-xs text-yellow-600 mt-2 animate-pulse">
                        ⏳ قريباً جداً من إكمال الدرس...
                      </p>
                    )}
                  </div>
                );
              })()}
              
              {/* أزرار التحكم */}
              <div className="flex justify-between items-center">
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      const nextState = !isVideoPlaying;
                      setIsVideoPlaying(nextState);
                      toast(nextState ? '▶️ تم استئناف التشغيل' : '⏸️ تم إيقاف الفيديو مؤقتاً', { duration: 2000 });
                    }}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 flex items-center gap-2 font-bold shadow-lg transition"
                  >
                    {isVideoPlaying ? '⏸️ إيقاف مؤقت' : '▶️ تشغيل'}
                  </button>
                </div>
                
                <div className="text-gray-600">
                  <span className="text-sm">تقدم الكورس: </span>
                  <span className="font-bold text-primary">{progress?.percentComplete || 0}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* زر الشات العائم - يظهر فقط للمشتركين */}
      {isEnrolled && !showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-8 left-8 w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center z-40"
        >
          <FaComments className="text-2xl" />
          <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        </button>
      )}
      
      {/* مكون الشات - يظهر فقط للمشتركين */}
      {isEnrolled && studentInfo?.id && (
        <CourseChat
          courseId={courseId}
          userId={studentInfo.id}
          userName={studentInfo.name}
          userRole="student"
          teacherId={teacherInfo?.id}
          teacherName={teacherInfo?.name}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />
      )}
      
      {/* معلومات المدرس (بدون زر شات إضافي) */}
      {false && course && (
        <div className="fixed bottom-8 right-8 bg-white rounded-lg shadow-lg p-4 max-w-xs z-30">
          <div className="flex items-center gap-3">
            <img
              src={teacherInfo?.avatar || '/teacher-avatar.jpg'}
              alt={teacherInfo?.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-purple-200"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-avatar.png';
              }}
            />
            <div className="flex-1">
              <h4 className="font-bold text-sm">{teacherInfo?.name}</h4>
              <p className="text-xs text-gray-500">مدرس الكورس</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoursePage;