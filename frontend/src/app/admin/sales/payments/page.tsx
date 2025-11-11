'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { FaMoneyBillWave, FaCreditCard, FaMobileAlt, FaUniversity, FaCheckCircle } from 'react-icons/fa';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    const mockPayments = [
      { id: 1, student: 'أحمد محمد', amount: 500, method: 'credit_card', status: 'success', date: '2024-10-01 14:30', transactionId: 'TXN001' },
      { id: 2, student: 'فاطمة علي', amount: 350, method: 'vodafone_cash', status: 'success', date: '2024-10-05 09:15', transactionId: 'TXN002' },
      { id: 3, student: 'محمد حسن', amount: 600, method: 'credit_card', status: 'success', date: '2024-10-03 16:45', transactionId: 'TXN003' },
      { id: 4, student: 'خالد يوسف', amount: 550, method: 'bank_transfer', status: 'success', date: '2024-10-04 11:20', transactionId: 'TXN004' },
      { id: 5, student: 'نور محمود', amount: 400, method: 'vodafone_cash', status: 'pending', date: '2024-10-06 10:00', transactionId: 'TXN005' },
    ];
    const totalRevenue = mockPayments.filter(p => p.status === 'success').reduce((sum, p) => sum + p.amount, 0);
    const thisMonth = mockPayments.filter(p => p.status === 'success' && p.date.startsWith('2024-10')).reduce((sum, p) => sum + p.amount, 0);
    const avgPayment = totalRevenue / mockPayments.filter(p => p.status === 'success').length;
    
    setTimeout(() => {
      setPayments(mockPayments);
      setLoading(false);
    }, 300);
  };

  const totalRevenue = payments.filter(p => p.status === 'success').reduce((sum, p) => sum + p.amount, 0);
  const thisMonth = payments.filter(p => p.status === 'success' && p.date.startsWith('2024-10')).reduce((sum, p) => sum + p.amount, 0);
  const avgPayment = payments.filter(p => p.status === 'success').length > 0 ? totalRevenue / payments.filter(p => p.status === 'success').length : 0;
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FaMoneyBillWave className="text-primary" />
            المدفوعات
          </h1>
        </div>

        {/* إحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 p-6 rounded-lg">
            <p className="text-sm text-gray-600">إجمالي الإيرادات</p>
            <p className="text-2xl font-bold text-green-600">{totalRevenue.toLocaleString()} ج.م</p>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg">
            <p className="text-sm text-gray-600">هذا الشهر</p>
            <p className="text-2xl font-bold text-blue-600">{thisMonth.toLocaleString()} ج.م</p>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg">
            <p className="text-sm text-gray-600">متوسط الدفعة</p>
            <p className="text-2xl font-bold text-purple-600">{Math.round(avgPayment).toLocaleString()} ج.م</p>
          </div>
        </div>

        {/* قائمة المدفوعات */}
        <div className="bg-white rounded-lg shadow p-6">
          {loading ? (
            <p className="text-center text-gray-500 py-8">جاري التحميل...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">المعاملة</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الطالب</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">المبلغ</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">طريقة الدفع</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الحالة</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-500">{payment.transactionId}</td>
                      <td className="px-4 py-3 text-sm font-medium">{payment.student}</td>
                      <td className="px-4 py-3 text-sm font-bold text-green-600">{payment.amount} ج.م</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          {payment.method === 'credit_card' && <FaCreditCard className="text-blue-600" />}
                          {payment.method === 'vodafone_cash' && <FaMobileAlt className="text-red-600" />}
                          {payment.method === 'bank_transfer' && <FaUniversity className="text-purple-600" />}
                          <span className="text-gray-600">
                            {payment.method === 'credit_card' ? 'بطاقة ائتمان' : 
                             payment.method === 'vodafone_cash' ? 'فودافون كاش' : 'تحويل بنكي'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 w-fit ${
                          payment.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.status === 'success' && <FaCheckCircle />}
                          {payment.status === 'success' ? 'ناجح' : 'قيد المراجعة'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{payment.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
