'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FaArrowRight, FaBookOpen, FaChartLine, FaEnvelope, FaPhone, FaUserCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import supabase from '@/lib/supabase-client';

type StudentDto = {
  id: string;
  userId: string;
  courseId: string;
  name: string;
  email: string;
  avatar: string;
  parentPhone: string;
  enrolledDate: string;
  progress: number;
  lastActive: string;
  courseName: string;
  enrolledAtRaw?: string | null;
  lastActiveAt?: string | null;
};

export default function AdminMyCourseStudentsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = (params as any)?.courseId as string | undefined;

  const { user, isAuthenticated, isLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [students, setStudents] = useState<StudentDto[]>([]);

  const teacherId = user?.id;

  const displayName = useMemo(() => {
    if (user?.role === 'admin') return 'مستر معتصم';
    return user?.name || 'المدرس';
  }, [user]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?redirect=/admin/my-courses');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const load = async () => {
      if (isLoading || !isAuthenticated || !user || !courseId) return;

      if (user.role !== 'admin') {
        toast.error('ليس لديك صلاحية الوصول لهذه الصفحة');
        router.replace('/');
        return;
      }

      try {
        setLoading(true);

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        let effectiveTeacherId: string | null = user.id;

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
            console.error('Error resolving admin UUID for course students page:', error);
            return null;
          }

          const rows: any[] = Array.isArray(data) ? (data as any[]) : data ? [data as any] : [];
          const preferred = rows.find((row) => String((row as any)?.role || '').toLowerCase() === 'admin');
          const picked = preferred || rows[0] || null;
          const resolved = picked?.id ? String(picked.id) : null;
          if (resolved && uuidRegex.test(resolved)) return resolved;
          return null;
        };

        if (!uuidRegex.test(String(effectiveTeacherId || '')) && resolvedPhone) {
          try {
            const resolvedId = await resolveUserUuidByPhone(resolvedPhone);

            if (resolvedId) {
              effectiveTeacherId = String(resolvedId);
            }
          } catch (resolveErr) {
            console.error('Error resolving admin UUID for course students page:', resolveErr);
          }
        }

        const hasValidTeacherUuid = !!effectiveTeacherId && uuidRegex.test(String(effectiveTeacherId));
        if (!hasValidTeacherUuid) {
          effectiveTeacherId = null;
        }

        const { data: courseRow, error: courseErr } = await supabase
          .from('courses')
          .select('id, title, instructor_id')
          .eq('id', courseId)
          .maybeSingle();

        if (courseErr || !courseRow) {
          console.error('Error loading course for admin students page:', courseErr);
          toast.error('تعذر تحميل بيانات الكورس');
          router.replace('/admin/my-courses');
          return;
        }

        setCourseTitle(courseRow.title || 'كورس');

        const qs = new URLSearchParams();
        qs.set('courseIds', String(courseId));
        if (effectiveTeacherId && uuidRegex.test(String(effectiveTeacherId))) {
          qs.set('teacherId', String(effectiveTeacherId));
        }

        const res = await fetch(`/api/teacher/students?${qs.toString()}`);
        const json = await res.json().catch(() => null);

        if (!res.ok) {
          console.error('Error loading students for admin my course:', json);
          toast.error('تعذر تحميل طلاب الكورس');
          setStudents([]);
          return;
        }

        const list: StudentDto[] = Array.isArray(json)
          ? (json as any)
          : Array.isArray(json?.students)
          ? (json.students as any)
          : [];

        setStudents(list);
      } catch (err) {
        console.error('Unexpected error loading students for admin my course:', err);
        toast.error('حدث خطأ أثناء تحميل طلاب الكورس');
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isLoading, isAuthenticated, user, courseId, teacherId, router]);

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-3">
            <FaBookOpen className="text-primary" />
            <div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/admin/my-courses')}
                  className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-purple-700"
                >
                  <FaArrowRight />
                  الرجوع
                </button>
              </div>
              <h1 className="text-2xl font-bold">طلاب الكورس</h1>
              <p className="text-sm text-gray-600">{courseTitle}</p>
            </div>
          </div>

          <div className="text-sm text-gray-600">{displayName}</div>
        </div>

        {loading ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center border border-gray-100 dark:border-gray-800">
            <p className="text-gray-600 dark:text-gray-300">لا يوجد طلاب مسجلين في هذا الكورس حالياً.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                  <tr>
                    <th className="text-right px-4 py-3">الطالب</th>
                    <th className="text-right px-4 py-3">التواصل</th>
                    <th className="text-right px-4 py-3">التقدم</th>
                    <th className="text-right px-4 py-3">آخر نشاط</th>
                    <th className="text-right px-4 py-3">التسجيل</th>
                    <th className="text-right px-4 py-3">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                            <Image
                              src={s.avatar || '/placeholder-avatar.png'}
                              alt={s.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                              <FaUserCircle className="text-gray-400" />
                              <span>{s.name || 'طالب'}</span>
                            </div>
                            <div className="text-xs text-gray-500">ID: {String(s.userId).slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-200">
                            <FaPhone className="text-primary" />
                            <span>{s.parentPhone || '-'}</span>
                          </div>
                          <div className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-200">
                            <FaEnvelope className="text-emerald-600" />
                            <span>{s.email || '-'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-2">
                          <FaChartLine className="text-primary" />
                          <span>{Math.round(Number(s.progress || 0))}%</span>
                        </div>
                        <div className="w-36 h-2 bg-gray-100 dark:bg-gray-800 rounded-full mt-2">
                          <div
                            className="h-2 bg-primary rounded-full"
                            style={{ width: `${Math.min(100, Math.max(0, Number(s.progress || 0)))}%` }}
                          />
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{s.lastActive || '-'}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{s.enrolledDate || '-'}</td>

                      <td className="px-4 py-3">
                        <Link
                          href={`/profile?userId=${encodeURIComponent(String(s.userId))}`}
                          className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition inline-block"
                        >
                          عرض الملف
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
