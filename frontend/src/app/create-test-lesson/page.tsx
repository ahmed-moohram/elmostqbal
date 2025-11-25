'use client';

import { useState } from 'react';
import supabase from '@/lib/supabase-client';

export default function CreateTestLessonPage() {
  const [courseId, setCourseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const createTestLesson = async () => {
    if (!courseId) {
      alert('الرجاء إدخال معرف الكورس');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // إنشاء درس تجريبي
      const testLesson = {
        course_id: courseId,
        title: 'درس تجريبي - مقدمة',
        description: 'هذا درس تجريبي للتأكد من عمل النظام',
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration_minutes: 10,
        order_index: 1,
        is_free: true,
        content_type: 'video',
        is_published: true
      };

      console.log('📝 إنشاء درس تجريبي:', testLesson);

      const { data, error } = await supabase
        .from('lessons')
        .insert(testLesson)
        .select()
        .single();

      if (error) {
        console.error('❌ خطأ:', error);
        setResult({ success: false, error: error.message });
      } else {
        console.log('✅ تم إنشاء الدرس:', data);
        setResult({ success: true, data });
      }
    } catch (err: any) {
      console.error('❌ خطأ غير متوقع:', err);
      setResult({ success: false, error: err.message });
    }

    setLoading(false);
  };

  const createMultipleLessons = async () => {
    if (!courseId) {
      alert('الرجاء إدخال معرف الكورس');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const lessons = [
        {
          course_id: courseId,
          title: 'الدرس الأول: المقدمة',
          description: 'مقدمة عن الكورس والمحتوى',
          video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          duration_minutes: 15,
          order_index: 1,
          is_free: true,
          content_type: 'video',
          is_published: true
        },
        {
          course_id: courseId,
          title: 'الدرس الثاني: الأساسيات',
          description: 'تعلم الأساسيات',
          video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          duration_minutes: 20,
          order_index: 2,
          is_free: false,
          content_type: 'video',
          is_published: true
        },
        {
          course_id: courseId,
          title: 'الدرس الثالث: التطبيق العملي',
          description: 'تطبيق عملي على ما تعلمناه',
          video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          duration_minutes: 25,
          order_index: 3,
          is_free: false,
          content_type: 'video',
          is_published: true
        }
      ];

      console.log('📝 إنشاء دروس متعددة:', lessons);

      const { data, error } = await supabase
        .from('lessons')
        .insert(lessons)
        .select();

      if (error) {
        console.error('❌ خطأ:', error);
        setResult({ success: false, error: error.message });
      } else {
        console.log('✅ تم إنشاء الدروس:', data);
        setResult({ success: true, data });
      }
    } catch (err: any) {
      console.error('❌ خطأ غير متوقع:', err);
      setResult({ success: false, error: err.message });
    }

    setLoading(false);
  };

  const checkLessons = async () => {
    if (!courseId) {
      alert('الرجاء إدخال معرف الكورس');
      return;
    }

    setLoading(true);
    
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');

    if (error) {
      console.error('❌ خطأ في جلب الدروس:', error);
    } else {
      console.log('📚 الدروس الموجودة:', data);
      setResult({ 
        success: true, 
        message: `يوجد ${data?.length || 0} درس`,
        data 
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🎯 إنشاء دروس تجريبية</h1>

        {/* إدخال معرف الكورس */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-lg font-bold mb-2">معرف الكورس (Course ID):</label>
          <input
            type="text"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            placeholder="مثال: 2249e3c6-8af8-41cf-8b1f-2d24c807776e"
            className="w-full p-3 border rounded-lg mb-4"
            dir="ltr"
          />
          
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={createTestLesson}
              disabled={loading}
              className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'جاري...' : 'إنشاء درس واحد'}
            </button>
            
            <button
              onClick={createMultipleLessons}
              disabled={loading}
              className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'جاري...' : 'إنشاء 3 دروس'}
            </button>
            
            <button
              onClick={checkLessons}
              disabled={loading}
              className="bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'جاري...' : 'فحص الدروس'}
            </button>
          </div>
        </div>

        {/* النتيجة */}
        {result && (
          <div className={`bg-white rounded-lg shadow p-6 ${
            result.success ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
          }`}>
            <h2 className="text-xl font-bold mb-4">
              {result.success ? '✅ نجح!' : '❌ فشل!'}
            </h2>
            
            {result.error && (
              <div className="bg-red-50 p-4 rounded mb-4">
                <p className="text-red-800">{result.error}</p>
              </div>
            )}
            
            {result.message && (
              <div className="bg-blue-50 p-4 rounded mb-4">
                <p className="text-blue-800">{result.message}</p>
              </div>
            )}
            
            {result.data && (
              <div>
                <h3 className="font-bold mb-2">البيانات:</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* تعليمات */}
        <div className="mt-8 bg-yellow-50 rounded-lg p-6">
          <h3 className="font-bold mb-3">📝 تعليمات:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>احصل على معرف الكورس من صفحة <a href="/list-all-courses" className="text-blue-600 hover:underline">/list-all-courses</a></li>
            <li>الصق المعرف في الحقل أعلاه</li>
            <li>اضغط "إنشاء درس واحد" أو "إنشاء 3 دروس"</li>
            <li>تحقق من النتيجة في الأسفل</li>
            <li>افتح صفحة الكورس للتحقق من ظهور الدروس</li>
          </ol>
          
          <div className="mt-4 p-3 bg-white rounded">
            <strong>معرف كورس للاختبار السريع:</strong>
            <code className="block mt-1 p-2 bg-gray-100 rounded" dir="ltr">
              2249e3c6-8af8-41cf-8b1f-2d24c807776e
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
