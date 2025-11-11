'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function DebugCoursePage() {
  const params = useParams();
  const courseId = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<any>(null);
  const [lessonsData, setLessonsData] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const debugCourse = async () => {
      setLoading(true);
      const debug: any = {
        courseId,
        timestamp: new Date().toISOString(),
        checks: []
      };

      try {
        // 1. التحقق من ID
        debug.checks.push({
          step: 'ID Check',
          value: courseId,
          valid: courseId && courseId.length > 0
        });

        if (!courseId) {
          setError('❌ لا يوجد ID للكورس');
          setDebugInfo(debug);
          setLoading(false);
          return;
        }

        // 2. الاتصال بـ Supabase
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = 'https://wnqifmvgvlmxgswhcwnc.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWlmbXZndmxteGdzd2hjd25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MzYwNTUsImV4cCI6MjA3ODAxMjA1NX0.LqWhTZYmr7nu-dIy2uBBqntOxoWM-waluYIR9bipC9M';
        const supabase = createClient(supabaseUrl, supabaseKey);

        debug.checks.push({
          step: 'Supabase Connection',
          status: 'Connected'
        });

        // 3. جلب الكورس
        console.log('🔍 البحث عن الكورس:', courseId);
        const { data: course, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        debug.checks.push({
          step: 'Course Fetch',
          query: `SELECT * FROM courses WHERE id = '${courseId}'`,
          found: !!course,
          error: courseError?.message || null
        });

        if (courseError) {
          console.error('❌ خطأ في جلب الكورس:', courseError);
          
          // محاولة جلب كل الكورسات للتأكد من الاتصال
          const { data: allCourses, error: allError } = await supabase
            .from('courses')
            .select('id, title, is_published')
            .limit(5);

          debug.checks.push({
            step: 'All Courses Check',
            count: allCourses?.length || 0,
            sample: allCourses?.map(c => ({
              id: c.id,
              title: c.title,
              published: c.is_published
            })),
            error: allError?.message || null
          });

          setError(`❌ الكورس غير موجود: ${courseError.message}`);
          setDebugInfo(debug);
          setLoading(false);
          return;
        }

        console.log('✅ تم العثور على الكورس:', course);
        setCourseData(course);

        debug.courseDetails = {
          id: course.id,
          title: course.title,
          is_published: course.is_published,
          is_featured: course.is_featured,
          created_at: course.created_at
        };

        // 4. جلب الدروس
        const { data: lessons, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });

        debug.checks.push({
          step: 'Lessons Fetch',
          query: `SELECT * FROM lessons WHERE course_id = '${courseId}'`,
          count: lessons?.length || 0,
          error: lessonsError?.message || null
        });

        if (lessons) {
          console.log('📚 الدروس:', lessons);
          setLessonsData(lessons);
        }

        setDebugInfo(debug);
      } catch (err: any) {
        console.error('❌ خطأ عام:', err);
        debug.generalError = {
          message: err.message,
          stack: err.stack
        };
        setError(`❌ خطأ: ${err.message}`);
        setDebugInfo(debug);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      debugCourse();
    }
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 تشخيص الكورس</h1>

        {/* معلومات أساسية */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📋 معلومات أساسية</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Course ID:</span>{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">{courseId || 'غير محدد'}</code>
            </div>
            <div>
              <span className="font-medium">الوقت:</span> {new Date().toLocaleString('ar-EG')}
            </div>
          </div>
        </div>

        {/* النتيجة */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">❌ خطأ</h2>
            <p className="text-red-700">{error}</p>
          </div>
        ) : courseData ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-green-800 mb-4">✅ الكورس موجود!</h2>
            <div className="space-y-2">
              <p><strong>العنوان:</strong> {courseData.title}</p>
              <p><strong>الوصف:</strong> {courseData.description}</p>
              <p><strong>السعر:</strong> {courseData.price || 0} ج.م</p>
              <p><strong>منشور:</strong> {courseData.is_published ? '✅ نعم' : '❌ لا'}</p>
              <p><strong>مميز:</strong> {courseData.is_featured ? '✅ نعم' : '❌ لا'}</p>
              <p><strong>المدرس:</strong> {courseData.instructor_name || 'غير محدد'}</p>
              <p><strong>عدد الدروس:</strong> {lessonsData.length}</p>
            </div>

            {lessonsData.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-bold mb-2">📚 الدروس:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {lessonsData.map((lesson, index) => (
                    <li key={lesson.id}>
                      {index + 1}. {lesson.title} ({lesson.duration_minutes || 0} دقيقة)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}

        {/* معلومات التشخيص */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">🔧 معلومات التشخيص</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs" dir="ltr">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {/* الإجراءات */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-bold text-blue-800 mb-4">💡 الإجراءات الممكنة</h2>
          <div className="space-y-3">
            <a 
              href={`/courses/${courseId}`}
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              📖 جرب فتح الكورس العادي
            </a>
            <br />
            <a 
              href="/test-courses"
              className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              📋 عرض كل الكورسات
            </a>
            <br />
            <button
              onClick={() => navigator.clipboard.writeText(courseId)}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              📋 نسخ ID الكورس
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
