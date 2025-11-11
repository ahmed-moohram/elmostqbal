'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaWhatsapp, FaCheckCircle, FaArrowLeft, FaInfoCircle, FaCopy, FaMobileAlt } from 'react-icons/fa';

interface CourseDetails {
  id: number;
  title: string;
  price: number;
  discountPrice: number | null;
  thumbnail: string;
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params?.id);
  
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vodafoneNumber] = useState('01070333143');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // التحقق من تسجيل دخول المستخدم
  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      router.push(`/login?redirect=/courses/${courseId}/payment`);
      return;
    }
    setIsLoggedIn(true);
  }, [courseId, router]);

  // استرداد بيانات الكورس
  useEffect(() => {
    const fetchCourseDetails = async () => {
      setIsLoading(true);
      try {
        // هنا يمكن استرداد البيانات من API حقيقي
        // لكن سنستخدم بيانات وهمية للتوضيح
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setCourse({
          id: courseId,
          title: "جبر ثانوية عامة",
          price: 550,
          discountPrice: 450,
          thumbnail: "/course-thumbnails/math.jpg",
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching course:', error);
        setIsLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId]);

  // نسخ رقم فودافون كاش
  const handleCopyNumber = () => {
    navigator.clipboard.writeText(vodafoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // فتح محادثة واتساب
  const handleWhatsappClick = () => {
    const message = `السلام عليكم، لقد قمت بتحويل مبلغ ${course?.discountPrice || course?.price} جنيه لشراء كورس "${course?.title}" وهذه صورة إيصال الدفع.`;
    const whatsappUrl = `https://wa.me/${vodafoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // تسجيل عملية الشراء (وهمي للتوضيح)
  const handleConfirmPayment = async () => {
    setIsSubmitting(true);
    
    try {
      // هنا يمكن إضافة طلب API حقيقي لتسجيل عملية الشراء
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // تسجيل الكورس كمشترى في localStorage (للتوضيح فقط)
      const purchasedCourses = JSON.parse(localStorage.getItem('purchasedCourses') || '[]');
      if (!purchasedCourses.includes(courseId)) {
        purchasedCourses.push(courseId);
        localStorage.setItem('purchasedCourses', JSON.stringify(purchasedCourses));
      }
      
      setPaymentSuccess(true);
      
      // إعادة التوجيه إلى صفحة الكورس بعد فترة
      setTimeout(() => {
        router.push(`/courses/${courseId}`);
      }, 3000);
    } catch (error) {
      console.error('Payment confirmation error:', error);
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

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700"
        >
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
                    MR
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
                  className="bg-gradient-primary px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-all duration-300"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      جارِ التحقق...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <FaCheckCircle />
                      دليلك يا دكتور انك شحنت
                    </span>
                  )}
                </motion.button>
                <p className="text-gray-500 text-sm mt-2">اضغط هنا بعد إرسال صورة الإيصال</p>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 sticky top-24 bg-white dark:bg-gray-800">
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">ملخص الطلب</h3>
                
                <div className="flex gap-4 border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
                  <div className="relative h-20 w-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <Image
                      src={course.thumbnail || '/placeholder-course.jpg'}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-white">{course.title}</h4>
                    {course.discountPrice ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-bold text-lg text-gray-800 dark:text-white">{course.discountPrice} ج.م</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 line-through">{course.price} ج.م</span>
                      </div>
                    ) : (
                      <p className="font-bold text-lg mt-1 text-gray-800 dark:text-white">{course.price} ج.م</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-gray-700 dark:text-gray-300">
                    <span>سعر الكورس</span>
                    <span>{course.price} ج.م</span>
                  </div>
                  {course.discountPrice && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>خصم</span>
                      <span>- {course.price - course.discountPrice} ج.م</span>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                  <div className="flex justify-between font-bold text-lg text-gray-800 dark:text-white">
                    <span>الإجمالي</span>
                    <span>{course.discountPrice || course.price} ج.م</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
