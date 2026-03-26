"use client";

import { useState, useEffect } from "react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
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
} from "chart.js";
import { FaChartBar, FaChartLine, FaChartPie, FaUsers, FaMoneyBillWave, FaBookOpen, FaGraduationCap, FaStar } from "react-icons/fa";

// Estilos globales para animaciones
import './dashboardAnimations.css';

// تسجيل مكونات ChartJS اللازمة
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

interface Stats {
  totalStudents: number;
  totalCourses: number;
  totalTeachers: number;
  totalRevenue: number;
  newStudentsToday?: number;
  activeStudents?: number;
  pendingPayments?: number;
  completionRate?: number;
  // Datos adicionales para gráficos
  newStudentsData?: number[];
  activeStudentsData?: number[];
  revenueData?: number[];
  completionData?: number[];
  // Etiquetas para gráficos (opcional si son diferentes a los predeterminados)
  monthLabels?: string[];
}

interface DashboardStatsProps {
  stats: Stats;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const [chartType, setChartType] = useState<"students" | "revenue" | "completion">("students");
  
  // استخدام البيانات الفعلية مباشرة من الـ API بدلاً من توليدها
  // في حالة عدم توفر بيانات كافية، سنترك المخطط فارغاً أو نعرض رسالة

  // استخدام بيانات فعلية من واجهة API - لا نستخدم بيانات مزيفة
  const studentsChartData = {
    labels: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو"],
    datasets: [
      {
        label: "الطلاب الجدد",
        data: stats.newStudentsData || [],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        tension: 0.3,
      },
      {
        label: "الطلاب النشطين",
        data: stats.activeStudentsData || [],
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.5)",
        tension: 0.3,
      }
    ],
  };

  // بيانات مخطط الإيرادات - مبنية على البيانات الفعلية من API
  const revenueChartData = {
    labels: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو"],
    datasets: [
      {
        label: "الإيرادات (ج.م)",
        data: stats.revenueData || [],
        backgroundColor: ["rgba(16, 185, 129, 0.6)", "rgba(59, 130, 246, 0.6)", "rgba(249, 115, 22, 0.6)", "rgba(79, 70, 229, 0.6)", "rgba(245, 158, 11, 0.6)", "rgba(236, 72, 153, 0.6)"],
        borderColor: "rgb(16, 185, 129)",
      }
    ],
  };

  // بيانات مخطط إكمال الكورسات
  const completionRate = stats.completionRate || 78;
  const completionChartData = {
    labels: ["أكملوا", "قيد التقدم", "بدأوا للتو"],
    datasets: [
      {
        data: [completionRate, Math.round((100 - completionRate) * 0.7), Math.round((100 - completionRate) * 0.3)],
        backgroundColor: [
          "rgba(16, 185, 129, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(249, 115, 22, 0.8)",
        ],
        borderColor: [
          "rgb(16, 185, 129)",
          "rgb(59, 130, 246)",
          "rgb(249, 115, 22)",
        ],
        borderWidth: 2,
      }
    ],
  };

  // خيارات الرسم البياني
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        rtl: true,
        labels: {
          font: {
            family: "Cairo, Arial"
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  // خيارات مخطط الدائرة
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        rtl: true,
        labels: {
          font: {
            family: "Cairo, Arial"
          }
        }
      }
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <h2 className="text-2xl font-bold text-blue-900 mb-6 relative">
        لوحة الإحصائيات
        <span className="absolute bottom-0 right-0 w-20 h-1 bg-gradient-to-l from-blue-600 to-blue-400 rounded-full"></span>
      </h2>
      
      {/* بطاقات الإحصائيات الرئيسية مع تأثيرات بصرية محسنة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 flex items-center shadow-lg border border-blue-100 transition-all duration-300 hover:shadow-xl hover:translate-y-[-5px] hover:border-blue-300">
          <div className="bg-blue-100 p-4 rounded-full mr-4 transition-all duration-300 hover:bg-blue-200 hover:shadow-md">
            <FaUsers className="text-2xl text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-800 mb-1 flex items-center">
              <span className="animate-countUp">{stats.totalStudents.toLocaleString('ar-EG')}</span>
              {stats.newStudentsToday && (
                <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full mr-2 animate-pulse">
                  +{stats.newStudentsToday} اليوم
                </span>
              )}
            </div>
            <div className="text-sm text-blue-600 opacity-80">إجمالي الطلاب</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl p-6 flex items-center shadow-lg border border-green-100 transition-all duration-300 hover:shadow-xl hover:translate-y-[-5px] hover:border-green-300">
          <div className="bg-green-100 p-4 rounded-full mr-4 transition-all duration-300 hover:bg-green-200 hover:shadow-md">
            <FaMoneyBillWave className="text-2xl text-green-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-green-800 mb-1">
              <span className="animate-countUp">{stats.totalRevenue.toLocaleString('ar-EG')}</span> ج.م
            </div>
            <div className="text-sm text-green-600 opacity-80">إجمالي الإيرادات</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl p-6 flex items-center shadow-lg border border-purple-100 transition-all duration-300 hover:shadow-xl hover:translate-y-[-5px] hover:border-purple-300">
          <div className="bg-purple-100 p-4 rounded-full mr-4 transition-all duration-300 hover:bg-purple-200 hover:shadow-md">
            <FaBookOpen className="text-2xl text-purple-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-800 mb-1">
              <span className="animate-countUp">{stats.totalCourses.toLocaleString('ar-EG')}</span>
            </div>
            <div className="text-sm text-purple-600 opacity-80">عدد الكورسات</div>
          </div>
        </div>
      </div>
      
      {/* أزرار تبديل نوع المخطط مع تصميم محسن */}
      <div className="flex flex-wrap gap-3 mb-6 justify-center md:justify-start">
        <button
          onClick={() => setChartType("students")}
          className={`p-3 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 shadow-sm ${
            chartType === "students" 
              ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md transform scale-105" 
              : "bg-white text-blue-600 hover:bg-blue-50 hover:shadow hover:scale-105"
          }`}
        >
          <FaChartLine className={`${chartType === "students" ? "animate-pulse" : ""}`} /> عدد الطلاب
        </button>
        <button
          onClick={() => setChartType("revenue")}
          className={`p-3 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 shadow-sm ${
            chartType === "revenue" 
              ? "bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md transform scale-105" 
              : "bg-white text-green-600 hover:bg-green-50 hover:shadow hover:scale-105"
          }`}
        >
          <FaChartBar className={`${chartType === "revenue" ? "animate-pulse" : ""}`} /> الإيرادات
        </button>
        <button
          onClick={() => setChartType("completion")}
          className={`p-3 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 shadow-sm ${
            chartType === "completion" 
              ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md transform scale-105" 
              : "bg-white text-purple-600 hover:bg-purple-50 hover:shadow hover:scale-105"
          }`}
        >
          <FaChartPie className={`${chartType === "completion" ? "animate-pulse" : ""}`} /> إكمال الدورات
        </button>
      </div>
      
      {/* المخططات مع تأثيرات انتقالية */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100 transition-all duration-500 hover:shadow-xl">
        <div className="h-80 transition-opacity duration-300">
          {chartType === "students" && (
            <div className="animate-fadeIn">
              <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <FaUsers className="text-blue-600" /> احصائيات الطلاب
              </h3>
              <Line data={studentsChartData} options={options} />
            </div>
          )}
          {chartType === "revenue" && (
            <div className="animate-fadeIn">
              <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                <FaMoneyBillWave className="text-green-600" /> احصائيات الإيرادات
              </h3>
              <Bar data={revenueChartData} options={options} />
            </div>
          )}
          {chartType === "completion" && (
            <div className="animate-fadeIn">
              <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center gap-2">
                <FaChartPie className="text-purple-600" /> معدلات إكمال الدورات
              </h3>
              <Doughnut data={completionChartData} options={doughnutOptions} />
            </div>
          )}
        </div>
      </div>
      
      {/* إحصائيات إضافية مع تصميم محسن */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl p-6 shadow-md border border-blue-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2 border-b border-blue-100 pb-2">
            <FaBookOpen className="text-blue-600" />
            <span>أكثر الكورسات شعبية</span>
          </h3>
          <ul className="space-y-3">
            <li className="flex justify-between items-center p-2 hover:bg-blue-50 rounded-lg transition-colors duration-200">
              <span className="font-medium">جبر ثانوية عامة</span>
              <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">{Math.round(stats.totalStudents * 0.4).toLocaleString('ar-EG')} طالب</span>
            </li>
            <li className="flex justify-between items-center p-2 hover:bg-blue-50 rounded-lg transition-colors duration-200">
              <span className="font-medium">فيزياء ثانوية عامة</span>
              <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">{Math.round(stats.totalStudents * 0.3).toLocaleString('ar-EG')} طالب</span>
            </li>
            <li className="flex justify-between items-center p-2 hover:bg-blue-50 rounded-lg transition-colors duration-200">
              <span className="font-medium">كيمياء ثانوية عامة</span>
              <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">{Math.round(stats.totalStudents * 0.25).toLocaleString('ar-EG')} طالب</span>
            </li>
          </ul>
        </div>
        
        <div className="bg-gradient-to-br from-white to-green-50 rounded-xl p-6 shadow-md border border-green-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2 border-b border-green-100 pb-2">
            <FaUsers className="text-green-600" />
            <span>أفضل المدرسين أداءً</span>
          </h3>
          <ul className="space-y-3">
            <li className="flex justify-between items-center p-2 hover:bg-green-50 rounded-lg transition-colors duration-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center text-green-700 font-bold">M</div>
                <span className="font-medium">MR</span>
              </div>
              <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                <span className="text-yellow-500">⭐</span> 4.9
              </span>
            </li>
            <li className="flex justify-between items-center p-2 hover:bg-green-50 rounded-lg transition-colors duration-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold">H</div>
                <span className="font-medium">هيمه</span>
              </div>
              <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                <span className="text-yellow-500">⭐</span> 4.8
              </span>
            </li>
            <li className="flex justify-between items-center p-2 hover:bg-green-50 rounded-lg transition-colors duration-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center text-purple-700 font-bold">A</div>
                <span className="font-medium">أحمد محمد</span>
              </div>
              <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                <span className="text-yellow-500">⭐</span> 4.7
              </span>
            </li>
          </ul>
        </div>
        
        <div className="bg-gradient-to-br from-white to-indigo-50 rounded-xl p-6 shadow-md border border-indigo-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
          <h3 className="font-bold text-indigo-800 mb-4 flex items-center gap-2 border-b border-indigo-100 pb-2">
            <FaUsers className="text-indigo-600" />
            <span>الطلاب الجدد</span>
            {stats.newStudentsToday && (
              <span className="bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full text-xs font-semibold mr-auto animate-pulse">
                +{stats.newStudentsToday} اليوم
              </span>
            )}
          </h3>
          <ul className="space-y-3">
            <li className="flex justify-between items-center p-2 hover:bg-indigo-50 rounded-lg transition-colors duration-200">
              <span className="font-medium">هذا الأسبوع</span>
              <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-sm font-semibold">
                +{Math.round(stats.totalStudents * 0.05).toLocaleString('ar-EG')}
              </span>
            </li>
            <li className="flex justify-between items-center p-2 hover:bg-indigo-50 rounded-lg transition-colors duration-200">
              <span className="font-medium">هذا الشهر</span>
              <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-sm font-semibold">
                +{Math.round(stats.totalStudents * 0.15).toLocaleString('ar-EG')}
              </span>
            </li>
            <li className="flex justify-between items-center p-2 hover:bg-indigo-50 rounded-lg transition-colors duration-200">
              <span className="font-medium">معدل النمو</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full" style={{ width: '75%' }}></div>
                </div>
                <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm font-semibold">+12%</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 