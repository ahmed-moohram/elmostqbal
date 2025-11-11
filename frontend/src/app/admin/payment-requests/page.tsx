'use client';

import { useState, useEffect } from 'react';
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaClock, 
  FaEye, 
  FaWhatsapp,
  FaPhone,
  FaUser,
  FaBook,
  FaMoneyBill,
  FaCalendar,
  FaSearch,
  FaFilter,
  FaSyncAlt
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface PaymentRequest {
  id: string;
  student_name: string;
  student_phone: string;
  student_email?: string;
  course_id: string;
  course_name: string;
  course_price: number;
  teacher_name?: string;
  teacher_phone?: string;
  payment_method: string;
  transaction_id?: string;
  payment_phone?: string;
  amount_paid: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  admin_notes?: string;
  rejection_reason?: string;
  created_at: string;
  approved_at?: string;
}

export default function PaymentRequestsAdmin() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  
  // إحصائيات
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchRequests();
    // تحديث تلقائي كل 30 ثانية
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const url = filter === 'all' 
        ? '/api/payment-request'
        : `/api/payment-request?status=${filter}`;
        
      const response = await fetch(url);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setRequests(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('خطأ في جلب الطلبات');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: PaymentRequest[]) => {
    const stats = {
      total: data.length,
      pending: data.filter(r => r.status === 'pending').length,
      approved: data.filter(r => r.status === 'approved').length,
      rejected: data.filter(r => r.status === 'rejected').length,
      totalRevenue: data
        .filter(r => r.status === 'approved')
        .reduce((sum, r) => sum + r.amount_paid, 0)
    };
    setStats(stats);
  };

  const handleUpdateStatus = async (requestId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/payment-request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          status: newStatus,
          adminNotes,
          rejectionReason: newStatus === 'rejected' ? rejectionReason : undefined
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
        fetchRequests();
        setShowDetailsModal(false);
        setSelectedRequest(null);
        setAdminNotes('');
        setRejectionReason('');
      } else {
        toast.error(result.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('خطأ في تحديث الحالة');
    }
  };

  const filteredRequests = requests.filter(request => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        request.student_name.toLowerCase().includes(search) ||
        request.student_phone.includes(search) ||
        request.course_name.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
            <FaClock className="text-xs" />
            في الانتظار
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
            <FaCheckCircle className="text-xs" />
            مقبول
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
            <FaTimesCircle className="text-xs" />
            مرفوض
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">إدارة طلبات الدفع</h1>
            <button
              onClick={fetchRequests}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              <FaSyncAlt className={loading ? 'animate-spin' : ''} />
              تحديث
            </button>
          </div>

          {/* الإحصائيات */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
              <div className="text-sm text-gray-600">إجمالي الطلبات</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-800">{stats.pending}</div>
              <div className="text-sm text-yellow-600">في الانتظار</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-800">{stats.approved}</div>
              <div className="text-sm text-green-600">مقبول</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-800">{stats.rejected}</div>
              <div className="text-sm text-red-600">مرفوض</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-800">{stats.totalRevenue.toLocaleString()} جنيه</div>
              <div className="text-sm text-blue-600">إجمالي الإيرادات</div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Filter Tabs */}
            <div className="flex gap-2">
              {['all', 'pending', 'approved', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {status === 'all' ? 'الكل' :
                   status === 'pending' ? 'في الانتظار' :
                   status === 'approved' ? 'مقبول' : 'مرفوض'}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="البحث بالاسم أو الهاتف أو اسم الكورس..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">لا توجد طلبات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الطالب</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الكورس</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">المبلغ</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">التاريخ</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الحالة</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{request.student_name}</div>
                          <div className="text-sm text-gray-500">{request.student_phone}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{request.course_name}</div>
                          {request.teacher_name && (
                            <div className="text-gray-500">المدرس: {request.teacher_name}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-green-600">
                          {request.amount_paid} جنيه
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-600">
                          {new Date(request.created_at).toLocaleDateString('ar-EG')}
                          <br />
                          {new Date(request.created_at).toLocaleTimeString('ar-EG')}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDetailsModal(true);
                            }}
                            className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition"
                            title="عرض التفاصيل"
                          >
                            <FaEye />
                          </button>
                          
                          {request.student_phone && (
                            <a
                              href={`https://wa.me/2${request.student_phone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition"
                              title="واتساب"
                            >
                              <FaWhatsapp />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">تفاصيل طلب الدفع</h2>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedRequest(null);
                      setAdminNotes('');
                      setRejectionReason('');
                    }}
                    className="text-white/80 hover:text-white text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* معلومات الطالب */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <FaUser className="text-blue-600" />
                    معلومات الطالب
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">الاسم:</span>
                      <span className="font-medium mr-2">{selectedRequest.student_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">الهاتف:</span>
                      <span className="font-medium mr-2" dir="ltr">{selectedRequest.student_phone}</span>
                    </div>
                    {selectedRequest.student_email && (
                      <div className="col-span-2">
                        <span className="text-gray-600">البريد:</span>
                        <span className="font-medium mr-2">{selectedRequest.student_email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* معلومات الكورس */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <FaBook className="text-green-600" />
                    معلومات الكورس
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">اسم الكورس:</span>
                      <span className="font-medium mr-2">{selectedRequest.course_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">السعر:</span>
                      <span className="font-medium text-green-600 mr-2">{selectedRequest.course_price} جنيه</span>
                    </div>
                    {selectedRequest.teacher_name && (
                      <div>
                        <span className="text-gray-600">المدرس:</span>
                        <span className="font-medium mr-2">{selectedRequest.teacher_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* معلومات الدفع */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <FaMoneyBill className="text-yellow-600" />
                    معلومات الدفع
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">طريقة الدفع:</span>
                      <span className="font-medium mr-2">فودافون كاش</span>
                    </div>
                    <div>
                      <span className="text-gray-600">المبلغ المدفوع:</span>
                      <span className="font-medium text-green-600 mr-2">{selectedRequest.amount_paid} جنيه</span>
                    </div>
                    {selectedRequest.payment_phone && (
                      <div>
                        <span className="text-gray-600">رقم الدفع:</span>
                        <span className="font-medium mr-2" dir="ltr">{selectedRequest.payment_phone}</span>
                      </div>
                    )}
                    {selectedRequest.transaction_id && (
                      <div>
                        <span className="text-gray-600">رقم المعاملة:</span>
                        <span className="font-medium mr-2">{selectedRequest.transaction_id}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* التوقيت */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <FaCalendar className="text-purple-600" />
                    التوقيت
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">تاريخ الطلب:</span>
                      <span className="font-medium mr-2">
                        {new Date(selectedRequest.created_at).toLocaleString('ar-EG')}
                      </span>
                    </div>
                    {selectedRequest.approved_at && (
                      <div>
                        <span className="text-gray-600">تاريخ الموافقة:</span>
                        <span className="font-medium mr-2">
                          {new Date(selectedRequest.approved_at).toLocaleString('ar-EG')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* الحالة الحالية */}
                <div className="flex items-center justify-center">
                  {getStatusBadge(selectedRequest.status)}
                </div>

                {/* ملاحظات الأدمن */}
                {selectedRequest.status === 'pending' && (
                  <>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        ملاحظات الأدمن (اختياري)
                      </label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
                        rows={3}
                        placeholder="أي ملاحظات للطالب..."
                      />
                    </div>

                    {/* أزرار الإجراءات */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleUpdateStatus(selectedRequest.id, 'approved')}
                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <FaCheckCircle />
                        قبول وتفعيل الاشتراك
                      </button>
                      
                      <button
                        onClick={() => {
                          if (!rejectionReason) {
                            toast.error('يرجى كتابة سبب الرفض');
                            return;
                          }
                          handleUpdateStatus(selectedRequest.id, 'rejected');
                        }}
                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <FaTimesCircle />
                        رفض الطلب
                      </button>
                    </div>

                    {/* سبب الرفض */}
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        سبب الرفض (مطلوب عند الرفض)
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-red-500"
                        rows={2}
                        placeholder="سبب رفض الطلب..."
                      />
                    </div>
                  </>
                )}

                {/* عرض الملاحظات السابقة */}
                {selectedRequest.admin_notes && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-bold text-blue-800 mb-2">ملاحظات الأدمن:</h4>
                    <p className="text-blue-700">{selectedRequest.admin_notes}</p>
                  </div>
                )}

                {selectedRequest.rejection_reason && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <h4 className="font-bold text-red-800 mb-2">سبب الرفض:</h4>
                    <p className="text-red-700">{selectedRequest.rejection_reason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
