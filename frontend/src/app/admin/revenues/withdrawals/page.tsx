'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaClock,
  FaMoneyBillWave,
  FaWhatsapp,
  FaSearch,
  FaFilter
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface WithdrawalRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  teacherPhone: string;
  amount: number;
  availableBalance: number;
  withdrawalMethod: string;
  accountDetails: any;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedAt: string;
  notes?: string;
  rejectionReason?: string;
}

export default function WithdrawalsManagement() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setIsLoading(true);
    try {
      // TODO: استبدل بـ API call حقيقي
      setTimeout(() => {
        const mockData: WithdrawalRequest[] = [
          {
            id: '1',
            teacherId: 'teacher-1',
            teacherName: 'د. أحمد محمود',
            teacherEmail: 'ahmed@teacher.com',
            teacherPhone: '01012345678',
            amount: 5000,
            availableBalance: 12000,
            withdrawalMethod: 'vodafone_cash',
            accountDetails: { phone: '01012345678' },
            status: 'pending',
            requestedAt: '2025-11-10T10:30:00',
            notes: 'طلب سحب عادي'
          },
          {
            id: '2',
            teacherId: 'teacher-2',
            teacherName: 'د. فاطمة أحمد',
            teacherEmail: 'fatma@teacher.com',
            teacherPhone: '01098765432',
            amount: 3500,
            availableBalance: 8500,
            withdrawalMethod: 'bank_transfer',
            accountDetails: { 
              bankName: 'البنك الأهلي المصري',
              accountNumber: '1234567890',
              accountName: 'فاطمة أحمد محمد'
            },
            status: 'approved',
            requestedAt: '2025-11-09T14:20:00'
          },
          {
            id: '3',
            teacherId: 'teacher-3',
            teacherName: 'د. محمد إبراهيم',
            teacherEmail: 'mohamed@teacher.com',
            teacherPhone: '01123456789',
            amount: 20000,
            availableBalance: 15840,
            withdrawalMethod: 'vodafone_cash',
            accountDetails: { phone: '01123456789' },
            status: 'rejected',
            requestedAt: '2025-11-08T16:45:00',
            rejectionReason: 'المبلغ المطلوب أكبر من الرصيد المتاح'
          }
        ];

        setWithdrawals(mockData);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast.error('خطأ في تحميل طلبات السحب');
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      toast.loading('جاري الموافقة...');
      // TODO: API call
      setTimeout(() => {
        setWithdrawals(prev => prev.map(w => 
          w.id === id ? { ...w, status: 'approved' as const } : w
        ));
        toast.dismiss();
        toast.success('✅ تم الموافقة على الطلب');
      }, 1000);
    } catch (error) {
      toast.error('حدث خطأ في الموافقة');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('سبب الرفض:');
    if (!reason) return;

    try {
      toast.loading('جاري الرفض...');
      // TODO: API call
      setTimeout(() => {
        setWithdrawals(prev => prev.map(w => 
          w.id === id ? { ...w, status: 'rejected' as const, rejectionReason: reason } : w
        ));
        toast.dismiss();
        toast.success('تم رفض الطلب');
      }, 1000);
    } catch (error) {
      toast.error('حدث خطأ في رفض الطلب');
    }
  };

  const handleMarkCompleted = async (id: string) => {
    try {
      toast.loading('جاري تحديث الحالة...');
      // TODO: API call
      setTimeout(() => {
        setWithdrawals(prev => prev.map(w => 
          w.id === id ? { ...w, status: 'completed' as const } : w
        ));
        toast.dismiss();
        toast.success('✅ تم تسليم المبلغ');
      }, 1000);
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const handleContactTeacher = (phone: string) => {
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  const filteredWithdrawals = withdrawals
    .filter(w => filter === 'all' || w.status === filter)
    .filter(w => 
      w.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.teacherEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
          <FaClock /> قيد المراجعة
        </span>;
      case 'approved':
        return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
          <FaCheckCircle /> معتمد
        </span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
          <FaTimesCircle /> مرفوض
        </span>;
      case 'completed':
        return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
          <FaCheckCircle /> مكتمل
        </span>;
    }
  };

  const getPendingCount = () => withdrawals.filter(w => w.status === 'pending').length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">💸 طلبات السحب</h1>
            <p className="text-gray-600 dark:text-gray-400">
              إدارة طلبات سحب الأرباح من المدرسين
              {getPendingCount() > 0 && (
                <span className="mr-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  {getPendingCount()} طلب جديد
                </span>
              )}
            </p>
          </div>
          <Link
            href="/admin/revenues"
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition"
          >
            ← العودة للإيرادات
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-yellow-100 rounded-xl p-6">
            <FaClock className="text-3xl text-yellow-600 mb-2" />
            <p className="text-sm text-yellow-800">قيد المراجعة</p>
            <p className="text-2xl font-bold text-yellow-900">
              {withdrawals.filter(w => w.status === 'pending').length}
            </p>
          </div>

          <div className="bg-blue-100 rounded-xl p-6">
            <FaCheckCircle className="text-3xl text-blue-600 mb-2" />
            <p className="text-sm text-blue-800">معتمدة</p>
            <p className="text-2xl font-bold text-blue-900">
              {withdrawals.filter(w => w.status === 'approved').length}
            </p>
          </div>

          <div className="bg-green-100 rounded-xl p-6">
            <FaCheckCircle className="text-3xl text-green-600 mb-2" />
            <p className="text-sm text-green-800">مكتملة</p>
            <p className="text-2xl font-bold text-green-900">
              {withdrawals.filter(w => w.status === 'completed').length}
            </p>
          </div>

          <div className="bg-red-100 rounded-xl p-6">
            <FaTimesCircle className="text-3xl text-red-600 mb-2" />
            <p className="text-sm text-red-800">مرفوضة</p>
            <p className="text-2xl font-bold text-red-900">
              {withdrawals.filter(w => w.status === 'rejected').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث عن مدرس..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-12 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700"
              />
            </div>
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700"
              >
                <option value="all">الكل</option>
                <option value="pending">قيد المراجعة</option>
                <option value="approved">معتمدة</option>
                <option value="completed">مكتملة</option>
                <option value="rejected">مرفوضة</option>
              </select>
            </div>
          </div>
        </div>

        {/* Withdrawals List */}
        <div className="space-y-4">
          {filteredWithdrawals.map((withdrawal, index) => (
            <motion.div
              key={withdrawal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  {/* Teacher Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {withdrawal.teacherName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {withdrawal.teacherEmail}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          طلب بتاريخ: {new Date(withdrawal.requestedAt).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                      {getStatusBadge(withdrawal.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">المبلغ المطلوب</p>
                        <p className="text-lg font-bold text-primary">{withdrawal.amount.toLocaleString()} ج.م</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">الرصيد المتاح</p>
                        <p className="text-lg font-semibold text-green-600">{withdrawal.availableBalance.toLocaleString()} ج.م</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">طريقة السحب</p>
                        <p className="text-sm font-medium">
                          {withdrawal.withdrawalMethod === 'vodafone_cash' ? 'فودافون كاش' : 'تحويل بنكي'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">تفاصيل الحساب</p>
                        <p className="text-sm font-medium">
                          {withdrawal.withdrawalMethod === 'vodafone_cash' 
                            ? withdrawal.accountDetails.phone 
                            : withdrawal.accountDetails.accountNumber}
                        </p>
                      </div>
                    </div>

                    {withdrawal.rejectionReason && (
                      <div className="bg-red-50 border-r-4 border-red-500 p-4 mb-4">
                        <p className="text-sm text-red-800">
                          <span className="font-bold">سبب الرفض:</span> {withdrawal.rejectionReason}
                        </p>
                      </div>
                    )}

                    {withdrawal.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <span className="font-semibold">ملاحظات:</span> {withdrawal.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col gap-2">
                    <button
                      onClick={() => handleContactTeacher(withdrawal.teacherPhone)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <FaWhatsapp /> واتساب
                    </button>

                    {withdrawal.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(withdrawal.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          <FaCheckCircle /> اعتماد
                        </button>
                        <button
                          onClick={() => handleReject(withdrawal.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                          <FaTimesCircle /> رفض
                        </button>
                      </>
                    )}

                    {withdrawal.status === 'approved' && (
                      <button
                        onClick={() => handleMarkCompleted(withdrawal.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        <FaCheckCircle /> تم التسليم
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredWithdrawals.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
              <FaMoneyBillWave className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">لا توجد طلبات سحب</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
