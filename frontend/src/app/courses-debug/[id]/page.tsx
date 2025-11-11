'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wnqifmvgvlmxgswhcwnc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWlmbXZndmxteGdzd2hjd25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MzYwNTUsImV4cCI6MjA3ODAxMjA1NX0.LqWhTZYmr7nu-dIy2uBBqntOxoWM-waluYIR9bipC9M'
);

export default function CourseDebugPage() {
  const params = useParams();
  const courseId = params?.id as string;
  
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [formattedSections, setFormattedSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    console.log('🔍 بدء تشخيص الكورس:', courseId);
    
    // 1. جلب بيانات الكورس
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();
    
    console.log('📚 بيانات الكورس:', courseData);
    if (courseError) console.error('❌ خطأ الكورس:', courseError);
    setCourse(courseData);
    
    // 2. جلب الدروس
    const { data: lessonsData, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });
    
    console.log('📚 الدروس الخام:', lessonsData);
    console.log('📝 عدد الدروس:', lessonsData?.length || 0);
    if (lessonsError) console.error('❌ خطأ الدروس:', lessonsError);
    setLessons(lessonsData || []);
    
    // 3. محاكاة تحويل البيانات (مثل صفحة الكورس)
    if (lessonsData && lessonsData.length > 0) {
      const sections = [
        {
          id: 'main-section',
          title: 'الدروس',
          lessons: lessonsData.map((lesson: any) => ({
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            duration: lesson.duration_minutes || 0,
            videoUrl: lesson.video_url,
            isFree: lesson.is_free,
            isPreview: lesson.is_free
          }))
        }
      ];
      console.log('📂 الأقسام المحولة:', sections);
      console.log('📊 عدد الأقسام:', sections.length);
      console.log('📝 دروس القسم الأول:', sections[0].lessons);
      setFormattedSections(sections);
    } else {
      console.log('⚠️ لا توجد دروس لتحويلها إلى أقسام');
      setFormattedSections([]);
    }
    
    setLoading(false);
  };

  if (loading) {
    return <div className="p-8">جاري التحميل...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 تشخيص صفحة الكورس</h1>
        
        {/* معلومات الكورس */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📚 معلومات الكورس</h2>
          {course ? (
            <div className="space-y-2">
              <p><strong>العنوان:</strong> {course.title}</p>
              <p><strong>الوصف:</strong> {course.description}</p>
              <p><strong>منشور:</strong> {course.is_published ? '✅ نعم' : '❌ لا'}</p>
              <p><strong>ID:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{course.id}</code></p>
            </div>
          ) : (
            <p className="text-red-600">❌ الكورس غير موجود!</p>
          )}
        </div>

        {/* الدروس الخام */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📝 الدروس الخام من قاعدة البيانات</h2>
          <p className="mb-4">عدد الدروس: <strong>{lessons.length}</strong></p>
          {lessons.length > 0 ? (
            <div className="space-y-3">
              {lessons.map((lesson, index) => (
                <div key={lesson.id} className="border rounded p-3">
                  <p><strong>{index + 1}. {lesson.title}</strong></p>
                  <p className="text-sm text-gray-600">Order: {lesson.order_index} | Free: {lesson.is_free ? 'Yes' : 'No'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-red-600">❌ لا توجد دروس!</p>
          )}
        </div>

        {/* الأقسام المحولة */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📂 الأقسام المحولة (كما في صفحة الكورس)</h2>
          <p className="mb-4">عدد الأقسام: <strong>{formattedSections.length}</strong></p>
          {formattedSections.length > 0 ? (
            <div className="space-y-4">
              {formattedSections.map((section, sIndex) => (
                <div key={section.id} className="border rounded p-4">
                  <h3 className="font-bold mb-2">{section.title} ({section.lessons?.length || 0} دروس)</h3>
                  {section.lessons?.map((lesson: any, lIndex: number) => (
                    <div key={lesson.id} className="ml-4 p-2 bg-gray-50 rounded mb-2">
                      <p>{lIndex + 1}. {lesson.title}</p>
                      <p className="text-sm text-gray-600">Duration: {lesson.duration} min | Free: {lesson.isFree ? 'Yes' : 'No'}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-yellow-600">⚠️ لا توجد أقسام محولة!</p>
          )}
        </div>

        {/* محاكاة عرض الدروس */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">🎬 محاكاة عرض الدروس (UI)</h2>
          {formattedSections && formattedSections.length > 0 ? (
            <div className="space-y-4">
              {formattedSections.map((section, sIndex) => (
                <div key={sIndex} className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-blue-500 transition">
                  <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-b border-gray-200">
                    <h4 className="font-bold text-lg flex items-center gap-2">
                      <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                        {sIndex + 1}
                      </span>
                      {section.title}
                      <span className="text-sm text-gray-500 mr-auto">({section.lessons?.length || 0} دروس)</span>
                    </h4>
                  </div>
                  <div className="p-2">
                    {section.lessons?.map((lesson: any, lIndex: number) => (
                      <div
                        key={lesson.id}
                        className="p-4 rounded-lg hover:bg-gray-50 mb-2 border cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                              {lesson.isFree ? '▶️' : '🔒'}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-semibold">
                                {lIndex + 1}. {lesson.title}
                              </h5>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm text-gray-600">
                                  ⏱ {lesson.duration} دقيقة
                                </span>
                                {lesson.isFree && (
                                  <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    معاينة مجانية
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">لا توجد أقسام متاحة</p>
          )}
        </div>

        {/* التحليل */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">📊 التحليل</h2>
          <div className="space-y-2">
            <p>✅ الكورس موجود: {course ? 'نعم' : 'لا'}</p>
            <p>✅ الدروس موجودة في DB: {lessons.length > 0 ? `نعم (${lessons.length})` : 'لا'}</p>
            <p>✅ الأقسام محولة بنجاح: {formattedSections.length > 0 ? 'نعم' : 'لا'}</p>
            <p>✅ UI يجب أن يعرض الدروس: {formattedSections.length > 0 && formattedSections[0].lessons?.length > 0 ? 'نعم' : 'لا'}</p>
          </div>
          
          {formattedSections.length > 0 && formattedSections[0].lessons?.length > 0 && (
            <div className="mt-4 p-4 bg-green-100 rounded">
              <p className="font-bold text-green-800">
                ✅ يجب أن تظهر الدروس في صفحة الكورس الأساسية!
              </p>
              <p className="text-sm text-green-700 mt-2">
                إذا لم تظهر، تحقق من Console للأخطاء
              </p>
            </div>
          )}
        </div>

        {/* روابط مفيدة */}
        <div className="mt-6 flex gap-3">
          <a 
            href={`/courses/${courseId}`}
            target="_blank"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            🔗 فتح صفحة الكورس الأصلية
          </a>
          <button 
            onClick={fetchData}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
          >
            🔄 إعادة التحميل
          </button>
        </div>
      </div>
    </div>
  );
}
