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
  return (
    <AdminLayout>
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold mb-3">هذه الصفحة غير متاحة حالياً</h1>
          <p className="text-gray-600 dark:text-gray-300">
            سيتم تفعيل لوحة التحليلات بعد الانتهاء من إعداد نظام الإدارة المتقدم.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}