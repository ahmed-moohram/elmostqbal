"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowRight, FaInfoCircle, FaShoppingCart, FaLock, FaBook } from 'react-icons/fa';
import CoursePayment from '../../../../components/CoursePayment';

// نموذج بيانات الكورس
interface Course {
  id: number;
  title: string;
  price: number;
  discountPrice: number | null;
  thumbnail: string;
  instructor: string;
  category: string;
  isPaid: boolean;
  paymentMethod: string;
}

export default function CourseCheckout() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentStep, setPaymentStep] = useState<'summary' | 'payment' | 'confirmation'>('summary');

  // استرداد معلومات الكورس
  useEffect(() => {
    if (!courseId) {
      setError('معرف الكورس غير صالح');
      setIsLoading(false);
      return;
    }

    // في الواقع، هذا سيكون طلب API لجلب بيانات الكورس بناءً على المعرف
    // للتبسيط، سنستخدم بيانات وهمية
    const fetchCourse = async () => {
      try {
        // محاكاة استرداد البيانات
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // استرداد بيانات الكورسات المحفوظة (في بيئة الإنتاج، هذا سيكون طلب API)
        const coursesData = localStorage.getItem('courses');
        const courses = coursesData ? JSON.parse(coursesData) : [];
        
        // البحث عن الكورس بالمعرف
        const foundCourse = courses.find((c: any) => c.id === courseId);
        
        if (foundCourse) {
          setCourse(foundCourse);
        } else {
          setError('الكورس غير موجود');
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('خطأ في استرداد بيانات الكورس', err);
        setError('حدث خطأ أثناء استرداد بيانات الكورس');
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  // التحقق من تسجيل دخول المستخدم
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.replace(`/login?redirect=/courses/${courseId}/checkout`);
    }
  }, [courseId, router]);

  // حساب السعر النهائي
  const finalPrice = course?.discountPrice || course?.price || 0;

  // المتابعة إلى الدفع
  const proceedToPayment = () => {
    setPaymentStep('payment');
  };

  // إتمام عملية الدفع
  const completePayment = () => {
    setPaymentStep('confirmation');
    // في التطبيق الفعلي، هنا يمكنك تنفيذ المزيد من الإجراءات بعد الدفع
  };

  // العودة للصفحة الرئيسية
  const goToHome = () => {
    router.replace('/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-solid border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="bg-red-50 p-8 rounded-lg text-center">
        <FaInfoCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl text-red-800 mb-2">خطأ</h2>
        <p className="text-red-700 mb-6">{error || 'لا يمكن استرداد بيانات الكورس'}</p>
        <Link href="/courses" className="bg-blue-600 text-white px-6 py-3 rounded-lg inline-block hover:bg-blue-700">
          العودة إلى الكورسات
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link href={`/courses/${courseId}`} className="text-blue-600 flex items-center hover:underline">
          <FaArrowRight className="ml-1" /> العودة إلى تفاصيل الكورس
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold text-blue-900 mb-8 text-center">إتمام عملية الشراء</h1>
      
      {/* مراحل الدفع */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center text-sm">
          <div className={`flex flex-col items-center ${paymentStep === 'summary' ? 'text-blue-600' : 'text-gray-500'}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center mb-1 ${
              paymentStep === 'summary' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              1
            </div>
            <span>ملخص الطلب</span>
          </div>
          <div className={`w-20 h-0.5 mx-2 ${paymentStep !== 'summary' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`flex flex-col items-center ${paymentStep === 'payment' ? 'text-blue-600' : 'text-gray-500'}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center mb-1 ${
              paymentStep === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              2
            </div>
            <span>الدفع</span>
          </div>
          <div className={`w-20 h-0.5 mx-2 ${paymentStep === 'confirmation' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`flex flex-col items-center ${paymentStep === 'confirmation' ? 'text-blue-600' : 'text-gray-500'}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center mb-1 ${
              paymentStep === 'confirmation' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}>
              3
            </div>
            <span>التأكيد</span>
          </div>
        </div>
      </div>
      
      {paymentStep === 'summary' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-blue-800 flex items-center gap-2 mb-4">
              <FaShoppingCart className="text-blue-600" />
              ملخص الطلب
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="md:col-span-1">
                <div className="bg-gray-100 rounded-lg overflow-hidden">
                  {course.thumbnail ? (
                    <img 
                      src={course.thumbnail} 
                      alt={course.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="aspect-video bg-blue-200 flex items-center justify-center">
                      <FaBook size={32} className="text-blue-600" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="md:col-span-4">
                <h3 className="text-lg font-bold mb-2">{course.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="flex items-center gap-1">
                      <span className="text-gray-600">المدرس:</span>
                      <span className="font-medium">{course.instructor}</span>
                    </p>
                    <p className="flex items-center gap-1">
                      <span className="text-gray-600">الفئة:</span>
                      <span className="font-medium">{course.category}</span>
                    </p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1">
                      <span className="text-gray-600">نوع الكورس:</span>
                      <span className="font-medium">{course.isPaid ? 'مدفوع' : 'مجاني'}</span>
                    </p>
                    <p className="flex items-center gap-1">
                      <span className="text-gray-600">طريقة الدفع:</span>
                      <span className="font-medium">{course.paymentMethod || '-'}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-gray-50">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
              <span className="text-gray-700">سعر الكورس</span>
              <span>{course.price} ج.م</span>
            </div>
            
            {course.discountPrice !== null && (
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                <span className="text-gray-700">الخصم</span>
                <span className="text-red-600">-{course.price - course.discountPrice} ج.م</span>
              </div>
            )}
            
            <div className="flex justify-between items-center mb-4 text-lg font-bold">
              <span>السعر النهائي</span>
              <span className="text-green-600">{finalPrice} ج.م</span>
            </div>
            
            <button
              onClick={proceedToPayment}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 font-bold flex items-center justify-center gap-2"
              disabled={!course.isPaid}
            >
              <FaLock />
              {course.isPaid ? 'المتابعة للدفع' : 'الكورس مجاني، لا يلزم الدفع'}
            </button>
            
            {!course.isPaid && (
              <p className="text-center text-sm text-gray-600 mt-2">
                هذا الكورس مجاني، يمكنك الوصول إليه مباشرة من خلال لوحة التحكم الخاصة بك.
              </p>
            )}
          </div>
        </div>
      )}
      
      {paymentStep === 'payment' && course.isPaid && (
        <CoursePayment
          courseId={course.id}
          courseTitle={course.title}
          coursePrice={finalPrice}
          onPaymentComplete={completePayment}
        />
      )}
      
      {paymentStep === 'confirmation' && (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <FaCheck size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-700 mb-2">تم إنشاء كود الدفع بنجاح!</h2>
          <p className="text-gray-600 mb-8">سيتم تفعيل الكورس خلال 15 دقيقة كحد أقصى من استلام الدفع.</p>
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={goToHome}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// أيقونة الصح
function FaCheck(props: any) {
  return (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path>
    </svg>
  );
} 