'use client';

import { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaEye, FaUserCircle, FaPhone, FaEnvelope, FaCalendar, FaFilter, FaSearch } from 'react-icons/fa';
import Image from 'next/image';

interface EnrollmentRequest {
  _id: string;
  studentInfo: {
    name: string;
    email: string;
    phone: string;
    parentPhone: string;
  };
  courseId: {
    _id: string;
    title: string;
    thumbnail: string;
  };
  paymentInfo: {
    method: string;
    amount: number;
    receiptImage: string;
    phoneNumber?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export default function StudentsManagement() {
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<EnrollmentRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrollmentRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, statusFilter, searchTerm]);

  const fetchEnrollmentRequests = async () => {
    try {
      let formattedRequests: any[] = [];
      
      // استخدام Supabase مباشرة
      const { getEnrollments } = await import('@/lib/supabase-admin');
      const result = await getEnrollments();
      
      if (result.success && result.data) {
        // تحويل البيانات من Supabase للصيغة المطلوبة
        formattedRequests = result.data.map((enrollment: any) => ({
          _id: enrollment.id,
          studentInfo: {
            name: enrollment.user?.name || 'غير محدد',
            email: enrollment.user?.email || 'غير محدد',
            phone: enrollment.user?.phone || 'غير محدد',
            parentPhone: enrollment.user?.parent_phone || ''
          },
          courseId: {
            _id: enrollment.course?.id || '',
            title: enrollment.course?.title || 'كورس غير محدد',
            thumbnail: enrollment.course?.thumbnail || '/placeholder-course.jpg'
          },
          paymentInfo: {
            method: enrollment.payment_method || 'vodafone_cash',
            amount: enrollment.course?.price || 0,
            receiptImage: enrollment.payment_receipt || 'pending_verification',
            phoneNumber: enrollment.payment_phone || ''
          },
          status: enrollment.status || 'pending',
          submittedAt: enrollment.enrolled_at || new Date().toISOString()
        }));
      }
      
      // جلب البيانات من localStorage كاحتياط
      const localRequests = JSON.parse(localStorage.getItem('enrollmentRequests') || '[]');
      
      // دمج البيانات من المصدرين
      const allRequests = [...formattedRequests];
      
      // إضافة الطلبات المحلية التي ليست في البيانات من Backend
      localRequests.forEach((localReq: any) => {
        const exists = allRequests.find((r) => 
          r.studentInfo?.phone === localReq.studentPhone && 
          r.courseId?._id === localReq.courseId
        );
        
        if (!exists) {
          // تحويل البيانات المحلية للصيغة المطلوبة
          allRequests.push({
            _id: localReq.id || `local-${Date.now()}-${Math.random()}`,
            studentInfo: {
              name: localReq.studentName || localReq.studentInfo?.name || 'طالب',
              email: localReq.studentInfo?.email || `student@temp.com`,
              phone: localReq.studentPhone || localReq.studentInfo?.phone || '',
              parentPhone: localReq.studentInfo?.parentPhone || ''
            },
            courseId: {
              _id: localReq.courseId?.toString() || 'unknown',
              title: localReq.courseName || 'كورس',
              thumbnail: '/placeholder-course.jpg'
            },
            paymentInfo: {
              method: 'vodafone_cash',
              amount: localReq.coursePrice || localReq.paymentInfo?.amount || 0,
              receiptImage: localReq.paymentInfo?.receiptImage || 'pending_whatsapp_verification',
              phoneNumber: localReq.paymentInfo?.phoneNumber || '01070333143'
            },
            status: (localReq.status as any) || 'pending',
            submittedAt: localReq.date || localReq.submittedAt || new Date().toISOString()
          });
        }
      });

      setRequests(allRequests);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(req =>
        req.studentInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.studentInfo.phone.includes(searchTerm) ||
        req.studentInfo.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  };

  const handleApprove = async (requestId: string) => {
    if (!confirm('هل أنت متأكد من الموافقة على هذا الطلب؟')) return;

    try {
      // استخدام Supabase مباشرة
      const { updateEnrollment } = await import('@/lib/supabase-admin');
      const result = await updateEnrollment(requestId, { status: 'approved' });
      
      if (!result.success) {
        console.log('Could not update in Supabase, updating locally');
      }
      
      // تحديث في الواجهة
      setRequests(prev =>
        prev.map(req =>
          req._id === requestId ? { ...req, status: 'approved' as const } : req
        )
      );
      
      // تحديث localStorage
      const localRequests = JSON.parse(localStorage.getItem('enrollmentRequests') || '[]');
      const updatedLocalRequests = localRequests.map((req: any) =>
        req.id === requestId ? { ...req, status: 'approved' } : req
      );
      localStorage.setItem('enrollmentRequests', JSON.stringify(updatedLocalRequests));
      
      alert('تم الموافقة على الطلب بنجاح! ✅');
    } catch (error) {
      console.error('Error approving request:', error);
      alert('حدث خطأ أثناء الموافقة على الطلب');
    }
  };

  const handleReject = async (requestId: string) => {
    const reason = prompt('يرجى إدخال سبب الرفض:');
    if (!reason) return;

    try {
      // محاولة إرسال للـ Backend
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        
        await fetch(`${API_URL}/api/admin/enrollments/${requestId}/reject`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason })
        });
      } catch (apiError) {
        console.log('Could not update backend, updating locally');
      }

      // تحديث في الواجهة
      setRequests(prev =>
        prev.map(req =>
          req._id === requestId ? { ...req, status: 'rejected' as const } : req
        )
      );
      
      // تحديث localStorage
      const localRequests = JSON.parse(localStorage.getItem('enrollmentRequests') || '[]');
      const updatedLocalRequests = localRequests.map((req: any) =>
        req.id === requestId ? { ...req, status: 'rejected', rejectionReason: reason } : req
      );
      localStorage.setItem('enrollmentRequests', JSON.stringify(updatedLocalRequests));

      alert('تم رفض الطلب ❌');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('حدث خطأ أثناء رفض الطلب');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };

    const labels = {
      pending: 'قيد المراجعة',
      approved: 'مقبول',
      rejected: 'مرفوض'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      vodafone_cash: 'فودافون كاش',
      bank_transfer: 'تحويل بنكي',
      instapay: 'إنستاباي',
      credit_card: 'بطاقة ائتمان',
      other: 'أخرى'
    };
    return methods[method as keyof typeof methods] || method;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            إدارة الطلاب وطلبات التسجيل
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            راجع وأدِر طلبات التسجيل والدفع
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute right-3 top-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث بالاسم، الهاتف أو البريد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <FaFilter className="absolute right-3 top-3.5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full pr-10 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
              >
                <option value="all">جميع الطلبات</option>
                <option value="pending">قيد المراجعة</option>
                <option value="approved">المقبولة</option>
                <option value="rejected">المرفوضة</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {requests.filter(r => r.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">قيد المراجعة</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {requests.filter(r => r.status === 'approved').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">مقبولة</p>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {requests.filter(r => r.status === 'rejected').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">مرفوضة</p>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    معلومات الطالب
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    الدورة
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    معلومات الدفع
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    الحالة
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      لا توجد طلبات
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      {/* Student Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <FaUserCircle className="text-3xl text-gray-400 mt-1" />
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {request.studentInfo.name}
                            </p>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mt-1">
                              <p className="flex items-center gap-2">
                                <FaEnvelope className="text-xs" />
                                {request.studentInfo.email}
                              </p>
                              <p className="flex items-center gap-2">
                                <FaPhone className="text-xs" />
                                {request.studentInfo.phone}
                              </p>
                              <p className="flex items-center gap-2 text-xs">
                                <FaPhone className="text-xs" />
                                ولي الأمر: {request.studentInfo.parentPhone}
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Course Info */}
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {request.courseId.title}
                        </p>
                      </td>

                      {/* Payment Info */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {request.paymentInfo.amount} جنيه
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {getPaymentMethodLabel(request.paymentInfo.method)}
                          </p>
                          <button
                            onClick={() => setSelectedReceipt(request.paymentInfo.receiptImage)}
                            className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                          >
                            <FaEye /> عرض الإيصال
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {getStatusBadge(request.status)}
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <FaCalendar className="text-xs" />
                            {new Date(request.submittedAt).toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(request._id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                            >
                              <FaCheck /> قبول
                            </button>
                            <button
                              onClick={() => handleReject(request._id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
                            >
                              <FaTimes /> رفض
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedReceipt(null)}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">صورة الإيصال</h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <FaTimes size={24} />
              </button>
            </div>
            <div className="relative w-full h-96">
              <Image
                src={selectedReceipt}
                alt="Receipt"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
