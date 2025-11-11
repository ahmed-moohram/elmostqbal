'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '@/components/AdminLayout';
import { FaUsers, FaGraduationCap, FaBook, FaMoneyBillWave, FaArrowUp, FaArrowDown, FaChartBar } from 'react-icons/fa';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// تسجيل مكونات الرسم البياني
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// نموذج بيانات الإحصاءات
interface AnalyticsData {
  summary: {
    totalStudents: number;
    totalRevenue: number;
    totalCourses: number;
    activeEnrollments: number;
    completionRate: number;
    averageRating: number;
    newUsers: {
      count: number;
      trend: number;
    };
    revenue: {
      amount: number;
      trend: number;
    };
  };
  enrollmentsByMonth: {
    labels: string[];
    data: number[];
  };
  revenueByMonth: {
    labels: string[];
    data: number[];
  };
  courseCategories: {
    labels: string[];
    data: number[];
    backgroundColor: string[];
  };
  topCourses: {
    title: string;
    enrollments: number;
    revenue: number;
    rating: number;
  }[];
  userDemographics: {
    labels: string[];
    data: number[];
    backgroundColor: string[];
  };
}

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('month');
  
  useEffect(() => {
    // محاكاة جلب البيانات من الخادم
    setTimeout(() => {
      const data: AnalyticsData = {
        summary: {
          totalStudents: 5247,
          totalRevenue: 1256890,
          totalCourses: 42,
          activeEnrollments: 3640,
          completionRate: 68,
          averageRating: 4.7,
          newUsers: {
            count: 320,
            trend: 12.5,
          },
          revenue: {
            amount: 125600,
            trend: 8.3,
          },
        },
        enrollmentsByMonth: {
          labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
          data: [320, 450, 380, 560, 480, 620],
        },
        revenueByMonth: {
          labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
          data: [85600, 97400, 82300, 108500, 95400, 125600],
        },
        courseCategories: {
          labels: ['رياضيات', 'فيزياء', 'كيمياء', 'أحياء', 'لغة عربية', 'لغة إنجليزية'],
          data: [35, 18, 15, 12, 10, 10],
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)',
          ],
        },
        topCourses: [
          { title: 'الرياضيات للصف الثالث الثانوي', enrollments: 640, revenue: 640000, rating: 4.9 },
          { title: 'الفيزياء للثانوية العامة', enrollments: 520, revenue: 468000, rating: 4.8 },
          { title: 'الكيمياء الشاملة', enrollments: 480, revenue: 432000, rating: 4.7 },

          { title: 'مراجعة الأحياء', enrollments: 320, revenue: 256000, rating: 4.5 },
        ],
        userDemographics: {
          labels: ['الثانوية العامة', 'الإعدادية', 'الجامعات', 'الدراسات العليا', 'أخرى'],
          data: [60, 15, 18, 5, 2],
          backgroundColor: [
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 99, 132, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
          ],
        },
      };
      
      setAnalytics(data);
      setIsLoading(false);
    }, 1000);
  }, [timeRange]);
  
  // تكوينات الرسوم البيانية
  const enrollmentChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
  
  const enrollmentChartData = analytics ? {
    labels: analytics.enrollmentsByMonth.labels,
    datasets: [
      {
        label: 'عدد الاشتراكات',
        data: analytics.enrollmentsByMonth.data,
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  } : null;
  
  const revenueChartData = analytics ? {
    labels: analytics.revenueByMonth.labels,
    datasets: [
      {
        label: 'الإيرادات (ج.م)',
        data: analytics.revenueByMonth.data,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  } : null;
  
  const courseCategoriesData = analytics ? {
    labels: analytics.courseCategories.labels,
    datasets: [
      {
        data: analytics.courseCategories.data,
        backgroundColor: analytics.courseCategories.backgroundColor,
        borderWidth: 1,
      },
    ],
  } : null;
  
  const userDemographicsData = analytics ? {
    labels: analytics.userDemographics.labels,
    datasets: [
      {
        data: analytics.userDemographics.data,
        backgroundColor: analytics.userDemographics.backgroundColor,
        borderWidth: 1,
      },
    ],
  } : null;
  
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }
  
  if (!analytics) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-xl text-red-500">حدث خطأ أثناء تحميل البيانات</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6"
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">لوحة التحليلات والإحصاءات</h1>
          
          <div className="bg-white rounded-lg shadow-sm overflow-hidden flex">
            <button 
              onClick={() => setTimeRange('week')}
              className={`px-4 py-2 ${timeRange === 'week' ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
            >
              أسبوع
            </button>
            <button 
              onClick={() => setTimeRange('month')}
              className={`px-4 py-2 ${timeRange === 'month' ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
            >
              شهر
            </button>
            <button 
              onClick={() => setTimeRange('year')}
              className={`px-4 py-2 ${timeRange === 'year' ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
            >
              سنة
            </button>
          </div>
        </div>
        
        {/* ملخص الإحصاءات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* إجمالي الطلاب */}
          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600">إجمالي الطلاب</p>
              <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                <FaUsers />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold">{analytics.summary.totalStudents.toLocaleString()}</h3>
              <div className={`flex items-center ${analytics.summary.newUsers.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                <span className="text-sm font-medium">{analytics.summary.newUsers.trend}%</span>
                {analytics.summary.newUsers.trend > 0 ? <FaArrowUp className="mr-1 text-xs" /> : <FaArrowDown className="mr-1 text-xs" />}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">+{analytics.summary.newUsers.count} طالب جديد هذا الشهر</p>
          </div>
          
          {/* إجمالي الإيرادات */}
          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600">إجمالي الإيرادات</p>
              <div className="p-2 bg-green-100 text-green-600 rounded-full">
                <FaMoneyBillWave />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold">{analytics.summary.totalRevenue.toLocaleString()} ج.م</h3>
              <div className={`flex items-center ${analytics.summary.revenue.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                <span className="text-sm font-medium">{analytics.summary.revenue.trend}%</span>
                {analytics.summary.revenue.trend > 0 ? <FaArrowUp className="mr-1 text-xs" /> : <FaArrowDown className="mr-1 text-xs" />}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{analytics.summary.revenue.amount.toLocaleString()} ج.م هذا الشهر</p>
          </div>
          
          {/* إجمالي الدورات */}
          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600">إجمالي الدورات</p>
              <div className="p-2 bg-yellow-100 text-yellow-600 rounded-full">
                <FaBook />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold">{analytics.summary.totalCourses}</h3>
            </div>
            <p className="text-xs text-gray-500 mt-2">{analytics.summary.activeEnrollments} اشتراك نشط</p>
          </div>
          
          {/* معدل الإكمال */}
          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600">معدل إكمال الدورات</p>
              <div className="p-2 bg-purple-100 text-purple-600 rounded-full">
                <FaGraduationCap />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold">{analytics.summary.completionRate}%</h3>
            </div>
            <p className="text-xs text-gray-500 mt-2">متوسط التقييم {analytics.summary.averageRating}/5</p>
          </div>
        </div>
        
        {/* الرسوم البيانية */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-soft p-6">
            <h3 className="text-lg font-bold mb-4">الاشتراكات الجديدة</h3>
            {enrollmentChartData && <Bar options={enrollmentChartOptions} data={enrollmentChartData} />}
          </div>
          
          <div className="bg-white rounded-xl shadow-soft p-6">
            <h3 className="text-lg font-bold mb-4">الإيرادات</h3>
            {revenueChartData && <Line options={enrollmentChartOptions} data={revenueChartData} />}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-soft p-6">
            <h3 className="text-lg font-bold mb-4">فئات الدورات</h3>
            <div className="flex items-center justify-center">
              {courseCategoriesData && <Doughnut data={courseCategoriesData} />}
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-soft p-6">
            <h3 className="text-lg font-bold mb-4">ديموغرافيا المستخدمين</h3>
            <div className="flex items-center justify-center">
              {userDemographicsData && <Doughnut data={userDemographicsData} />}
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-soft p-6">
            <h3 className="text-lg font-bold mb-4">أفضل الدورات أداءً</h3>
            <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
              <table className="w-full text-sm">
                <thead className="text-xs uppercase bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-right">الدورة</th>
                    <th className="px-3 py-2 text-right">الاشتراكات</th>
                    <th className="px-3 py-2 text-right">الإيرادات</th>
                    <th className="px-3 py-2 text-right">التقييم</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topCourses.map((course, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2">{course.title}</td>
                      <td className="px-3 py-2">{course.enrollments}</td>
                      <td className="px-3 py-2">{course.revenue.toLocaleString()} ج.م</td>
                      <td className="px-3 py-2 flex items-center">
                        {course.rating}
                        <span className="text-yellow-500 ml-1">★</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* تحليل البيانات */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <h3 className="text-lg font-bold mb-4">تحليل الأداء</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-800">معدل التحويل</h4>
                <span className="text-green-600 font-bold">5.2%</span>
              </div>
              <p className="text-sm text-gray-600">نسبة الزوار الذين قاموا بالتسجيل</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '5.2%' }}></div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-800">معدل الاحتفاظ</h4>
                <span className="text-blue-600 font-bold">78.9%</span>
              </div>
              <p className="text-sm text-gray-600">نسبة المستخدمين النشطين شهرياً</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '78.9%' }}></div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-800">قيمة المستخدم</h4>
                <span className="text-purple-600 font-bold">420 ج.م</span>
              </div>
              <p className="text-sm text-gray-600">متوسط الإيرادات لكل مستخدم</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '42%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AdminLayout>
  );
} 