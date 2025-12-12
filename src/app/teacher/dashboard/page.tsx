'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import supabase from '@/lib/supabase-client';
import CourseChat from '@/components/CourseChat';
import { 
  FaUsers, FaBookOpen, FaChartLine, FaDollarSign, 
  FaVideo, FaComments, FaBell, FaPlus, FaEdit, 
  FaTrash, FaEye, FaCog, FaSignOutAlt, FaGraduationCap,
  FaStar, FaClock, FaCheckCircle, FaEnvelope, FaWhatsapp
} from 'react-icons/fa';
import { uploadTeacherAvatar } from '@/lib/supabase-upload';

interface TeacherData {
  id: string;
  name: string;
  email: string;
  bio: string;
  specialization: string;
  profileImage: string;
  rating: number;
  studentsCount: number;
  coursesCount: number;
  isVerified: boolean;
  status?: 'pending' | 'approved' | 'rejected';
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  studentsCount: number;
  lessonsCount: number;
  rating: number;
  isPublished: boolean;
  createdAt: string;
}

interface Student {
  id: string;
  userId: string;
  courseId: string;
  name: string;
  email: string;
  avatar: string;
  enrolledDate: string;
  progress: number;
  lastActive: string;
  courseName: string;
  enrolledAtRaw?: string | null;
  lastActiveAt?: string | null;
  parentPhone?: string;
}

interface StudentDetailsState {
  loading: boolean;
  error: string | null;
  quizResults: any[];
  completedLessons: number;
  totalLessons: number;
  averageQuizScore: number;
}

interface ParentReport {
  id: string;
  teacherId: string;
  studentId: string;
  courseId: string;
  parentPhone: string | null;
  studentName: string;
  courseTitle: string;
  reportText: string;
  sentVia: string;
  createdAt: string;
}

interface Message {
  id: string;
  studentName: string;
  studentAvatar: string;
  content: string;
  time: string;
  isRead: boolean;
  courseTitle: string;
  courseId: string;
}
export default function TeacherDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const [teacher, setTeacher] = useState<TeacherData | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'courses' | 'students' | 'messages' | 'earnings' | 'settings'
  >('overview');
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalStudents: 0,
    activeStudents: 0,
    totalCourses: 0,
    averageRating: 0,
    totalLessons: 0,
    completionRate: 0,
    averageQuizScore: 0,
  });
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentDetails, setStudentDetails] = useState<StudentDetailsState>({
    loading: false,
    error: null,
    quizResults: [],
    completedLessons: 0,
    totalLessons: 0,
    averageQuizScore: 0,
  });
  const [parentReportMode, setParentReportMode] = useState(false);
  const [parentReports, setParentReports] = useState<ParentReport[]>([]);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatCourseId, setChatCourseId] = useState<string | null>(null);

  const latestActivities = students
    .slice()
    .filter((s) => s.lastActiveAt || s.enrolledAtRaw)
    .sort((a, b) => {
      const aDate = a.lastActiveAt || a.enrolledAtRaw || '';
      const bDate = b.lastActiveAt || b.enrolledAtRaw || '';
      const aTime = aDate ? new Date(aDate).getTime() : 0;
      const bTime = bDate ? new Date(bDate).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 5);

  const buildParentReportText = () => {
    if (!selectedStudent) return '';

    const totalLessons = studentDetails.totalLessons || 0;
    const completedLessons = studentDetails.completedLessons || 0;
    const remainingLessons = Math.max(totalLessons - completedLessons, 0);

    const totalQuizAttempts = studentDetails.quizResults.length;
    const passedQuizzes = studentDetails.quizResults.filter((q: any) => q.passed).length;
    const failedQuizzes = Math.max(totalQuizAttempts - passedQuizzes, 0);

    let weeklyStatus = 'لا توجد بيانات حديثة عن حضور هذا الأسبوع.';
    if (selectedStudent.lastActiveAt) {
      const last = new Date(selectedStudent.lastActiveAt as any);
      if (!isNaN(last.getTime())) {
        const diffDays = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
        weeklyStatus =
          diffDays <= 7
            ? 'حضر دروس الكورس خلال هذا الأسبوع.'
            : 'لم يسجل حضوراً للكورس خلال هذا الأسبوع.';
      }
    }

    const avgScore =
      studentDetails.quizResults.length > 0 ? studentDetails.averageQuizScore : 0;

    return `السلام عليكم ورحمة الله وبركاته\n\nولي أمر الطالب/ة ${selectedStudent.name}\n\nنود إبلاغكم بتقرير مختصر عن أداء ابنكم/ابنتكم في كورس "${selectedStudent.courseName}" على المنصة.\n\n- نسبة إنجاز الكورس الحالية: ${selectedStudent.progress}%\n- عدد الدروس المكتملة: ${completedLessons} من ${totalLessons} درس\n- الدروس المتبقية: ${remainingLessons} درس\n- عدد محاولات الاختبارات: ${totalQuizAttempts}\n- عدد مرات النجاح في الامتحان: ${passedQuizzes}\n- عدد مرات الرسوب في الامتحان: ${failedQuizzes}\n- متوسط درجة الاختبارات: ${avgScore}%\n- حالة الحضور هذا الأسبوع: ${weeklyStatus}\n\nنشكركم على متابعتكم، وأي تقصير يتم التنبيه عليه أولاً للطالب ثم التنسيق معكم عند الحاجة.`;
  };

  const handleChangeAvatar = () => {
    if (!user) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (event: Event) => {
      const target = event.target as HTMLInputElement | null;
      const file = target?.files?.[0];
      if (!file) return;

      setAvatarUploading(true);
      try {
        const result = await uploadTeacherAvatar(file);
        if (!result.success || !result.url) {
          toast.error('فشل رفع الصورة، حاول مرة أخرى');
          return;
        }

        const url = result.url;

        const { error: userError } = await supabase
          .from('users')
          .update({ avatar_url: url })
          .eq('id', user.id);

        if (userError) {
          console.error('Error updating user avatar:', userError);
        }

        const { error: teacherError } = await supabase
          .from('teachers')
          .update({ avatar_url: url })
          .eq('user_id', user.id);

        if (teacherError) {
          console.error('Error updating teacher avatar:', teacherError);
        }

        setTeacher((prev) => (prev ? { ...prev, profileImage: url } : prev));
        toast.success('تم تحديث صورتك بنجاح');
      } catch (error) {
        console.error('Error uploading teacher avatar:', error);
        toast.error('حدث خطأ أثناء رفع الصورة');
      } finally {
        setAvatarUploading(false);
      }
    };
    input.click();
  };

  const handleOpenParentReport = (student: Student) => {
    setParentReportMode(true);
    handleViewStudent(student);
  };

  const handleSendParentReportWhatsApp = async (student: Student) => {
    if (!student.parentPhone) {
      toast.error('لا يوجد رقم ولي أمر مسجلاً لهذا الطالب');
      return;
    }

    try {
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', student.courseId);

      if (lessonsError) {
        console.error('Error loading lessons for parent report:', lessonsError);
        toast.error('تعذر تحميل بيانات الدروس لهذا الطالب');
        return;
      }

      const lessonIds = (lessons || []).map((l: any) => l.id);
      let completedLessons = 0;

      if (lessonIds.length > 0) {
        const { count, error: progressError } = await supabase
          .from('lesson_progress')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', student.userId)
          .in('lesson_id', lessonIds)
          .eq('is_completed', true);

        if (progressError) {
          console.error('Error loading lesson_progress for parent report:', progressError);
        } else {
          completedLessons = count || 0;
        }
      }

      const { data: quizData, error: quizError } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', student.userId)
        .eq('course_id', student.courseId)
        .order('attempted_at', { ascending: false });

      if (quizError) {
        console.error('Error loading quiz results for parent report:', quizError);
      }

      const totalLessons = lessonIds.length;
      const remainingLessons = Math.max(totalLessons - completedLessons, 0);

      const totalQuizAttempts = quizData ? quizData.length : 0;
      const passedQuizzes = quizData
        ? quizData.filter((q: any) => q.passed).length
        : 0;
      const failedQuizzes = Math.max(totalQuizAttempts - passedQuizzes, 0);

      let averageQuizScore = 0;
      if (quizData && quizData.length > 0) {
        const totalScore = quizData.reduce(
          (sum: number, q: any) => sum + (Number(q.score) || 0),
          0
        );
        averageQuizScore = Number((totalScore / quizData.length).toFixed(1));
      }

      let weeklyStatus = 'لا توجد بيانات حديثة عن حضور هذا الأسبوع.';
      if (student.lastActiveAt) {
        const last = new Date(student.lastActiveAt as any);
        if (!isNaN(last.getTime())) {
          const diffDays = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
          weeklyStatus =
            diffDays <= 7
              ? 'حضر دروس الكورس خلال هذا الأسبوع.'
              : 'لم يسجل حضوراً للكورس خلال هذا الأسبوع.';
        }
      }

      const text = `السلام عليكم ورحمة الله وبركاته\n\nولي أمر الطالب/ة ${student.name}\n\nنود إبلاغكم بتقرير مختصر عن أداء ابنكم/ابنتكم في كورس "${student.courseName}" على المنصة.\n\n- نسبة إنجاز الكورس الحالية: ${student.progress}%\n- عدد الدروس المكتملة: ${completedLessons} من ${totalLessons} درس\n- الدروس المتبقية: ${remainingLessons} درس\n- عدد محاولات الاختبارات: ${totalQuizAttempts}\n- عدد مرات النجاح في الامتحان: ${passedQuizzes}\n- عدد مرات الرسوب في الامتحان: ${failedQuizzes}\n- متوسط درجة الاختبارات: ${averageQuizScore}%\n- حالة الحضور هذا الأسبوع: ${weeklyStatus}\n\nنشكركم على متابعتكم، وأي تقصير يتم التنبيه عليه أولاً للطالب ثم التنسيق معكم عند الحاجة.`;

      const rawPhone = String(student.parentPhone || '').replace(/[^0-9]/g, '');
      if (!rawPhone) {
        toast.error('رقم ولي الأمر غير صالح');
        return;
      }

      try {
        if (user?.id) {
          const res = await fetch('/api/teacher/parent-reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              teacherId: user.id,
              studentId: student.userId,
              courseId: student.courseId,
              parentPhone: rawPhone,
              studentName: student.name,
              courseTitle: student.courseName,
              reportText: text,
              sentVia: 'whatsapp',
            }),
          });

          if (res.ok) {
            const json = await res.json();
            if (json.report) {
              setParentReports((prev) => {
                const next = [json.report as ParentReport, ...prev];
                return next.sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
              });
            }
          } else {
            console.error('Failed to log parent report:', await res.text());
          }
        }
      } catch (logError) {
        console.error('Error logging parent report:', logError);
      }

      const waUrl = `https://wa.me/2${rawPhone}?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
    } catch (error) {
      console.error('Error preparing parent report WhatsApp message:', error);
      toast.error('حدث خطأ أثناء تجهيز تقرير ولي الأمر');
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?redirect=/teacher/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;

    if (user.role !== 'teacher') {
      toast.error('يجب تسجيل الدخول كمدرس');
      router.replace('/');
      return;
    }

    const loadDashboard = async () => {
      try {
        const { data: teacherRow, error: teacherError } = await supabase
          .from('teachers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (teacherError) {
          console.error('Error loading teacher profile:', teacherError);
        }

        const teacherData: TeacherData = {
          id: teacherRow?.id || user.id,
          name: user.name,
          email: user.email || '',
          bio: teacherRow?.bio || '',
          specialization: teacherRow?.specialization || 'مدرس',
          profileImage: (user as any).avatar_url || '/placeholder-avatar.png',
          rating: teacherRow?.average_rating || 0,
          studentsCount: teacherRow?.total_students || 0,
          coursesCount: teacherRow?.total_courses || 0,
          isVerified: true,
          status: (teacherRow as any)?.status || 'approved',
        };

        setTeacher(teacherData);

        if (teacherData.status && teacherData.status !== 'approved') {
          return;
        }

        const { data: coursesRows, error: coursesError } = await supabase
          .from('courses')
          .select(
            'id, title, short_description, thumbnail, price, students_count, total_lessons, rating, status, created_at'
          )
          .eq('instructor_id', user.id)
          .order('created_at', { ascending: false });

        if (coursesError) {
          console.error('Error loading teacher courses:', coursesError);
          setCourses([]);
          setStudents([]);
          return;
        }

        const mappedCourses: Course[] = (coursesRows || []).map((c: any) => ({
          id: c.id,
          title: c.title,
          description: c.short_description || '',
          thumbnail: c.thumbnail || '/placeholder-course.jpg',
          price: c.price ?? 0,
          studentsCount: c.students_count ?? 0,
          lessonsCount: c.total_lessons ?? 0,
          rating: c.rating ?? 0,
          isPublished: c.status === 'published',
          createdAt: c.created_at,
        }));

        setCourses(mappedCourses);

        const totalStudents = mappedCourses.reduce(
          (sum, course) => sum + (course.studentsCount || 0),
          0
        );
        const totalLessons = mappedCourses.reduce(
          (sum, course) => sum + (course.lessonsCount || 0),
          0
        );
        const avgRating = mappedCourses.length
          ? mappedCourses.reduce((sum, course) => sum + (course.rating || 0), 0) /
            mappedCourses.length
          : 0;

        let avgQuizScore = 0;
        if (mappedCourses.length > 0) {
          const courseIdsForQuiz = mappedCourses.map((c) => c.id);

          const { data: quizResultsForTeacher, error: quizResultsError } =
            await supabase
              .from('quiz_results')
              .select('score, course_id')
              .in('course_id', courseIdsForQuiz);

          if (quizResultsError) {
            console.error(
              'Error loading quiz results for teacher courses:',
              quizResultsError
            );
          } else if (quizResultsForTeacher && quizResultsForTeacher.length > 0) {
            const totalScore = quizResultsForTeacher.reduce(
              (sum: number, r: any) => sum + (Number(r.score) || 0),
              0
            );
            avgQuizScore = totalScore / quizResultsForTeacher.length;
          }
        }

        setStats((prev) => ({
          ...prev,
          totalStudents,
          totalCourses: mappedCourses.length,
          totalLessons,
          averageRating: Number(avgRating.toFixed(1)),
          averageQuizScore: Number(avgQuizScore.toFixed(1)),
        }));

        if (mappedCourses.length > 0) {
          const courseIds = mappedCourses.map((c) => c.id);
          const courseMap = new Map(mappedCourses.map((c) => [c.id, c.title]));

          try {
            const params = new URLSearchParams();
            params.set('courseIds', courseIds.join(','));
            if (user?.id) {
              params.set('teacherId', user.id);
            }

            const res = await fetch(`/api/teacher/students?${params.toString()}`);

            if (!res.ok) {
              console.error(
                'Error fetching teacher students via /api/teacher/students:',
                await res.text()
              );
              setStudents([]);
              setMessages([]);
              return;
            }

            const json = await res.json();
            const studentsFromApi: Student[] = Array.isArray(json)
              ? json
              : Array.isArray(json.students)
              ? json.students
              : [];

            setStudents(studentsFromApi);

            const usersMap = new Map(
              (studentsFromApi || []).map((s) => [
                s.userId,
                {
                  id: s.userId,
                  name: s.name,
                  avatar_url: s.avatar,
                } as any,
              ])
            );

            try {
              const { data: courseMessages, error: courseMessagesError } =
                await supabase
                  .from('course_messages')
                  .select('*')
                  .in('course_id', courseIds)
                  .order('created_at', { ascending: true });

              if (courseMessagesError || !courseMessages) {
                console.error(
                  'Error loading course messages for teacher:',
                  courseMessagesError
                );
                setMessages([]);
              } else {
                const msgs = courseMessages as any[];
                const latestByPair = new Map<string, any>();

                msgs.forEach((m: any) => {
                  const key = `${m.sender_id || ''}-${m.course_id || ''}`;
                  const existing = latestByPair.get(key);
                  const createdAt = m.created_at
                    ? new Date(m.created_at).getTime()
                    : 0;
                  if (!existing || createdAt > (existing._ts || 0)) {
                    latestByPair.set(key, { ...m, _ts: createdAt });
                  }
                });

                const mappedMessages: Message[] = Array.from(latestByPair.values())
                  .map((m: any) => {
                    const studentUser: any = usersMap.get(m.sender_id);
                    const courseTitleForMsg = courseMap.get(m.course_id) || 'كورس';
                    return {
                      id: String(m.id),
                      studentName: studentUser?.name || m.sender_name || 'طالب',
                      studentAvatar:
                        studentUser?.avatar_url || '/placeholder-avatar.png',
                      content: m.content || '',
                      time: m.created_at
                        ? new Date(m.created_at).toLocaleString('ar-EG')
                        : '',
                      isRead: true,
                      courseTitle: courseTitleForMsg,
                      courseId: String(m.course_id || ''),
                    };
                  })
                  .sort((a, b) => {
                    const aTime = a.time ? new Date(a.time).getTime() : 0;
                    const bTime = b.time ? new Date(b.time).getTime() : 0;
                    return bTime - aTime;
                  });

                setMessages(mappedMessages);
              }
            } catch (msgErr) {
              console.error('Error loading course messages for teacher:', msgErr);
            }
          } catch (studentsErr) {
            console.error('Error loading students for teacher dashboard:', studentsErr);
            setStudents([]);
            setMessages([]);
          }
        } else {
          setStudents([]);
          setMessages([]);
        }

        try {
          if (user?.id) {
            const params = new URLSearchParams();
            params.set('teacherId', user.id);
            params.set('days', '7');

            const res = await fetch(
              `/api/teacher/parent-reports?${params.toString()}`
            );
            if (res.ok) {
              const json = await res.json();
              const reports: ParentReport[] = Array.isArray(json.reports)
                ? json.reports
                : [];
              setParentReports(reports);
            } else {
              console.error('Error loading parent reports:', await res.text());
              setParentReports([]);
            }
          }
        } catch (reportsErr) {
          console.error('Unexpected error loading parent reports:', reportsErr);
          setParentReports([]);
        }
      } catch (error) {
        console.error('Error loading teacher dashboard:', error);
      }
    };

    loadDashboard();
  }, [isLoading, isAuthenticated, user, router]);

  const handleLogout = () => {
    logout();
    toast.success('تم تسجيل الخروج بنجاح');
    router.push('/login');
  };

  const handleViewStudent = async (student: Student) => {
    setSelectedStudent(student);
    setParentReportMode(false);
    setStudentDetails({
      loading: true,
      error: null,
      quizResults: [],
      completedLessons: 0,
      totalLessons: 0,
      averageQuizScore: 0,
    });

    try {
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', student.courseId);

      if (lessonsError) {
        console.error('Error loading lessons for student details:', lessonsError);
        setStudentDetails((prev) => ({
          ...prev,
          loading: false,
          error: 'تعذر تحميل تفاصيل الدروس لهذا الطالب',
        }));
        return;
      }

      const lessonIds = (lessons || []).map((l: any) => l.id);
      let completedLessons = 0;

      if (lessonIds.length > 0) {
        const { count, error: progressError } = await supabase
          .from('lesson_progress')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', student.userId)
          .in('lesson_id', lessonIds)
          .eq('is_completed', true);

        if (progressError) {
          console.error(
            'Error loading lesson_progress for student details:',
            progressError
          );
        } else {
          completedLessons = count || 0;
        }
      }

      const { data: quizData, error: quizError } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', student.userId)
        .eq('course_id', student.courseId)
        .order('attempted_at', { ascending: false });

      if (quizError) {
        console.error('Error loading quiz results for student:', quizError);
        setStudentDetails({
          loading: false,
          error: 'تعذر تحميل نتائج الاختبارات لهذا الطالب',
          quizResults: [],
          completedLessons,
          totalLessons: lessonIds.length,
          averageQuizScore: 0,
        });
        return;
      }

      const averageQuizScore =
        quizData && quizData.length > 0
          ? quizData.reduce(
              (sum: number, q: any) => sum + (Number(q.score) || 0),
              0
            ) / quizData.length
          : 0;

      setStudentDetails({
        loading: false,
        error: null,
        quizResults: quizData || [],
        completedLessons,
        totalLessons: lessonIds.length,
        averageQuizScore: Number(averageQuizScore.toFixed(1)),
      });
    } catch (error) {
      console.error('Error loading student details:', error);
      setStudentDetails((prev) => ({
        ...prev,
        loading: false,
        error: 'حدث خطأ أثناء تحميل تفاصيل الطالب',
      }));
    }
  };

  const handleCloseStudentDetails = () => {
    setSelectedStudent(null);
    setStudentDetails({
      loading: false,
      error: null,
      quizResults: [],
      completedLessons: 0,
      totalLessons: 0,
      averageQuizScore: 0,
    });
  };

  if (!isAuthenticated || user?.role !== 'teacher') {
    return null;
  }

  if (!teacher) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  if (teacher.status && teacher.status !== 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg text-center">
          <FaClock className="mx-auto text-4xl text-yellow-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">حسابك كمدرس قيد المراجعة</h1>
          <p className="text-gray-600 mb-4">
            شكراً لانضمامك إلينا يا {teacher.name}. سيتم مراجعة طلبك من قبل الإدارة
            وسنقوم بإبلاغك فور قبول الحساب.
          </p>
          <p className="text-sm text-gray-500">
            يمكنك العودة لاحقاً أو التواصل مع الدعم في حال تأخّر المراجعة.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* الشريط الجانبي */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6">
          {/* معلومات المدرس */}
          <div className="flex items-center gap-4 mb-8">
            <img
              src={teacher.profileImage || '/placeholder-avatar.png'}
              alt={teacher.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-purple-200"
            />
            <div>
              <h3 className="font-bold">{teacher.name}</h3>
              <p className="text-sm text-gray-500">{teacher.specialization}</p>
            </div>
          </div>

          {/* القائمة */}
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'overview'
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'hover:bg-gray-100'
              }`}
            >
              <FaChartLine />
              نظرة عامة
            </button>

            <button
              onClick={() => setActiveTab('courses')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'courses'
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'hover:bg-gray-100'
              }`}
            >
              <FaBookOpen />
              الكورسات
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'students'
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'hover:bg-gray-100'
              }`}
            >
              <FaUsers />
              الطلاب
            </button>

            <button
              onClick={() => setActiveTab('messages')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition relative ${
                activeTab === 'messages'
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'hover:bg-gray-100'
              }`}
            >
              <FaComments />
              الرسائل
              {messages.filter((m) => !m.isRead).length > 0 && (
                <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('earnings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'earnings'
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'hover:bg-gray-100'
              }`}
            >
              <FaDollarSign />
              الأرباح
            </button>

            <hr className="my-4" />

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'settings'
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'hover:bg-gray-100'
              }`}
            >
              <FaCog />
              الإعدادات
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition hover:bg-red-50 text-red-600"
            >
              <FaSignOutAlt />
              تسجيل الخروج
            </button>
          </nav>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 p-8">
        {/* الهيدر */}
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {activeTab === 'overview' && 'نظرة عامة'}
              {activeTab === 'courses' && 'إدارة الكورسات'}
              {activeTab === 'students' && 'الطلاب المشتركين'}
              {activeTab === 'messages' && 'الرسائل والمحادثات'}
              {activeTab === 'earnings' && 'الأرباح والمدفوعات'}
              {activeTab === 'settings' && 'الإعدادات'}
            </h1>
            <p className="text-gray-600 mt-1">
              {new Date().toLocaleDateString('ar-EG', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* زر إضافة كورس */}
          {activeTab === 'courses' && (
            <Link
              href="/teachers/courses/create"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition"
            >
              <FaPlus />
              إضافة كورس جديد
            </Link>
          )}
        </header>

        {/* نظرة عامة */}
        {activeTab === 'overview' && (
          <div>
            {/* الإحصائيات */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <FaDollarSign className="text-3xl text-green-500" />
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                    +12% هذا الشهر
                  </span>
                </div>
                <h3 className="text-2xl font-bold">
                  {stats.totalRevenue.toLocaleString()} ج.م
                </h3>
                <p className="text-gray-500 text-sm">إجمالي الأرباح</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <FaUsers className="text-3xl text-blue-500" />
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {stats.activeStudents} نشط
                  </span>
                </div>
                <h3 className="text-2xl font-bold">{stats.totalStudents}</h3>
                <p className="text-gray-500 text-sm">إجمالي الطلاب</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <FaBookOpen className="text-3xl text-purple-500" />
                  <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                    {stats.totalLessons} درس
                  </span>
                </div>
                <h3 className="text-2xl font-bold">{stats.totalCourses}</h3>
                <p className="text-gray-500 text-sm">الكورسات المنشورة</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <FaStar className="text-3xl text-yellow-500" />
                  <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                    ممتاز
                  </span>
                </div>
                <h3 className="text-2xl font-bold">{stats.averageRating}</h3>
                <p className="text-gray-500 text-sm">متوسط التقييم</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <FaGraduationCap className="text-3xl text-indigo-500" />
                  <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded">
                    من نتائج اختبارات الطلاب
                  </span>
                </div>
                <h3 className="text-2xl font-bold">
                  {stats.averageQuizScore}
                  <span className="text-sm mr-1">%</span>
                </h3>
                <p className="text-gray-500 text-sm">متوسط درجات الاختبارات</p>
              </div>
            </div>

            {/* آخر النشاطات */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">آخر النشاطات</h2>
              <div className="space-y-4">
                {latestActivities.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    لا توجد نشاطات حديثة حتى الآن. سيظهر هنا آخر تفاعل لطلابك مع
                    الكورسات.
                  </p>
                ) : (
                  latestActivities.map((s) => {
                    const hasProgress = (s.progress ?? 0) > 0 && s.lastActiveAt;
                    const dateSource = s.lastActiveAt || s.enrolledAtRaw || '';
                    const formattedDate = dateSource
                      ? new Date(dateSource).toLocaleString('ar-EG')
                      : '';

                    return (
                      <div
                        key={`${s.id}-${s.courseId}`}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            hasProgress ? 'bg-green-100' : 'bg-blue-100'
                          }`}
                        >
                          {hasProgress ? (
                            <FaCheckCircle className="text-green-600" />
                          ) : (
                            <FaUsers className="text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {hasProgress ? (
                              <>
                                {s.name} تقدم إلى نسبة {s.progress}% في كورس{' '}
                                {s.courseName}
                              </>
                            ) : (
                              <>
                                {s.name} انضم إلى كورس {s.courseName}
                              </>
                            )}
                          </p>
                          {formattedDate && (
                            <p className="text-sm text-gray-500">{formattedDate}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* إدارة الكورسات */}
        {activeTab === 'courses' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-course.jpg';
                  }}
                />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg">{course.title}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        course.isPublished
                          ? 'bg-green-100 text-green-600'
                          : 'bg-yellow-100 text-yellow-600'
                      }`}
                    >
                      {course.isPublished ? 'منشور' : 'مسودة'}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {course.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <FaUsers />
                      <span>{course.studentsCount} طالب</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaVideo />
                      <span>{course.lessonsCount} درس</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaStar className="text-yellow-500" />
                      <span>{course.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaDollarSign />
                      <span>{course.price} ج.م</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/teacher/courses/${course.id}/edit`}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
                    >
                      <FaEdit />
                      تعديل
                    </Link>
                    <Link
                      href={`/teacher/courses/${course.id}/lessons`}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                    >
                      <FaVideo />
                      الدروس
                    </Link>
                    <Link
                      href={`/teacher/courses/${course.id}/exams`}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                    >
                      <FaGraduationCap />
                      الامتحانات
                    </Link>
                    <Link
                      href={`/courses/${course.id}`}
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition flex items-center justify-center"
                    >
                      <FaEye />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* قائمة الطلاب + تقارير أولياء الأمور */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">الطلاب المشتركين</h2>
                  <div className="flex gap-2">
                    <input
                      type="search"
                      placeholder="بحث..."
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-500"
                    />
                    <select className="px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-500">
                      <option>كل الكورسات</option>
                      {courses.map((course) => (
                        <option key={course.id}>{course.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الطالب
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الكورس
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        التقدم
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        تاريخ الانضمام
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        آخر نشاط
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <img
                              src={student.avatar}
                              alt={student.name}
                              className="w-10 h-10 rounded-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  '/placeholder-avatar.png';
                              }}
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {student.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {student.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {student.courseName}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${student.progress}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">
                              {student.progress}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.enrolledDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              student.lastActive === 'الآن'
                                ? 'bg-green-100 text-green-600'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {student.lastActive}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-3">
                            <button className="text-purple-600 hover:text-purple-900">
                              <FaComments />
                            </button>
                            <button
                              onClick={() => handleViewStudent(student)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <FaEye />
                            </button>
                            <button
                              onClick={() => handleSendParentReportWhatsApp(student)}
                              className="flex items-center gap-1 text-green-600 hover:text-green-900 text-xs sm:text-sm"
                              title="إرسال تقرير لولي الأمر عبر واتساب"
                            >
                              <FaWhatsapp />
                              <span className="hidden sm:inline">
                                إرسال لولي الأمر
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  تقارير أولياء الأمور (آخر 7 أيام)
                </h2>
                <span className="text-sm text-gray-500">
                  إجمالي التقارير: {parentReports.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                {parentReports.length === 0 ? (
                  <div className="p-6 text-sm text-gray-500">
                    لم يتم إرسال أي تقارير لولي الأمر خلال هذا الأسبوع بعد.
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          الطالب
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          الكورس
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          رقم ولي الأمر
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          طريقة الإرسال
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          التاريخ
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {parentReports.map((report) => (
                        <tr key={report.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {report.studentName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {report.courseTitle}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {report.parentPhone || '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {report.sentVia === 'whatsapp'
                              ? 'واتساب'
                              : report.sentVia}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {report.createdAt
                              ? new Date(report.createdAt).toLocaleString('ar-EG')
                              : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* الرسائل */}
        {activeTab === 'messages' && teacher.status === 'approved' && (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">الرسائل والمحادثات</h2>
            </div>
            <div className="divide-y">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-6 hover:bg-gray-50 cursor-pointer ${
                    !message.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={message.studentAvatar}
                      alt={message.studentName}
                      className="w-12 h-12 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          '/placeholder-avatar.png';
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="font-medium">
                            {message.studentName}
                          </span>
                          <span className="text-sm text-gray-500 mr-2">
                            - {message.courseTitle}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {message.time}
                        </span>
                      </div>
                      <p className="text-gray-700">{message.content}</p>
                      <button
                        className="mt-2 text-purple-600 hover:text-purple-700 text-sm font-medium"
                        onClick={() => {
                          if (!message.courseId) return;
                          setChatCourseId(message.courseId);
                          setShowChat(true);
                        }}
                      >
                        الرد على الرسالة ←
                      </button>
                    </div>
                    {!message.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* نافذة تفاصيل الطالب + تقرير ولي الأمر */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 relative">
              <button
                onClick={handleCloseStudentDetails}
                className="absolute top-3 left-3 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
              <h2 className="text-xl font-bold mb-4">
                تفاصيل الطالب: {selectedStudent.name}
              </h2>

              {studentDetails.loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-600 border-t-transparent" />
                </div>
              ) : studentDetails.error ? (
                <p className="text-red-600">{studentDetails.error}</p>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">التقدم في الكورس</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        الكورس: {selectedStudent.courseName}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        نسبة التقدم العامة: {selectedStudent.progress}%
                      </p>
                      <p className="text-sm text-gray-600">
                        الدروس المكتملة:{' '}
                        {studentDetails.totalLessons > 0
                          ? `${studentDetails.completedLessons} من ${studentDetails.totalLessons}`
                          : 'لا توجد بيانات دروس بعد'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold mb-2">ملخص الاختبارات</h3>
                      <p className="text-sm text-gray-600 mb-1">
                        عدد المحاولات: {studentDetails.quizResults.length}
                      </p>
                      <p className="text-sm text-gray-600">
                        متوسط الدرجة:{' '}
                        {studentDetails.quizResults.length > 0
                          ? `${studentDetails.averageQuizScore}%`
                          : 'لا توجد اختبارات بعد'}
                      </p>
                    </div>
                  </div>

                  {studentDetails.quizResults.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">
                        تفاصيل نتائج الاختبارات
                      </h3>
                      <div className="max-h-64 overflow-y-auto border rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-2 text-right">الاختبار</th>
                              <th className="px-4 py-2 text-right">الدرجة</th>
                              <th className="px-4 py-2 text-right">الأسئلة</th>
                              <th className="px-4 py-2 text-right">النتيجة</th>
                              <th className="px-4 py-2 text-right">التاريخ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentDetails.quizResults.map((q: any) => (
                              <tr key={q.id} className="border-t">
                                <td className="px-4 py-2">
                                  {q.quiz_title || 'اختبار'}
                                </td>
                                <td className="px-4 py-2">
                                  {q.score}
                                  <span className="text-xs text-gray-500 ml-1">
                                    درجة
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  {q.total_questions || '-'}
                                </td>
                                <td className="px-4 py-2">
                                  <span
                                    className={`px-2 py-1 text-xs rounded ${
                                      q.passed
                                        ? 'bg-green-100 text-green-600'
                                        : 'bg-red-100 text-red-600'
                                    }`}
                                  >
                                    {q.passed ? 'ناجح' : 'راسب'}
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  {q.attempted_at
                                    ? new Date(q.attempted_at).toLocaleString(
                                        'ar-EG'
                                      )
                                    : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {parentReportMode && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                      <h3 className="font-semibold mb-1 flex items-center gap-2">
                        <FaEnvelope className="text-purple-600" />
                        نص تقرير جاهز لولي الأمر
                      </h3>
                      <p className="text-xs text-gray-500">
                        يمكنك نسخ النص التالي وإرساله لولي الأمر عبر واتساب أو
                        رسالة.
                      </p>
                      <textarea
                        className="w-full h-40 text-sm border rounded-lg p-3 bg-white resize-none"
                        readOnly
                        value={buildParentReportText()}
                      />
                      {selectedStudent.parentPhone && (
                        <p className="text-xs text-gray-600">
                          رقم ولي الأمر المسجل:{' '}
                          <span className="font-semibold">
                            {selectedStudent.parentPhone}
                          </span>
                        </p>
                      )}
                      {selectedStudent.parentPhone && (
                        <button
                          type="button"
                          onClick={() => {
                            const text = buildParentReportText();
                            if (!text) return;
                            const rawPhone = String(
                              selectedStudent.parentPhone || ''
                            ).replace(/[^0-9]/g, '');
                            if (!rawPhone) return;
                            const waUrl = `https://wa.me/2${rawPhone}?text=${encodeURIComponent(
                              text
                            )}`;
                            window.open(waUrl, '_blank');
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm rounded-lg transition"
                        >
                          <FaWhatsapp />
                          إرسال التقرير عبر واتساب
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {showChat && chatCourseId && user?.id && (
          <CourseChat
            courseId={chatCourseId}
            userId={user.id}
            userName={user.name}
            userRole="teacher"
            teacherId={user.id}
            teacherName={user.name}
            isOpen={showChat}
            onClose={() => setShowChat(false)}
          />
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-xl">
            <h2 className="text-xl font-bold mb-4">إعدادات الملف الشخصي</h2>
            <div className="flex items-center gap-4 mb-4">
              <img
                src={teacher.profileImage || '/placeholder-avatar.png'}
                alt={teacher.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-purple-200"
              />
              <button
                type="button"
                onClick={handleChangeAvatar}
                disabled={avatarUploading}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700 disabled:opacity-60"
              >
                {avatarUploading ? 'جاري رفع الصورة...' : 'تغيير الصورة'}
              </button>
            </div>
            <p className="text-sm text-gray-500">
              يمكنك تحميل صورة شخصية تظهر في صفحة المدرس والصفحة الرئيسية.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}