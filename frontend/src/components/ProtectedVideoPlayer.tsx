'use client';

import { useState, useEffect } from 'react';
import { FaLock, FaShoppingCart, FaWhatsapp, FaPhone, FaCopy, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface ProtectedVideoPlayerProps {
  courseId: string;
  courseName: string;
  coursePrice: number;
  teacherName: string;
  teacherPhone?: string;
  videoUrl: string;
  isEnrolled: boolean;
  onEnroll?: () => void;
}

export default function ProtectedVideoPlayer({
  courseId,
  courseName,
  coursePrice,
  teacherName,
  teacherPhone,
  videoUrl,
  isEnrolled,
  onEnroll
}: ProtectedVideoPlayerProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const [actualCourseName, setActualCourseName] = useState(courseName);
  const [actualCoursePrice, setActualCoursePrice] = useState(coursePrice);
  const [actualTeacherPhone, setActualTeacherPhone] = useState(teacherPhone);
  
  // رقم فودافون كاش للمدرس
  const vodafoneCashNumber = actualTeacherPhone || teacherPhone || '01012345678';
  
  useEffect(() => {
    // جلب بيانات الطالب من localStorage
    const student = localStorage.getItem('studentInfo');
    if (student) {
      const data = JSON.parse(student);
      setStudentName(data.name || '');
      setStudentPhone(data.phone || '');
    }
    
    // جلب بيانات الكورس من localStorage كـ fallback
    const currentCourse = localStorage.getItem('currentCourse');
    if (currentCourse) {
      const courseData = JSON.parse(currentCourse);
      console.log('📚 بيانات الكورس من localStorage:', courseData);
      
      // استخدام البيانات من localStorage إذا لم تكن موجودة في props
      if (!courseName || courseName === '') {
        setActualCourseName(courseData.title || 'الكورس');
      }
      if (!coursePrice || coursePrice === 0) {
        setActualCoursePrice(courseData.price || 299);
      }
      if (!teacherPhone || teacherPhone === '') {
        setActualTeacherPhone(courseData.instructor_phone || '01012345678');
      }
    }
  }, [courseName, coursePrice, teacherPhone]);

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(vodafoneCashNumber);
    setCopied(true);
    toast.success('تم نسخ الرقم!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleWhatsAppClick = async () => {
    // التحقق من البيانات الطالب
    if (!studentName || !studentPhone) {
      toast.error('من فضلك أكمل بياناتك أولاً');
      return;
    }
    
    // التحقق من بيانات الكورس
    const finalCourseName = actualCourseName || courseName;
    const finalCoursePrice = actualCoursePrice || coursePrice;
    
    if (!finalCourseName || !finalCoursePrice) {
      console.error('❌ بيانات الكورس غير متوفرة:', { 
        actualCourseName, 
        courseName, 
        actualCoursePrice, 
        coursePrice 
      });
      
      // محاولة جلب البيانات من localStorage مرة أخرى
      const savedCourse = localStorage.getItem('currentCourse');
      if (savedCourse) {
        const courseData = JSON.parse(savedCourse);
        setActualCourseName(courseData.title || 'الكورس');
        setActualCoursePrice(courseData.price || 299);
        toast.error('تم تحديث بيانات الكورس، حاول مرة أخرى');
      } else {
        toast.error('عذراً، بيانات الكورس غير متوفرة. قم بتحديث الصفحة');
      }
      return;
    }

    // إرسال طلب الدفع إلى قاعدة البيانات
    try {
      const paymentData = {
        studentName,
        studentPhone,
        studentEmail: '', // يمكن إضافته لاحقاً
        courseId,
        courseName: finalCourseName,
        coursePrice: finalCoursePrice,
        teacherName: teacherName || 'المدرس',
        teacherPhone: actualTeacherPhone || teacherPhone,
        paymentPhone: studentPhone,
        transactionId: `VF${Date.now()}` // معرف مؤقت للمعاملة
      };

      const response = await fetch('/api/payment-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('تم إرسال طلب الدفع بنجاح! سيتم مراجعته قريباً');
        
        // حفظ معرف الطلب
        localStorage.setItem('lastPaymentRequestId', result.requestId);
        
        // إنشاء نص الرسالة التلقائية
        const message = `*طلب اشتراك في كورس*
    
🎓 *الاسم:* ${studentName}
📱 *رقم الهاتف:* ${studentPhone}
📚 *اسم الكورس:* ${finalCourseName}
💰 *المبلغ:* ${finalCoursePrice} جنيه مصري
🆔 *كود الكورس:* ${courseId}
📄 *رقم الطلب:* ${result.requestId?.slice(0, 8)}

✅ تم التحويل عبر فودافون كاش
📲 الرقم المحول منه: ${studentPhone}

⏰ التاريخ والوقت: ${new Date().toLocaleString('ar-EG')}

*برجاء تفعيل الاشتراك*`;

        // تحويل النص لـ URL encoding
        const encodedMessage = encodeURIComponent(message);
        
        // رقم الواتساب الذي سيستقبل الرسالة (يمكن تغييره)
        const whatsappNumber = '201012345678'; // ضع رقمك هنا بدون +
        
        // فتح الواتساب مع الرسالة المعدة
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
        
        // إغلاق نافذة الدفع
        setShowPaymentModal(false);
      } else {
        toast.error(result.error || 'حدث خطأ في إرسال الطلب');
      }
    } catch (error) {
      console.error('Error sending payment request:', error);
      toast.error('خطأ في الاتصال بالخادم');
    }
  };

  if (isEnrolled) {
    // عرض الفيديو للمشتركين
    return (
      <div className="w-full aspect-video bg-black rounded-xl overflow-hidden">
        <iframe
          src={videoUrl}
          title="Course Video"
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // عرض رسالة القفل وزر الشراء للغير مشتركين
  return (
    <>
      <div className="w-full aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden relative">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-full p-8 mb-6">
            <FaLock className="text-6xl" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">محتوى مغلق</h2>
          <p className="text-gray-300 text-center mb-6">
            يجب الاشتراك في الكورس لمشاهدة هذا المحتوى
          </p>
          
          <button
            onClick={() => setShowPaymentModal(true)}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl shadow-xl transition transform hover:scale-105 flex items-center gap-3"
          >
            <FaShoppingCart className="text-xl" />
            اشترك الآن ({actualCoursePrice || coursePrice} جنيه)
          </button>
        </div>
      </div>

      {/* نافذة الدفع */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">الدفع بفودافون كاش</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-white/80 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>
              <p className="mt-2 text-red-100">
                ادفع بسهولة وأمان عبر فودافون كاش
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* معلومات الكورس */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h4 className="font-bold text-gray-800 mb-3">تفاصيل الكورس:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">اسم الكورس:</span>
                    <span className="font-medium">{actualCourseName || courseName || 'الكورس'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">المدرس:</span>
                    <span className="font-medium">{teacherName || 'المدرس'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">السعر:</span>
                    <span className="font-bold text-green-600 text-lg">{actualCoursePrice || coursePrice || 299} جنيه</span>
                  </div>
                </div>
              </div>

              {/* بيانات الطالب */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    اسمك الكامل *
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:border-red-500 focus:outline-none"
                    placeholder="أدخل اسمك بالكامل"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    رقم هاتفك *
                  </label>
                  <input
                    type="tel"
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:border-red-500 focus:outline-none"
                    placeholder="01xxxxxxxxx"
                    pattern="[0-9]{11}"
                    required
                    dir="ltr"
                  />
                </div>
              </div>

              {/* خطوات الدفع */}
              <div className="bg-red-50 rounded-xl p-4 mb-6">
                <h4 className="font-bold text-gray-800 mb-3">خطوات الدفع:</h4>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-2">
                    <span className="font-bold text-red-600">1.</span>
                    <span>افتح تطبيق فودافون كاش</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-red-600">2.</span>
                    <div>
                      <span>حول المبلغ إلى الرقم:</span>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="bg-white px-3 py-2 rounded-lg font-bold text-lg" dir="ltr">
                          {vodafoneCashNumber}
                        </code>
                        <button
                          onClick={handleCopyNumber}
                          className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition"
                          title="نسخ الرقم"
                        >
                          {copied ? <FaCheckCircle className="text-green-600" /> : <FaCopy className="text-red-600" />}
                        </button>
                      </div>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-red-600">3.</span>
                    <span>المبلغ المطلوب: <strong>{actualCoursePrice || coursePrice || 299} جنيه</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-red-600">4.</span>
                    <span>بعد التحويل، اضغط على زر "أرسل للواتساب"</span>
                  </li>
                </ol>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex gap-3">
                <button
                  onClick={handleWhatsAppClick}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
                  disabled={!studentName || !studentPhone}
                >
                  <FaWhatsapp className="text-xl" />
                  أرسل للواتساب
                </button>
                
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition"
                >
                  إلغاء
                </button>
              </div>

              {/* تنبيه */}
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>ملاحظة:</strong> سيتم تفعيل اشتراكك خلال 30 دقيقة بعد التأكد من وصول المبلغ
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
