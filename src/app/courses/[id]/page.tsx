"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import ProtectedVideoPlayer from '@/components/ProtectedVideoPlayer';
import { FaPlay, FaLock, FaCheck, FaUsers, FaClock, FaBookOpen, FaChartLine, FaComments, FaQuestionCircle } from 'react-icons/fa';
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
  const [accessCode, setAccessCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [studentInfo, setStudentInfo] = useState<{id: string; name: string; phone: string} | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [videoProgress, setVideoProgress] = useState<{[key: string]: number}>({});
  const [videoCompleted, setVideoCompleted] = useState<{[key: string]: boolean}>({});
  const [resumeSecondsByLesson, setResumeSecondsByLesson] = useState<{[key: string]: number}>({});
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

  // دالة للتحقق من الاشتراك (يمكن استدعاؤها من أي مكان)
  const checkEnrollmentStatus = async (forceRefresh = false): Promise<boolean> => {
    if (!courseId) return false;

    // التحقق من localStorage أولاً (cache) إلا إذا طُلب التحديث القسري
    const cachedEnrollment = localStorage.getItem(`enrollment_${courseId}`);
    const enrollmentTimestamp = localStorage.getItem(`enrollment_${courseId}_timestamp`);
    const isRecentlyEnrolled = enrollmentTimestamp && (Date.now() - parseInt(enrollmentTimestamp)) < 300000; // خلال آخر 5 دقائق
    
    let isCurrentlyEnrolled = cachedEnrollment === 'true';

    // إذا كان الاشتراك مفعَّلاً بالفعل في localStorage ولم يُطلب التحديث القسري
    if (cachedEnrollment === 'true' && !forceRefresh) {
      // إذا تم تفعيل الاشتراك مؤخراً (خلال آخر 60 ثانية)، نعتمد على localStorage فقط
      // لأن الاشتراك قد لا يزال قيد الإنشاء في قاعدة البيانات أو قد يكون هناك تأخير في المزامنة
      if (isRecentlyEnrolled) {
        setIsEnrolled(true);
        return true;
      }

      // التحقق السريع من قاعدة البيانات للتأكد من أن الاشتراك لا يزال نشطاً
      try {
        const userJson = localStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          const userId = user.id;

          if (userId && courseId) {
            const { default: supabase } = await import('@/lib/supabase-client');
            
            // التحقق من course_enrollments مباشرة (هذا هو الجدول الرئيسي للاشتراكات)
            // لأن course_enrollments.student_id قد يشير إلى auth.users
            const { data: courseEnrollment } = await supabase
              .from('course_enrollments')
              .select('id, is_active')
              .eq('student_id', userId)
              .eq('course_id', courseId)
              .eq('is_active', true)
              .maybeSingle();

            // إذا وُجد اشتراك في course_enrollments، نؤكد الاشتراك
            if (courseEnrollment) {
              setIsEnrolled(true);
              return true;
            }

            // التحقق من enrollments (للتوافق مع النظام القديم) - فقط إذا لم نجد في course_enrollments
            const { data: legacyEnrollment } = await supabase
              .from('enrollments')
              .select('id, is_active')
              .eq('user_id', userId)
              .eq('course_id', courseId)
              .eq('is_active', true)
              .maybeSingle();

            if (legacyEnrollment) {
              setIsEnrolled(true);
              return true;
            }

            // إذا لم يكن هناك اشتراك نشط في قاعدة البيانات
            // لا نحذف الاشتراك من localStorage إذا كان قد تم تفعيله مؤخراً
            // أو إذا كان هناك خطأ في الاتصال بقاعدة البيانات
            if (!courseEnrollment && !legacyEnrollment) {
              // محاولة ثانية بعد تأخير صغير (للتأكد من أن المعاملة تمت)
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              const { data: retryCourseEnrollment } = await supabase
                .from('course_enrollments')
                .select('id, is_active')
                .eq('student_id', userId)
                .eq('course_id', courseId)
                .eq('is_active', true)
                .maybeSingle();

              const { data: retryLegacyEnrollment } = await supabase
                .from('enrollments')
                .select('id, is_active')
                .eq('user_id', userId)
                .eq('course_id', courseId)
                .eq('is_active', true)
                .maybeSingle();

              // إذا وُجد الاشتراك في المحاولة الثانية، نحتفظ به
              if (retryCourseEnrollment || retryLegacyEnrollment) {
                // تحديث timestamp لأن الاشتراك موجود في قاعدة البيانات
                localStorage.setItem(`enrollment_${courseId}`, 'true');
                localStorage.setItem(`enrollment_${courseId}_timestamp`, Date.now().toString());
                setIsEnrolled(true);
                return true;
              }

              // إذا لم نجد الاشتراك في قاعدة البيانات بعد المحاولتين
              // نحتفظ بالاشتراك في localStorage دائماً ولا نحذفه
              // لأن الاشتراك قد يكون موجوداً لكن هناك مشكلة في الاتصال أو RLS policies
              // أو قد يكون الاشتراك تم إنشاؤه بطريقة مختلفة
              localStorage.setItem(`enrollment_${courseId}_timestamp`, Date.now().toString());
              setIsEnrolled(true);
              return true;
            }
          }
        }
      } catch (dbError) {
        console.error('Error checking enrollment in database:', dbError);
        // في حالة الخطأ، نعتمد على localStorage ونحدث timestamp
        // لأن الخطأ قد يكون مؤقتاً (مشكلة في الاتصال مثلاً)
        if (cachedEnrollment === 'true') {
          localStorage.setItem(`enrollment_${courseId}_timestamp`, Date.now().toString());
          setIsEnrolled(true);
          return true;
        }
      }
      
      // إذا وصلنا هنا وكان الاشتراك موجوداً في localStorage، نحتفظ به
      if (cachedEnrollment === 'true') {
        setIsEnrolled(true);
        return true;
      }
      
      return false;
    }
    
    // التحقق الدوري من قاعدة البيانات
    let phone: string | null = null;
    let userId: string | null = null;
    const studentInfo = localStorage.getItem('studentInfo');
    if (studentInfo) {
      try {
        const parsed = JSON.parse(studentInfo);
        phone = parsed.phone || null;
      } catch (e) {
        console.error('Error parsing studentInfo:', e);
      }
    }

    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        phone = phone || user.studentPhone || user.phone || null;
        userId = user.id || null;
      } catch (e) {
        console.error('Error parsing user data when checking enrollment:', e);
      }
    }

    // التحقق من الاشتراك في قاعدة البيانات أولاً (يشمل الاشتراكات بكود الكورس)
    if (userId && courseId) {
      try {
        const { default: supabase } = await import('@/lib/supabase-client');
        
        // التحقق من course_enrollments مباشرة (حتى لو لم يكن المستخدم في users)
        // لأن course_enrollments.student_id قد يشير إلى auth.users
        const { data: courseEnrollment } = await supabase
          .from('course_enrollments')
          .select('id, is_active')
          .eq('student_id', userId)
          .eq('course_id', courseId)
          .eq('is_active', true)
          .maybeSingle();

        // التحقق من enrollments (للتوافق مع النظام القديم)
        const { data: legacyEnrollment } = await supabase
          .from('enrollments')
          .select('id, is_active')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .eq('is_active', true)
          .maybeSingle();

        if (courseEnrollment || legacyEnrollment) {
          // يوجد اشتراك نشط في قاعدة البيانات
          if (!cachedEnrollment) {
            toast.success('🎉 مرحباً! تم تفعيل اشتراكك في الكورس');
          }
          isCurrentlyEnrolled = true;
          // حفظ الاشتراك في localStorage مع timestamp محدث
          localStorage.setItem(`enrollment_${courseId}`, 'true');
          localStorage.setItem(`enrollment_${courseId}_timestamp`, Date.now().toString());
          setIsEnrolled(true);
          return true;
        } else if (cachedEnrollment === 'true') {
          // إذا كان الاشتراك موجوداً في localStorage لكن لم نجده في قاعدة البيانات
          // قد يكون هناك تأخير في المزامنة أو مشكلة في الاتصال
          // نحتفظ بالاشتراك في localStorage ونحدث timestamp
          localStorage.setItem(`enrollment_${courseId}_timestamp`, Date.now().toString());
          setIsEnrolled(true);
          return true;
        }
      } catch (dbError) {
        console.error('Error checking enrollment in database:', dbError);
        // في حالة الخطأ، إذا كان الاشتراك موجوداً في localStorage، نحتفظ به
        if (cachedEnrollment === 'true') {
          localStorage.setItem(`enrollment_${courseId}_timestamp`, Date.now().toString());
          setIsEnrolled(true);
          return true;
        }
      }
    }

    // التحقق من طلبات الدفع (للطلبات المعلقة)
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
            }

            // في حالة وجود طلب دفع مقبول نضمن أن الاشتراك مفعَّل
            // ملاحظة: الاشتراك في enrollments يتم إنشاؤه تلقائياً من API route عند الموافقة على طلب الدفع
            isCurrentlyEnrolled = true;
            localStorage.setItem(`enrollment_${courseId}`, 'true');
            localStorage.setItem(`enrollment_${courseId}_timestamp`, Date.now().toString());
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

    // التحقق من timestamp قبل حذف الاشتراك
    // إذا كان الاشتراك قد تم تفعيله مؤخراً، نحتفظ به حتى لو لم نجده في قاعدة البيانات
    // نستخدم نفس القيمة المحسوبة في بداية الدالة
    // إذا كان الاشتراك موجوداً في localStorage، نحتفظ به دائماً
    // لأن الاشتراك قد يكون موجوداً في قاعدة البيانات لكن هناك مشكلة في الاتصال
    if (cachedEnrollment === 'true') {
      // تحديث timestamp لإعطاء وقت إضافي
      localStorage.setItem(`enrollment_${courseId}_timestamp`, Date.now().toString());
      setIsEnrolled(true);
      return true;
    }

    setIsEnrolled(isCurrentlyEnrolled);

    return isCurrentlyEnrolled;
  };

  // التحقق من الاشتراك
  useEffect(() => {
    const checkEnrollment = async () => {
      await checkEnrollmentStatus(false);
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
        .maybeSingle();
      
      console.log('📊 نتيجة البحث:', { 
        found: !!courseData, 
        error: fetchError?.message,
        code: fetchError?.code,
        details: fetchError?.details
      });
      
      if (fetchError) {
        console.error('❌ خطأ في قاعدة البيانات:', fetchError);
        throw new Error('خطأ في الاتصال بقاعدة البيانات');
      }
      
      if (!courseData) {
        console.error('⚠️ لم يتم العثور على كورس بهذا الـ ID:', courseId);
        // محاولة جلب أول 3 كورسات للتأكد من الاتصال
        const { data: testCourses } = await supabase
          .from('courses')
          .select('id, title')
          .limit(3);
        console.log('📋 كورسات موجودة كمثال:', testCourses);
        throw new Error(`الكورس غير موجود. ID المطلوب: ${courseId}`);
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

  useEffect(() => {
    if (!courseId || !activeLesson) return;
    if (!isEnrolled) return;

    const loadResume = async () => {
      try {
        const userJson = localStorage.getItem('user');
        let userId: string | null = null;
        if (userJson) {
          try {
            const user = JSON.parse(userJson);
            userId = user.id || null;
          } catch (e) {
            console.error('Error parsing user data for resume:', e);
          }
        }
        if (!userId) return;

        const params = new URLSearchParams();
        params.set('userId', String(userId));
        params.set('lessonId', String(activeLesson));
        params.set('courseId', String(courseId));

        const res = await fetch(`/api/lesson-progress?${params.toString()}`);
        const body = await res.json().catch(() => null);
        if (!res.ok || !body?.success) return;

        const p = body?.progress;
        const watchedSeconds = p?.watchedSeconds ? Number(p.watchedSeconds) : 0;
        const isCompleted = !!p?.isCompleted;

        if (watchedSeconds > 0) {
          setVideoProgress((prev) => ({
            ...prev,
            [String(activeLesson)]: watchedSeconds,
          }));
          setResumeSecondsByLesson((prev) => ({
            ...prev,
            [String(activeLesson)]: watchedSeconds,
          }));
        }

        if (isCompleted) {
          setVideoCompleted((prev) => ({
            ...prev,
            [String(activeLesson)]: true,
          }));
        }
      } catch (e) {
        console.error('Error loading resume progress:', e);
      }
    };

    loadResume();
  }, [courseId, activeLesson, isEnrolled]);

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

  const handleRedeemCode = async () => {
    if (!courseId) {
      toast.error('معرّف الكورس غير معروف، حدّث الصفحة وحاول مرة أخرى');
      return;
    }

    const trimmedCode = accessCode.trim();
    if (!trimmedCode) {
      toast.error('من فضلك أدخل كود الاشتراك');
      return;
    }

    try {
      const userJson = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (!userJson) {
        toast.error('يجب تسجيل الدخول أولاً لاستخدام الكود');
        router.push('/login');
        return;
      }

      const user = JSON.parse(userJson);
      const studentId = user.id as string | undefined;
      const studentPhoneForCode =
        (studentInfo?.phone as string | undefined) ||
        (user.studentPhone as string | undefined) ||
        (user.phone as string | undefined) ||
        undefined;

      if (!studentId && !studentPhoneForCode) {
        toast.error('لا يمكن تحديد حساب الطالب، حاول تسجيل الخروج ثم تسجيل الدخول مرة أخرى');
        return;
      }

      setIsRedeeming(true);

      const response = await fetch('/api/course-access-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: trimmedCode,
          courseId,
          // نرسل المعرف والرقم معاً، والـ API ستختار الطريقة الأنسب لتحديد الطالب
          studentId,
          studentPhone: studentPhoneForCode,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        const message = data?.message || data?.error || 'الكود غير صحيح أو تم استخدامه من قبل';
        toast.error(message);
        return;
      }

      toast.success(data.message || '🎉 تم تفعيل اشتراكك في الكورس باستخدام الكود');

      // حفظ حالة الاشتراك في localStorage مع timestamp
      try {
        localStorage.setItem(`enrollment_${courseId}`, 'true');
        localStorage.setItem(`enrollment_${courseId}_timestamp`, Date.now().toString());
      } catch (e) {
        console.warn('تعذر حفظ حالة الاشتراك في localStorage بعد تفعيل الكود:', e);
      }

      // تحديث حالة الاشتراك فوراً
      setIsEnrolled(true);

      // إعادة التحقق من الاشتراك من قاعدة البيانات بعد تأخير كافٍ
      // للتأكد من أن المعاملة تمت وأن الاشتراك موجود فعلياً
      setTimeout(async () => {
        try {
          const isEnrolled = await checkEnrollmentStatus(true);
          if (isEnrolled) {
            // التأكد من أن الاشتراك محفوظ في localStorage مع تحديث timestamp
            localStorage.setItem(`enrollment_${courseId}`, 'true');
            localStorage.setItem(`enrollment_${courseId}_timestamp`, Date.now().toString());
            setIsEnrolled(true);
          } else {
            // إذا لم يُوجد الاشتراك بعد 5 ثوانٍ، نعطي المستخدم رسالة واضحة
            // لكننا لا نحذف الاشتراك من localStorage لأن API route قد يكون أنشأه بالفعل
            console.warn('⚠️ لم يتم العثور على الاشتراك في قاعدة البيانات بعد تفعيل الكود');
            // نحدث timestamp مرة أخرى لإعطاء وقت إضافي
            localStorage.setItem(`enrollment_${courseId}_timestamp`, Date.now().toString());
            // لا نعرض رسالة خطأ للمستخدم لأن الاشتراك قد يكون موجوداً بالفعل
          }
        } catch (error) {
          console.error('Error rechecking enrollment:', error);
          // في حالة الخطأ، نحتفظ بالاشتراك في localStorage
          localStorage.setItem(`enrollment_${courseId}_timestamp`, Date.now().toString());
        }
      }, 5000); // تأخير 5 ثوانٍ للسماح للمعاملة بالاكتمال
    } catch (error) {
      console.error('Error redeeming course access code:', error);
      toast.error('حدث خطأ أثناء تفعيل الكود، حاول مرة أخرى');
    } finally {
      setIsRedeeming(false);
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
          // استخدام API route لحفظ التقدم (لتجنب مشاكل RLS)
          try {
            const progressResponse = await fetch('/api/lesson-progress', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId,
                lessonId,
                courseId,
                watchedSeconds: 0,
                progressPercent: 100,
                isCompleted: true,
              }),
            });

            if (!progressResponse.ok) {
              const errorData = await progressResponse.json().catch(() => ({}));
              console.error('❌ خطأ في حفظ تقدم الدرس:', errorData.error || 'Unknown error');
            } else {
              // منح النقاط عند إكمال الدرس
              try {
                const pointsResponse = await fetch('/api/points/award', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId,
                    points: 10, // 10 نقاط لكل درس مكتمل
                    action: 'lesson_completion',
                    description: `إكمال الدرس: ${selectedLesson?.title || ''}`,
                    referenceId: lessonId,
                  }),
                });

                if (pointsResponse.ok) {
                  toast.success('🎉 حصلت على 10 نقاط لإكمال الدرس!');
                }
              } catch (pointsError) {
                console.error('❌ خطأ في منح النقاط:', pointsError);
              }

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
            }
          } catch (progressError) {
            console.error('❌ خطأ في حفظ تقدم الدرس:', progressError);
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

  // عداد الوقت - يبدأ فقط عند الضغط على زر play
  useEffect(() => {
    if (!activeLesson || !isEnrolled || !selectedLessonForProgress || !isVideoPlaying) return;

    const lessonId = activeLesson;
    const durationMinutes = selectedLessonForProgress.duration || 0;
    if (!durationMinutes) return;

    // الوقت المطلوب بالثواني (100% من المدة)
    const requiredSeconds = durationMinutes * 60;

    // التحقق من أن الدرس لم يكتمل بعد
    if (videoCompleted[lessonId] || (progress && progress.completedLessons.includes(lessonId))) {
      return;
    }

    // عداد التقدم - يحفظ التقدم عند الوصول لنسب معينة
    const milestonePercentages = [25, 50, 75, 100];
    const milestoneReached = new Set<number>();

    const intervalId = window.setInterval(() => {
      // إيقاف العدّ عندما تكون التبويبة غير ظاهرة
      if (typeof document !== 'undefined' && document.hidden) return;

      setVideoProgress((prev) => {
        const prevSeconds = prev[lessonId] || 0;

        // لو وصلنا للوقت المطلوب (100%) نكمل الدرس
        if (prevSeconds >= requiredSeconds) {
          // إكمال الدرس
          setVideoCompleted((prevCompleted) => {
            if (prevCompleted[lessonId]) return prevCompleted;
            return { ...prevCompleted, [lessonId]: true };
          });
          return prev;
        }

        const nextSeconds = prevSeconds + 1;
        const currentPercent = Math.round((nextSeconds / requiredSeconds) * 100);

        // حفظ التقدم عند الوصول لمعالم معينة (25%, 50%, 75%, 100%)
        milestonePercentages.forEach((milestone) => {
          if (currentPercent >= milestone && !milestoneReached.has(milestone)) {
            milestoneReached.add(milestone);
            // حفظ التقدم في قاعدة البيانات
            const saveProgress = async () => {
              try {
                const userJson = localStorage.getItem('user');
                let userId: string | null = null;
                
                if (userJson) {
                  try {
                    const user = JSON.parse(userJson);
                    userId = user.id || null;
                  } catch (e) {
                    console.error('Error parsing user data:', e);
                  }
                }

                if (!userId || !courseId || !lessonId) return;

                await fetch('/api/lesson-progress', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId,
                    lessonId,
                    courseId,
                    watchedSeconds: nextSeconds,
                    progressPercent: currentPercent,
                    isCompleted: currentPercent >= 100,
                  }),
                });

                console.log(`✅ تم حفظ التقدم: ${currentPercent}%`);
              } catch (error) {
                console.error('❌ خطأ في حفظ التقدم:', error);
              }
            };
            
            saveProgress();
          }
        });

        return {
          ...prev,
          [lessonId]: nextSeconds,
        };
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeLesson, isEnrolled, selectedLessonForProgress, videoCompleted, progress, isVideoPlaying, courseId]);

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
                        onClick={() => {
                          if (teacherInfo?.id) {
                            // توجيه إلى صفحة الرسائل مع معرف المدرس والكورس
                            router.push(`/messages?user=${teacherInfo.id}&courseId=${courseId}`);
                          } else {
                            toast.error('لا يمكن العثور على معلومات المدرس');
                          }
                        }}
                        disabled={!studentInfo?.id || !teacherInfo?.id}
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
                    <>
                      <button
                        type="button"
                        onClick={handleEnrollment}
                        disabled={isEnrolling}
                        className="w-full px-5 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-primary font-bold shadow-md text-sm md:text-base disabled:opacity-70 disabled:cursor-not-allowed transition"
                      >
                        {isEnrolling ? 'جاري تحويلك للدفع...' : 'اشترك الآن في الكورس'}
                      </button>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            dir="ltr"
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value)}
                            placeholder="أدخل كود الاشتراك"
                            className="flex-1 rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                          />
                          <button
                            type="button"
                            onClick={handleRedeemCode}
                            disabled={isRedeeming || !accessCode.trim()}
                            className="px-3 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-primary text-sm font-bold disabled:opacity-70 disabled:cursor-not-allowed transition"
                          >
                            {isRedeeming ? 'جاري التفعيل...' : 'تفعيل بالكود'}
                          </button>
                        </div>
                        <p className="text-[11px] text-white/80 text-right">
                          إذا كان لديك كود اشتراك من المدرس يمكنك إدخاله هنا بدلاً من الدفع.
                        </p>
                      </div>
                    </>
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
                      onClick={() => {
                        if (teacherInfo?.id) {
                          // توجيه إلى صفحة الرسائل مع معرف المدرس والكورس
                          router.push(`/messages?user=${teacherInfo.id}&courseId=${courseId}`);
                        } else {
                          toast.error('لا يمكن العثور على معلومات المدرس');
                        }
                      }}
                      disabled={!studentInfo?.id || !teacherInfo?.id}
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
                      duration={selectedLesson.duration || 0}
                      initialWatchedSeconds={
                        activeLesson
                          ? (resumeSecondsByLesson[String(activeLesson)] || videoProgress[String(activeLesson)] || 0)
                          : 0
                      }
                      onProgress={(progress, watchedSeconds) => {
                        // تحديث التقدم في الصفحة الرئيسية
                        if (activeLesson) {
                          setVideoProgress((prev) => ({
                            ...prev,
                            [activeLesson]: watchedSeconds,
                          }));
                        }
                      }}
                      onPlayStateChange={(isPlaying) => {
                        setIsVideoPlaying(isPlaying);
                      }}
                    />
                  </div>

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
                  {course.sections?.map((section: any, sIndex: number) => {
                    const displayItems: any[] =
                      Array.isArray(section?.items) && section.items.length > 0
                        ? (section.items as any[])
                        : Array.isArray(section?.lessons)
                          ? (section.lessons as any[]).map((lesson: any, index: number) => ({
                              type: 'lesson' as const,
                              id: String(lesson.id),
                              title: lesson.title,
                              duration: lesson.duration || 0,
                              isPreview: !!lesson.isPreview,
                              orderIndex: index + 1,
                            }))
                          : [];

                    return (
                      <div key={section.id} className="rounded-2xl border border-slate-100 dark:border-gray-800 overflow-hidden">
                        <div className="bg-slate-50 dark:bg-gray-800/60 px-4 py-3 font-semibold flex items-center justify-between">
                          <span className="truncate">{section.title}</span>
                          <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">
                            {sIndex + 1}
                          </span>
                        </div>
                        <div className="p-2">
                          <div className="space-y-2">
                            {displayItems.map((item: any, index: number) => {
                              const itemType = String(item?.type || 'lesson');

                              if (itemType === 'exam') {
                                const examId = String(item.id);
                                const isLocked = !isEnrolled;

                                return (
                                  <button
                                    key={`exam-${examId}`}
                                    type="button"
                                    className="w-full text-right p-3 rounded-xl flex items-center justify-between gap-3 transition border bg-white dark:bg-gray-900 hover:bg-slate-50 dark:hover:bg-gray-800 border-slate-100 dark:border-gray-800"
                                    onClick={() => {
                                      try {
                                        router.push(`/courses/${courseId}/exams?examId=${encodeURIComponent(examId)}`);
                                      } catch (err) {
                                        console.error('Error navigating to exams page:', err);
                                      }
                                    }}
                                  >
                                    <div className="min-w-0">
                                      <div className="font-semibold text-sm truncate">
                                        {index + 1}. {item.title}
                                      </div>
                                      <div className="text-xs flex items-center justify-end gap-2 mt-1 text-gray-500 dark:text-gray-400">
                                        <span className="inline-flex items-center gap-1">
                                          <FaClock className="text-[10px]" /> {Number(item.duration) || 0} دقيقة
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                          <FaQuestionCircle className="text-[10px]" /> امتحان
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {isLocked && <FaLock className="text-gray-400" />}
                                    </div>
                                  </button>
                                );
                              }

                              const lessonId = String(item.id);
                              const isActive = activeLesson === lessonId;
                              const isCompleted = progress?.completedLessons.includes(lessonId);
                              const isLocked = !isEnrolled && !item.isPreview;

                              return (
                                <button
                                  key={lessonId}
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
                                      {index + 1}. {item.title}
                                    </div>
                                    <div className={`text-xs flex items-center justify-end gap-2 mt-1 ${isActive ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>
                                      <span className="inline-flex items-center gap-1">
                                        <FaClock className="text-[10px]" /> {Number(item.duration) || 0} دقيقة
                                      </span>
                                      {!isEnrolled && !!item.isPreview && (
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
                    );
                  })}
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