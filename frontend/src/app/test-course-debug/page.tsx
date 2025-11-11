'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TestCourseDebugPage() {
  const [loading, setLoading] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [courseData, setCourseData] = useState<any>(null);
  const [createdCourse, setCreatedCourse] = useState<any>(null);
  const router = useRouter();

  // إنشاء كورس مع فيديوهات
  const createCourseWithVideos = async () => {
    setLoading(true);
    try {
      const { createCourseWithLessons } = await import('@/lib/supabase-courses');
      
      const courseData = {
        title: 'كورس تجريبي مع فيديوهات ' + new Date().getTime(),
        description: 'كورس تجريبي لاختبار الفيديوهات',
        instructor_name: 'مدرس تجريبي',
        price: 200,
        duration_hours: 3,
        level: 'beginner',
        category: 'test',
        thumbnail: '/placeholder-course.png',
        is_published: true // مهم: نشر الكورس مباشرة
      };

      const sections = [{
        title: 'القسم الأول',
        lessons: [
          {
            title: 'الدرس الأول - مقدمة',
            description: 'مقدمة عن الكورس',
            duration: 10,
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
          },
          {
            title: 'الدرس الثاني - الأساسيات',
            description: 'شرح الأساسيات',
            duration: 15,
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
          },
          {
            title: 'الدرس الثالث - التطبيق العملي',
            description: 'تطبيق عملي على ما تعلمناه',
            duration: 20,
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
          }
        ]
      }];

      console.log('🚀 إنشاء الكورس...');
      const result = await createCourseWithLessons(courseData, sections);
      
      if (result.success && result.data) {
        console.log('✅ تم إنشاء الكورس:', result.data);
        setCreatedCourse(result.data);
        setCourseId(result.data.id);
        alert(`✅ تم إنشاء الكورس بنجاح!\nID: ${result.data.id}`);
      } else {
        console.error('❌ فشل إنشاء الكورس:', result.error);
        alert('❌ فشل إنشاء الكورس: ' + JSON.stringify(result.error));
      }
    } catch (error: any) {
      console.error('❌ خطأ:', error);
      alert('❌ خطأ: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // التحقق من وجود الكورس
  const checkCourse = async () => {
    if (!courseId) {
      alert('⚠️ أدخل ID الكورس أولاً');
      return;
    }

    setLoading(true);
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = 'https://wnqifmvgvlmxgswhcwnc.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWlmbXZndmxteGdzd2hjd25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MzYwNTUsImV4cCI6MjA3ODAxMjA1NX0.LqWhTZYmr7nu-dIy2uBBqntOxoWM-waluYIR9bipC9M';
      const supabase = createClient(supabaseUrl, supabaseKey);

      console.log('🔍 البحث عن الكورس:', courseId);
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) {
        console.error('❌ خطأ في البحث:', error);
        alert('❌ الكورس غير موجود في قاعدة البيانات!');
        setCourseData(null);
      } else {
        console.log('✅ تم العثور على الكورس:', data);
        setCourseData(data);
        alert('✅ الكورس موجود في قاعدة البيانات!');
      }

      // جلب الدروس أيضاً
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (lessons) {
        console.log('📚 الدروس المرتبطة:', lessons);
      }
    } catch (error: any) {
      console.error('❌ خطأ:', error);
      alert('❌ خطأ: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // الذهاب إلى صفحة الكورس
  const goToCourse = () => {
    if (!courseId) {
      alert('⚠️ أدخل ID الكورس أولاً');
      return;
    }
    router.push(`/courses/${courseId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 اختبار وتشخيص مشكلة الكورسات</h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* إنشاء كورس جديد */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-bold mb-4">1️⃣ إنشاء كورس جديد مع فيديوهات</h2>
            <button
              onClick={createCourseWithVideos}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'جاري الإنشاء...' : '🆕 إنشاء كورس جديد مع 3 فيديوهات'}
            </button>
            
            {createdCourse && (
              <div className="mt-4 p-4 bg-green-50 rounded">
                <h3 className="font-bold text-green-800">✅ تم إنشاء الكورس:</h3>
                <p className="text-sm">ID: {createdCourse.id}</p>
                <p className="text-sm">العنوان: {createdCourse.title}</p>
              </div>
            )}
          </div>

          {/* التحقق من وجود الكورس */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-bold mb-4">2️⃣ التحقق من وجود الكورس</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                placeholder="أدخل ID الكورس"
                className="flex-1 p-3 border rounded-lg"
              />
              <button
                onClick={checkCourse}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'جاري البحث...' : '🔍 بحث'}
              </button>
            </div>

            {courseData && (
              <div className="mt-4 p-4 bg-blue-50 rounded">
                <h3 className="font-bold text-blue-800">✅ معلومات الكورس:</h3>
                <pre className="text-xs overflow-auto" dir="ltr">
                  {JSON.stringify(courseData, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* الذهاب إلى صفحة الكورس */}
          <div>
            <h2 className="text-xl font-bold mb-4">3️⃣ عرض الكورس</h2>
            <button
              onClick={goToCourse}
              disabled={!courseId}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              📖 الذهاب إلى صفحة الكورس
            </button>
          </div>

          {/* تعليمات */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-bold text-yellow-800 mb-2">📝 تعليمات الاستخدام:</h3>
            <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
              <li>اضغط على "إنشاء كورس جديد" لإنشاء كورس تجريبي</li>
              <li>انسخ ID الكورس الذي سيظهر</li>
              <li>استخدم زر "بحث" للتأكد من وجود الكورس</li>
              <li>اضغط "الذهاب إلى صفحة الكورس" لمشاهدة الكورس</li>
              <li>افتح Console (F12) لمشاهدة التفاصيل</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
