'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase-client';

export default function GetValidCourseIdPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('id, title, is_published, created_at')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('❌ خطأ:', error);
        } else {
          console.log(`✅ تم جلب ${data?.length || 0} كورس`);
          setCourses(data || []);
        }
      } catch (err: any) {
        console.error('❌ خطأ:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const openCourse = (id: string) => {
    router.push(`/courses/${id}`);
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    alert('✅ تم نسخ ID الصحيح!');
  };

  const copyLink = (id: string) => {
    const link = `${window.location.origin}/courses/${id}`;
    navigator.clipboard.writeText(link);
    alert('✅ تم نسخ الرابط الكامل!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl">جاري جلب الكورسات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold mb-2">🎯 احصل على ID صحيح للكورس</h1>
          <p className="text-gray-600 mb-8">اختر أي كورس من القائمة أدناه</p>

          {/* رسالة توضيحية */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-yellow-800 mb-2">⚠️ المشكلة:</h3>
            <p className="text-yellow-700 mb-2">
              كنت تستخدم <code className="bg-yellow-100 px-2 py-1 rounded">شسيشس</code> كـ ID وهذا غير صحيح!
            </p>
            <p className="text-yellow-700">
              الـ ID يجب أن يكون UUID مثل: <code className="bg-yellow-100 px-2 py-1 rounded text-xs">123e4567-e89b-12d3-a456-426614174000</code>
            </p>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600 mb-4">😔 لا توجد كورسات في قاعدة البيانات</p>
              <button
                onClick={() => router.push('/simple-create-course')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
              >
                ✨ إنشاء كورس جديد
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">📚 الكورسات المتاحة:</h2>
              
              {courses.map((course, index) => (
                <div 
                  key={course.id} 
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">
                        {index + 1}. {course.title}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">ID الصحيح:</span>{' '}
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs" dir="ltr">
                            {course.id}
                          </code>
                        </p>
                        <p>
                          <span className="font-medium">الحالة:</span>{' '}
                          {course.is_published ? 
                            <span className="text-green-600">✅ منشور</span> : 
                            <span className="text-gray-500">📝 مسودة</span>
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => openCourse(course.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        title="فتح الكورس"
                      >
                        👁️ عرض
                      </button>
                      <button
                        onClick={() => copyId(course.id)}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                        title="نسخ ID"
                      >
                        📋 ID
                      </button>
                      <button
                        onClick={() => copyLink(course.id)}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                        title="نسخ الرابط"
                      >
                        🔗 رابط
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* تعليمات */}
          <div className="mt-8 bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <h3 className="font-bold text-green-800 mb-2">✅ الحل:</h3>
            <ol className="list-decimal list-inside text-green-700 space-y-1">
              <li>اختر أي كورس من القائمة أعلاه</li>
              <li>اضغط على "📋 ID" لنسخ الـ ID الصحيح</li>
              <li>أو اضغط على "🔗 رابط" لنسخ الرابط الكامل</li>
              <li>أو اضغط على "👁️ عرض" لفتح الكورس مباشرة</li>
            </ol>
          </div>

          {/* روابط مفيدة */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => router.push('/simple-create-course')}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"
            >
              ✨ إنشاء كورس جديد
            </button>
            <button
              onClick={() => router.push('/list-all-courses')}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
            >
              📚 عرض كل الكورسات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
