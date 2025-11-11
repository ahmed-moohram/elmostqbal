'use client';

import { useState, useEffect } from 'react';
import { FaWhatsapp, FaCheckCircle, FaTimesCircle, FaClock, FaSearch, FaMoneyBillWave } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface PaymentRequest {
  id: string;
  studentName: string;
  studentPhone: string;
  courseName: string;
  courseId: string;
  amount: number;
  teacherName: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  vodafoneNumber: string;
  notes?: string;
}

export default function PaymentsManagement() {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // محاكاة جلب طلبات الدفع
    const mockPayments: PaymentRequest[] = [
      {
        id: '1',
        studentName: 'أحمد محمد علي',
        studentPhone: '01012345678',
        courseName: 'الرياضيات للصف الثالث الثانوي',
        courseId: '55555555-5555-5555-5555-555555555555',
        amount: 299,
        teacherName: 'أ. محمد أحمد',
        status: 'pending',
        requestDate: new Date().toISOString(),
        vodafoneNumber: '01098765432',
        notes: 'تم التحويل من رقم 01012345678'
      },
      {
        id: '2',
        studentName: 'فاطمة السيد',
        studentPhone: '01234567890',
        courseName: 'اللغة العربية للصف الثاني الإعدادي',
        courseId: '66666666-6666-6666-6666-666666666666',
        amount: 199,
        teacherName: 'أ. فاطمة عبد الله',
        status: 'approved',
        requestDate: new Date(Date.now() - 86400000).toISOString(),
        vodafoneNumber: '01122334455'
      }
    ];
    setPayments(mockPayments);
  }, []);

  const handleApprovePayment = async (paymentId: string) => {
    try {
      // محاكاة تفعيل الاشتراك
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPayments(prev => prev.map(payment => 
        payment.id === paymentId 
          ? { ...payment, status: 'approved' as const }
          : payment
      ));
      
      toast.success('✅ تم تفعيل الاشتراك بنجاح');
      
      // إرسال إشعار للطالب (محاكاة)
      console.log('إرسال إشعار للطالب بتفعيل الاشتراك');
    } catch (error) {
      toast.error('حدث خطأ في تفعيل الاشتراك');
    }
  };

  const handleRejectPayment = async (paymentId: string, reason?: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPayments(prev => prev.map(payment => 
        payment.id === paymentId 
          ? { ...payment, status: 'rejected' as const, notes: reason }
          : payment
      ));
      
      toast.success('تم رفض طلب الدفع');
      
      // إرسال إشعار للطالب بالرفض
      console.log('إرسال إشعار للطالب بالرفض:', reason);
    } catch (error) {
      toast.error('حدث خطأ في معالجة الطلب');
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesFilter = 
      filter === 'all' || 
      payment.status === filter;
    
    const matchesSearch = 
      payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.studentPhone.includes(searchTerm) ||
      payment.courseName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const stats = {
    pending: payments.filter(p => p.status === 'pending').length,
    approved: payments.filter(p => p.status === 'approved').length,
    rejected: payments.filter(p => p.status === 'rejected').length,
    totalAmount: payments.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0)
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FaMoneyBillWave />
            إدارة المدفوعات والاشتراكات
          </h1>
          <p className="text-green-100 mt-1">تفعيل الاشتراكات بعد التحقق من المدفوعات</p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">في الانتظار</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <FaClock className="text-4xl text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">مفعّل</p>
                <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <FaCheckCircle className="text-4xl text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">مرفوض</p>
                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <FaTimesCircle className="text-4xl text-red-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">إجمالي المدفوعات</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalAmount} جنيه</p>
              </div>
              <FaMoneyBillWave className="text-4xl text-purple-500" />
            </div>
          </div>
        </div>

        {/* الفلاتر والبحث */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'all' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'pending' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                في الانتظار ({stats.pending})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'approved' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                مفعّل
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'rejected' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                مرفوض
              </button>
            </div>

            <div className="relative">
              <FaSearch className="absolute right-3 top-3 text-gray-400" />
              <input
                type="search"
                placeholder="بحث بالاسم أو الرقم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 pl-4 py-2 border rounded-lg focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          {/* جدول المدفوعات */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    الطالب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    الكورس
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    المبلغ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    رقم فودافون
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.studentName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <FaWhatsapp className="text-green-600" />
                          <span dir="ltr">{payment.studentPhone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-gray-900">
                          {payment.courseName}
                        </div>
                        <div className="text-xs text-gray-500">
                          المدرس: {payment.teacherName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-green-600">
                        {payment.amount} جنيه
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span dir="ltr" className="text-sm">
                        {payment.vodafoneNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(payment.requestDate).toLocaleDateString('ar-EG')}
                      <br />
                      {new Date(payment.requestDate).toLocaleTimeString('ar-EG')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        payment.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-700'
                          : payment.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {payment.status === 'pending' ? 'في الانتظار'
                          : payment.status === 'approved' ? 'مفعّل'
                          : 'مرفوض'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {payment.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprovePayment(payment.id)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition"
                            title="تفعيل الاشتراك"
                          >
                            تفعيل
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('سبب الرفض:');
                              if (reason) handleRejectPayment(payment.id, reason);
                            }}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition"
                            title="رفض"
                          >
                            رفض
                          </button>
                        </div>
                      )}
                      {payment.notes && (
                        <div className="text-xs text-gray-500 mt-1">
                          ملاحظة: {payment.notes}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredPayments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                لا توجد طلبات دفع
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
