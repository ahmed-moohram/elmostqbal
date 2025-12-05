'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase-client';

export default function SimpleCreateCoursePage() {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdCourse, setCreatedCourse] = useState<any>(null);
  const router = useRouter();

  const createCourse = async () => {
    if (!title.trim()) {
      alert('⚠️ أدخل عنوان الكورس');
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 إنشاء كورس جديد:', title);

      // إنشاء الكورس مباشرة
      const { data: course, error } = await supabase
        .from('courses')
        .insert({
          title: title,
          description: 'كورس تجريبي',
          instructor_name: 'مدرس تجريبي',
          price: 0,
          duration_hours: 1,
          level: 'beginner',
          category: 'test',
          thumbnail: '/placeholder-course.png',
          is_published: true, // منشور مباشرة
          is_featured: false
        })
        .select()
        .single();

      if (error) {
        console.error('❌ خطأ:', error);
        alert('❌ فشل إنشاء الكورس: ' + error.message);
        return;
      }

      console.log('✅ تم إنشاء الكورس:', course);
      setCreatedCourse(course);

      // إضافة درس تجريبي
      if (course && course.id) {
        const { data: lesson, error: lessonError } = await supabase
          .from('lessons')
          .insert({
            course_id: course.id,
            title: 'الدرس الأول',
            description: 'درس تجريبي',
            video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            duration_minutes: 10,
            order_index: 1,
            is_free: true,
            is_published: true
          })
          .select()
          .single();

        if (lessonError) {
          console.error('⚠️ خطأ في إضافة الدرس:', lessonError);
        } else {
          console.log('✅ تم إضافة الدرس:', lesson);
        }
      }

    } catch (err: any) {
      console.error('❌ خطأ:', err);
      alert('❌ خطأ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const goToCourse = () => {
    if (createdCourse && createdCourse.id) {
      router.push(`/courses/${createdCourse.id}`);
    }
  };

  const copyId = () => {
    if (createdCourse && createdCourse.id) {
      navigator.clipboard.writeText(createdCourse.id);
      alert('✅ تم نسخ ID: ' + createdCourse.id);
    }
  };

  const debugCourse = () => {
    if (createdCourse && createdCourse.id) {
      window.open(`/debug-course/${createdCourse.id}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-8">🎯 إنشاء كورس بسيط</h1>

          {!createdCourse ? (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">عنوان الكورس</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: تعلم البرمجة"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              <button
                onClick={createCourse}
                disabled={loading || !title.trim()}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium text-lg"
              >
                {loading ? '⏳ جاري الإنشاء...' : '✨ إنشاء الكورس'}
              </button>
            </>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-green-800 mb-4">✅ تم إنشاء الكورس بنجاح!</h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-start">
                    <span className="font-medium text-gray-600 w-20">العنوان:</span>
                    <span className="flex-1">{createdCourse.title}</span>
                  </div>
                  
                  <div className="flex items-start">
                    <span className="font-medium text-gray-600 w-20">ID:</span>
                    <code className="flex-1 bg-gray-100 px-2 py-1 rounded text-xs" dir="ltr">
                      {createdCourse.id}
                    </code>
                  </div>
                  
                  <div className="flex items-start">
                    <span className="font-medium text-gray-600 w-20">منشور:</span>
                    <span className="flex-1">{createdCourse.is_published ? '✅ نعم' : '❌ لا'}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <button
                  onClick={goToCourse}
                  className="bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                  📖 فتح صفحة الكورس
                </button>
                
                <button
                  onClick={debugCourse}
                  className="bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-medium"
                >
                  🔍 تشخيص الكورس
                </button>
                
                <button
                  onClick={copyId}
                  className="bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 font-medium"
                >
                  📋 نسخ ID الكورس
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-medium"
                >
                  🔄 إنشاء كورس جديد
                </button>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-bold text-yellow-800 mb-2">💡 ملاحظات:</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• إذا ظهرت رسالة "الكورس غير موجود"، جرب تشخيص الكورس</li>
                  <li>• احفظ ID الكورس لاستخدامه لاحقاً</li>
                  <li>• افتح Console (F12) لمشاهدة التفاصيل</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
