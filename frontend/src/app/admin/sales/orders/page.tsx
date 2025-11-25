'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { FaClipboardList, FaSearch, FaEye, FaCheck, FaTimes } from 'react-icons/fa';
import supabase from '@/lib/supabase-client';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(
          `
          id,
          amount,
          status,
          payment_method,
          payment_date,
          transaction_id,
          user:users ( id, name ),
          course:courses ( id, title )
        `
        )
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('خطأ في جلب الطلبات:', error);
        setOrders([]);
        return;
      }

      const transformed = (data || []).map((row: any) => {
        const rawStatus = (row.status || '').toLowerCase();
        let status: 'completed' | 'pending' | 'cancelled' = 'pending';

        if (['success', 'completed', 'paid'].includes(rawStatus)) {
          status = 'completed';
        } else if (['pending', 'processing', 'waiting'].includes(rawStatus)) {
          status = 'pending';
        } else if (rawStatus) {
          status = 'cancelled';
        }

        return {
          id: row.id,
          studentName: row.user?.name || 'طالب',
          courseName: row.course?.title || 'دورة',
          amount: Number(row.amount) || 0,
          status,
          date: row.payment_date
            ? new Date(row.payment_date).toLocaleString('ar-EG')
            : '',
          paymentMethod: row.payment_method || '',
        };
      });

      setOrders(transformed);
    } catch (error) {
      console.error('خطأ غير متوقع في جلب الطلبات:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FaClipboardList className="text-primary" />
            الطلبات
          </h1>
        </div>

        {/* إحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">إجمالي الطلبات</p>
            <p className="text-2xl font-bold text-blue-600">{orders.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">مكتملة</p>
            <p className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === 'completed').length}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">قيد المعالجة</p>
            <p className="text-2xl font-bold text-yellow-600">{orders.filter(o => o.status === 'pending').length}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">ملغاة</p>
            <p className="text-2xl font-bold text-red-600">{orders.filter(o => o.status === 'cancelled').length}</p>
          </div>
        </div>

        {/* بحث */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="relative">
            <FaSearch className="absolute right-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث عن طلب..."
              className="w-full pr-10 pl-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* قائمة الطلبات */}
        <div className="bg-white rounded-lg shadow p-6">
          {loading ? (
            <p className="text-center text-gray-500 py-8">جاري التحميل...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">#</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الطالب</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الدورة</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">المبلغ</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الحالة</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">التاريخ</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.filter(o => !searchTerm || o.studentName.includes(searchTerm) || o.courseName.includes(searchTerm)).map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">#{order.id}</td>
                      <td className="px-4 py-3 text-sm font-medium">{order.studentName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{order.courseName}</td>
                      <td className="px-4 py-3 text-sm font-bold text-green-600">{order.amount} ج.م</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.status === 'completed' ? 'مكتمل' : order.status === 'pending' ? 'قيد المعالجة' : 'ملغي'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{order.date}</td>
                      <td className="px-4 py-3 text-sm">
                        <button className="text-blue-600 hover:text-blue-800" title="عرض التفاصيل">
                          <FaEye />
                        </button>
                      </td>
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
