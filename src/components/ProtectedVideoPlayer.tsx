'use client';

import { useState, useEffect } from 'react';
import { FaLock, FaShoppingCart, FaWhatsapp, FaPhone, FaCopy, FaCheckCircle, FaExpand, FaCompress, FaPlus, FaMinus } from 'react-icons/fa';
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
  lessonId?: string;
  useAccessCode?: boolean;
}

export default function ProtectedVideoPlayer({
  courseId,
  courseName,
  coursePrice,
  teacherName,
  teacherPhone,
  videoUrl,
  isEnrolled,
  onEnroll,
  lessonId,
  useAccessCode = false,
}: ProtectedVideoPlayerProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const [actualCourseName, setActualCourseName] = useState(courseName);
  const [actualCoursePrice, setActualCoursePrice] = useState(coursePrice);
  const [actualTeacherPhone, setActualTeacherPhone] = useState(teacherPhone);
  const [unlockedLessons, setUnlockedLessons] = useState<string[]>([]);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [lessonHasCode, setLessonHasCode] = useState(false);
  const [lessonIsFreeOrPreview, setLessonIsFreeOrPreview] = useState(false);
  const [metaLoaded, setMetaLoaded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

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

  useEffect(() => {
    if (!courseId) return;
    try {
      const raw = localStorage.getItem(`lesson_unlocks_${courseId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setUnlockedLessons(parsed.map((id: any) => String(id)));
        }
      }
    } catch (e) {
      console.error('Error loading unlocked lessons from localStorage in ProtectedVideoPlayer:', e);
    }
  }, [courseId]);

  useEffect(() => {
    if (!lessonId || !useAccessCode) {
      setLessonHasCode(false);
      setLessonIsFreeOrPreview(false);
      setMetaLoaded(false);
      return;
    }

    const fetchMeta = async () => {
      try {
        const res = await fetch(`/api/lessons/${lessonId}`);
        if (!res.ok) {
          setMetaLoaded(true);
          return;
        }
        const data = await res.json();
        setLessonHasCode(!!data.hasCode);
        setLessonIsFreeOrPreview(!!data.isFree || !!data.isPreview);
        setMetaLoaded(true);
      } catch (err) {
        console.error('Error loading lesson meta in ProtectedVideoPlayer:', err);
        setMetaLoaded(true);
      }
    };

    fetchMeta();
  }, [lessonId, useAccessCode, courseId]);

  // إعادة ضبط مستوى الزووم عند الخروج من وضع التكبير المخصص
  useEffect(() => {
    if (!isExpanded) {
      setZoomLevel(1);
    }
  }, [isExpanded]);

  const handleVerifyCode = async () => {
    if (!lessonId || !courseId) return;

    if (!codeInput.trim()) {
      setCodeError('يرجى إدخال الكود');
      return;
    }

    setIsVerifyingCode(true);
    setCodeError(null);

    try {
      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: codeInput.trim(), courseId }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setUnlockedLessons((prev) => {
          if (prev.includes(lessonId)) return prev;
          const updated = [...prev, lessonId];
          try {
            localStorage.setItem(
              `lesson_unlocks_${courseId}`,
              JSON.stringify(updated),
            );
          } catch (e) {
            console.error('Error saving unlocked lessons to localStorage in ProtectedVideoPlayer:', e);
          }
          return updated;
        });
        setCodeInput('');
        setCodeError(null);
        toast.success('تم تفعيل الكود وفتح الفيديو');
      } else {
        setCodeError(data?.error || 'الكود غير صحيح');
      }
    } catch (err) {
      console.error('Error verifying lesson code in ProtectedVideoPlayer:', err);
      setCodeError('حدث خطأ أثناء التحقق من الكود');
    } finally {
      setIsVerifyingCode(false);
    }
  };

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

  const renderVideoPlayer = () => {
    const isDriveVideo = !!videoUrl && videoUrl.includes('drive.google.com');
    const getEmbeddedUrl = () => {
      const url = videoUrl;
      if (!url) return '';

      try {
        if (url.includes('drive.google.com')) {
          try {
            const parsed = new URL(url);
            let fileId = '';

            const pathParts = parsed.pathname.split('/').filter(Boolean);
            const dIndex = pathParts.indexOf('d');
            if (dIndex !== -1 && pathParts[dIndex + 1]) {
              fileId = pathParts[dIndex + 1];
            }

            if (!fileId) {
              const idParam = parsed.searchParams.get('id');
              if (idParam) {
                fileId = idParam;
              }
            }

            if (fileId) {
              return `https://drive.google.com/file/d/${fileId}/preview`;
            }
          } catch (e) {}
        }

        if (url.includes('youtube.com/watch')) {
          const urlObj = new URL(url);
          const v = urlObj.searchParams.get('v');
          if (v) {
            return `https://www.youtube.com/embed/${v}?autoplay=0&rel=0&modestbranding=1&controls=1&disablekb=1&iv_load_policy=3&fs=0`;
          }
        }

        if (url.includes('youtu.be/')) {
          const id = url.split('youtu.be/')[1]?.split(/[?&]/)[0];
          if (id) {
            return `https://www.youtube.com/embed/${id}?autoplay=0&rel=0&modestbranding=1&controls=1&disablekb=1&iv_load_policy=3&fs=0`;
          }
        }

        if (url.includes('youtube.com/embed/')) {
          const hasQuery = url.includes('?');
          const base = hasQuery ? url.split('?')[0] : url;
          return `${base}?autoplay=0&rel=0&modestbranding=1&controls=1&disablekb=1&iv_load_policy=3&fs=0`;
        }
      } catch (e) {}

      return url;
    };

    return (
      <div className={isExpanded ? 'fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-start pt-2 px-2' : 'w-full'}>
        <div
          className="w-full max-w-6xl max-h-[90vh] aspect-video bg-black rounded-xl overflow-hidden relative"
          style={{
            transform: isExpanded ? `scale(${zoomLevel})` : 'scale(1)',
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease-out',
          }}
        >
          <iframe
            src={getEmbeddedUrl()}
            title="Course Video"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
          <div className="absolute top-0 left-0 right-0 h-16 bg-black/35 flex items-center justify-between px-4 pointer-events-auto z-10 select-none">
            <div className="flex items-center gap-2 text-white/85 text-sm font-bold">
              <FaLock className="text-lg" />
              <span>محتوى محمي</span>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="flex items-center gap-2 text-white/90 bg-black/40 hover:bg-black/60 rounded-full px-3 py-1 text-xs font-semibold transition"
            >
              {isExpanded ? (
                <>
                  <FaCompress className="text-sm" />
                  <span>تصغير الفيديو</span>
                </>
              ) : (
                <>
                  <FaExpand className="text-sm" />
                  <span>تكبير الفيديو</span>
                </>
              )}
            </button>
          </div>

          {/* أزرار الزووم في الأسفل */}
          {isExpanded && (
            <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-black/40 text-white px-3 py-1 rounded-full text-xs pointer-events-auto select-none">
              <span className="opacity-80">الزووم</span>
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.max(1, Number((prev - 0.15).toFixed(2))))}
                className="flex items-center justify-center w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 transition disabled:opacity-40"
                disabled={zoomLevel <= 1}
              >
                <FaMinus className="text-xs" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.min(2, Number((prev + 0.15).toFixed(2))))}
                className="flex items-center justify-center w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 transition disabled:opacity-40"
                disabled={zoomLevel >= 2}
              >
                <FaPlus className="text-xs" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const usesCodeFlow = !!lessonId && useAccessCode;

  const isLessonUnlocked = !!lessonId && unlockedLessons.includes(lessonId);

  if (usesCodeFlow) {
    // دروس مجانية / معاينة: تفتح بدون كود حتى لو المستخدم غير مشترك
    if (lessonIsFreeOrPreview) {
      return renderVideoPlayer();
    }

    // يوجد كود محدد لهذا الدرس: نطلب الكود لغير المشتركين
    if (lessonHasCode) {
      if (!isLessonUnlocked) {
        return (
          <div className="w-full aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden relative">
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-8 mb-6">
                <FaLock className="text-6xl" />
              </div>

              <h2 className="text-2xl font-bold mb-2">هذا الفيديو محمي بكود</h2>
              <p className="text-gray-300 text-center mb-4">
                أدخل كود هذا الدرس الذي حصلت عليه من المدرس لفتح الفيديو.
              </p>

              <div className="w-full max-w-md space-y-3">
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-900/60 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="أدخل الكود هنا"
                />
                {codeError && (
                  <p className="text-sm text-red-400 text-center">{codeError}</p>
                )}
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={isVerifyingCode}
                  className="w-full px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold transition disabled:opacity-60"
                >
                  {isVerifyingCode ? 'جاري التحقق من الكود...' : 'تفعيل الكود وفتح الفيديو'}
                </button>
              </div>
            </div>
          </div>
        );
      }

      return renderVideoPlayer();
    }

    // لا يوجد كود مضبوط لهذا الدرس وليس مجاني/معاينة:
    // في هذه الحالة لا نفتح الفيديو لغير المشتركين، بل نعود لمسار الاشتراك في الأسفل.
  }

  if (isEnrolled) {
    return renderVideoPlayer();
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
            onClick={() => {
              if (onEnroll) {
                onEnroll();
              } else {
                setShowPaymentModal(true);
              }
            }}
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
