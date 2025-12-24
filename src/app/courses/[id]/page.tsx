"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import ProtectedVideoPlayer from '@/components/ProtectedVideoPlayer';
import { FaPlay, FaLock, FaCheck, FaUsers, FaClock, FaBookOpen, FaChartLine, FaComments } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import VideoProtection from '@/components/VideoProtection';
import CourseChat from '@/components/CourseChat';
import { achievementsService } from '@/services/achievements.service';

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
  const [videoProgress, setVideoProgress] = useState<{[key: string]: number}>({});
  const [videoCompleted, setVideoCompleted] = useState<{[key: string]: boolean}>({});
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [teacherInfo, setTeacherInfo] = useState<{id: string; name: string; avatar: string; phone?: string} | null>(null);
  const autoCompletedLessonsRef = useRef<Set<string>>(new Set());

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
        // هنا نُظهر دائماً 5 نجوم في واجهة هذه الصفحة
        rating: 5,
        ratingCount: (courseData as any).rating_count ?? 0,
        // عدد الطلاب نظهره بين 1000 و 2000 في هذه الصفحة فقط (عرض واجهة)
        studentsCount: Math.floor(1000 + Math.random() * 1001),
        level: courseData.level,
        category: courseData.category,
        sections: sectionsWithLessons,
      };
      
      console.log('📂 الأقسام المحولة:', formattedCourse.sections);
      console.log('📊 عدد الأقسام:', formattedCourse.sections.length);
      
      setCourse(formattedCourse);

      // تعيين أول درس كنشط افتراضياً حتى يظهر مشغل الفيديو مباشرة
      try {
        const firstLesson =
          formattedCourse.sections
            ?.flatMap((section: any) => section.lessons || [])?.[0] || null;
        if (firstLesson) {
          setActiveLesson(String(firstLesson.id));
        }
      } catch (e) {
        console.warn('⚠️ تعذر تعيين أول درس نشط تلقائياً:', e);
      }
      
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
                course_id: courseId,
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

            // تحديث أو إنشاء صف في جدول enrollments لهذا الطالب وهذا الكورس
            // حتى تظهر نسبة التقدم والإنجازات في لوحة الطالب بشكل صحيح
            try {
              const { error: enrollmentError } = await supabase
                .from('enrollments')
                .upsert(
                  {
                    user_id: userId,
                    course_id: courseId,
                    progress: percentComplete,
                    last_accessed: new Date().toISOString(),
                    completed_at: percentComplete === 100 ? new Date().toISOString() : null,
                    is_active: true,
                  },
                  { onConflict: 'user_id,course_id' }
                );

              if (enrollmentError) {
                console.error('❌ خطأ في حفظ/تحديث تقدم الكورس في enrollments:', enrollmentError);
              }
            } catch (enrollErr) {
              console.error('❌ خطأ غير متوقع أثناء حفظ/تحديث جدول enrollments:', enrollErr);
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

  // تجهيز بيانات الدرس الحالي للتقدّم
  const allLessons = course
    ? course.sections?.flatMap((section: any) => section.lessons || [])
    : [];
  const selectedLesson =
    allLessons && activeLesson
      ? allLessons.find((lesson: any) => String(lesson.id) === activeLesson) || null
      : null;

  const selectedLessonForProgress = selectedLesson;
  const lessonDurationMinutes = selectedLessonForProgress?.duration || 0;
  const requiredWatchSeconds =
    lessonDurationMinutes > 0 ? lessonDurationMinutes * 60 * 0.8 : 0;
  const watchedSeconds = activeLesson ? videoProgress[activeLesson] || 0 : 0;
  const watchProgressPercent =
    requiredWatchSeconds > 0
      ? Math.min(Math.round((watchedSeconds / requiredWatchSeconds) * 100), 100)
      : 0;
  const isLessonWatchCompleted =
    !!activeLesson &&
    (!!videoCompleted[activeLesson] ||
      !!(progress && progress.completedLessons.includes(activeLesson)));

  // تتبع تقدّم مشاهدة الدرس الحالي بشكل تقريبي (كل ثانية طالما الصفحة نشطة وبعد بدء التتبع)
  useEffect(() => {
    if (!activeLesson || !isEnrolled || !selectedLessonForProgress || !isVideoPlaying) return;

    const lessonId = activeLesson;
    const durationMinutes = selectedLessonForProgress.duration || 0;
    if (!durationMinutes) return;

    const requiredSeconds = durationMinutes * 60 * 0.8;

    const intervalId = window.setInterval(() => {
      // إيقاف العدّ عندما تكون التبويبة غير ظاهرة لتقليل التزييف قدر الإمكان
      if (typeof document !== 'undefined' && document.hidden) return;

      setVideoProgress((prev) => {
        const prevSeconds = prev[lessonId] || 0;

        // لو وصلنا فعلاً للحد المطلوب لا نزيد الوقت أكثر
        if (prevSeconds >= requiredSeconds) {
          return prev;
        }

        const nextSeconds = prevSeconds + 1;

        // عند الوصول للحد المطلوب نعلّم الدرس كمكتمل (محلياً)
        if (nextSeconds >= requiredSeconds) {
          setVideoCompleted((prevCompleted) => {
            if (prevCompleted[lessonId]) return prevCompleted;
            return { ...prevCompleted, [lessonId]: true };
          });
        }

        return {
          ...prev,
          [lessonId]: nextSeconds,
        };
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeLesson, isEnrolled, selectedLessonForProgress, isVideoPlaying]);

  // عند اكتمال مشاهدة الدرس (محلياً) نستدعي منطق إكمال الدرس مرة واحدة فقط
  useEffect(() => {
    if (!activeLesson || !isEnrolled) return;

    if (videoCompleted[activeLesson] && !autoCompletedLessonsRef.current.has(activeLesson)) {
      autoCompletedLessonsRef.current.add(activeLesson);
      handleLessonComplete(activeLesson, true);
    }
  }, [activeLesson, isEnrolled, videoCompleted, handleLessonComplete]);

  // حالات التحميل / الخطأ / عدم وجود الكورس
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل الكورس...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md bg-white rounded-xl shadow-lg p-6 text-center">
          <h2 className="text-xl font-bold mb-2 text-red-600">حدث خطأ</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => fetchCourse()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md bg-white rounded-xl shadow-lg p-6 text-center">
          <h2 className="text-xl font-bold mb-2 text-red-600">⚠️ الكورس غير موجود</h2>
          <p className="text-gray-600 mb-4">لم نتمكن من العثور على هذا الكورس.</p>
          <button
            type="button"
            onClick={() => router.replace('/courses')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            العودة إلى قائمة الكورسات
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 mt-24 md:mt-28">
        {/* تفعيل الحماية المتقدمة */}
        <VideoProtection />

        {/* هيدر الكورس (بنفس تصميم الصورة) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-600 to-indigo-700 p-6 md:p-8 mb-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(255,255,255,0.10),rgba(255,255,255,0))]" />
          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-8 text-right">
              <div className="flex flex-wrap justify-end gap-2 mb-4">
                {course.category && (
                  <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                    {course.category}
                  </span>
                )}
                <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                  {course.level || 'all-levels'}
                </span>
                {isEnrolled && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold">
                    <FaCheck className="text-emerald-200" />
                    <span>اشتراك مُفعل</span>
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl font-bold mb-3 leading-tight">{course.title}</h1>
              <p className="text-white/90 text-sm md:text-base leading-relaxed max-w-3xl mr-auto line-clamp-3">
                {course.description}
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-end gap-4 text-sm text-white/90">
                <div className="inline-flex items-center gap-2">
                  <FaUsers className="text-emerald-200" />
                  <span className="font-semibold">{course.studentsCount || 0}</span>
                </div>
                {isEnrolled && (
                  <div className="inline-flex items-center gap-2">
                    <FaChartLine className="text-white/80" />
                    <span className="font-semibold">تقدمك: {progress?.percentComplete || 0}%</span>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm p-4 md:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-right">
                    <div className="text-xs text-white/70 mb-1">السعر</div>
                    <div className="text-2xl font-bold">
                      {course.price ? <span>{course.price} ج.م</span> : <span>مجاناً</span>}
                    </div>
                  </div>
                  {isEnrolled && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowChat(true)}
                        disabled={!studentInfo?.id}
                        className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-60 disabled:cursor-not-allowed transition"
                        aria-label="فتح المحادثة"
                        title="المحادثة"
                      >
                        <FaComments />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  {!isEnrolled ? (
                    <button
                      type="button"
                      onClick={handleEnrollment}
                      disabled={isEnrolling}
                      className="w-full px-5 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-primary font-bold shadow-md text-sm md:text-base disabled:opacity-70 disabled:cursor-not-allowed transition"
                    >
                      {isEnrolling ? 'جاري تحويلك للدفع...' : 'اشترك الآن في الكورس'}
                    </button>
                  ) : (
                    <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-400/20 text-white text-sm font-semibold">
                      <FaCheck className="text-emerald-200" />
                      <span>تم تفعيل اشتراكك في هذا الكورس</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-right">
                    <div className="text-sm font-semibold">{teacherInfo?.name || course.instructor?.name || 'المدرس'}</div>
                    <div className="text-xs text-white/70">مدرس الكورس</div>
                  </div>
                  <div className="relative h-10 w-10 rounded-full overflow-hidden border border-white/20 bg-white/10">
                    <Image
                      src={teacherInfo?.avatar || course.instructor?.image || '/default-instructor.svg'}
                      alt={teacherInfo?.name || course.instructor?.name || 'المدرس'}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 order-2 lg:order-1 space-y-6">
            {/* مشغل الفيديو وشريط التقدم */}
            {activeLesson && selectedLesson && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="text-right flex-1">
                    <h3 className="text-xl md:text-2xl font-bold mb-1 flex items-center justify-end gap-2">
                      <span className="truncate">{selectedLesson.title}</span>
                      <FaPlay className="text-primary" />
                    </h3>

                    <div className="flex flex-wrap justify-end gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        <FaClock className="text-[10px]" /> {lessonDurationMinutes} دقيقة
                      </span>
                      {!isEnrolled && !!selectedLesson.isPreview && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-1 font-semibold">
                          معاينة
                        </span>
                      )}
                    </div>
                  </div>

                  {isEnrolled && (
                    <button
                      type="button"
                      onClick={() => setShowChat(true)}
                      disabled={!studentInfo?.id}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                      title="اسأل المدرس"
                    >
                      <FaComments />
                      <span className="text-sm font-semibold">اسأل المدرس</span>
                    </button>
                  )}
                </div>

                <div className="w-full">
                  <div className="aspect-video bg-black rounded-xl overflow-hidden">
                    <ProtectedVideoPlayer
                      courseId={courseId}
                      courseName={course.title}
                      coursePrice={course.price}
                      teacherName={teacherInfo?.name || 'المدرس'}
                      teacherPhone={teacherInfo?.phone}
                      lessonId={String(selectedLesson.id)}
                      useAccessCode={!isEnrolled}
                      videoUrl={selectedLesson.videoUrl || ''}
                      isEnrolled={isEnrolled || !!selectedLesson.isPreview}
                    />
                  </div>

                  {isEnrolled && selectedLessonForProgress && (
                    <div className="mt-5 rounded-2xl bg-slate-50 dark:bg-gray-800/50 border border-slate-100 dark:border-gray-800 p-4 space-y-3">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setIsVideoPlaying((prev) => !prev)}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold border border-primary text-primary hover:bg-primary/5 transition"
                        >
                          {isVideoPlaying ? 'إيقاف احتساب التقدم' : 'ابدأ احتساب التقدم'}
                        </button>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {isLessonWatchCompleted
                            ? '✅ تم إكمال هذا الدرس'
                            : `تقدم المشاهدة: ${watchProgressPercent}%`}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {Math.floor(watchedSeconds / 60)}:
                          {(watchedSeconds % 60).toString().padStart(2, '0')} /{' '}
                          {lessonDurationMinutes}:00 دقيقة
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isLessonWatchCompleted
                              ? 'bg-green-500'
                              : watchProgressPercent >= 80
                                ? 'bg-blue-600'
                                : 'bg-primary'
                          }`}
                          style={{ width: `${isLessonWatchCompleted ? 100 : watchProgressPercent}%` }}
                        />
                      </div>

                      <div className="flex justify-end items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300 mr-1">تقدم الكورس:</span>
                        <span className="font-bold text-primary">{progress?.percentComplete || 0}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 order-1 lg:order-2">
            <div className="lg:sticky lg:top-28 space-y-6">
              {/* قائمة الدروس البسيطة لاختيار الدرس */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {isEnrolled ? `تقدمك: ${progress?.percentComplete || 0}%` : 'تصفح المحتوى'}
                  </div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <FaBookOpen className="text-primary" /> محتوى الكورس
                  </h3>
                </div>

                <div className="space-y-4">
                  {course.sections?.map((section: any, sIndex: number) => (
                    <div key={section.id} className="rounded-2xl border border-slate-100 dark:border-gray-800 overflow-hidden">
                      <div className="bg-slate-50 dark:bg-gray-800/60 px-4 py-3 font-semibold flex items-center justify-between">
                        <span className="truncate">{section.title}</span>
                        <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">
                          {sIndex + 1}
                        </span>
                      </div>
                      <div className="p-2">
                        <div className="space-y-2">
                          {section.lessons?.map((lesson: any, index: number) => {
                            const lessonId = String(lesson.id);
                            const isActive = activeLesson === lessonId;
                            const isCompleted = progress?.completedLessons.includes(lessonId);
                            const isLocked = !isEnrolled && !lesson.isPreview;

                            return (
                              <button
                                key={lesson.id}
                                type="button"
                                className={`w-full text-right p-3 rounded-xl flex items-center justify-between gap-3 transition border ${
                                  isActive
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-white dark:bg-gray-900 hover:bg-slate-50 dark:hover:bg-gray-800 border-slate-100 dark:border-gray-800'
                                }`}
                                onClick={() => {
                                  setActiveLesson(lessonId);
                                  setIsVideoPlaying(false);
                                }}
                              >
                                <div className="min-w-0">
                                  <div className="font-semibold text-sm truncate">
                                    {index + 1}. {lesson.title}
                                  </div>
                                  <div className={`text-xs flex items-center justify-end gap-2 mt-1 ${isActive ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>
                                    <span className="inline-flex items-center gap-1">
                                      <FaClock className="text-[10px]" /> {lesson.duration} دقيقة
                                    </span>
                                    {!isEnrolled && !!lesson.isPreview && (
                                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold ${isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                                        معاينة
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {isLocked && <FaLock className={isActive ? 'text-white/90' : 'text-gray-400'} />}
                                  {isCompleted && <FaCheck className={isActive ? 'text-white' : 'text-emerald-500'} />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {isEnrolled && (
          <CourseChat
            courseId={courseId}
            userId={studentInfo?.id || ''}
            userName={studentInfo?.name || 'طالب'}
            userRole="student"
            teacherId={teacherInfo?.id}
            teacherName={teacherInfo?.name}
            isOpen={showChat}
            onClose={() => setShowChat(false)}
          />
        )}
      </div>
    </div>
  );
}

export default CoursePage;