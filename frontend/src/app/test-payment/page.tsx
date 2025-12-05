'use client';

import { useState, useEffect } from 'react';
import ProtectedVideoPlayer from '@/components/ProtectedVideoPlayer';
import { toast } from 'react-hot-toast';

export default function TestPaymentPage() {
  const [courseData, setCourseData] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);

  useEffect(() => {
    // جلب بيانات الكورس من localStorage
    const currentCourse = localStorage.getItem('currentCourse');
    if (currentCourse) {
      const data = JSON.parse(currentCourse);
      setCourseData(data);
      console.log('📚 بيانات الكورس:', data);
    }

    // جلب بيانات الطالب من localStorage  
    const studentInfo = localStorage.getItem('studentInfo');
    if (studentInfo) {
      const data = JSON.parse(studentInfo);
      setStudentData(data);
      console.log('👨‍🎓 بيانات الطالب:', data);
    }
  }, []);

  const saveTestData = () => {
    // حفظ بيانات تجريبية
    const testCourse = {
      id: 'test-course-123',
      title: 'دورة الرياضيات المتقدمة',
      price: 299,
      instructor_name: 'أ. محمد أحمد',
      instructor_phone: '01098765432'
    };

    const testStudent = {
      name: 'أحمد محمد علي',
      phone: '01012345678',
      email: 'student@test.com'
    };

    localStorage.setItem('currentCourse', JSON.stringify(testCourse));
    localStorage.setItem('studentInfo', JSON.stringify(testStudent));
    
    setCourseData(testCourse);
    setStudentData(testStudent);
    
    toast.success('تم حفظ البيانات التجريبية');
    
    // تحديث الصفحة بعد ثانية
    setTimeout(() => window.location.reload(), 1000);
  };

  const clearData = () => {
    localStorage.removeItem('currentCourse');
    localStorage.removeItem('studentInfo');
    setCourseData(null);
    setStudentData(null);
    toast.success('تم مسح البيانات');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">صفحة اختبار نظام الدفع</h1>

        {/* معلومات البيانات المحفوظة */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">📚 بيانات الكورس</h2>
            {courseData ? (
              <div className="space-y-2">
                <p><strong>الاسم:</strong> {courseData.title}</p>
                <p><strong>السعر:</strong> {courseData.price} جنيه</p>
                <p><strong>المدرس:</strong> {courseData.instructor_name}</p>
                <p><strong>رقم الفودافون كاش:</strong> {courseData.instructor_phone}</p>
                <p><strong>ID:</strong> {courseData.id}</p>
              </div>
            ) : (
              <p className="text-gray-500">لا توجد بيانات محفوظة</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">👨‍🎓 بيانات الطالب</h2>
            {studentData ? (
              <div className="space-y-2">
                <p><strong>الاسم:</strong> {studentData.name}</p>
                <p><strong>الهاتف:</strong> {studentData.phone}</p>
                <p><strong>البريد:</strong> {studentData.email}</p>
              </div>
            ) : (
              <p className="text-gray-500">لا توجد بيانات محفوظة</p>
            )}
          </div>
        </div>

        {/* أزرار التحكم */}
        <div className="flex gap-4 justify-center mb-8">
          <button
            onClick={saveTestData}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition"
          >
            حفظ بيانات تجريبية
          </button>
          
          <button
            onClick={clearData}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
          >
            مسح البيانات
          </button>

          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
          >
            تحديث الصفحة
          </button>
        </div>

        {/* مكون الفيديو المحمي للاختبار */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">🎥 اختبار مشغل الفيديو المحمي</h2>
          
          <ProtectedVideoPlayer
            courseId={courseData?.id || 'test-123'}
            courseName={courseData?.title || 'دورة تجريبية'}
            coursePrice={courseData?.price || 299}
            teacherName={courseData?.instructor_name || 'المدرس'}
            teacherPhone={courseData?.instructor_phone || '01012345678'}
            videoUrl="https://www.youtube.com/embed/dQw4w9WgXcQ"
            isEnrolled={false}
            onEnroll={() => toast.success('تم الاشتراك!')}
          />
        </div>

        {/* معلومات تشخيصية */}
        <div className="mt-12 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">🔍 معلومات تشخيصية</h3>
          
          <div className="space-y-2">
            <p><strong>حالة LocalStorage:</strong></p>
            <ul className="list-disc list-inside ml-4">
              <li>currentCourse: {localStorage.getItem('currentCourse') ? '✅ موجود' : '❌ غير موجود'}</li>
              <li>studentInfo: {localStorage.getItem('studentInfo') ? '✅ موجود' : '❌ غير موجود'}</li>
            </ul>
            
            <div className="mt-4">
              <p className="font-bold mb-2">خطوات الاختبار:</p>
              <ol className="list-decimal list-inside ml-4 space-y-1">
                <li>اضغط "حفظ بيانات تجريبية" لإنشاء بيانات اختبار</li>
                <li>اضغط على "اشترك الآن" في مشغل الفيديو</li>
                <li>املأ بياناتك في النافذة المنبثقة</li>
                <li>اضغط "أرسل للواتساب" لاختبار الإرسال</li>
              </ol>
            </div>
            
            <div className="mt-4 p-4 bg-white rounded-lg">
              <p className="font-bold mb-2">Console Logs:</p>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                {JSON.stringify({ courseData, studentData }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
