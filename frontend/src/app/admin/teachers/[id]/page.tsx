'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowRight, FaBook, FaGraduationCap, FaUsers, FaExternalLinkAlt } from 'react-icons/fa';
import AdminLayout from '../../../../components/AdminLayout';
import supabase from '@/lib/supabase-client';

interface TeacherDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  specialization: string;
  bio?: string | null;
  experienceYears?: number | null;
  status?: string | null;
  totalStudents?: number;
  totalCourses?: number;
  createdAt?: string | null;
}

interface CourseSummary {
  id: string;
  title: string;
  isPublished: boolean;
  studentsCount: number;
  createdAt?: string | null;
}

export default function AdminTeacherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = (params as any)?.id as string | undefined;

  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTeacher = async () => {
      if (!teacherId) {
        setError('معرّف المدرس غير صالح');
        setIsLoading(false);
        return;
      }

      try {
        const { data: userRow, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', teacherId)
          .maybeSingle();

        if (userError || !userRow) {
          setError('لم يتم العثور على هذا المدرس');
          setIsLoading(false);
          return;
        }

        const { data: teacherRow, error: teacherError } = await supabase
          .from('teachers')
          .select('*')
          .eq('user_id', teacherId)
          .maybeSingle();

        if (teacherError) {
          console.error('Error loading teacher meta:', teacherError);
        }

        const detail: TeacherDetail = {
          id: userRow.id,
          name: userRow.name || 'بدون اسم',
          email: userRow.email || '',
          phone: userRow.phone || null,
          specialization:
            (teacherRow && teacherRow.specialization) ||
            userRow.specialty ||
            'مدرس',
          bio: teacherRow?.bio ?? null,
          experienceYears: teacherRow?.experience_years ?? null,
          status: teacherRow?.status ?? userRow.status ?? null,
          totalStudents: teacherRow?.total_students ?? 0,
          totalCourses: teacherRow?.total_courses ?? 0,
          createdAt: userRow.created_at ?? null,
        };

        setTeacher(detail);

        const { data: coursesRows, error: coursesError } = await supabase
          .from('courses')
          .select('id, title, is_published, students_count, created_at')
          .eq('instructor_id', teacherId)
          .order('created_at', { ascending: false });

        if (coursesError) {
          console.error('Error loading teacher courses for admin view:', coursesError);
        }

        const mappedCourses: CourseSummary[] = (coursesRows || []).map((c: any) => ({
          id: c.id,
          title: c.title || 'بدون عنوان',
          isPublished: !!c.is_published,
          studentsCount: c.students_count ?? 0,
          createdAt: c.created_at ?? null,
        }));

        setCourses(mappedCourses);
      } catch (e) {
        console.error('Unexpected error loading teacher detail:', e);
        setError('حدث خطأ أثناء تحميل بيانات المدرس');
      } finally {
        setIsLoading(false);
      }
    };

    loadTeacher();
  }, [teacherId]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !teacher) {
    return (
      <AdminLayout>
        <div className="max-w-3xl mx-auto py-8">
          <button
            onClick={() => router.push('/admin/teachers')}
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary"
          >
            <FaArrowRight />
            العودة لقائمة المدرسين
          </button>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 text-center">
            <p className="text-red-600 dark:text-red-400 font-medium mb-2">{error || 'لم يتم العثور على هذا المدرس'}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto py-8 space-y-6">
        <button
          onClick={() => router.push('/admin/teachers')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary mb-4"
        >
          <FaArrowRight />
          العودة لقائمة المدرسين
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1 space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{teacher.name}</h1>
            <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <FaGraduationCap /> {teacher.specialization}
            </p>
            <p className="text-gray-600 dark:text-gray-300">البريد: {teacher.email || 'غير متوفر'}</p>
            <p className="text-gray-600 dark:text-gray-300">الهاتف: {teacher.phone || 'غير متوفر'}</p>
            {teacher.status && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                الحالة: {teacher.status === 'pending' ? 'قيد المراجعة' : teacher.status === 'approved' ? 'مقبول' : teacher.status === 'rejected' ? 'مرفوض' : teacher.status}
              </p>
            )}
            {teacher.createdAt && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                تاريخ الانضمام: {new Date(teacher.createdAt).toLocaleDateString('ar-EG')}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 items-stretch w-full md:w-auto min-w-[220px]">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                <div className="flex items-center justify-center gap-1 text-sm text-gray-600 dark:text-gray-300 mb-1">
                  <FaUsers /> الطلاب
                </div>
                <div className="text-xl font-bold">{teacher.totalStudents ?? 0}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                <div className="flex items-center justify-center gap-1 text-sm text-gray-600 dark:text-gray-300 mb-1">
                  <FaBook /> الكورسات
                </div>
                <div className="text-xl font-bold">{teacher.totalCourses ?? courses.length}</div>
              </div>
            </div>

            <Link
              href={`/teachers/${teacher.id}/dashboard`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition"
            >
              فتح لوحة تحكم المدرس
              <FaExternalLinkAlt className="text-xs" />
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FaBook /> كورسات المدرس
          </h2>
          {courses.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">لا توجد كورسات مسجّلة لهذا المدرس حتى الآن.</p>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-gray-100 dark:border-gray-700 rounded-lg px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{course.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      عدد الطلاب: {course.studentsCount}
                      {course.createdAt && ` • تم الإنشاء في ${new Date(course.createdAt).toLocaleDateString('ar-EG')}`}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center justify-center px-3 py-1 text-xs rounded-full ${
                      course.isPublished
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}
                  >
                    {course.isPublished ? 'منشور' : 'مسودة'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
