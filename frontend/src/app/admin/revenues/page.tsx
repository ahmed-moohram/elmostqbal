'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaDollarSign, 
  FaChartLine, 
  FaUsers, 
  FaGraduationCap,
  FaMoneyBillWave,
  FaDownload,
  FaSearch,
  FaFilter,
  FaEye
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface TeacherRevenue {
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  totalRevenue: number;
  platformFees: number;
  teacherEarnings: number;
  availableBalance: number;
  withdrawnAmount: number;
  transactionsCount: number;
  studentsCount: number;
  coursesCount: number;
  lastTransaction: string;
}

interface PlatformStats {
  totalRevenue: number;
  platformEarnings: number;
  teachersEarnings: number;
  activeTeachers: number;
  payingStudents: number;
  revenueGeneratingCourses: number;
}

export default function RevenuesManagement() {
  const [teachersRevenue, setTeachersRevenue] = useState<TeacherRevenue[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalRevenue: 0,
    platformEarnings: 0,
    teachersEarnings: 0,
    activeTeachers: 0,
    payingStudents: 0,
    revenueGeneratingCourses: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'revenue' | 'transactions' | 'students'>('revenue');

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    setIsLoading(true);
    try {
      // TODO: استبدل هذا بـ API call حقيقي
      // محاكاة بيانات
      setTimeout(() => {
        const mockData: TeacherRevenue[] = [
          {
            teacherId: '1',
            teacherName: 'د. أحمد محمود',
            teacherEmail: 'ahmed@teacher.com',
            totalRevenue: 45000,
            platformFees: 9000,
            teacherEarnings: 36000,
            availableBalance: 12000,
            withdrawnAmount: 24000,
            transactionsCount: 150,
            studentsCount: 450,
            coursesCount: 3,
            lastTransaction: '2025-11-08'
          },
          {
            teacherId: '2',
            teacherName: 'د. فاطمة أحمد',
            teacherEmail: 'fatma@teacher.com',
            totalRevenue: 38500,
            platformFees: 7700,
            teacherEarnings: 30800,
            availableBalance: 8500,
            withdrawnAmount: 22300,
            transactionsCount: 128,
            studentsCount: 380,
            coursesCount: 2,
            lastTransaction: '2025-11-09'
          },
          {
            teacherId: '3',
            teacherName: 'د. محمد إبراهيم',
            teacherEmail: 'mohamed@teacher.com',
            totalRevenue: 29800,
            platformFees: 5960,
            teacherEarnings: 23840,
            availableBalance: 15840,
            withdrawnAmount: 8000,
            transactionsCount: 99,
            studentsCount: 295,
            coursesCount: 2,
            lastTransaction: '2025-11-10'
          }
        ];

        setTeachersRevenue(mockData);

        // حساب الإحصائيات الإجمالية
        const stats: PlatformStats = {
          totalRevenue: mockData.reduce((sum, t) => sum + t.totalRevenue, 0),
          platformEarnings: mockData.reduce((sum, t) => sum + t.platformFees, 0),
          teachersEarnings: mockData.reduce((sum, t) => sum + t.teacherEarnings, 0),
          activeTeachers: mockData.length,
          payingStudents: mockData.reduce((sum, t) => sum + t.studentsCount, 0),
          revenueGeneratingCourses: mockData.reduce((sum, t) => sum + t.coursesCount, 0)
        };

        setPlatformStats(stats);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      toast.error('خطأ في تحميل بيانات الإيرادات');
      setIsLoading(false);
    }
  };

  const handleExportReport = () => {
    toast.success('جاري تصدير التقرير...');
    // TODO: تصدير إلى Excel/PDF
  };

  const filteredTeachers = teachersRevenue
    .filter(teacher => 
      teacher.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.teacherEmail.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return b.totalRevenue - a.totalRevenue;
        case 'transactions':
          return b.transactionsCount - a.transactionsCount;
        case 'students':
          return b.studentsCount - a.studentsCount;
        default:
          return 0;
      }
    });

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
            <h1 className="text-3xl font-bold mb-2">💰 إدارة الإيرادات</h1>
            <p className="text-gray-600 dark:text-gray-400">
              نظام متكامل لإدارة وتتبع إيرادات المدرسين
            </p>
          </div>
          <button
            onClick={handleExportReport}
            className="bg-green-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-green-700 transition"
          >
            <FaDownload /> تصدير التقرير
          </button>
        </div>

        {/* Platform Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg"
          >
            <FaDollarSign className="text-3xl mb-2 opacity-80" />
            <p className="text-sm opacity-90">إجمالي الإيرادات</p>
            <p className="text-2xl font-bold">{platformStats.totalRevenue.toLocaleString()} ج.م</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg"
          >
            <FaMoneyBillWave className="text-3xl mb-2 opacity-80" />
            <p className="text-sm opacity-90">أرباح المنصة (20%)</p>
            <p className="text-2xl font-bold">{platformStats.platformEarnings.toLocaleString()} ج.م</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg"
          >
            <FaChartLine className="text-3xl mb-2 opacity-80" />
            <p className="text-sm opacity-90">أرباح المدرسين (80%)</p>
            <p className="text-2xl font-bold">{platformStats.teachersEarnings.toLocaleString()} ج.م</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg"
          >
            <FaUsers className="text-3xl mb-2 opacity-80" />
            <p className="text-sm opacity-90">مدرسين نشطين</p>
            <p className="text-2xl font-bold">{platformStats.activeTeachers}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white shadow-lg"
          >
            <FaGraduationCap className="text-3xl mb-2 opacity-80" />
            <p className="text-sm opacity-90">طلاب مشتركين</p>
            <p className="text-2xl font-bold">{platformStats.payingStudents}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg"
          >
            <FaChartLine className="text-3xl mb-2 opacity-80" />
            <p className="text-sm opacity-90">كورسات مدفوعة</p>
            <p className="text-2xl font-bold">{platformStats.revenueGeneratingCourses}</p>
          </motion.div>
        </div>

        {/* Search and Filters */}
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
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700"
              >
                <option value="revenue">الأعلى إيراداً</option>
                <option value="transactions">الأكثر معاملات</option>
                <option value="students">الأكثر طلاباً</option>
              </select>
            </div>
          </div>
        </div>

        {/* Teachers Revenue Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">المدرس</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">إجمالي الإيرادات</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">نصيب المنصة</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">نصيب المدرس</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">رصيد متاح</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">معاملات</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">طلاب</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTeachers.map((teacher, index) => (
                  <motion.tr
                    key={teacher.teacherId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{teacher.teacherName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{teacher.teacherEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-blue-600">{teacher.totalRevenue.toLocaleString()} ج.م</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-green-600">{teacher.platformFees.toLocaleString()} ج.م</p>
                      <p className="text-xs text-gray-500">20%</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-purple-600">{teacher.teacherEarnings.toLocaleString()} ج.م</p>
                      <p className="text-xs text-gray-500">80%</p>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-orange-600">{teacher.availableBalance.toLocaleString()} ج.م</p>
                        <p className="text-xs text-gray-500">مسحوب: {teacher.withdrawnAmount.toLocaleString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold">{teacher.transactionsCount}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold">{teacher.studentsCount}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/revenues/${teacher.teacherId}`}
                        className="text-primary hover:text-primary-dark flex items-center gap-1"
                      >
                        <FaEye /> تفاصيل
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Link href="/admin/revenues/withdrawals" className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-lg transition">
            <FaMoneyBillWave className="text-3xl text-blue-500 mb-3" />
            <h3 className="text-lg font-bold mb-2">طلبات السحب</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">إدارة طلبات سحب الأرباح</p>
          </Link>

          <Link href="/admin/revenues/reports" className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-lg transition">
            <FaChartLine className="text-3xl text-green-500 mb-3" />
            <h3 className="text-lg font-bold mb-2">التقارير المالية</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">عرض التقارير والإحصائيات</p>
          </Link>

          <Link href="/admin/revenues/history" className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-lg transition">
            <FaDollarSign className="text-3xl text-purple-500 mb-3" />
            <h3 className="text-lg font-bold mb-2">سجل المعاملات</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">جميع المعاملات المالية</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
