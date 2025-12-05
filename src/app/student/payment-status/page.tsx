'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaClock, 
  FaCheckCircle, 
  FaTimesCircle,
  FaSpinner,
  FaWhatsapp,
  FaBook,
  FaMoneyBill,
  FaCalendar,
  FaRedo
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface PaymentRequest {
  id: string;
  student_name: string;
  course_name: string;
  course_id: string;
  course_price: number;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  rejection_reason?: string;
  created_at: string;
  approved_at?: string;
}

export default function PaymentStatusPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [studentPhone, setStudentPhone] = useState('');

  useEffect(() => {
    // جلب رقم الطالب من localStorage
    const studentInfo = localStorage.getItem('studentInfo');
    if (studentInfo) {
      const data = JSON.parse(studentInfo);
      if (data.phone) {
        setStudentPhone(data.phone);
        fetchMyRequests(data.phone);
        
        // تحديث تلقائي كل 10 ثوانٍ للطلبات المعلقة
        const interval = setInterval(() => {
          checkForUpdates(data.phone);
        }, 10000);
        
        return () => clearInterval(interval);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchMyRequests = async (phone: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payment-request?studentPhone=${phone}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setRequests(data.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
        
        // التحقق من وجود طلبات مقبولة
        const approvedRequests = data.filter(r => r.status === 'approved');
        if (approvedRequests.length > 0) {
          toast.success('🎉 تم قبول طلبك! يمكنك الآن الوصول للكورسات');
          
          // حفظ حالة الاشتراكات
          approvedRequests.forEach(req => {
            localStorage.setItem(`enrollment_${req.course_id}`, 'true');
          });
        }
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('خطأ في جلب حالة الطلبات');
    } finally {
      setLoading(false);
    }
  };

  const checkForUpdates = async (phone: string) => {
    try {
      setChecking(true);
      const response = await fetch(`/api/payment-request?studentPhone=${phone}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const oldRequests = requests;
        setRequests(data.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
        
        // التحقق من التغييرات
        data.forEach(newReq => {
          const oldReq = oldRequests.find(r => r.id === newReq.id);
          if (oldReq && oldReq.status !== newReq.status) {
            if (newReq.status === 'approved') {
              toast.success(`✅ تم قبول طلبك لكورس: ${newReq.course_name}`);
              localStorage.setItem(`enrollment_${newReq.course_id}`, 'true');
              
              // إعادة توجيه للكورس بعد 3 ثوانٍ
              setTimeout(() => {
                router.push(`/courses/${newReq.course_id}`);
              }, 3000);
            } else if (newReq.status === 'rejected') {
              toast.error(`❌ تم رفض طلبك لكورس: ${newReq.course_name}`);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error checking updates:', error);
    } finally {
      setChecking(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex flex-col items-center">
            <div className="bg-yellow-100 rounded-full p-6 mb-4">
              <FaClock className="text-5xl text-yellow-600 animate-pulse" />
            </div>
            <span className="text-2xl font-bold text-yellow-700">في الانتظار</span>
            <p className="text-gray-600 mt-2 text-center">
              طلبك قيد المراجعة وسيتم الرد عليك قريباً
            </p>
          </div>
        );
      case 'approved':
        return (
          <div className="flex flex-col items-center">
            <div className="bg-green-100 rounded-full p-6 mb-4">
              <FaCheckCircle className="text-5xl text-green-600" />
            </div>
            <span className="text-2xl font-bold text-green-700">تم القبول</span>
            <p className="text-gray-600 mt-2 text-center">
              تم تفعيل اشتراكك! يمكنك الآن الوصول للكورس
            </p>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex flex-col items-center">
            <div className="bg-red-100 rounded-full p-6 mb-4">
              <FaTimesCircle className="text-5xl text-red-600" />
            </div>
            <span className="text-2xl font-bold text-red-700">مرفوض</span>
            <p className="text-gray-600 mt-2 text-center">
              عذراً، تم رفض طلبك. يرجى مراجعة السبب أدناه
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="text-4xl text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (!studentPhone) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="bg-gray-100 rounded-full p-6 inline-block mb-4">
            <FaTimesCircle className="text-4xl text-gray-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4">غير مسجل</h2>
          <p className="text-gray-600 mb-6">
            يجب عليك التسجيل أولاً لمتابعة طلبات الدفع
          </p>
          <button
            onClick={() => router.push('/register')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
          >
            التسجيل الآن
          </button>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="bg-gray-100 rounded-full p-6 inline-block mb-4">
            <FaBook className="text-4xl text-gray-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4">لا توجد طلبات</h2>
          <p className="text-gray-600 mb-6">
            لم تقم بإرسال أي طلبات دفع حتى الآن
          </p>
          <button
            onClick={() => router.push('/courses')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
          >
            استعرض الكورسات
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">حالة طلبات الدفع</h1>
            <button
              onClick={() => fetchMyRequests(studentPhone)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              disabled={checking}
            >
              <FaRedo className={checking ? 'animate-spin' : ''} />
              تحديث
            </button>
          </div>
          
          {checking && (
            <div className="mt-4 text-center text-sm text-gray-600">
              <FaSpinner className="inline animate-spin mr-2" />
              جاري التحقق من التحديثات...
            </div>
          )}
        </div>

        {/* Requests List */}
        <div className="space-y-6">
          {requests.map((request, index) => (
            <div 
              key={request.id} 
              className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                index === 0 ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* Status Header */}
              <div className={`p-6 ${
                request.status === 'pending' ? 'bg-yellow-50' :
                request.status === 'approved' ? 'bg-green-50' :
                'bg-red-50'
              }`}>
                {getStatusDisplay(request.status)}
              </div>

              {/* Request Details */}
              <div className="p-6 space-y-4">
                {/* Course Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <FaBook className="text-blue-600" />
                    معلومات الكورس
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">اسم الكورس:</span>
                      <span className="font-medium">{request.course_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">السعر:</span>
                      <span className="font-medium text-green-600">{request.course_price} جنيه</span>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <FaCalendar className="text-purple-600" />
                    التوقيت
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">تاريخ الطلب:</span>
                      <span className="font-medium">
                        {new Date(request.created_at).toLocaleString('ar-EG')}
                      </span>
                    </div>
                    {request.approved_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">تاريخ الموافقة:</span>
                        <span className="font-medium text-green-600">
                          {new Date(request.approved_at).toLocaleString('ar-EG')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Notes */}
                {request.admin_notes && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-bold text-blue-800 mb-2">ملاحظات الإدارة:</h4>
                    <p className="text-blue-700">{request.admin_notes}</p>
                  </div>
                )}

                {/* Rejection Reason */}
                {request.rejection_reason && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <h4 className="font-bold text-red-800 mb-2">سبب الرفض:</h4>
                    <p className="text-red-700">{request.rejection_reason}</p>
                    <button
                      onClick={() => window.open('https://wa.me/201012345678', '_blank')}
                      className="mt-3 flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                    >
                      <FaWhatsapp />
                      تواصل معنا عبر الواتساب
                    </button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {request.status === 'approved' && (
                    <button
                      onClick={() => router.push(`/courses/${request.course_id}`)}
                      className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <FaBook />
                      الذهاب للكورس
                    </button>
                  )}
                  
                  {request.status === 'pending' && (
                    <div className="flex-1 text-center">
                      <div className="bg-yellow-100 text-yellow-800 py-3 px-4 rounded-lg">
                        <FaSpinner className="inline animate-spin mr-2" />
                        يتم مراجعة طلبك... (متوسط الوقت: 30 دقيقة)
                      </div>
                    </div>
                  )}
                  
                  {request.status === 'rejected' && (
                    <button
                      onClick={() => router.push('/courses')}
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
                    >
                      تصفح كورسات أخرى
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-800 mb-3">معلومات مهمة:</h3>
          <ul className="space-y-2 text-blue-700">
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>يتم مراجعة الطلبات عادة خلال 30 دقيقة من إرسالها</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>سيتم تفعيل اشتراكك تلقائياً عند قبول الطلب</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>الصفحة تتحدث تلقائياً كل 10 ثوانٍ للتحقق من التحديثات</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>في حالة الرفض، يمكنك التواصل معنا لمعرفة السبب</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
