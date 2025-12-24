'use client';

import { useState } from 'react';

export default function TestCoursePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const createTestCourse = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // 1. جلب دالة createCourseWithLessons بشكل ديناميكي
      const { createCourseWithLessons } = await import('@/lib/supabase-courses');
      
      // 2. بيانات تجريبية بسيطة
      const courseData = {
        title: 'كورس تجريبي ' + new Date().getTime(),
        description: 'هذا كورس تجريبي',
        price: 0,
        duration_hours: 1,
        level: 'beginner',
        category: 'test'
      };

      // دروس تجريبية بسيطة
      const sections = [{
        title: 'قسم تجريبي',
        lessons: [{
          title: 'درس تجريبي',
          description: 'وصف الدرس',
          duration: 5,
          videoUrl: ''
        }]
      }];

      console.log('🚀 محاولة إنشاء الكورس...');
      const res = await createCourseWithLessons(courseData, sections);
      
      console.log('✅ النتيجة:', res);
      setResult(res);
      
      if (res.success) {
        alert('✅ تم إنشاء الكورس بنجاح!');
      } else {
        throw new Error(res.error?.message || 'فشل إنشاء الكورس');
      }
    } catch (err: any) {
      console.error('❌ خطأ:', err);
      setError(err.message || 'حدث خطأ غير معروف');
      setResult({ success: false, error: err.message || err });
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 p-8">
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-red-600 mb-4">حدث خطأ!</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">صفحة اختبار إنشاء الكورسات</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <button
            onClick={createTestCourse}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'جاري الإنشاء...' : 'إنشاء كورس تجريبي'}
          </button>

          {result && (
            <div className="mt-6 p-4 bg-gray-100 rounded">
              <h3 className="font-bold mb-2">النتيجة:</h3>
              <pre className="text-sm overflow-auto" dir="ltr">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-6 text-sm text-gray-600">
            <p className="mb-2">افتح Console (F12) لرؤية المزيد من التفاصيل.</p>
            <p>تحقق من لوحة تحكم Supabase بعد النقر على الزر أعلاه.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
