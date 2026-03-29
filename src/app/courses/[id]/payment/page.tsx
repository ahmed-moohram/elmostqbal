'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaWhatsapp, FaCheckCircle, FaArrowLeft, FaInfoCircle, FaCopy, FaMobileAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface CourseDetails {
  id: string | number;
  title: string;
  price: number;
  discountPrice: number | null;
  thumbnail: string;
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = (params?.id as string) || '';

  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vodafoneNumber] = useState('01070333143');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [studentName, setStudentName] = useState<string>('الطالب');

  // التحقق من تسجيل دخول المستخدم
  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      router.replace(`/login?redirect=/courses/${courseId}/payment`);
      return;
    }
    try {
      const user = JSON.parse(userJson);
      setStudentName(user.name || 'الطالب');
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
    setIsLoggedIn(true);
  }, [courseId, router]);

  // استرداد بيانات الكورس
  useEffect(() => {
    const fetchCourseDetails = async () => {
      setIsLoading(true);
      try {
        // محاولة جلب بيانات الكورس من Supabase أولاً
        const { default: supabase } = await import('@/lib/supabase-client');

        const { data: courseData, error } = await supabase
          .from('courses')
          .select('id, title, price, discount_price, thumbnail')
          .eq('id', courseId)
          .maybeSingle();

        if (!error && courseData) {
          setCourse({
            id: courseData.id,
            title: courseData.title,
            price: (courseData as any).price || 0,
            discountPrice: (courseData as any).discount_price ?? null,
            thumbnail: (courseData as any).thumbnail || '/placeholder-course.jpg',
          });
        } else {
          console.warn('لم يتم العثور على الكورس في Supabase لمسار الدفع:', error);
          setCourse(null);
          setTimeout(() => {
            router.replace('/courses');
          }, 2000);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching course:', error);
        setIsLoading(false);
        router.replace(`/error?message=${encodeURIComponent('حدث خطأ أثناء تحميل بيانات الكورس')}&redirectTo=${encodeURIComponent(`/courses`)}`);
      }
    };

    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId, router]);

  // نسخ رقم فودافون كاش
  const handleCopyNumber = () => {
    navigator.clipboard.writeText(vodafoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // فتح محادثة واتساب
  const handleWhatsappClick = () => {
    try {
      // استخراج معلومات المستخدم
      const userJson = localStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : {};
      const studentName = user.name || 'طالب جديد';
      const studentGrade = user.gradeLevel || user.grade || 'غير محدد';
      const studentPhone = user.studentPhone || user.phone || 'غير متوفر';

      // تحضير الرسالة
      const courseName = course?.title || '';
      const coursePrice = course?.discountPrice || course?.price || 0;

      const message = `
*طلب اشتراك في كورس*

📚 اسم الكورس: ${courseName}
💰 السعر: ${coursePrice} جنيه
📖 الصف الدراسي: ${studentGrade}
👤 اسم الطالب: ${studentName}
📱 رقم الهاتف: ${studentPhone}

سأرسل إيصال الدفع الآن لتأكيد الاشتراك ✅
`;

      // توجيه المستخدم إلى واتساب
      const waUrl = `https://wa.me/2${vodafoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');

      // تسجيل أن المستخدم ضغط على زر واتساب
      localStorage.setItem(`whatsapp_clicked_${courseId}`, 'true');

      toast.success('تم فتح واتساب! أرسل صورة الإيصال ثم اضغط "تأكيد" أدناه 📸', {
        duration: 6000
      });

    } catch (error) {
      console.error('خطأ في فتح محادثة واتساب:', error);
      toast.error('حدث خطأ أثناء محاولة فتح واتساب');
    }
  };

  // وظيفة إرسال إشعار للمسؤول
  const sendAdminNotification = async (data) => {
    try {
      // في الحالة الفعلية، سنرسل البيانات إلى API
      console.log('إرسال إشعار للمسؤول:', data);

      // محاكاة لاستدعاء API
      // await fetch('/api/admin/notifications', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data)
      // });

      // تخزين محلي للعرض التوضيحي
      const adminNotifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
      adminNotifications.push(data);
      localStorage.setItem('adminNotifications', JSON.stringify(adminNotifications));
    } catch (error) {
      console.error('خطأ في إرسال الإشعار:', error);
    }
  };

  // تأكيد إرسال الإيصال للأدمن
  const handleConfirmPayment = async () => {
    setIsSubmitting(true);

    try {
      // التحقق من صحة البيانات قبل المتابعة
      if (!course) {
        toast.error('بيانات الكورس غير متوفرة');
        return;
      }

      // استخراج معلومات المستخدم
      const userJson = localStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : {};
      const studentInfoJson = localStorage.getItem('studentInfo');
      let studentInfo: any = null;
      try {
        studentInfo = studentInfoJson ? JSON.parse(studentInfoJson) : null;
      } catch (e) {
        console.error('Error parsing studentInfo:', e);
      }

      const finalStudentName = (studentInfo && studentInfo.name) || user.name || 'طالب';
      const finalStudentEmail = (studentInfo && studentInfo.email) || user.email || `student${Date.now()}@temp.com`;
      const finalStudentPhone = (studentInfo && studentInfo.phone) || user.studentPhone || user.phone || '';
      const finalStudentGrade =
        (studentInfo && (studentInfo.gradeLevel || studentInfo.grade)) ||
        user.gradeLevel ||
        user.grade ||
        'غير محدد';
      const nowIso = new Date().toISOString();

      // التأكد من أن المستخدم أرسل إلى واتساب أولاً
      const hasClickedWhatsapp = localStorage.getItem(`whatsapp_clicked_${courseId}`);
      if (!hasClickedWhatsapp) {
        toast.error('يرجى إرسال الإيصال عبر واتساب أولاً قبل التأكيد!');
        setIsSubmitting(false);
        return;
      }
      
      // إنشاء طلب تسجيل للأدمن
      const enrollmentRequest = {
        // معرف محلي للطلب ليستعمله الأدمن في الواجهة
        id: `local-${courseId}-${Date.now()}`,
        studentId: user.id || user._id,
        // حقول مسطّحة لواجهة الأدمن القديمة
        studentName: finalStudentName,
        studentPhone: finalStudentPhone,
        studentGrade: finalStudentGrade,
        courseName: course.title,
        coursePrice: course.discountPrice || course.price,
        date: nowIso,
        // كائنات تفصيلية للاستخدامات الأخرى
        studentInfo: {
          name: finalStudentName,
          email: finalStudentEmail,
          phone: finalStudentPhone,
          parentPhone: user.parentPhone || ''
        },
        courseId: courseId,
        paymentInfo: {
          method: 'vodafone_cash',
          amount: course.discountPrice || course.price,
          receiptImage: 'pending_whatsapp_verification',
          phoneNumber: vodafoneNumber
        },
        status: 'pending',
        submittedAt: nowIso
      };
      
      // محاولة إرسال للـ backend (API القديم إن وجد)
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_URL}/api/admin/enrollment-requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify(enrollmentRequest)
        });

        if (response.ok) {
          console.log('تم إرسال الطلب للسيرفر بنجاح');
        }
      } catch (apiError) {
        console.log('حفظ الطلب محلياً فقط', apiError);
      }

      // إنشاء طلب دفع في نظام المنصة (Supabase عبر /api/payment-request)
      try {
        await fetch('/api/payment-request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentName: finalStudentName,
            studentPhone: finalStudentPhone,
            studentEmail: finalStudentEmail,
            studentId: user.id || (user as any)._id,
            courseId: courseId,
            courseName: course.title,
            coursePrice: course.discountPrice || course.price,
            teacherName: '',
            teacherPhone: '',
            paymentPhone: finalStudentPhone,
            transactionId: undefined,
          }),
        });
      } catch (paymentError) {
        console.error('Error creating payment request:', paymentError);
      }

      // حفظ في localStorage كـ backup
      const requestsStr = localStorage.getItem('enrollmentRequests');
      let requests: any[] = [];
      if (requestsStr) {
        try {
          requests = JSON.parse(requestsStr);
        } catch (e) {
          console.error('Error parsing enrollment requests:', e);
        }
      }

      requests.push(enrollmentRequest);
      localStorage.setItem('enrollmentRequests', JSON.stringify(requests));
      
      // إزالة علامة واتساب بعد التأكيد
      localStorage.removeItem(`whatsapp_clicked_${courseId}`);
      
      setPaymentSuccess(true);
      toast.success('تم تأكيد طلبك! سيتم مراجعته من الأدمن وتفعيل الكورس قريباً ✅', {
        duration: 5000
      });
      
      // إعادة التوجيه بعد 3 ثواني
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (error) {
      console.error('Payment confirmation error:', error);
      toast.error('حدث خطأ أثناء تأكيد الدفع. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <FaInfoCircle className="text-primary text-4xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">يرجى تسجيل الدخول أولاً</h2>
          <p className="mb-4">يجب عليك تسجيل الدخول قبل إتمام عملية الشراء.</p>
          <Link 
            href={`/login?redirect=/courses/${courseId}/payment`}
            className="inline-block bg-primary text-white rounded-lg px-6 py-2 hover:bg-primary-dark transition-colors"
          >
            تسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <FaInfoCircle className="text-red-500 text-4xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">خطأ في تحميل بيانات الكورس</h2>
          <p className="mb-4">لم نتمكن من العثور على بيانات الكورس المطلوب.</p>
          <Link 
            href="/courses" 
            className="inline-block bg-primary text-white rounded-lg px-6 py-2 hover:bg-primary-dark transition-colors"
          >
            العودة إلى الكورسات
          </Link>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">تم تأكيد دفعتك بنجاح!</h2>
          <p className="text-gray-600 mb-6">يمكنك الآن الوصول الكامل إلى محتوى الكورس</p>
          <Link 
            href={`/courses/${courseId}`} 
            className="inline-block bg-primary text-white rounded-lg px-6 py-3 hover:bg-primary-dark transition-colors font-bold"
          >
            بدء التعلم الآن
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-16 min-h-screen bg-gradient-to-br from-background to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container-custom">
        <Link href={`/courses/${courseId}`} className="flex items-center text-primary mb-6 hover:underline transition-colors">
          <FaArrowLeft className="ml-2" /> العودة إلى صفحة الكورس
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="bg-gradient-to-r from-primary/90 to-accent/90 p-8 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/20 opacity-10"></div>
            <div className="relative z-10">
              <h1 className="text-3xl font-bold mb-2">إتمام الدفع</h1>
              <p className="text-white/80">{course.title}</p>
              <div className="mt-4 inline-block bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full text-lg font-bold">
                {course.discountPrice ? (
                  <>
                    <span className="line-through text-white/60 ml-2">{course.price} ج.م</span>
                    <span>{course.discountPrice} ج.م</span>
                  </>
                ) : (
                  <span>{course.price} ج.م</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-5 gap-8 p-8">
            <div className="md:col-span-3 space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-500 p-5 rounded-lg">
                <div className="flex items-start">
                  <FaInfoCircle className="text-blue-500 dark:text-blue-400 text-xl mt-1 ml-3" />
                  <div>
                    <h3 className="font-bold text-lg mb-3 text-gray-800 dark:text-white">كيفية إتمام عملية الدفع:</h3>
                    <ol className="space-y-3 pr-6 list-decimal text-gray-700 dark:text-gray-300">
                      <li>قم بتحويل المبلغ <strong className="text-primary dark:text-primary-light">{course.discountPrice || course.price} ج.م</strong> إلى رقم فودافون كاش الموضح.</li>
                      <li>احتفظ بصورة لإيصال التحويل أو لقطة شاشة تُظهر رقم العملية.</li>
                      <li>اضغط على زر "تأكيد الدفع عبر واتساب" وأرسل صورة الإيصال.</li>
                      <li>سيتم التحقق من الدفع وتفعيل الكورس لك <strong className="text-green-600 dark:text-green-400">خلال ساعة واحدة</strong> في أوقات العمل.</li>
                    </ol>
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-gray-800 shadow-sm">
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-primary rounded-full inline-block"></span>
                  تفاصيل الدفع
                </h3>
                
                <div className="mb-6 border-b dark:border-gray-700 pb-6">
                  <p className="text-gray-600 dark:text-gray-400 mb-2 text-sm">طريقة الدفع:</p>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 bg-red-600 text-white py-1.5 px-3 rounded-full font-bold text-sm">
                      <FaMobileAlt />
                      <span>Vodafone Cash</span>
                    </span>
                    <span className="font-bold text-gray-800 dark:text-white">فودافون كاش</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-600 dark:text-gray-400 mb-2 text-sm">رقم المحفظة:</p>
                  <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 p-4 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-red-600 dark:text-red-400 ml-2"><FaMobileAlt size={20}/></span>
                      <span className="font-mono text-xl font-bold text-gray-800 dark:text-white">{vodafoneNumber}</span>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 ml-auto bg-white dark:bg-gray-700 p-2 rounded-full shadow-sm"
                      onClick={handleCopyNumber}
                      aria-label="نسخ رقم الهاتف"
                    >
                      <FaCopy size={18} />
                    </motion.button>
                  </div>
                  {copied && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-green-500 dark:text-green-400 text-sm mt-2 flex items-center gap-1"
                    >
                      <FaCheckCircle size={14}/> تم نسخ الرقم!
                    </motion.p>
                  )}
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-600 dark:text-gray-400 mb-2 text-sm">اسم المستلم:</p>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg font-bold text-gray-800 dark:text-white border border-gray-100 dark:border-gray-600">
                    {studentName}
                  </div>
                </div>
                
                <div className="mt-8">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleWhatsappClick}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl px-6 py-4 w-full mb-3 font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    <FaWhatsapp size={24} />
                    <span>تأكيد الدفع عبر واتساب</span>
                  </motion.button>
                  <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 text-sm mt-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <p>متاح الآن - سيتم الرد خلال دقائق</p>
                  </div>
                </div>
              </div>
                            <div className="text-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleConfirmPayment}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2 justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      جارِ التأكيد...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 justify-center">
                      <FaCheckCircle />
                      تأكيد إرسال الإيصال
                    </span>
                  )}
                </motion.button>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                  اضغط هنا بعد إرسال صورة الإيصال عبر واتساب ☝️
                </p>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <div className="border border-gray-200 rounded-xl p-6 sticky top-24">
                <h3 className="text-xl font-bold mb-4">ملخص الطلب</h3>
                
                <div className="flex gap-4 border-b pb-4 mb-4">
                  <div className="relative h-20 w-24 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={course.thumbnail || '/placeholder-course.jpg'}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold">{course.title}</h4>
                    {course.discountPrice ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-bold text-lg">{course.discountPrice} ج.م</span>
                        <span className="text-sm text-gray-500 line-through">{course.price} ج.م</span>
                      </div>
                    ) : (
                      <p className="font-bold text-lg mt-1">{course.price} ج.م</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>سعر الكورس</span>
                    <span>{course.price} ج.م</span>
                  </div>
                  {course.discountPrice && (
                    <div className="flex justify-between text-green-600">
                      <span>خصم</span>
                      <span>- {course.price - course.discountPrice} ج.م</span>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>الإجمالي</span>
                    <span>{course.discountPrice || course.price} ج.م</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 