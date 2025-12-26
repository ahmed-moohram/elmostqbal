'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  FaUsers,
  FaGraduationCap,
  FaBookOpen,
  FaMoneyBillWave,
  FaChartLine,
  FaCreditCard,
  FaBell,
  FaCheckCircle,
  FaChartBar,
  FaExclamationTriangle,
  FaSync,
  FaInfoCircle
} from 'react-icons/fa';
import dynamic from 'next/dynamic';

// المخططات البيانية بتحميل ديناميكي لتحسين الأداء
const BarChart = dynamic(() => import('../charts/BarChart'), { ssr: false });
const LineChart = dynamic(() => import('../charts/LineChart'), { ssr: false });
const PieChart = dynamic(() => import('../charts/PieChart'), { ssr: false });
const RevenueWidget = dynamic(() => import('./RevenueWidget'), { ssr: false });

interface Stats {
  totalStudents: number;
  totalCourses: number;
  totalTeachers: number;
  totalRevenue: number;
  newStudentsToday: number;
  activeStudents: number;
  pendingPayments: number;
  completionRate: number;
  newTeachersThisMonth?: number;
  newCoursesThisMonth?: number;
  revenueIncrease?: number;
}

interface Transaction {
  id: string;
  studentName: string;
  courseTitle: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: string;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  type: 'technical' | 'payment' | 'content';
  status: 'new' | 'in-progress' | 'resolved';
  date: string;
  priority: 'high' | 'medium' | 'low';
}

// بيانات المخططات الافتراضية - ستستبدل بالبيانات الفعلية من API
const emptyChartData = {
  labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
  datasets: []
};

// بيانات الحالة الأولية
const initialStats: Stats = {
  totalStudents: 0,
  totalCourses: 0,
  totalTeachers: 0,
  totalRevenue: 0,
  newStudentsToday: 0,
  activeStudents: 0,
  pendingPayments: 0,
  completionRate: 0
};

// أنواع المخططات البيانية

// مخطط الإيرادات (خطي)
interface RevenueChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth?: number;
    tension?: number;
    fill?: boolean;
  }>;
}

// مخطط الاشتراكات (عمودي)
interface EnrollmentChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor?: string;
    borderWidth?: number;
  }>;
}

// مخطط طرق الدفع (دائري)
interface PaymentMethodsChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor?: string[];
    borderWidth?: number;
  }>;
}

// مكون لوحة التحكم المتقدمة
const AdvancedDashboard = () => {
  // حالات البيانات الرئيسية
  const [stats, setStats] = useState<Stats>(initialStats);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // حالات الفلترة والمخططات
  const [dateRange, setDateRange] = useState('month');
  
  // بيانات المخططات مع الأنواع المحددة
  const [revenueData, setRevenueData] = useState<RevenueChartData>({
    labels: emptyChartData.labels,
    datasets: []
  });
  
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentChartData>({
    labels: emptyChartData.labels,
    datasets: []
  });
  
  const [paymentMethodsData, setPaymentMethodsData] = useState<PaymentMethodsChartData>({
    labels: emptyChartData.labels,
    datasets: []
  });
  
  // الدالة المسؤولة عن تحميل البيانات من API
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // الحصول على التوكن من التخزين
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('لم يتم العثور على توكن التفويض. الرجاء تسجيل الدخول مرة أخرى.');
      }
      
      // الحصول على عنوان API من متغيرات البيئة
      const apiUrl = "";
      
      // تحضير خيارات الطلب
      const requestOptions = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      // طلبات متوازية للإحصائيات والمعاملات والمشكلات فقط
      const [statsResponse, transactionsResponse, issuesResponse] = 
        await Promise.all([
          fetch(`/api/admin/dashboard/stats?period=${dateRange}`, requestOptions),
          fetch(`/api/admin/dashboard/transactions?period=${dateRange}`, requestOptions),
          fetch(`/api/admin/dashboard/issues`, requestOptions)
        ]);
      
      // التحقق من استجابة الإحصائيات
      if (!statsResponse.ok) {
        throw new Error(`خطأ في الحصول على الإحصائيات: ${statsResponse.status}`);
      }
      
      // التحقق من استجابة المعاملات
      if (!transactionsResponse.ok) {
        throw new Error(`خطأ في الحصول على المعاملات: ${transactionsResponse.status}`);
      }
      
      // تحليل البيانات في حالة نجاح الطلبات
      const statsData = await statsResponse.json();
      const transactionsData = await transactionsResponse.json();
      
      // تحديث البيانات الموجودة في الحالة
      setStats(statsData);
      setTransactions(transactionsData.transactions || []);
      
      // التعامل مع المشكلات إن وجدت
      if (issuesResponse.ok) {
        const issuesData = await issuesResponse.json();
        setIssues(issuesData.issues || []);
      }
      
      // لم نعد نستخدم بيانات المخططات في الواجهة، لذا لا حاجة لمعالجة استجابة charts هنا
      
    } catch (error: any) {
      console.error('خطأ في تحميل بيانات لوحة القيادة:', error);
      setError(error.message || 'حدث خطأ أثناء تحميل البيانات');
      toast.error(error.message || 'حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };



  // تحديث البيانات عند تغيير نطاق التاريخ
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);
  
  // تحميل البيانات عند تحميل المكون وإعادة تحميلها دورياً
  useEffect(() => {
    // استخدام useEffect لتحميل البيانات عند تحميل المكون
    loadData();
    
    // مؤشر للتحقق من أن المكون لا يزال موجودًا
    let isComponentMounted = true;
    
    // إعداد التحديث الدوري كل 5 دقائق
    const intervalId = setInterval(() => {
      // التحقق من أن المكون لا يزال موجودًا قبل التحديث
      if (isComponentMounted) {
        // إضافة آلية catch للتعامل مع الأخطاء في التحديث التلقائي
        loadData().catch(err => {
          console.error('خطأ في التحديث التلقائي:', err);
          // لا نريد عرض رسالة خطأ للمستخدم في التحديث التلقائي
          // عرض تنبيه لطيف بدلاً من ذلك
          toast.error('فشل التحديث التلقائي - سيتم المحاولة مرة أخرى قريبًا', {
            duration: 3000,
            icon: '⚠️',
          });
        });
      }
    }, 5 * 60 * 1000); // 5 دقائق
    
    // تنظيف عند فك المكون
    return () => {
      isComponentMounted = false;
      clearInterval(intervalId);
    };
  }, []);
  
  // إعادة تحميل البيانات عند تغير نطاق التاريخ
  useEffect(() => {
    // تنفيذ تحميل البيانات عند تغيير النطاق الزمني
    loadData();
  }, [dateRange]);

  // معالجة حل المشكلات
  const handleIssueSolve = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('يجب تسجيل الدخول للقيام بهذه العملية');
        return;
      }
      
      // تحديث الواجهة أولاً لتحسين تجربة المستخدم (Optimistic UI)
      setIssues(issues.map(issue => 
        issue.id === id ? { ...issue, status: 'resolved' } : issue
      ));
      
      // إرسال الطلب إلى الخادم
      const response = await fetch(`/api/admin/dashboard/issues/${id}/resolve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('فشل تحديث حالة المشكلة');
      }
      
      toast.success('تم حل المشكلة بنجاح');
    } catch (error: any) {
      console.error('خطأ في حل المشكلة:', error);
      toast.error(error.message || 'حدث خطأ أثناء حل المشكلة');
      
      // إعادة تحميل البيانات في حالة الفشل
      loadData();
    }
  };

  // معالجة تحديث حالة المعاملات
  const handleTransaction = async (id: string, action: 'approve' | 'decline') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('يجب تسجيل الدخول للقيام بهذه العملية');
        return;
      }
      
      // تحديث الواجهة أولاً (Optimistic UI)
      setTransactions(transactions.map(tx => {
        if (tx.id === id) {
          return {
            ...tx,
            status: action === 'approve' ? 'completed' : 'failed'
          };
        }
        return tx;
      }));
      
      // إرسال الطلب إلى الخادم
      const response = await fetch(`/api/admin/dashboard/transactions/${id}/${action}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`فشل ${action === 'approve' ? 'قبول' : 'رفض'} المعاملة`);
      }
      
      toast.success(action === 'approve' ? 'تم قبول المعاملة بنجاح' : 'تم رفض المعاملة');
      
      // تحديث الإحصائيات بعد نجاح العملية
      if (action === 'approve') {
        // العثور على المعاملة المعنية
        const transaction = transactions.find(tx => tx.id === id);
        if (transaction) {
          // تحديث الإحصائيات المحلية
          setStats(prevStats => ({
            ...prevStats,
            totalRevenue: prevStats.totalRevenue + (transaction?.amount || 0),
            pendingPayments: Math.max(0, prevStats.pendingPayments - 1)
          }));
        }
      }
      
    } catch (error: any) {
      console.error('خطأ في معالجة المعاملة:', error);
      toast.error(error.message || 'حدث خطأ أثناء معالجة المعاملة');
      
      // إعادة تحميل البيانات في حالة الفشل
      loadData();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {loading ? (
        <motion.div 
          className="flex flex-col justify-center items-center py-10 space-y-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative w-20 h-20">
            <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-blue-200 opacity-30"></div>
            <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <div className="absolute top-2 left-2 w-16 h-16 rounded-full border-4 border-purple-300 opacity-50"></div>
            <div className="absolute top-2 left-2 w-16 h-16 rounded-full border-4 border-t-purple-600 border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.5s' }}></div>
          </div>
          <span className="text-blue-600 text-lg font-bold mt-4">جاري تحميل البيانات...</span>
          <p className="text-gray-600 text-sm">يتم تحديث المعلومات من الخادم</p>
        </motion.div>
      ) : error ? (
        <motion.div 
          className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-8 flex flex-col items-center justify-center space-y-4 shadow-sm"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-red-500 rounded-full opacity-20 animate-pulse"></div>
            <FaExclamationTriangle className="text-red-500 relative z-10" size={48} />
          </div>
          <h3 className="text-xl font-bold text-red-700 mt-2">حدث خطأ أثناء تحميل البيانات</h3>
          <p className="text-red-600 text-center bg-white bg-opacity-50 p-3 rounded-lg border border-red-100 w-full max-w-md">{error}</p>
          <motion.button 
            onClick={() => loadData()}
            className="mt-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="flex items-center gap-2 font-medium">
              <FaSync className="animate-spin" style={{ animationDuration: '1.5s' }} /> إعادة المحاولة
            </span>
          </motion.button>
        </motion.div>
      ) : (
        <>
          {/* عنوان اللوحة مع فلاتر */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm">
            <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم الرئيسية</h1>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setDateRange('week')}
                className={`px-3 py-1.5 rounded text-sm ${dateRange === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                أسبوعي
              </button>
              <button 
                onClick={() => setDateRange('month')}
                className={`px-3 py-1.5 rounded text-sm ${dateRange === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                شهري
              </button>
              <button 
                onClick={() => setDateRange('year')}
                className={`px-3 py-1.5 rounded text-sm ${dateRange === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                سنوي
              </button>
            </div>
          </div>
          
          {/* المؤشرات الرئيسية */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <RevenueWidget 
              title="الطلاب"
              value={stats.totalStudents}
              trend={stats.newStudentsToday}
              trendLabel="طالب جديد اليوم"
              icon={<FaUsers className="text-blue-600" size={18} />}
              color="blue"
              footerLabel="إجمالي الطلاب المسجلين"
            />
            
            <RevenueWidget 
              title="المدرسين"
              value={stats.totalTeachers}
              trend={stats.newTeachersThisMonth ?? 0}
              trendLabel="مدرس جديد هذا الشهر"
              icon={<FaGraduationCap className="text-green-600" size={18} />}
              color="green"
              footerLabel="إجمالي المدرسين النشطين"
            />
            
            <RevenueWidget 
              title="الدورات"
              value={stats.totalCourses}
              trend={stats.newCoursesThisMonth ?? 0}
              trendLabel="دورة جديدة هذا الشهر"
              icon={<FaBookOpen className="text-purple-600" size={18} />}
              color="purple"
              footerLabel="إجمالي الدورات المتاحة"
            />
            
            <RevenueWidget 
              title="الإيرادات"
              value={stats.totalRevenue}
              trend={stats.revenueIncrease ?? 0}
              trendLabel={stats.revenueIncrease && stats.revenueIncrease > 0 ? "زيادة عن الشهر الماضي" : stats.revenueIncrease && stats.revenueIncrease < 0 ? "نقص عن الشهر الماضي" : "لا يوجد تغيير"}
              icon={<FaMoneyBillWave className="text-yellow-600" size={18} />}
              color="yellow"
              footerLabel="إجمالي الإيرادات (ج.م)"
              isCurrency
            />
          </div>
          
          {false && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* مخطط الإيرادات */}
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                      <FaChartLine className="text-blue-500" />
                      تحليل الإيرادات
                    </h3>
                    <div className="h-72">
                      {revenueData.datasets.length > 0 && revenueData.datasets[0].data.length > 0 ? (
                        <LineChart data={revenueData} />
                      ) : (
                        <div className="h-full flex flex-col justify-center items-center text-gray-400 bg-blue-50 rounded-lg animate-pulse-light">
                          <FaChartLine size={36} className="mb-3 text-blue-400" />
                          <p className="text-gray-600 font-medium">لا توجد بيانات إيرادات كافية</p>
                          <p className="text-sm text-gray-500 mt-2">ستظهر البيانات بمجرد توفرها</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* مخطط طرق الدفع */}
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                      <FaCreditCard className="text-purple-500" />
                      طرق الدفع المفضلة
                    </h3>
                    <div className="h-72">
                      {paymentMethodsData.datasets.length > 0 && paymentMethodsData.datasets[0].data.length > 0 ? (
                        <PieChart data={paymentMethodsData} />
                      ) : (
                        <div className="h-full flex flex-col justify-center items-center text-gray-400 bg-purple-50 rounded-lg animate-pulse-light">
                          <FaCreditCard size={36} className="mb-3 text-purple-400" />
                          <p className="text-gray-600 font-medium">لا توجد بيانات طرق دفع متوفرة</p>
                          <p className="text-sm text-gray-500 mt-2">سيتم عرض الإحصائيات بمجرد إجراء معاملات</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <FaCreditCard className="text-primary" />
                    وسائل الدفع
                  </h3>
                </div>
                <div className="h-72">
                  {paymentMethodsData.datasets.length > 0 && paymentMethodsData.datasets[0].data.length > 0 ? (
                    <PieChart data={paymentMethodsData} />
                  ) : (
                    <div className="h-full flex flex-col justify-center items-center text-gray-400">
                      <FaInfoCircle size={40} className="mb-3" />
                      <p>لا توجد بيانات كافية لعرض الرسم البياني</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* المعاملات والمشكلات */}
          {false && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FaMoneyBillWave className="text-primary" />
                  أحدث المعاملات
                </h3>
                <span className="bg-yellow-100 text-yellow-600 text-xs font-medium px-2 py-1 rounded-full">
                  {transactions.filter(tx => tx.status === 'pending').length} في الانتظار
                </span>
              </div>
              
              <div className="overflow-x-auto rounded-lg bg-white shadow-inner">
                {transactions.length > 0 ? (
                  <motion.table 
                    className="w-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <thead className="text-right text-xs font-medium text-gray-500 border-b bg-gray-50">
                      <tr>
                        <th className="py-3 px-4 font-semibold">الطالب</th>
                        <th className="py-3 px-4 font-semibold">الدورة</th>
                        <th className="py-3 px-4 font-semibold">المبلغ</th>
                        <th className="py-3 px-4 font-semibold">التاريخ</th>
                        <th className="py-3 px-4 font-semibold">الحالة</th>
                        <th className="py-3 px-4 font-semibold">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {transactions.map((tx, index) => (
                        <motion.tr 
                          key={tx.id} 
                          className="hover:bg-gray-50"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <td className="py-4 pr-4 whitespace-nowrap text-sm">{tx.studentName}</td>
                          <td className="py-4 whitespace-nowrap text-sm">{tx.courseTitle}</td>
                          <td className="py-4 whitespace-nowrap text-sm font-medium">
                            {new Intl.NumberFormat('ar-EG').format(tx.amount)} ج.م
                          </td>
                          <td className="py-4 whitespace-nowrap text-sm">
                            {new Date(tx.date).toLocaleDateString('ar-EG')}
                          </td>
                          <td className="py-4 whitespace-nowrap text-sm">
                            <span 
                              className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                tx.status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : tx.status === 'pending' 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {tx.status === 'completed' && 'مكتمل'}
                              {tx.status === 'pending' && 'معلق'}
                              {tx.status === 'failed' && 'فشل'}
                            </span>
                          </td>
                          <td className="py-4 whitespace-nowrap text-sm">
                            {tx.status === 'pending' && (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleTransaction(tx.id, 'approve')}
                                  className="text-xs bg-green-50 text-green-600 hover:bg-green-100 px-2 py-1 rounded transition-colors"
                                >
                                  قبول
                                </button>
                                <button 
                                  onClick={() => handleTransaction(tx.id, 'decline')}
                                  className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded transition-colors"
                                >
                                  رفض
                                </button>
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </motion.table>
                ) : (
                  <motion.div 
                    className="py-16 text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="relative inline-block mb-6">
                      <div className="absolute -inset-1 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
                      <FaMoneyBillWave className="text-blue-500 relative z-10" size={46} />
                    </div>
                    <h4 className="text-lg font-bold text-blue-700 mb-2">لا توجد معاملات حالياً</h4>
                    <p className="text-blue-600 text-sm max-w-md mx-auto">ستظهر المعاملات الجديدة هنا فور إتمامها</p>
                  </motion.div>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-primary to-blue-400"></div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <div className="relative">
                    <div className="absolute -inset-1 rounded-full bg-primary opacity-20 animate-pulse"></div>
                    <FaBell className="text-primary relative z-10" />
                  </div>
                  المشكلات النشطة
                </h3>
                <motion.span 
                  className="bg-red-100 text-red-600 text-xs font-semibold px-3 py-1 rounded-full shadow-sm border border-red-200 flex items-center gap-1"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  {issues.filter(issue => issue.status !== 'resolved').length} نشطة
                </motion.span>
              </div>
              
              <div className="space-y-4">
                {issues.filter(issue => issue.status !== 'resolved').length > 0 ? (
                  issues.filter(issue => issue.status !== 'resolved').map((issue, index) => (
                    <motion.div 
                      key={issue.id} 
                      className="p-5 border-r-4 border-l-0 border-t-0 border-b-0 bg-white rounded-lg shadow-md transition-all duration-200 relative overflow-hidden"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.1)' }}
                      style={{
                        borderRightColor: issue.priority === 'high' ? '#ef4444' : issue.priority === 'medium' ? '#f59e0b' : '#3b82f6'
                      }}
                    >
                      <div className="absolute top-0 right-0 h-full w-1 opacity-20 rounded-r" 
                           style={{ 
                             background: issue.priority === 'high' 
                               ? 'linear-gradient(to bottom, #ef4444, transparent)' 
                               : issue.priority === 'medium' 
                                 ? 'linear-gradient(to bottom, #f59e0b, transparent)' 
                                 : 'linear-gradient(to bottom, #3b82f6, transparent)' 
                           }}>
                      </div>
                      <div className="flex justify-between">
                        <h4 className="font-medium text-gray-800">{issue.title}</h4>
                        <span 
                          className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                              issue.priority === 'high' 
                                ? 'bg-red-100 text-red-800' 
                                : issue.priority === 'medium' 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-blue-100 text-blue-800'
                            }`}
                        >
                          {issue.priority === 'high' && 'عالية'}
                          {issue.priority === 'medium' && 'متوسطة'}
                          {issue.priority === 'low' && 'منخفضة'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{issue.description}</p>
                      <div className="flex justify-between mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <span 
                            className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                              issue.type === 'technical' 
                                ? 'bg-blue-100 text-blue-800' 
                                : issue.type === 'payment' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {issue.type === 'technical' && 'مشكلة تقنية'}
                            {issue.type === 'payment' && 'مشكلة دفع'}
                            {issue.type === 'content' && 'مشكلة محتوى'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(issue.date).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                        <motion.button 
                          onClick={() => handleIssueSolve(issue.id)}
                          className="text-xs bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-md shadow-sm transition-all font-medium flex items-center gap-1"
                          whileHover={{ scale: 1.05, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <FaCheckCircle size={12} className="animate-pulse" /> تم الحل
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    className="text-center py-12 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="relative inline-block mb-6">
                      <div className="absolute -inset-1 bg-green-200 rounded-full opacity-20 animate-pulse"></div>
                      <FaCheckCircle size={46} className="text-green-500 relative z-10" />
                    </div>
                    <h4 className="text-lg font-bold text-green-700 mb-2">لا توجد مشكلات نشطة حالياً</h4>
                    <p className="text-green-600 text-sm max-w-md mx-auto">جميع المشكلات تم حلها بنجاح</p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
          )}
          
          {/* إحصائيات إضافية */}
          {false && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FaChartBar className="text-primary" />
                إحصائيات الاشتراكات
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setDateRange('week')}
                  className={`px-3 py-1 rounded-full text-xs ${dateRange === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  أسبوعي
                </button>
                <button 
                  onClick={() => setDateRange('month')}
                  className={`px-3 py-1 rounded-full text-xs ${dateRange === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  شهري
                </button>
                <button 
                  onClick={() => setDateRange('year')}
                  className={`px-3 py-1 rounded-full text-xs ${dateRange === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  سنوي
                </button>
              </div>
            </div>
            <div className="h-80">
              {enrollmentData.datasets.length > 0 && enrollmentData.datasets[0].data.length > 0 ? (
                <BarChart data={enrollmentData} />
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-gray-400 bg-gray-50 rounded-lg animate-pulse-light">
                  <FaInfoCircle size={40} className="mb-3 text-blue-400" />
                  <p className="text-gray-600 font-medium">لا توجد بيانات كافية لعرض الرسم البياني</p>
                  <p className="text-sm text-gray-500 mt-2">جاري جمع البيانات الإحصائية...</p>
                </div>
              )}
            </div>
          </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default AdvancedDashboard;
