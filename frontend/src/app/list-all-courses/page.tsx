'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase-client';

export default function ListAllCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const fetchAllCourses = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('❌ خطأ:', fetchError);
          setError('فشل جلب الكورسات: ' + fetchError.message);
        } else {
          console.log(`✅ تم جلب ${data?.length || 0} كورس`);
          setCourses(data || []);
        }
      } catch (err: any) {
        console.error('❌ خطأ:', err);
        setError('حدث خطأ: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllCourses();
  }, []);

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    alert('✅ تم نسخ ID: ' + id);
  };

  const openCourse = (id: string) => {
    // فتح في نافذة جديدة للاحتفاظ بهذه الصفحة مفتوحة
    window.open(`/courses/${id}`, '_blank');
  };

  const debugCourse = (id: string) => {
    window.open(`/debug-course/${id}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">جاري التحميل...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-red-600 mb-4">خطأ!</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">📚 جميع الكورسات في قاعدة البيانات</h1>
        <p className="text-gray-600 mb-8">عدد الكورسات: {courses.length}</p>

        {courses.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800">لا توجد كورسات في قاعدة البيانات.</p>
            <a href="/admin/courses/new" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              إضافة كورس جديد
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العنوان</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المدرس</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السعر</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">منشور</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ الإنشاء</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses.map((course, index) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{index + 1}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs" dir="ltr">
                        {course.id}
                      </code>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium">{course.title}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {course.instructor_name || 'غير محدد'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {course.price || 0} ج.م
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {course.is_published ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          منشور
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          مسودة
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(course.created_at).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyId(course.id)}
                          className="text-gray-600 hover:text-gray-900"
                          title="نسخ ID"
                        >
                          📋
                        </button>
                        <button
                          onClick={() => openCourse(course.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="فتح الكورس"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => debugCourse(course.id)}
                          className="text-purple-600 hover:text-purple-900"
                          title="تشخيص"
                        >
                          🔍
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-bold text-blue-900 mb-2">📋 نسخ ID</h3>
            <p className="text-sm text-blue-700">اضغط على 📋 لنسخ ID الكورس</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-bold text-green-900 mb-2">👁️ عرض الكورس</h3>
            <p className="text-sm text-green-700">اضغط على 👁️ لفتح صفحة الكورس</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-bold text-purple-900 mb-2">🔍 تشخيص</h3>
            <p className="text-sm text-purple-700">اضغط على 🔍 لتشخيص أي مشاكل</p>
          </div>
        </div>
      </div>
    </div>
  );
}
