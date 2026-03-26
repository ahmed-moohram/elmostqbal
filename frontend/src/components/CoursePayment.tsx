"use client";

import { useState, useEffect } from 'react';
import { FaMoneyBill, FaClock, FaCopy, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

interface FawryPaymentProps {
  courseId: number;
  courseTitle: string;
  coursePrice: number;
  onPaymentComplete: () => void;
}

// دالة لحفظ معلومات الطلب في localStorage
const saveOrderInfo = (code: string, expiry: Date, courseId: number) => {
  try {
    const orderInfo = {
      paymentCode: code,
      expiryDate: expiry.toISOString(),
      courseId: courseId,
      createdAt: new Date().toISOString()
    };
    
    // الحصول على الطلبات السابقة إن وجدت
    const existingOrders = localStorage.getItem('fawryOrders');
    let orders = existingOrders ? JSON.parse(existingOrders) : [];
    
    // إضافة الطلب الجديد
    orders.push(orderInfo);
    
    // حفظ الطلبات في localStorage
    localStorage.setItem('fawryOrders', JSON.stringify(orders));
  } catch (error) {
    console.error('خطأ في حفظ معلومات الطلب:', error);
  }
};

const CoursePayment = ({ courseId, courseTitle, coursePrice, onPaymentComplete }: FawryPaymentProps) => {
  const [paymentCode, setPaymentCode] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<string>('');

  // إنشاء رمز الدفع
  useEffect(() => {
    generatePaymentCode();
  }, []);

  // تنفيذ العد التنازلي للوقت المتبقي
  useEffect(() => {
    if (!expiryDate) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = expiryDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        setCountdown('انتهى الوقت');
        return;
      }
      
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      
      setCountdown(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };
    
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(timer);
  }, [expiryDate]);

  // إنشاء رمز الدفع من فوري
  const generatePaymentCode = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // في هذا المثال سنقوم بإنشاء رمز وهمي
      // في التطبيق الفعلي، هنا ستقوم بالاتصال بـ API خاص بخدمة فوري
      
      // محاكاة طلب API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // إنشاء رمز وهمي
      const fawryCode = Math.floor(100000000 + Math.random() * 900000000).toString();
      setPaymentCode(fawryCode);
      
      // تحديد وقت انتهاء الصلاحية (12 ساعة من الآن)
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 12);
      setExpiryDate(expiry);

      // حفظ معلومات الطلب في localStorage للتتبع
      saveOrderInfo(fawryCode, expiry, courseId);
      
      setIsLoading(false);
    } catch (error) {
      console.error('خطأ في إنشاء رمز الدفع', error);
      setError('حدث خطأ أثناء إنشاء رمز الدفع. الرجاء المحاولة مرة أخرى.');
      setIsLoading(false);
    }
  };

  // نسخ رمز الدفع
  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(paymentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
      <h2 className="text-2xl font-bold text-blue-800 mb-6 flex items-center gap-2">
        <FaMoneyBill className="text-blue-600" />
        الدفع عبر خدمة فوري
      </h2>
      
      {error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-2">
          <FaExclamationTriangle />
          {error}
          <button 
            onClick={generatePaymentCode}
            className="mr-auto text-sm bg-red-700 text-white px-3 py-1 rounded hover:bg-red-800"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : isLoading ? (
        <div className="py-8 text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-solid border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-600">جاري إنشاء رمز الدفع...</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">اسم الكورس:</span>
              <span className="font-bold">{courseTitle}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">المبلغ المطلوب:</span>
              <span className="font-bold text-green-600">{coursePrice} ج.م</span>
            </div>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-lg mb-6">
            <h3 className="text-blue-800 font-bold mb-2">رمز الدفع الخاص بك:</h3>
            <div className="flex items-center">
              <div className="bg-white p-4 rounded-lg border border-blue-200 font-mono text-xl font-bold text-blue-900 flex-grow">
                {paymentCode}
              </div>
              <button 
                onClick={copyCodeToClipboard}
                className="ml-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                title="نسخ الرمز"
              >
                {copied ? <FaCheck /> : <FaCopy />}
              </button>
            </div>
            
            <div className="mt-4 flex items-center text-blue-700">
              <FaClock className="mr-2" />
              <span>ينتهي بعد: </span>
              <span className="font-mono ml-2 font-bold">{countdown}</span>
            </div>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg mb-6 text-sm">
            <h3 className="font-bold text-amber-800 mb-2">طريقة الدفع:</h3>
            <ol className="list-decimal list-inside text-amber-700 space-y-2">
              <li>قم بزيارة أقرب منفذ لخدمة فوري</li>
              <li>اطلب من الموظف الدفع باستخدام رمز فوري</li>
              <li>زود الموظف بالرمز المذكور أعلاه</li>
              <li>قم بدفع المبلغ المطلوب + رسوم الخدمة</li>
              <li>احتفظ بإيصال الدفع</li>
              <li>سيتم تفعيل الكورس خلال 15 دقيقة كحد أقصى من استلام الدفع</li>
            </ol>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={onPaymentComplete}
              className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 font-bold"
            >
              العودة للرئيسية
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 font-bold"
            >
              طباعة التفاصيل
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CoursePayment; 