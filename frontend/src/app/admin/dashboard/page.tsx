'use client';

import { useState, useEffect, ReactNode } from 'react';
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FaUsers, FaGraduationCap, FaBook, FaMoneyBillWave, FaChartLine, FaSearch, FaEllipsisV, FaArrowUp, FaArrowDown, FaExclamationCircle, FaCheckCircle, FaRegCalendarAlt, FaRegClock } from 'react-icons/fa';
import AdminLayout from "../../../components/AdminLayout";
import userStorage from "@/services/userStorage";

// Create NoSSR wrapper for Recharts
const NoSSR = ({ children }: { children: ReactNode }) => <>{children}</>;



// الألوان للرسوم البيانية
const COLORS = ['#6d28d9', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

// نماذج البيانات للرسوم البيانية
interface RevenueDataPoint {
  name: string;
  revenue: number;
}

interface EnrollmentDataPoint {
  name: string;
  students: number;
}

interface CategoryDataPoint {
  name: string;
  value: number;
}

interface RecentOrder {
  id: string;
  studentName: string;
  studentAvatar: string;
  courseName: string;
  date: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
}

interface RecentStudent {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinDate: string;
  enrolledCourses: number;
}

interface PopularCourse {
  id: string;
  title: string;
  instructor: string;
  thumbnail: string;
  students: number;
  rating: number;
  revenue: number;
}

const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
  const [popularCourses, setPopularCourses] = useState<PopularCourse[]>([]);
  
  // متغيرات الحالة للرسوم البيانية
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentDataPoint[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryDataPoint[]>([]);
  
  // فترات الإيرادات والتسجيلات
  const [revenuePeriod, setRevenuePeriod] = useState('1month');
  const [enrollmentPeriod, setEnrollmentPeriod] = useState('1month');
  
  // جلب البيانات من السيرفر
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = userStorage.getAuthToken();
        if (!token) {
          console.error('غير مصرح به. الرجاء تسجيل الدخول');
          setIsLoading(false);
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // تنفيذ كل استدعاءات API في وقت واحد
        const [ordersRes, studentsRes, coursesRes, analyticsRes] = await Promise.all([
          fetch(`${apiUrl}/api/admin/orders`, { headers }),
          fetch(`${apiUrl}/api/admin/students/recent`, { headers }),
          fetch(`${apiUrl}/api/admin/courses/popular`, { headers }),
          fetch(`${apiUrl}/api/admin/analytics?period=${revenuePeriod}`, { headers }),
        ]);
        
        // التحقق من نجاح الاستجابات
        const ordersOk = ordersRes.ok;
        const studentsOk = studentsRes.ok;
        const coursesOk = coursesRes.ok;
        const analyticsOk = analyticsRes.ok;
        
        // معالجة البيانات وتعبئة حالة المكون
        if (ordersOk) {
          const ordersData = await ordersRes.json();
          setRecentOrders(Array.isArray(ordersData) ? ordersData : ordersData.orders || []);
        } else {
          console.error('فشل في جلب بيانات الطلبات');
          setRecentOrders([]);
        }
        
        if (studentsOk) {
          const studentsData = await studentsRes.json();
          setRecentStudents(Array.isArray(studentsData) ? studentsData : studentsData.students || []);
        } else {
          console.error('فشل في جلب بيانات الطلاب');
          setRecentStudents([]);
        }
        
        if (coursesOk) {
          const coursesData = await coursesRes.json();
          setPopularCourses(Array.isArray(coursesData) ? coursesData : coursesData.courses || []);
        } else {
          console.error('فشل في جلب بيانات الدورات الشائعة');
          setPopularCourses([]);
        }
        
        // تحديث بيانات الرسوم البيانية إذا كان الطلب ناجحًا
        if (analyticsOk) {
          const analyticsData = await analyticsRes.json();
          const monthsData = analyticsData.monthsData || [];
          
          // تحويل البيانات لصيغة الرسوم البيانية
          const revenueChartData = monthsData.map((item: any) => ({
            month: item.month,
            revenue: item.revenue
          }));
          
          const enrollmentChartData = monthsData.map((item: any) => ({
            month: item.month,
            students: item.students
          }));
          
          setRevenueData(revenueChartData);
          setEnrollmentData(enrollmentChartData);
          
          // بيانات الفئات (يمكن إضافة endpoint خاص لاحقاً)
          setCategoryData([]);
        } else {
          console.error('فشل في جلب بيانات التحليلات');
          setRevenueData([]);
          setEnrollmentData([]);
          setCategoryData([]);
        }
        
      } catch (error) {
        console.error('خطأ في جلب البيانات:', error);
        // تعيين البيانات إلى مصفوفات فارغة في حالة الخطأ
        setRecentOrders([]);
        setRecentStudents([]);
        setPopularCourses([]);
        setRevenueData([]);
        setEnrollmentData([]);
        setCategoryData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [revenuePeriod, enrollmentPeriod]);

  // حساب إجمالي الإيرادات من الطلبات المكتملة
  const totalRevenue = recentOrders.reduce((sum, order) => 
    order.status === 'completed' ? sum + order.amount : sum, 0);

  // حساب إجمالي الطلاب المسجلين
  const totalStudents = recentStudents.length;

  // حساب إجمالي الدورات الشائعة
  const totalCourses = popularCourses.length;

  // معدل النمو (سيتم تحديثه من بيانات API حقيقية عندما تكون متاحة)
  const growthRate = 5; // قيمة افتراضية حتى يتم تنفيذ API لمعدل النمو

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">جاري تحميل لوحة التحكم...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">لوحة التحكم</h1>
          <p className="text-gray-500">مرحباً بك في لوحة تحكم المشرف، يمكنك متابعة أداء المنصة من هنا.</p>
        </div>
        
        {/* البطاقات الإحصائية */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  <StatsCard 
    icon={<FaUsers className="text-primary" />} 
    title="إجمالي الطلاب" 
    value={totalStudents.toLocaleString()} 
    trend={`+${Math.round(totalStudents * (growthRate / 100))} هذا الشهر`}
    isPositive={true}
  />
  <StatsCard 
    icon={<FaGraduationCap className="text-accent" />} 
    title="الدورات النشطة" 
    value={totalCourses.toLocaleString()} 
    trend={`+${Math.round(growthRate)}% هذا الشهر`}
    isPositive={true}
  />
  <StatsCard 
    icon={<FaMoneyBillWave className="text-green-500" />} 
    title="إجمالي الإيرادات" 
    value={`${totalRevenue.toLocaleString()} ج.م`} 
    trend={`+${growthRate}% هذا الشهر`}
    isPositive={true}
  />
  <StatsCard 
    icon={<FaChartLine className="text-yellow-500" />} 
    title="معدل الإكمال" 
    value={`${Math.min(80, Math.max(0, Math.round(totalStudents > 0 ? (recentOrders.length / totalStudents) * 100 : 0)))}%`} 
    trend={`${Math.round(growthRate / 2)}% تحسن`}
    isPositive={true}
  />
</div>

<div className="flex justify-center mb-10">
  <Link href="/admin/courses">
    <button className="flex flex-col items-center justify-center bg-primary text-white text-2xl font-bold rounded-2xl shadow-lg px-12 py-8 hover:bg-accent transition-all border-4 border-primary/40">
      <FaBook className="text-5xl mb-3" />
      الدورات
      <span className="text-sm font-normal mt-2 text-white/90">تحكم شامل: إضافة، حذف، تعديل الدورات</span>
    </button>
  </Link>
</div>
        
        {/* الرسوم البيانية */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* رسم بياني للإيرادات */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="card-premium"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">الإيرادات الشهرية</h2>
              <div className="flex items-center gap-2">
                <select 
                  value={revenuePeriod}
                  onChange={(e) => setRevenuePeriod(e.target.value)}
                  className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800"
                >
                  <option value="1day">آخر يوم</option>
                  <option value="1week">آخر أسبوع</option>
                  <option value="2weeks">آخر أسبوعين</option>
                  <option value="3weeks">آخر 3 أسابيع</option>
                  <option value="1month">آخر شهر</option>
                  <option value="2months">آخر شهرين</option>
                  <option value="3months">آخر 3 أشهر</option>
                  <option value="6months">آخر 6 أشهر</option>
                  <option value="1year">آخر سنة</option>
                  <option value="2years">آخر سنتين</option>
                  <option value="3years">آخر 3 سنوات</option>
                  <option value="5years">آخر 5 سنوات</option>
                </select>
              </div>
            </div>
            
            <div className="h-80">
              <AreaChart
                data={revenueData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                width={500}
                height={300}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6d28d9" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6d28d9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${value} ج.م`} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#6d28d9" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </div>
          </motion.div>
          
          {/* رسم بياني للتسجيلات */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="card-premium"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">تسجيلات الطلاب</h2>
              <div className="flex items-center gap-2">
                <select 
                  value={enrollmentPeriod}
                  onChange={(e) => setEnrollmentPeriod(e.target.value)}
                  className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800"
                >
                  <option value="1day">آخر يوم</option>
                  <option value="1week">آخر أسبوع</option>
                  <option value="2weeks">آخر أسبوعين</option>
                  <option value="3weeks">آخر 3 أسابيع</option>
                  <option value="1month">آخر شهر</option>
                  <option value="2months">آخر شهرين</option>
                  <option value="3months">آخر 3 أشهر</option>
                  <option value="6months">آخر 6 أشهر</option>
                  <option value="1year">آخر سنة</option>
                  <option value="2years">آخر سنتين</option>
                  <option value="3years">آخر 3 سنوات</option>
                  <option value="5years">آخر 5 سنوات</option>
                </select>
              </div>
            </div>
            
            <div className="h-80">
              <BarChart
                data={enrollmentData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                width={500}
                height={300}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${value} طالب`} />
                <Bar 
                  dataKey="students" 
                  fill="#8b5cf6" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </div>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* العمود الأول */}
          <div className="lg:col-span-2 space-y-8">
            {/* الطلبات الأخيرة */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="card-premium"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">الطلبات الأخيرة</h2>
                <Link href="/admin/sales/orders" className="text-primary hover:underline text-sm">
                  عرض الكل
                </Link>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-right py-3 px-4 font-medium text-gray-500">رقم الطلب</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">الطالب</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">الدورة</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">التاريخ</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">المبلغ</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-4 text-sm">{order.id}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative h-8 w-8 rounded-full overflow-hidden">
                              <Image 
                                src={order.studentAvatar} 
                                alt={order.studentName}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <span className="text-sm font-medium">{order.studentName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">{order.courseName}</td>
                        <td className="py-3 px-4 text-sm">{order.date}</td>
                        <td className="py-3 px-4 text-sm font-medium">{order.amount} ج.م</td>
                        <td className="py-3 px-4">
                          <span 
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                              'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}
                          >
                            {order.status === 'completed' ? 'مكتمل' :
                             order.status === 'pending' ? 'قيد الانتظار' :
                             'فشل'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
            
            {/* الدورات الأكثر شعبية */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="card-premium"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">الدورات الأكثر شعبية</h2>
                <Link href="/admin/courses" className="text-primary hover:underline text-sm">
                  عرض الكل
                </Link>
              </div>
              
              <div className="space-y-6">
                {popularCourses.map((course) => (
                  <div key={course.id} className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="relative h-20 w-32 rounded-lg overflow-hidden flex-shrink-0">
                      <Image 
                        src={course.thumbnail} 
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold mb-1">{course.title}</h3>
                      <p className="text-sm text-gray-500 mb-2">{course.instructor}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <FaUsers className="text-primary" />
                            <span>{course.students} طالب</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FaMoneyBillWave className="text-green-500" />
                            <span>{course.revenue.toLocaleString()} ج.م</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 px-2 py-1 rounded-full text-xs">
                          <FaChartLine />
                          <span>{course.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
          
          {/* العمود الثاني */}
          <div className="space-y-8">
            {/* توزيع الفئات */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="card-premium"
            >
              <h2 className="text-xl font-bold mb-6">توزيع الدورات حسب الفئة</h2>
              
              <div className="h-64 flex justify-center">
                {categoryData && categoryData.length > 0 ? (
                  <PieChart width={250} height={200}>
                    <Pie
                      data={categoryData as any}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={(entry: any) => `${entry.name} ${((entry.percent || 0) * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <FaExclamationCircle className="text-4xl mb-2" />
                    <p>لا توجد بيانات</p>
                  </div>
                )}
              </div>
            </motion.div>
            
            {/* أحدث الطلاب */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="card-premium"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">أحدث الطلاب</h2>
                <Link href="/admin/students" className="text-primary hover:underline text-sm">
                  عرض الكل
                </Link>
              </div>
              
              <div className="space-y-4">
                {recentStudents.map((student) => (
                  <div key={student.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="relative h-10 w-10 rounded-full overflow-hidden">
                      <Image 
                        src={student.avatar} 
                        alt={student.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{student.name}</div>
                      <div className="text-xs text-gray-500">{student.email}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      <div>{student.joinDate}</div>
                      <div className="text-primary">{student.enrolledCourses} دورات</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            
            {/* إجراءات سريعة */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="card-premium"
            >
              <h2 className="text-xl font-bold mb-6">إجراءات سريعة</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Link href="/admin/enrollments">
                  <div className="p-4 bg-gradient-to-tr from-primary to-accent text-white rounded-2xl text-center shadow-lg border-2 border-primary/20 hover:scale-105 hover:shadow-2xl transition-transform cursor-pointer flex flex-col items-center justify-center">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white text-primary shadow mb-2">
                      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14c-4.418 0-8 2.239-8 5v1a1 1 0 001 1h14a1 1 0 001-1v-1c0-2.761-3.582-5-8-5z" /></svg>
                    </span>
                    <div className="text-lg font-bold drop-shadow">طلبات اشتراك الطلاب</div>
                    <div className="text-xs text-white/80 mt-1">مراجعة وقبول أو رفض الطلبات باحترافية</div>
                    <span className="mt-2 inline-block px-4 py-1 bg-white text-primary rounded-full font-bold shadow group-hover:bg-accent group-hover:text-white transition">إدارة الطلبات</span>
                  </div>
                </Link>
                <Link href="/admin/courses/new">
                  <div className="p-4 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-center transition-colors">
                    <FaBook className="text-2xl mx-auto mb-2" />
                    <div className="text-sm font-medium">إضافة دورة</div>
                  </div>
                </Link>
                <Link href="/admin/users">
                  <div className="p-4 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-center transition-colors">
                    <FaUsers className="text-2xl mx-auto mb-2" />
                    <div className="text-sm font-medium">إدارة المستخدمين</div>
                  </div>
                </Link>
                <Link href="/admin/reports">
                  <div className="p-4 bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-lg text-center transition-colors">
                    <FaChartLine className="text-2xl mx-auto mb-2" />
                    <div className="text-sm font-medium">التقارير</div>
                  </div>
                </Link>
                <Link href="/admin/settings">
                  <div className="p-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-center transition-colors">
                    <FaSearch className="text-2xl mx-auto mb-2" />
                    <div className="text-sm font-medium">الإعدادات</div>
                  </div>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// مكون البطاقة الإحصائية
interface StatsCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  trend: string;
  isPositive?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ icon, title, value, trend, isPositive = true }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all p-5 border border-gray-100 dark:border-gray-700"
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="text-gray-500 text-sm mb-1">{title}</div>
          <div className="text-2xl font-bold">{value}</div>
          <div className={`text-xs flex items-center gap-1 mt-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <FaArrowUp /> : <FaArrowDown />}
            <span>{trend}</span>
          </div>
        </div>
        <div className="p-3 rounded-full bg-primary/10">
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;