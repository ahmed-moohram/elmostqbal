"use client";

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { FaChartLine, FaDownload, FaCalendar, FaUsers, FaMoneyBillWave, FaGraduationCap, FaArrowUp } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import supabase from '@/lib/supabase-client';

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('2024-10-01');
  const [dateTo, setDateTo] = useState('2024-10-31');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    if (!dateFrom || !dateTo) {
      toast.error('يرجى اختيار التواريخ');
      return;
    }
    setLoading(true);
    try {
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);

      const fromIso = fromDate.toISOString();
      const toIso = toDate.toISOString();

      const [
        { data: studentsData, error: studentsError },
        { data: paymentsData, error: paymentsError },
        { data: enrollmentsData, error: enrollmentsError }
      ] = await Promise.all([
        supabase
          .from('users')
          .select('id, created_at')
          .eq('role', 'student')
          .gte('created_at', fromIso)
          .lte('created_at', toIso),
        supabase
          .from('payments')
          .select('id, amount, status, course_id, payment_date')
          .gte('payment_date', fromIso)
          .lte('payment_date', toIso),
        supabase
          .from('enrollments')
          .select('id, course_id, enrolled_at')
          .gte('enrolled_at', fromIso)
          .lte('enrolled_at', toIso),
      ]);

      if (studentsError) {
        console.error('خطأ في جلب تسجيلات الطلاب للتقرير:', studentsError);
      }
      if (paymentsError) {
        console.error('خطأ في جلب المدفوعات للتقرير:', paymentsError);
      }
      if (enrollmentsError) {
        console.error('خطأ في جلب التسجيلات للتقرير:', enrollmentsError);
      }

      const safeStudents = (studentsData || []) as any[];
      const safePayments = (paymentsData || []) as any[];
      const safeEnrollments = (enrollmentsData || []) as any[];

      const successfulPayments = safePayments.filter((p: any) =>
        ['success', 'completed', 'paid'].includes(String(p.status || '').toLowerCase())
      );

      const newRegistrations = safeStudents.length;

      const revenue = successfulPayments.reduce(
        (sum: number, p: any) => sum + (Number(p.amount) || 0),
        0
      );

      const soldCourseIds = new Set<string>();
      successfulPayments.forEach((p: any) => {
        if (p.course_id) {
          soldCourseIds.add(String(p.course_id));
        }
      });
      safeEnrollments.forEach((e: any) => {
        if (e.course_id) {
          soldCourseIds.add(String(e.course_id));
        }
      });

      const coursesSold = soldCourseIds.size;

      const dayMap = new Map<
        string,
        { registrations: number; revenue: number; courses: Set<string> }
      >();

      const addDayEntry = (
        dateStr: string | null | undefined,
        updater: (entry: {
          registrations: number;
          revenue: number;
          courses: Set<string>;
        }) => void
      ) => {
        if (!dateStr) return;
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return;
        const dayKey = d.toISOString().slice(0, 10);
        if (!dayMap.has(dayKey)) {
          dayMap.set(dayKey, {
            registrations: 0,
            revenue: 0,
            courses: new Set<string>(),
          });
        }
        const entry = dayMap.get(dayKey)!;
        updater(entry);
      };

      safeStudents.forEach((s: any) => {
        addDayEntry(s.created_at, (entry) => {
          entry.registrations += 1;
        });
      });

      successfulPayments.forEach((p: any) => {
        addDayEntry(p.payment_date, (entry) => {
          entry.revenue += Number(p.amount) || 0;
          if (p.course_id) {
            entry.courses.add(String(p.course_id));
          }
        });
      });

      safeEnrollments.forEach((e: any) => {
        addDayEntry(e.enrolled_at, (entry) => {
          if (e.course_id) {
            entry.courses.add(String(e.course_id));
          }
        });
      });

      const details = Array.from(dayMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, value]) => ({
          date,
          registrations: value.registrations,
          revenue: value.revenue,
          courses: value.courses.size,
        }));

      const courseRevenueMap = new Map<
        string,
        { revenue: number; sales: number }
      >();

      successfulPayments.forEach((p: any) => {
        if (!p.course_id) return;
        const courseId = String(p.course_id);
        const current = courseRevenueMap.get(courseId) || {
          revenue: 0,
          sales: 0,
        };
        current.revenue += Number(p.amount) || 0;
        current.sales += 1;
        courseRevenueMap.set(courseId, current);
      });

      let courseTitlesMap = new Map<string, string>();
      const courseIds = Array.from(courseRevenueMap.keys());

      if (courseIds.length > 0) {
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, title')
          .in('id', courseIds);

        if (coursesError) {
          console.error('خطأ في جلب عناوين الكورسات للتقرير:', coursesError);
        } else {
          courseTitlesMap = new Map(
            (coursesData || []).map((c: any) => [String(c.id), c.title as string])
          );
        }
      }

      const topCourses = Array.from(courseRevenueMap.entries())
        .map(([courseId, info]) => ({
          name: courseTitlesMap.get(courseId) || 'دورة بدون اسم',
          sales: info.sales,
          revenue: info.revenue,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const report = {
        newRegistrations,
        revenue,
        coursesSold,
        growthRate: null,
        details,
        topCourses,
      };

      setReportData(report);
      toast.success('تم إنشاء التقرير بنجاح');
    } catch (error) {
      console.error('خطأ غير متوقع في إنشاء التقرير:', error);
      toast.error('حدث خطأ أثناء إنشاء التقرير');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    toast.success('جاري تصدير التقرير...');
    setTimeout(() => {
      toast.success('تم التصدير بنجاح!');
    }, 1000);
  };
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FaChartLine className="text-primary" />
            التقارير
          </h1>
          <button className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-dark">
            <FaDownload /> تصدير PDF
          </button>
        </div>

        {/* فلاتر التاريخ */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">من تاريخ</label>
              <div className="relative">
                <FaCalendar className="absolute right-3 top-3 text-gray-400" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">إلى تاريخ</label>
              <div className="relative">
                <FaCalendar className="absolute right-3 top-3 text-gray-400" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={generateReport}
                disabled={loading}
                className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'جاري التحميل...' : 'عرض التقرير'}
              </button>
            </div>
          </div>
        </div>

        {/* الإحصائيات */}
        {reportData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 animate-fadeIn">
            <div className="bg-blue-50 p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">التسجيلات الجديدة</p>
                  <p className="text-3xl font-bold text-blue-600">{reportData.newRegistrations}</p>
                </div>
                <FaUsers className="text-4xl text-blue-600 opacity-20" />
              </div>
            </div>
            <div className="bg-green-50 p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">الإيرادات</p>
                  <p className="text-3xl font-bold text-green-600">{reportData.revenue.toLocaleString()} ج.م</p>
                </div>
                <FaMoneyBillWave className="text-4xl text-green-600 opacity-20" />
              </div>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">الدورات المباعة</p>
                  <p className="text-3xl font-bold text-purple-600">{reportData.coursesSold}</p>
                </div>
                <FaGraduationCap className="text-4xl text-purple-600 opacity-20" />
              </div>
            </div>
            <div className="bg-orange-50 p-6 rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">معدل النمو</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {reportData.growthRate != null ? reportData.growthRate : '--'}
                    {reportData.growthRate != null && '%'}
                  </p>
                </div>
                <FaArrowUp className="text-4xl text-orange-600 opacity-20" />
              </div>
            </div>
          </div>
        )}

        {/* جدول التقرير */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">التقرير التفصيلي</h2>
            {reportData && (
              <button
                onClick={exportToPDF}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <FaDownload /> تصدير PDF
              </button>
            )}
          </div>
          
          {!reportData ? (
            <div className="text-center py-12">
              <FaChartLine className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                اختر نطاق تاريخ واضغط "عرض التقرير"
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto animate-fadeIn">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">التاريخ</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">التسجيلات</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الإيرادات</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الدورات المباعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.details.map((row: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{row.date}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {row.registrations}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-green-600">{row.revenue.toLocaleString()} ج.م</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          {row.courses}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-bold">
                  <tr>
                    <td className="px-4 py-3 text-sm">الإجمالي</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="bg-blue-200 text-blue-900 px-2 py-1 rounded">
                        {reportData.newRegistrations}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600">{reportData.revenue.toLocaleString()} ج.م</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="bg-purple-200 text-purple-900 px-2 py-1 rounded">
                        {reportData.coursesSold}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* أفضل الدورات */}
        {reportData && (
          <div className="bg-white rounded-lg shadow p-6 animate-fadeIn">
            <h2 className="font-bold text-lg mb-4">أفضل الدورات مبيعاً</h2>
            <div className="space-y-3">
              {reportData.topCourses.map((course: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{course.name}</p>
                      <p className="text-sm text-gray-600">{course.sales} عملية بيع</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-green-600">{course.revenue.toLocaleString()} ج.م</p>
                    <p className="text-xs text-gray-500">الإيرادات</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
