'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import supabase from '@/lib/supabase-client';

export default function TestCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('courses')
          .select('*, instructor_user:users!courses_instructor_id_fkey(id, name, avatar_url, profile_picture)')
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('❌ خطأ في جلب الكورسات:', fetchError);
          setError('فشل جلب الكورسات: ' + fetchError.message);
        } else {
          console.log('✅ الكورسات الموجودة:', data);
          const enriched = (data || []).map((course: any) => ({
            ...course,
            instructor_name: course?.instructor_user?.name || course?.instructor_name || null,
          }));
          setCourses(enriched);
        }
      } catch (err: any) {
        console.error('❌ خطأ:', err);
        setError('حدث خطأ: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

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
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">الكورسات المتاحة في قاعدة البيانات</h1>
        
        <div className="mb-6 text-lg">
          عدد الكورسات: <span className="font-bold text-blue-600">{courses.length}</span>
        </div>

        {courses.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800">لا توجد كورسات في قاعدة البيانات حالياً.</p>
            <Link href="/admin/courses/new" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              إضافة كورس جديد
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow p-6">
                <div className="mb-4">
                  {course.thumbnail && course.thumbnail !== '/placeholder-course.png' ? (
                    <img 
                      src={course.thumbnail} 
                      alt={course.title}
                      className="w-full h-40 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-course.svg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-gray-500">بدون صورة</span>
                    </div>
                  )}
                </div>
                
                <h3 className="font-bold text-lg mb-2">{course.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{course.description?.substring(0, 100)}...</p>
                
                <div className="space-y-1 text-sm">
                  <div>السعر: <span className="font-bold">{course.price || 0} ج.م</span></div>
                  <div>المدرس: {course.instructor_name || 'غير محدد'}</div>
                  <div>المستوى: {course.level || 'غير محدد'}</div>
                  <div>منشور: {course.is_published ? '✅ نعم' : '❌ لا'}</div>
                </div>
                
                <div className="mt-4 space-x-2 space-x-reverse">
                  <Link 
                    href={`/courses/${course.id}`}
                    className="inline-block bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    عرض الكورس
                  </Link>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(course.id);
                      alert('تم نسخ ID الكورس: ' + course.id);
                    }}
                    className="inline-block bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                  >
                    نسخ ID
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-bold mb-2">معلومات مفيدة:</h3>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>هذه الصفحة تعرض جميع الكورسات المخزنة في Supabase</li>
            <li>يمكنك النقر على "عرض الكورس" لرؤية تفاصيل كل كورس</li>
            <li>إذا ظهرت رسالة "الكورس غير موجود"، تحقق من ID الكورس</li>
            <li>الصور يجب أن تكون روابط كاملة (URLs) أو مرفوعة في Supabase Storage</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
