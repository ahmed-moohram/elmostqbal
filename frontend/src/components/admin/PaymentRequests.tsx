'use client';

import { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaEye, FaWhatsapp, FaUserGraduate, FaBook, FaMoneyBillWave } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface PaymentRequest {
  id: string;
  type: string;
  courseId: number;
  courseName: string;
  studentName: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  phone?: string;
  grade?: string;
}

export default function PaymentRequests() {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchPaymentRequests();
  }, []);

  const fetchPaymentRequests = async () => {
    setIsLoading(true);
    try {
      // في النسخة النهائية، هذا سيكون استدعاء API
      // const response = await fetch('/api/admin/payment-requests');
      // const data = await response.json();
      // setPaymentRequests(data);
      
      // للعرض التوضيحي، نستخدم البيانات المخزنة محلياً
      const adminNotifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
      const paymentReqs = adminNotifications
        .filter(notification => notification.type === 'payment_request')
        .map((req, index) => ({
          ...req,
          id: req.id || `payment-${index + 1}`,
          status: req.status || 'pending'
        }));
      
      setPaymentRequests(paymentReqs);
    } catch (error) {
      console.error('خطأ في جلب طلبات الدفع:', error);
      toast.error('حدث خطأ أثناء جلب طلبات الدفع');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePayment = async (id: string) => {
    try {
      // في النسخة النهائية، هذا سيكون استدعاء API
      // await fetch(`/api/admin/payment-requests/${id}/approve`, {
      //   method: 'POST'
      // });
      
      // للعرض التوضيحي، نحدث البيانات محلياً
      const updatedRequests = paymentRequests.map(req => 
        req.id === id ? { ...req, status: 'approved' as const } : req
      );
      setPaymentRequests(updatedRequests);
      
      // تحديث في التخزين المحلي
      const adminNotifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
      const updatedNotifications = adminNotifications.map(notification => 
        notification.type === 'payment_request' && notification.date === selectedRequest?.date
          ? { ...notification, status: 'approved' }
          : notification
      );
      localStorage.setItem('adminNotifications', JSON.stringify(updatedNotifications));
      
      toast.success('تم الموافقة على طلب الدفع');
      setIsModalOpen(false);
    } catch (error) {
      console.error('خطأ في الموافقة على طلب الدفع:', error);
      toast.error('حدث خطأ أثناء الموافقة على طلب الدفع');
    }
  };

  const handleRejectPayment = async (id: string) => {
    try {
      // في النسخة النهائية، هذا سيكون استدعاء API
      // await fetch(`/api/admin/payment-requests/${id}/reject`, {
      //   method: 'POST'
      // });
      
      // للعرض التوضيحي، نحدث البيانات محلياً
      const updatedRequests = paymentRequests.map(req => 
        req.id === id ? { ...req, status: 'rejected' as const } : req
      );
      setPaymentRequests(updatedRequests);
      
      // تحديث في التخزين المحلي
      const adminNotifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
      const updatedNotifications = adminNotifications.map(notification => 
        notification.type === 'payment_request' && notification.date === selectedRequest?.date
          ? { ...notification, status: 'rejected' }
          : notification
      );
      localStorage.setItem('adminNotifications', JSON.stringify(updatedNotifications));
      
      toast.success('تم رفض طلب الدفع');
      setIsModalOpen(false);
    } catch (error) {
      console.error('خطأ في رفض طلب الدفع:', error);
      toast.error('حدث خطأ أثناء رفض طلب الدفع');
    }
  };

  const handleContactViaWhatsapp = (phone?: string) => {
    if (!phone) return;
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  const handleViewDetails = (request: PaymentRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">طلبات الدفع</h2>
        <button 
          onClick={fetchPaymentRequests}
          className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
        >
          تحديث
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin w-10 h-10 border-3 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : paymentRequests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-xl">
          <FaMoneyBillWave className="text-gray-300 dark:text-gray-500 text-5xl mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">لا توجد طلبات دفع</h3>
          <p className="text-gray-500 dark:text-gray-400">لم يتم العثور على طلبات دفع في النظام حالياً</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-300">#</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-300">الطالب</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-300">الكورس</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-300">المبلغ</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-300">التاريخ</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-300">الحالة</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-300">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paymentRequests.map((request, index) => (
                <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 ml-2">
                        <FaUserGraduate />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{request.studentName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 ml-2">
                        <FaBook />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">{request.courseName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono font-medium text-gray-800 dark:text-gray-200">{request.amount} ج.م</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{new Date(request.date).toLocaleDateString('ar-EG')}</td>
                  <td className="px-4 py-3">
                    {request.status === 'pending' && (
                      <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-500 text-xs font-medium px-2.5 py-1 rounded-full">
                        قيد الانتظار
                      </span>
                    )}
                    {request.status === 'approved' && (
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-500 text-xs font-medium px-2.5 py-1 rounded-full">
                        تمت الموافقة
                      </span>
                    )}
                    {request.status === 'rejected' && (
                      <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-500 text-xs font-medium px-2.5 py-1 rounded-full">
                        مرفوض
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(request)}
                        className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                        title="عرض التفاصيل"
                      >
                        <FaEye />
                      </button>
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprovePayment(request.id)}
                            className="p-1.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                            title="موافقة"
                          >
                            <FaCheck />
                          </button>
                          <button
                            onClick={() => handleRejectPayment(request.id)}
                            className="p-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                            title="رفض"
                          >
                            <FaTimes />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* نافذة تفاصيل طلب الدفع */}
      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-accent p-4 text-white">
              <h3 className="text-xl font-bold">تفاصيل طلب الدفع</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">اسم الطالب</p>
                  <p className="font-medium text-gray-800 dark:text-white">{selectedRequest.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">المبلغ</p>
                  <p className="font-mono font-bold text-primary dark:text-primary-light">{selectedRequest.amount} ج.م</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">الكورس</p>
                  <p className="font-medium text-gray-800 dark:text-white">{selectedRequest.courseName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">التاريخ</p>
                  <p className="font-medium text-gray-800 dark:text-white">{new Date(selectedRequest.date).toLocaleDateString('ar-EG')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">الصف الدراسي</p>
                  <p className="font-medium text-gray-800 dark:text-white">{selectedRequest.grade || 'غير محدد'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">رقم الهاتف</p>
                  <p className="font-medium text-gray-800 dark:text-white">{selectedRequest.phone || 'غير متوفر'}</p>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between">
                <div className="flex space-x-2 space-x-reverse">
                  {selectedRequest.phone && (
                    <button
                      onClick={() => handleContactViaWhatsapp(selectedRequest.phone)}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <FaWhatsapp />
                      تواصل
                    </button>
                  )}
                </div>
                <div className="flex space-x-2 space-x-reverse">
                  {selectedRequest.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprovePayment(selectedRequest.id)}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                      >
                        موافقة
                      </button>
                      <button
                        onClick={() => handleRejectPayment(selectedRequest.id)}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                      >
                        رفض
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
