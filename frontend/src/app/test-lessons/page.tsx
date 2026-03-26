'use client';

import { useState, useEffect } from 'react';
import supabase from '@/lib/supabase-client';

export default function TestLessonsPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('id, title')
      .order('created_at', { ascending: false });
    
    if (data) {
      setCourses(data);
      console.log('📚 الكورسات المتاحة:', data);
    }
  };

  const fetchLessons = async (courseId: string) => {
    setLoading(true);
    console.log('🔍 جلب دروس الكورس:', courseId);
    
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });
    
    if (error) {
      console.error('❌ خطأ:', error);
    } else {
      console.log('✅ الدروس:', data);
      setLessons(data || []);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 اختبار جلب الدروس</h1>
        
        {/* اختيار الكورس */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">اختر كورس:</h2>
          <select
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              if (e.target.value) {
                fetchLessons(e.target.value);
              }
            }}
            className="w-full p-3 border rounded-lg"
          >
            <option value="">-- اختر كورس --</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {course.title} ({course.id})
              </option>
            ))}
          </select>
        </div>

        {/* عرض الدروس */}
        {selectedCourse && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">
              الدروس ({lessons.length} درس)
            </h2>
            
            {loading ? (
              <p>جاري التحميل...</p>
            ) : lessons.length > 0 ? (
              <div className="space-y-4">
                {lessons.map((lesson, index) => (
                  <div key={lesson.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg">
                        {index + 1}. {lesson.title}
                      </h3>
                      <span className="text-sm text-gray-500">
                        ID: {lesson.id}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>الوصف:</strong> {lesson.description || 'لا يوجد'}
                      </div>
                      <div>
                        <strong>المدة:</strong> {lesson.duration_minutes || 0} دقيقة
                      </div>
                      <div>
                        <strong>رابط الفيديو:</strong> {lesson.video_url || 'لا يوجد'}
                      </div>
                      <div>
                        <strong>الترتيب:</strong> {lesson.order_index || 0}
                      </div>
                      <div>
                        <strong>مجاني:</strong> {lesson.is_free ? 'نعم' : 'لا'}
                      </div>
                      <div>
                        <strong>Course ID:</strong> {lesson.course_id}
                      </div>
                    </div>
                    
                    {/* عرض كل البيانات الخام */}
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm text-blue-600">
                        عرض البيانات الخام
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(lesson, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">لا توجد دروس لهذا الكورس</p>
            )}
            
            {/* معلومات إضافية */}
            {selectedCourse && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-bold mb-2">معلومات مفيدة:</h3>
                <ul className="text-sm space-y-1">
                  <li>• Course ID: <code className="bg-white px-2 py-1 rounded">{selectedCourse}</code></li>
                  <li>• عدد الدروس: {lessons.length}</li>
                  <li>• رابط صفحة الكورس: <a href={`/courses/${selectedCourse}`} target="_blank" className="text-blue-600 hover:underline">/courses/{selectedCourse}</a></li>
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* تعليمات */}
        <div className="mt-8 p-6 bg-yellow-50 rounded-lg">
          <h3 className="font-bold mb-2">📝 ملاحظات:</h3>
          <ul className="text-sm space-y-1">
            <li>• هذه الصفحة تختبر جلب الدروس من قاعدة البيانات مباشرة</li>
            <li>• إذا ظهرت الدروس هنا ولم تظهر في صفحة الكورس، فالمشكلة في عرض البيانات</li>
            <li>• إذا لم تظهر الدروس هنا، فالمشكلة في قاعدة البيانات</li>
            <li>• افتح Console (F12) لمشاهدة التفاصيل</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
