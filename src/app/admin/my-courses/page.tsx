'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FaBookOpen, FaComments, FaEdit, FaKey, FaUsers } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import supabase from '@/lib/supabase-client';

type CourseRow = {
  id: string;
  title: string | null;
  short_description?: string | null;
  thumbnail?: string | null;
  students_count?: number | null;
  total_lessons?: number | null;
  status?: string | null;
  created_at?: string | null;
};

export default function AdminMyCoursesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?redirect=/admin/my-courses');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;

    if (user.role !== 'admin') {
      toast.error('ليس لديك صلاحية الوصول لهذه الصفحة');
      router.replace('/');
      return;
    }

    const load = async () => {
      try {
        setLoadingCourses(true);

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        let instructorId: string | null = user.id;

        const resolvedPhone: string | null =
          (user as any)?.phone ||
          (user as any)?.student_phone ||
          (user as any)?.parent_phone ||
          (user as any)?.mother_phone ||
          (user?.role === 'admin' ? '01005209667' : null);

        const resolveUserUuidByPhone = async (phone: string): Promise<string | null> => {
          const normalizedPhone = String(phone || '').trim();
          if (!normalizedPhone) return null;

          const tryWithPhoneColumn = async () =>
            supabase
              .from('users')
              .select('id, role')
              .or(
                `phone.eq.${normalizedPhone},student_phone.eq.${normalizedPhone},parent_phone.eq.${normalizedPhone},mother_phone.eq.${normalizedPhone}`
              )
              .limit(10);

          const tryWithoutPhoneColumn = async () =>
            supabase
              .from('users')
              .select('id, role')
              .or(
                `student_phone.eq.${normalizedPhone},parent_phone.eq.${normalizedPhone},mother_phone.eq.${normalizedPhone}`
              )
              .limit(10);

          let { data, error } = await tryWithPhoneColumn();

          if (error && typeof error.message === 'string' && error.message.toLowerCase().includes('phone')) {
            ({ data, error } = await tryWithoutPhoneColumn());
          }

          if (error) {
            console.error('Error resolving admin UUID for my courses:', error);
            return null;
          }

          const rows: any[] = Array.isArray(data) ? (data as any[]) : data ? [data as any] : [];
          const preferred = rows.find((row) => String((row as any)?.role || '').toLowerCase() === 'admin');
          const picked = preferred || rows[0] || null;
          const resolved = picked?.id ? String(picked.id) : null;
          if (resolved && uuidRegex.test(resolved)) return resolved;
          return null;
        };

        if (!uuidRegex.test(String(instructorId || '')) && resolvedPhone) {
          try {
            const resolvedId = await resolveUserUuidByPhone(resolvedPhone);

            if (resolvedId) {
              instructorId = String(resolvedId);
            }
          } catch (resolveErr) {
            console.error('Error resolving admin UUID for my courses:', resolveErr);
          }
        }

        if (!instructorId || !uuidRegex.test(String(instructorId))) {
          instructorId = null;
        }

        let query = supabase
          .from('courses')
          .select('id, title, short_description, thumbnail, students_count, total_lessons, status, created_at')
          .order('created_at', { ascending: false });

        if (instructorId && uuidRegex.test(String(instructorId))) {
          query = query.eq('instructor_id', instructorId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error loading admin-owned courses:', error);
          toast.error('تعذر تحميل دوراتك');
          setCourses([]);
          return;
        }

        setCourses((data as any[]) as CourseRow[]);
      } catch (e) {
        console.error('Unexpected error loading admin-owned courses:', e);
        toast.error('حدث خطأ أثناء تحميل دوراتك');
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    };

    load();
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FaBookOpen className="text-primary" />
            <h1 className="text-2xl font-bold">دوراتي</h1>
          </div>

          <Link
            href="/admin/courses/new"
            className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition"
          >
            إضافة دورة
          </Link>
        </div>

        {loadingCourses ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center border border-gray-100 dark:border-gray-800">
            <p className="text-gray-600 dark:text-gray-300">لا توجد دورات مضافة باسمك حالياً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm"
              >
                <div className="relative h-40 bg-gray-100 dark:bg-gray-800">
                  <Image
                    src={course.thumbnail || '/placeholder-course.jpg'}
                    alt={course.title || 'Course'}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-bold mb-2 line-clamp-2">{course.title || 'دورة بدون عنوان'}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                    {course.short_description || ''}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-4">
                    <span className="inline-flex items-center gap-2">
                      <FaUsers className="text-primary" />
                      {(course.students_count ?? 0).toLocaleString('ar-EG')} طالب
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <FaBookOpen className="text-emerald-600" />
                      {(course.total_lessons ?? 0).toLocaleString('ar-EG')} درس
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/teacher/courses/${course.id}/lessons`}
                      className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition inline-flex items-center justify-center gap-2"
                      title="إدارة الدروس + الأكواد"
                    >
                      <FaKey />
                      الأكواد
                    </Link>

                    <Link
                      href={`/teacher/courses/${course.id}/exams`}
                      className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition inline-flex items-center justify-center gap-2"
                      title="إدارة الامتحانات"
                    >
                      <FaBookOpen />
                      الامتحانات
                    </Link>

                    <Link
                      href={`/admin/my-courses/${course.id}/students`}
                      className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition inline-flex items-center justify-center gap-2"
                      title="متابعة طلاب الكورس"
                    >
                      <FaUsers />
                      الطلاب
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        router.push('/messages');
                      }}
                      className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition inline-flex items-center justify-center gap-2"
                      title="رسائل الطلاب"
                    >
                      <FaComments />
                      الشات
                    </button>

                    <Link
                      href={`/teacher/courses/${course.id}/edit`}
                      className="col-span-2 px-3 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition inline-flex items-center justify-center gap-2"
                      title="تعديل بيانات الكورس"
                    >
                      <FaEdit />
                      تعديل الكورس
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
