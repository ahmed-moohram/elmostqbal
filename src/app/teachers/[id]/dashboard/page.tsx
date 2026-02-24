'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FaChalkboardTeacher,
  FaUsers,
  FaVideo,
  FaChartLine,
  FaUpload,
  FaEye,
  FaEdit,
  FaClock,
  FaPlus,
  FaComment,
  FaCheckCircle,
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import supabase from '@/lib/supabase-client';
import { uploadLessonVideo } from '@/lib/supabase-upload';
import AdminTeacherChat from '@/components/Messages/AdminTeacherChat';

interface Teacher {
  id: string;
  name: string;
  email: string;
  specialty: string;
  role: 'teacher';
}

interface Course {
  id: string;
  title: string;
  studentsCount: number;
  lessonsCount: number;
  status: 'published' | 'draft';
}

interface Lesson {
  id: string;
  title: string;
  durationMinutes: number;
  orderIndex: number;
  isFree: boolean;
  videoUrl: string | null;
}

interface Student {
  id: string;
  name: string;
  email: string;
  enrolledCourses: string[];
  progress: number;
}

interface Activity {
  id: string;
  type: 'enrollment';
  studentName: string;
  courseTitle: string;
  timestamp: string;
}

interface CourseMessageSummary {
  id: string;
  courseId: string;
  courseTitle: string;
  senderName: string;
  senderRole: 'student' | 'teacher';
  content: string;
  createdAt: string;
}

export default function TeacherDashboardById() {
  const router = useRouter();
  const params = useParams();
  const teacherId = (params as any)?.id as string | undefined;

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'students' | 'upload' | 'messages'>('overview');
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessonsByCourse, setLessonsByCourse] = useState<Record<string, Lesson[]>>({});
  const [students, setStudents] = useState<Student[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [courseMessages, setCourseMessages] = useState<CourseMessageSummary[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [isFreeLesson, setIsFreeLesson] = useState(false);

  // تحميل بيانات المدرس والكورسات والطلاب بناءً على teacherId في الرابط
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!teacherId) {
          toast.error('معرّف المدرس غير موجود في الرابط');
          router.replace('/');
          return;
        }

        // جلب بيانات المدرس من جدول users أو teachers
        const { data: teacherRow, error: teacherError } = await supabase
          .from('teachers')
          .select('*')
          .eq('user_id', teacherId)
          .maybeSingle();

        if (teacherError) {
          console.error('❌ خطأ في جلب بيانات المدرس:', teacherError);
        }

        setTeacher({
          id: teacherId,
          name: (teacherRow as any)?.name || 'مدرس',
          email: (teacherRow as any)?.email || '',
          specialty: (teacherRow as any)?.specialization || 'مدرس',
          role: 'teacher',
        });

        // جلب كورسات المدرس
        const { data: coursesRows, error: coursesError } = await supabase
          .from('courses')
          .select('id, title, students_count, total_lessons, status')
          .eq('instructor_id', teacherId)
          .order('created_at', { ascending: false });

        if (coursesError) {
          console.error('❌ خطأ في جلب كورسات المدرس:', coursesError);
          setCourses([]);
        } else {
          const mappedCourses: Course[] = (coursesRows || []).map((c: any) => ({
            id: c.id,
            title: c.title,
            studentsCount: c.students_count ?? 0,
            lessonsCount: c.total_lessons ?? 0,
            status: c.status === 'published' ? 'published' : 'draft',
          }));
          setCourses(mappedCourses);
        }

        // يمكن لاحقاً إضافة جلب الطلاب والأنشطة هنا إذا لزم الأمر
      } catch (error) {
        console.error('❌ خطأ غير متوقع أثناء تحميل لوحة المدرس بالمعرّف:', error);
        toast.error('حدث خطأ أثناء تحميل بيانات لوحة المدرس');
      } finally {
        setIsLoading(false);
        setDataLoading(false);
      }
    };

    loadData();
  }, [teacherId, router]);

  const handleUploadVideo = () => {
    setActiveTab('upload');
  };

  const handleLessonUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCourseId) {
      toast.error('يرجى اختيار كورس أولاً');
      return;
    }

    if (!uploadFile) {
      toast.error('يرجى اختيار ملف فيديو');
      return;
    }

    if (!lessonTitle.trim()) {
      toast.error('يرجى إدخال عنوان للدرس');
      return;
    }

    try {
      setUploading(true);

      const uploadResult = await uploadLessonVideo(uploadFile);
      if (!uploadResult.success || !uploadResult.url) {
        toast.error('فشل رفع الفيديو، حاول مرة أخرى');
        return;
      }

      const course = courses.find((c) => c.id === selectedCourseId);
      const orderIndex = (course?.lessonsCount ?? 0) + 1;
      const duration = Math.max(1, Number(durationMinutes) || 1);

      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          course_id: selectedCourseId,
          title: lessonTitle || 'درس بدون عنوان',
          description: lessonDescription || '',
          video_url: uploadResult.url,
          duration_minutes: duration,
          order_index: orderIndex,
          is_free: isFreeLesson,
          is_published: true,
        })
        .select()
        .single();

      if (lessonError) {
        console.error('❌ خطأ في إنشاء الدرس:', lessonError);
        toast.error('حدث خطأ أثناء إنشاء الدرس');
        return;
      }

      if (!lesson) {
        toast.error('لم يتم إنشاء الدرس، حاول مرة أخرى');
        return;
      }

      setCourses((prev) =>
        prev.map((c) =>
          c.id === selectedCourseId ? { ...c, lessonsCount: c.lessonsCount + 1 } : c
        )
      );

      setLessonsByCourse((prev) => {
        const existing = prev[selectedCourseId] || [];
        const newLesson: Lesson = {
          id: String(lesson.id),
          title: lesson.title || lessonTitle || 'درس بدون عنوان',
          durationMinutes: Number(lesson.duration_minutes) || duration,
          orderIndex: Number(lesson.order_index) || orderIndex,
          isFree: !!lesson.is_free,
          videoUrl: lesson.video_url || uploadResult.url,
        };
        const updated = [...existing, newLesson].sort((a, b) => a.orderIndex - b.orderIndex);
        return { ...prev, [selectedCourseId]: updated };
      });

      setLessonTitle('');
      setLessonDescription('');
      setDurationMinutes('');
      setIsFreeLesson(false);
      setUploadFile(null);

      toast.success('تم رفع الفيديو وإنشاء الدرس بنجاح');
    } catch (error) {
      console.error('❌ خطأ غير متوقع أثناء رفع الفيديو:', error);
      toast.error('حدث خطأ أثناء رفع الفيديو');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string, courseId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الدرس؟')) return;

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) {
        console.error('❌ خطأ في حذف الدرس:', error);
        toast.error('فشل حذف الدرس');
        return;
      }

      setLessonsByCourse((prev) => {
        const existing = prev[courseId] || [];
        const updatedLessons = existing.filter((l) => l.id !== lessonId);
        return { ...prev, [courseId]: updatedLessons };
      });

      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId && c.lessonsCount > 0
            ? { ...c, lessonsCount: c.lessonsCount - 1 }
            : c
        )
      );

      toast.success('تم حذف الدرس بنجاح');
    } catch (error) {
      console.error('❌ خطأ غير متوقع أثناء حذف الدرس:', error);
      toast.error('حدث خطأ أثناء حذف الدرس');
    }
  };

  const handleEditLesson = async (lesson: Lesson, courseId: string) => {
    try {
      const newTitle = window.prompt('عنوان الدرس', lesson.title) ?? lesson.title;
      if (!newTitle.trim()) {
        toast.error('عنوان الدرس لا يمكن أن يكون فارغاً');
        return;
      }

      const durationPrompt = window.prompt(
        'مدة الفيديو بالدقائق',
        String(lesson.durationMinutes || '')
      );

      let newDuration = lesson.durationMinutes;
      if (durationPrompt !== null && durationPrompt !== '') {
        const parsed = Number(durationPrompt);
        if (!Number.isNaN(parsed) && parsed > 0) {
          newDuration = parsed;
        }
      }

      const { data: updatedLesson, error } = await supabase
        .from('lessons')
        .update({
          title: newTitle,
          duration_minutes: newDuration,
        })
        .eq('id', lesson.id)
        .select()
        .single();

      if (error) {
        console.error('❌ خطأ في تحديث الدرس:', error);
        toast.error('فشل تحديث الدرس');
        return;
      }

      setLessonsByCourse((prev) => {
        const existing = prev[courseId] || [];
        const updatedLessons = existing.map((l) =>
          l.id === lesson.id
            ? {
              ...l,
              title: updatedLesson?.title || newTitle,
              durationMinutes:
                Number((updatedLesson as any)?.duration_minutes) || newDuration,
            }
            : l
        );
        return { ...prev, [courseId]: updatedLessons };
      });

      toast.success('تم تحديث بيانات الدرس');
    } catch (error) {
      console.error('❌ خطأ غير متوقع أثناء تعديل الدرس:', error);
      toast.error('حدث خطأ أثناء تعديل الدرس');
    }
  };

  const handleToggleCoursePublish = async (courseId: string, currentStatus: 'published' | 'draft') => {
    try {
      const nextPublished = currentStatus !== 'published';
      const form = new FormData();
      form.append('isPublished', String(nextPublished));

      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        body: form,
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        console.error('❌ خطأ في تحديث حالة نشر الكورس عبر API:', json);
        toast.error('فشل تغيير حالة نشر الكورس');
        return;
      }

      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId ? { ...c, status: nextPublished ? 'published' : 'draft' } : c,
        ),
      );

      toast.success(nextPublished ? 'تم نشر الكورس بنجاح' : 'تم إلغاء نشر الكورس');
    } catch (error) {
      console.error('❌ خطأ غير متوقع أثناء تغيير حالة نشر الكورس:', error);
      toast.error('حدث خطأ أثناء تغيير حالة نشر الكورس');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الكورس؟ سيتم حذف جميع دروسه وتسجيلات الطلاب المرتبطة به.')) {
      return;
    }

    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        console.error('❌ خطأ في حذف الكورس عبر API:', json);
        toast.error('فشل حذف الكورس');
        return;
      }

      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      setLessonsByCourse((prev) => {
        const copy = { ...prev };
        delete copy[courseId];
        return copy;
      });
      setSelectedCourseId((prev) => (prev === courseId ? '' : prev));

      toast.success('تم حذف الكورس بنجاح');
    } catch (error) {
      console.error('❌ خطأ غير متوقع أثناء حذف الكورس:', error);
      toast.error('حدث خطأ أثناء حذف الكورس');
    }
  };

  const handleOpenChat = (studentId: string, studentName: string) => {
    setActiveTab('messages');
    toast.success(`انتقل إلى علامة التبويب الرسائل وافتح محادثة مع ${studentName} أو ابدأ واحدة جديدة...`);
  };

  const handleViewStudent = () => {
    toast('عرض تفاصيل الطالب...');
  };

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">لوحة تحكم المدرس</h1>
              <p className="text-gray-600">مرحباً، {teacher?.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleUploadVideo}
                className="bg-primary text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-primary-dark transition"
              >
                <FaUpload /> رفع فيديو جديد
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex gap-6">
            {[
              { id: 'overview', label: 'نظرة عامة', icon: FaChartLine },
              { id: 'courses', label: 'الكورسات', icon: FaChalkboardTeacher },
              { id: 'students', label: 'الطلاب', icon: FaUsers },
              { id: 'upload', label: 'رفع المحتوى', icon: FaUpload },
              { id: 'messages', label: 'الرسائل', icon: FaComment },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${activeTab === tab.id
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-gray-600 hover:text-primary'
                  }`}
              >
                <tab.icon />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <FaChalkboardTeacher className="text-3xl opacity-80" />
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">الكورسات</span>
                </div>
                <h3 className="text-3xl font-bold mb-1">{courses.length}</h3>
                <p className="text-sm opacity-90">إجمالي الكورسات</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <FaUsers className="text-3xl opacity-80" />
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">الطلاب</span>
                </div>
                <h3 className="text-3xl font-bold mb-1">
                  {courses.reduce((sum, c) => sum + c.studentsCount, 0)}
                </h3>
                <p className="text-sm opacity-90">إجمالي الطلاب</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <FaVideo className="text-3xl opacity-80" />
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">الفيديوهات</span>
                </div>
                <h3 className="text-3xl font-bold mb-1">
                  {courses.reduce((sum, c) => sum + c.lessonsCount, 0)}
                </h3>
                <p className="text-sm opacity-90">إجمالي الفيديوهات</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <FaCheckCircle className="text-3xl opacity-80" />
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">منشور</span>
                </div>
                <h3 className="text-3xl font-bold mb-1">
                  {courses.filter((c) => c.status === 'published').length}
                </h3>
                <p className="text-sm opacity-90">كورسات منشورة</p>
              </motion.div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">النشاط الأخير</h3>
              {activities.length === 0 ? (
                <p className="text-sm text-gray-500">لا يوجد نشاط حديث حتى الآن.</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                        <FaUsers />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">
                          انضم {activity.studentName} إلى كورس {activity.courseTitle}
                        </p>
                        <p className="text-sm text-gray-600">{activity.courseTitle}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(activity.timestamp).toLocaleString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">كورساتي</h2>
              <button
                onClick={() => router.replace('/teachers/courses/create')}
                className="bg-primary text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-dark transition"
              >
                <FaPlus /> إضافة كورس جديد
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => {
                const courseLessons = lessonsByCourse[course.id] || [];
                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-xl shadow-lg overflow-hidden"
                  >
                    <div className="h-40 bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                      <FaChalkboardTeacher className="text-6xl text-white opacity-50" />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        {course.status === 'published' ? (
                          <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <FaCheckCircle /> منشور
                          </span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-600 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <FaClock /> مسودة
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg mb-2">{course.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <span className="flex items-center gap-1">
                          <FaUsers /> {course.studentsCount} طالب
                        </span>
                        <span className="flex items-center gap-1">
                          <FaVideo /> {course.lessonsCount} درس
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => router.push(`/courses/${course.id}`)}
                          className="flex-1 bg-primary text-white py-2 rounded-lg flex items-center justify-center gap-1 hover:bg-primary-dark transition"
                        >
                          <FaEye /> عرض
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push(`/teacher/courses/${course.id}/edit`)}
                          className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg flex items-center justify-center gap-1 hover:bg-gray-200 transition"
                        >
                          <FaEdit /> تعديل
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => handleToggleCoursePublish(course.id, course.status)}
                          className={`px-3 py-1 rounded-full border transition flex items-center gap-1 ${{
                            published:
                              'border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
                            draft:
                              'border-green-300 bg-green-50 text-green-700 hover:bg-green-100',
                          }[course.status]}`}
                        >
                          {course.status === 'published' ? (
                            <>
                              <FaClock /> إلغاء نشر الكورس
                            </>
                          ) : (
                            <>
                              <FaCheckCircle /> نشر الكورس
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCourse(course.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          حذف الكورس
                        </button>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => router.push(`/teacher/courses/${course.id}/lessons`)}
                          className="text-xs text-primary hover:text-primary-dark"
                        >
                          إضافة درس لهذا الكورس
                        </button>
                      </div>
                      {courseLessons.length > 0 && (
                        <div className="mt-4 border-t pt-4 space-y-2">
                          <div className="flex items-center justify-between text-sm text-gray-700">
                            <span className="font-semibold">دروس الكورس</span>
                            <span className="text-xs text-gray-500">
                              {courseLessons.length} درس
                            </span>
                          </div>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {courseLessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2"
                              >
                                <div>
                                  <div className="font-medium">
                                    {lesson.orderIndex}. {lesson.title}
                                  </div>
                                  <div className="text-xs text-gray-500 flex gap-3 mt-1">
                                    <span>{lesson.durationMinutes || 0} دقيقة</span>
                                    <span>{lesson.isFree ? 'مجاني' : 'مدفوع'}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEditLesson(lesson, course.id)}
                                    className="text-blue-600 hover:text-blue-800 text-xs"
                                  >
                                    تعديل
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLesson(lesson.id, course.id)}
                                    className="text-red-600 hover:text-red-800 text-xs"
                                  >
                                    حذف
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">طلابي</h2>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">الاسم</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">البريد</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">الكورسات</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">التقدم</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold">{student.name}</td>
                      <td className="px-6 py-4 text-gray-600">{student.email}</td>
                      <td className="px-6 py-4">{student.enrolledCourses.length} كورس</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${student.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold">{student.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleViewStudent()}
                            className="text-primary hover:text-primary-dark transition"
                            title="عرض التفاصيل"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => handleOpenChat(student.id, student.name)}
                            className="text-blue-600 hover:text-blue-800 transition"
                            title="فتح محادثة"
                          >
                            <FaComment />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">رفع المحتوى</h2>
            <div className="bg-white rounded-xl shadow-lg p-8">
              <form onSubmit={handleLessonUpload} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">اختر الكورس</label>
                    <select
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    >
                      <option value="">اختر كورساً</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">عنوان الدرس</label>
                    <input
                      type="text"
                      value={lessonTitle}
                      onChange={(e) => setLessonTitle(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">وصف الدرس (اختياري)</label>
                  <textarea
                    value={lessonDescription}
                    onChange={(e) => setLessonDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">مدة الفيديو (بالدقائق)</label>
                    <input
                      type="number"
                      min={1}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-6 md:mt-8">
                    <input
                      id="isFreeLesson"
                      type="checkbox"
                      checked={isFreeLesson}
                      onChange={(e) => setIsFreeLesson(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="isFreeLesson" className="text-sm font-medium">
                      درس مجاني
                    </label>
                  </div>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                  <FaUpload className="text-4xl text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">ملف الفيديو</h3>
                  <p className="text-gray-600 mb-4">
                    اختر ملف الفيديو من جهازك (mp4, mov, وغيرها).
                  </p>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setUploadFile(file);
                    }}
                    className="block w-full text-sm text-gray-700"
                    required
                  />
                  {uploadFile && (
                    <p className="mt-2 text-sm text-gray-500">
                      الملف المختار: {uploadFile.name}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'جاري الرفع...' : 'رفع وإنشاء الدرس'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'messages' && teacherId && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">الرسائل والمحادثات للمدرس</h2>
            <AdminTeacherChat teacherId={teacherId} />
          </div>
        )}
      </div>
    </div>
  );
}
