"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { toast } from 'react-hot-toast';
import { FaUsers, FaEnvelope, FaPhone, FaChartLine, FaTrophy, FaGraduationCap, FaSpinner } from 'react-icons/fa';
import supabase from '@/lib/supabase-client';

interface Student {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  parent_phone?: string;
  enrolled_at: string;
  progress: number;
  achievements_count: number;
  exams_count: number;
  average_score?: number;
}

interface Course {
  id: string;
  title: string;
}

export default function CourseStudentsPage() {
  const router = useRouter();
  const courseId = (useParams() as any)?.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchCourse();
      fetchStudents();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .eq('id', courseId)
        .single();

      if (error) throw error;
      setCourse(data);
    } catch (error: any) {
      console.error('Error fetching course:', error);
      toast.error('حدث خطأ في جلب بيانات الكورس');
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const response = await fetch(`/api/admin/courses/${courseId}/students`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || 'حدث خطأ في جلب بيانات الطلاب');
      }

      setStudents(Array.isArray(data?.students) ? data.students : []);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      const message = error?.message || 'حدث خطأ في جلب بيانات الطلاب';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const sendToParent = async (student: Student) => {
    if (!student.parent_phone) {
      toast.error('لا يوجد رقم هاتف لولي الأمر');
      return;
    }

    if (!window.confirm(`هل تريد إرسال تقرير الطالب ${student.name} إلى ولي الأمر على الرقم ${student.parent_phone}?`)) {
      return;
    }

    try {
      setSendingTo(student.id);
      const response = await fetch(`/api/admin/send-parent-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          studentId: student.id,
          courseId: courseId,
          parentPhone: student.parent_phone,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'فشل إرسال التقرير');
      }

      // فتح WhatsApp مع الرسالة
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank');
        toast.success(`✅ تم فتح WhatsApp لإرسال التقرير إلى ولي الأمر`);
      } else {
        toast.success(`✅ تم إنشاء التقرير بنجاح`);
      }
    } catch (error: any) {
      console.error('Error sending report:', error);
      toast.error(error.message || 'حدث خطأ أثناء إرسال التقرير');
    } finally {
      setSendingTo(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <FaSpinner className="animate-spin text-4xl text-primary" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="mb-4 text-primary hover:text-primary-dark"
          >
            ← العودة
          </button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FaUsers className="text-primary" />
            طلاب الكورس: {course?.title || 'جاري التحميل...'}
          </h1>
          <p className="text-gray-600 mt-2">
            إجمالي الطلاب: {students.length}
          </p>
        </div>

        {errorMessage ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h3 className="text-xl font-bold mb-2">تعذر تحميل الطلاب</h3>
            <p className="text-gray-600">{errorMessage}</p>
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FaUsers className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">لا يوجد طلاب مسجلين</h3>
            <p className="text-gray-600">لم يسجل أي طالب في هذا الكورس بعد</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">اسم الطالب</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">رقم الهاتف</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">التقدم</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">الإنجازات</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">الامتحانات</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">المتوسط</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">إرسال لولي الأمر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{student.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {student.phone || 'غير متوفر'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{student.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <FaTrophy className="text-yellow-500" />
                        <span className="text-sm">{student.achievements_count}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <FaGraduationCap className="text-blue-500" />
                        <span className="text-sm">{student.exams_count}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {student.average_score !== undefined ? (
                        <span className={`text-sm font-medium ${
                          student.average_score >= 80 ? 'text-green-600' :
                          student.average_score >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {student.average_score}%
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => sendToParent(student)}
                        disabled={!student.parent_phone || sendingTo === student.id}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          student.parent_phone
                            ? 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        title={student.parent_phone ? 'إرسال تقرير لولي الأمر' : 'لا يوجد رقم هاتف لولي الأمر'}
                      >
                        {sendingTo === student.id ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <>
                            <FaEnvelope className="inline ml-1" />
                            إرسال
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

