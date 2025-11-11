'use client';

import { useState } from 'react';

export default function CourseHelperPage() {
  const [activeTab, setActiveTab] = useState('info');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">🛠️ مساعد حل مشكلة الكورسات</h1>
        <p className="text-gray-600 mb-8">أدوات شاملة لتشخيص وحل مشكلة "الكورس غير موجود"</p>

        {/* التبويبات */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 rounded-lg ${activeTab === 'info' ? 'bg-blue-600 text-white' : 'bg-white'}`}
          >
            📋 معلومات
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`px-4 py-2 rounded-lg ${activeTab === 'tools' ? 'bg-blue-600 text-white' : 'bg-white'}`}
          >
            🔧 الأدوات
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2 rounded-lg ${activeTab === 'sql' ? 'bg-blue-600 text-white' : 'bg-white'}`}
          >
            💾 SQL
          </button>
          <button
            onClick={() => setActiveTab('solution')}
            className={`px-4 py-2 rounded-lg ${activeTab === 'solution' ? 'bg-blue-600 text-white' : 'bg-white'}`}
          >
            ✅ الحل
          </button>
        </div>

        {/* المحتوى */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">📌 تشخيص المشكلة</h2>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-bold text-red-800 mb-2">المشكلة:</h3>
                  <p className="text-red-700">عند إنشاء كورس جديد ومحاولة فتحه، تظهر رسالة "الكورس غير موجود"</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">الأسباب المحتملة:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500">⚠️</span>
                    <div>
                      <strong>الكورس غير منشور:</strong> الكورس محفوظ كمسودة (is_published = false)
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500">⚠️</span>
                    <div>
                      <strong>مشكلة في ID:</strong> الـ ID المستخدم في الرابط غير صحيح
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500">⚠️</span>
                    <div>
                      <strong>مشكلة في قاعدة البيانات:</strong> الكورس لم يُحفظ بشكل صحيح
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500">⚠️</span>
                    <div>
                      <strong>مشكلة في الكود:</strong> صفحة العرض لا تجلب البيانات بشكل صحيح
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">المعلومات التقنية:</h3>
                <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm">
                  <div>📦 Supabase URL: https://wnqifmvgvlmxgswhcwnc.supabase.co</div>
                  <div>📁 جدول الكورسات: courses</div>
                  <div>📁 جدول الدروس: lessons</div>
                  <div>🔑 Primary Key: id (UUID)</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">🔧 الأدوات المتاحة</h2>
              
              <div className="grid gap-4">
                <a 
                  href="/simple-create-course" 
                  target="_blank"
                  className="block p-4 border-2 border-green-200 rounded-lg hover:bg-green-50"
                >
                  <h3 className="font-bold text-green-800 mb-2">✨ إنشاء كورس بسيط</h3>
                  <p className="text-sm text-gray-600">إنشاء كورس تجريبي بسيط مع عرض الـ ID مباشرة</p>
                </a>

                <a 
                  href="/list-all-courses" 
                  target="_blank"
                  className="block p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50"
                >
                  <h3 className="font-bold text-blue-800 mb-2">📚 عرض كل الكورسات</h3>
                  <p className="text-sm text-gray-600">عرض جدول بكل الكورسات مع الـ IDs وحالة النشر</p>
                </a>

                <a 
                  href="/test-course-debug" 
                  target="_blank"
                  className="block p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50"
                >
                  <h3 className="font-bold text-purple-800 mb-2">🔍 تشخيص متقدم</h3>
                  <p className="text-sm text-gray-600">إنشاء كورس واختباره وتشخيص المشاكل</p>
                </a>

                <div className="p-4 border-2 border-gray-200 rounded-lg">
                  <h3 className="font-bold text-gray-800 mb-2">🔗 تشخيص كورس محدد</h3>
                  <p className="text-sm text-gray-600 mb-3">استخدم هذا الرابط مع ID الكورس:</p>
                  <code className="block bg-gray-100 p-2 rounded text-xs">/debug-course/[COURSE_ID]</code>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">💾 سكريبتات SQL للإصلاح</h2>
              
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-bold mb-2">1️⃣ عرض كل الكورسات</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto" dir="ltr">
{`SELECT 
  id,
  title,
  is_published,
  created_at
FROM courses
ORDER BY created_at DESC
LIMIT 10;`}
                  </pre>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-bold mb-2">2️⃣ نشر كل الكورسات</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto" dir="ltr">
{`UPDATE courses 
SET is_published = true 
WHERE is_published = false;`}
                  </pre>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-bold mb-2">3️⃣ البحث عن كورس بالـ ID</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto" dir="ltr">
{`SELECT * FROM courses 
WHERE id = 'YOUR_COURSE_ID_HERE';`}
                  </pre>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-bold mb-2">4️⃣ إضافة كورس تجريبي</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto" dir="ltr">
{`INSERT INTO courses (
  title, description, instructor_name, 
  price, level, category, is_published
)
VALUES (
  'كورس تجريبي', 'وصف تجريبي', 'مدرس تجريبي',
  0, 'beginner', 'test', true
)
RETURNING id, title;`}
                  </pre>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>ملاحظة:</strong> شغل هذه السكريبتات في Supabase Dashboard → SQL Editor
                </p>
              </div>
            </div>
          )}

          {activeTab === 'solution' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">✅ خطوات الحل</h2>
              
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">1</span>
                  <div>
                    <h3 className="font-bold mb-1">افتح صفحة عرض كل الكورسات</h3>
                    <p className="text-sm text-gray-600 mb-2">للتأكد من وجود الكورسات في قاعدة البيانات</p>
                    <a href="/list-all-courses" target="_blank" className="text-blue-600 hover:underline text-sm">
                      ← افتح الصفحة
                    </a>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">2</span>
                  <div>
                    <h3 className="font-bold mb-1">أنشئ كورس تجريبي بسيط</h3>
                    <p className="text-sm text-gray-600 mb-2">لاختبار عملية الإنشاء والعرض</p>
                    <a href="/simple-create-course" target="_blank" className="text-blue-600 hover:underline text-sm">
                      ← إنشاء كورس
                    </a>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">3</span>
                  <div>
                    <h3 className="font-bold mb-1">انسخ ID الكورس</h3>
                    <p className="text-sm text-gray-600">بعد إنشاء الكورس، انسخ الـ ID الذي سيظهر</p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">4</span>
                  <div>
                    <h3 className="font-bold mb-1">شخّص الكورس</h3>
                    <p className="text-sm text-gray-600 mb-2">استخدم أداة التشخيص للتأكد من وجود الكورس</p>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">/debug-course/[ID]</code>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">5</span>
                  <div>
                    <h3 className="font-bold mb-1">نشر الكورسات (إن لزم)</h3>
                    <p className="text-sm text-gray-600 mb-2">إذا كانت الكورسات مسودات، شغل SQL لنشرها</p>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded block mt-1">UPDATE courses SET is_published = true;</code>
                  </div>
                </li>
              </ol>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-bold text-green-800 mb-2">🎯 الحل السريع</h3>
                <p className="text-green-700 text-sm">
                  في أغلب الحالات، المشكلة تكون أن الكورس غير منشور. 
                  تأكد من تفعيل خيار "نشر الكورس مباشرة" عند الإنشاء.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
