'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { FaMoneyBillWave, FaCreditCard, FaMobileAlt, FaUniversity, FaCheckCircle } from 'react-icons/fa';
import supabase from '@/lib/supabase-client';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(
          `
          id,
          amount,
          payment_method,
          status,
          payment_date,
          transaction_id,
          user:users ( id, name )
        `
        )
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('خطأ في جلب المدفوعات:', error);
        setPayments([]);
        return;
      }

      const transformed = (data || []).map((row: any) => ({
        id: row.id,
        student: row.user?.name || 'طالب',
        amount: Number(row.amount) || 0,
        method: row.payment_method || '',
        status: row.status || '',
        rawDate: row.payment_date ? new Date(row.payment_date) : null,
        date: row.payment_date
          ? new Date(row.payment_date).toLocaleString('ar-EG')
          : '',
        transactionId: row.transaction_id || '',
      }));

      setPayments(transformed);
    } catch (error) {
      console.error('خطأ غير متوقع في جلب المدفوعات:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const successfulPayments = payments.filter((p: any) => {
    const status = (p.status || '').toLowerCase();
    return ['success', 'completed', 'paid'].includes(status);
  });

  const totalRevenue = successfulPayments.reduce(
    (sum: number, p: any) => sum + (p.amount || 0),
    0
  );

  const now = new Date();
  const thisMonth = successfulPayments
    .filter((p: any) =>
      p.rawDate &&
      p.rawDate.getFullYear() === now.getFullYear() &&
      p.rawDate.getMonth() === now.getMonth()
    )
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  const avgPayment =
    successfulPayments.length > 0
      ? totalRevenue / successfulPayments.length
      : 0;
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
