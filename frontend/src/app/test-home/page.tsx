'use client';

export default function TestHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-green-600 mb-4">
            ✅ التطبيق يعمل بنجاح!
          </h1>
          
          <p className="text-lg text-gray-700 mb-6">
            تم حل مشكلة Error 500. الخادم يعمل الآن على المنفذ 3000.
          </p>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-bold text-blue-900 mb-2">الصفحات المتاحة:</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/" className="text-blue-600 hover:underline">
                    🏠 الصفحة الرئيسية
                  </a>
                </li>
                <li>
                  <a href="/courses" className="text-blue-600 hover:underline">
                    📚 الكورسات
                  </a>
                </li>
                <li>
                  <a href="/test-courses" className="text-blue-600 hover:underline">
                    🔍 اختبار عرض الكورسات
                  </a>
                </li>
                <li>
                  <a href="/test-course" className="text-blue-600 hover:underline">
                    ➕ اختبار إنشاء كورس
                  </a>
                </li>
                <li>
                  <a href="/admin/courses/new" className="text-blue-600 hover:underline">
                    ✏️ إضافة كورس جديد (أدمن)
                  </a>
                </li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-bold text-green-900 mb-2">المشاكل التي تم حلها:</h3>
              <ul className="list-disc list-inside space-y-1 text-green-700">
                <li>✅ Error 500 Internal Server Error</li>
                <li>✅ تحويل من Backend API إلى Supabase</li>
                <li>✅ إصلاح مشكلة عدم ظهور الصور</li>
                <li>✅ إصلاح مشكلة "الكورس غير موجود"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
