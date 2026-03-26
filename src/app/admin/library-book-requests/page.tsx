"use client";

import { useEffect, useState } from 'react';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaEye,
  FaPhone,
  FaUser,
  FaBook,
  FaMoneyBill,
  FaCalendar,
  FaSearch,
  FaFilter,
  FaSyncAlt,
  FaArrowLeft,
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';

interface LibraryBookRequest {
  id: string;
  book_id: string;
  student_id: string | null;
  teacher_id: string | null;
  student_name: string;
  student_phone: string;
  teacher_phone?: string | null;
  price: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  created_at: string;
  approved_at?: string | null;
  updated_at?: string | null;
  book_title?: string | null;
}

export default function LibraryBookRequestsAdmin() {
  const [requests, setRequests] = useState<LibraryBookRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<LibraryBookRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const url =
        filter === 'all'
          ? '/api/library/book-purchase'
          : `/api/library/book-purchase?status=${filter}`;

      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data)) {
        const mapped: LibraryBookRequest[] = data.map((r: any) => ({
          ...r,
          price: typeof r.price === 'number' ? r.price : r.price ? Number(r.price) : 0,
        }));
        setRequests(mapped);
        calculateStats(mapped);
      }
    } catch (error) {
      console.error('Error fetching library book requests:', error);
      toast.error('خطأ في جلب طلبات شراء الكتب');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: LibraryBookRequest[]) => {
    const stats = {
      total: data.length,
      pending: data.filter((r) => r.status === 'pending').length,
      approved: data.filter((r) => r.status === 'approved').length,
      rejected: data.filter((r) => r.status === 'rejected').length,
      totalRevenue: data
        .filter((r) => r.status === 'approved')
        .reduce((sum, r) => sum + (r.price || 0), 0),
    };
    setStats(stats);
  };

  const handleUpdateStatus = async (requestId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await fetch('/api/library/book-purchase', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setShowDetailsModal(false);
        setSelectedRequest(null);
        fetchRequests();
      } else {
        toast.error(result.error || 'حدث خطأ في تحديث حالة طلب شراء الكتاب');
      }
    } catch (error) {
      console.error('Error updating library book request status:', error);
      toast.error('خطأ في تحديث حالة الطلب');
    }
  };

  const filteredRequests = requests.filter((request) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        request.student_name.toLowerCase().includes(search) ||
        request.student_phone.includes(search) ||
        (request.book_title || '').toLowerCase().includes(search) ||
        request.book_id.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const getStatusBadge = (status: LibraryBookRequest['status']) => {
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
      case 'cancelled':
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-800">إدارة طلبات شراء الكتب</h1>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/payment-requests"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                >
                  <FaArrowLeft />
                  <span>العودة إلى طلبات الدفع</span>
                </Link>
                <button
                  onClick={fetchRequests}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  <FaSyncAlt className={loading ? 'animate-spin' : ''} />
                  تحديث
                </button>
              </div>
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
                    {status === 'all'
                      ? 'الكل'
                      : status === 'pending'
                      ? 'في الانتظار'
                      : status === 'approved'
                      ? 'مقبول'
                      : 'مرفوض'}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="البحث بالاسم أو الهاتف أو اسم الكتاب..."
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
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الكتاب</th>
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
                            <div className="font-medium text-gray-900">
                              {request.book_title || 'كتاب'}
                            </div>
                            <div className="text-gray-500 text-xs">ID: {request.book_id}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-green-600">
                            {request.price} جنيه
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-600">
                            {new Date(request.created_at).toLocaleDateString('ar-EG')}
                            <br />
                            {new Date(request.created_at).toLocaleTimeString('ar-EG')}
                          </div>
                        </td>
                        <td className="px-4 py-4">{getStatusBadge(request.status)}</td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDetailsModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
                          >
                            <FaEye className="text-xs" />
                            تفاصيل
                          </button>
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
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">تفاصيل طلب شراء الكتاب</h2>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedRequest(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <FaUser className="text-gray-500" />
                    <span className="font-semibold">الطالب:</span>
                    <span>{selectedRequest.student_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaPhone className="text-gray-500" />
                    <span className="font-semibold">الهاتف:</span>
                    <span>{selectedRequest.student_phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaBook className="text-gray-500" />
                    <span className="font-semibold">الكتاب:</span>
                    <span>{selectedRequest.book_title || selectedRequest.book_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaMoneyBill className="text-gray-500" />
                    <span className="font-semibold">المبلغ:</span>
                    <span>{selectedRequest.price} جنيه</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCalendar className="text-gray-500" />
                    <span className="font-semibold">تاريخ الطلب:</span>
                    <span>
                      {new Date(selectedRequest.created_at).toLocaleString('ar-EG')}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  {selectedRequest.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                      >
                        رفض
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(selectedRequest.id, 'approved')}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                      >
                        قبول وتفعيل الكتاب
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
