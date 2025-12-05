'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaClock, FaCheckCircle, FaTimesCircle, FaEnvelope, FaPhone, FaSchool } from 'react-icons/fa';

export default function TeacherPending() {
  const router = useRouter();
  const [teacherData, setTeacherData] = useState<any>(null);
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    const teacher = localStorage.getItem('teacher');
    if (!teacher) {
      router.push('/teacher/register');
      return;
    }
    
    const data = JSON.parse(teacher);
    setTeacherData(data);
    setStatus(data.status || 'pending');

    // محاكاة التحقق من حالة الموافقة كل 5 ثواني
    const interval = setInterval(() => {
      const updatedTeacher = localStorage.getItem('teacher');
      if (updatedTeacher) {
        const updated = JSON.parse(updatedTeacher);
        if (updated.status === 'approved') {
          setStatus('approved');
          clearInterval(interval);
          setTimeout(() => {
            router.push('/teacher/dashboard');
          }, 3000);
        } else if (updated.status === 'rejected') {
          setStatus('rejected');
          clearInterval(interval);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!teacherData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
      <div className="max-w-2xl w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className={`p-8 text-center text-white ${
            status === 'approved' 
              ? 'bg-gradient-to-r from-green-500 to-green-600'
              : status === 'rejected'
              ? 'bg-gradient-to-r from-red-500 to-red-600'
              : 'bg-gradient-to-r from-yellow-500 to-orange-500'
          }`}>
            <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full flex items-center justify-center">
              {status === 'approved' ? (
                <FaCheckCircle className="text-6xl text-green-500" />
              ) : status === 'rejected' ? (
                <FaTimesCircle className="text-6xl text-red-500" />
              ) : (
                <FaClock className="text-6xl text-yellow-500" />
              )}
            </div>
            
            <h1 className="text-3xl font-bold mb-2">
              {status === 'approved' 
                ? '🎉 تهانينا! تم قبول طلبك'
                : status === 'rejected'
                ? '😔 عذراً، تم رفض طلبك'
                : 'طلبك قيد المراجعة'}
            </h1>
            
            <p className="text-white/90">
              {status === 'approved' 
                ? 'مرحباً بك في منصتنا التعليمية'
                : status === 'rejected'
                ? 'يمكنك التقديم مرة أخرى بعد تحسين ملفك'
                : 'سيتم مراجعة طلبك من قبل فريق الإدارة'}
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* معلومات المدرس */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">معلومات طلبك:</h2>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FaSchool className="text-purple-500" />
                  <span className="text-gray-600">الاسم:</span>
                  <span className="font-medium">{teacherData.name}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <FaEnvelope className="text-purple-500" />
                  <span className="text-gray-600">البريد الإلكتروني:</span>
                  <span className="font-medium">{teacherData.email}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <FaPhone className="text-purple-500" />
                  <span className="text-gray-600">رقم الهاتف:</span>
                  <span className="font-medium" dir="ltr">{teacherData.phone}</span>
                </div>
              </div>
            </div>

            {/* الخطوات التالية */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-800 mb-4">
                {status === 'pending' ? 'الخطوات التالية:' : 'ماذا الآن؟'}
              </h3>
              
              {status === 'pending' && (
                <ol className="space-y-3 text-gray-600">
                  <li className="flex gap-2">
                    <span className="font-bold text-purple-600">1.</span>
                    سيقوم فريق المراجعة بفحص طلبك خلال 24-48 ساعة
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-purple-600">2.</span>
                    ستتلقى إشعاراً عبر البريد الإلكتروني بنتيجة المراجعة
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-purple-600">3.</span>
                    في حالة القبول، ستتمكن من الدخول لحسابك وبدء إضافة الكورسات
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-purple-600">4.</span>
                    احرص على تجهيز محتوى عالي الجودة للطلاب
                  </li>
                </ol>
              )}

              {status === 'approved' && (
                <div className="space-y-3 text-gray-600">
                  <p className="text-green-600 font-medium">
                    ✅ تم تفعيل حسابك كمدرس في المنصة
                  </p>
                  <p>سيتم تحويلك إلى لوحة التحكم خلال ثوانٍ...</p>
                  <button
                    onClick={() => router.push('/teacher/dashboard')}
                    className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    الذهاب إلى لوحة التحكم
                  </button>
                </div>
              )}

              {status === 'rejected' && (
                <div className="space-y-3 text-gray-600">
                  <p className="text-red-600 font-medium">
                    ❌ للأسف لم يتم قبول طلبك في الوقت الحالي
                  </p>
                  <p>الأسباب المحتملة:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>عدم اكتمال المعلومات المطلوبة</li>
                    <li>عدم توافق المؤهلات مع المعايير المطلوبة</li>
                    <li>وجود عدد كافٍ من المدرسين في تخصصك حالياً</li>
                  </ul>
                  <button
                    onClick={() => router.push('/teacher/register')}
                    className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    التقديم مرة أخرى
                  </button>
                </div>
              )}
            </div>

            {/* معلومات التواصل */}
            {status === 'pending' && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>ملاحظة:</strong> إذا كان لديك أي استفسار، يمكنك التواصل معنا عبر البريد الإلكتروني:
                  <a href="mailto:support@platform.com" className="font-medium underline mr-2">
                    support@platform.com
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
