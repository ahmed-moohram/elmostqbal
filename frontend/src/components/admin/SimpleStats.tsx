'use client';

import { FaUsers, FaChalkboardTeacher, FaBook, FaMoneyBillWave } from 'react-icons/fa';

interface Stats {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalRevenue?: number;
  activeEnrollments?: number;
}

interface SimpleStatsProps {
  stats: Stats;
}

export default function SimpleStats({ stats }: SimpleStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* إجمالي الطلاب */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm mb-1">إجمالي الطلاب</p>
            <h3 className="text-3xl font-bold">{stats.totalStudents.toLocaleString('ar-EG')}</h3>
            {stats.activeEnrollments !== undefined && (
              <p className="text-blue-100 text-xs mt-1">
                {stats.activeEnrollments} نشط
              </p>
            )}
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-full">
            <FaUsers className="text-3xl" />
          </div>
        </div>
      </div>

      {/* إجمالي المدرسين */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm mb-1">إجمالي المدرسين</p>
            <h3 className="text-3xl font-bold">{stats.totalTeachers.toLocaleString('ar-EG')}</h3>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-full">
            <FaChalkboardTeacher className="text-3xl" />
          </div>
        </div>
      </div>

      {/* إجمالي الدورات */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm mb-1">إجمالي الدورات</p>
            <h3 className="text-3xl font-bold">{stats.totalCourses.toLocaleString('ar-EG')}</h3>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-full">
            <FaBook className="text-3xl" />
          </div>
        </div>
      </div>

      {/* إجمالي الإيرادات */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-100 text-sm mb-1">إجمالي الإيرادات</p>
            <h3 className="text-3xl font-bold">
              {(stats.totalRevenue || 0).toLocaleString('ar-EG')}
              <span className="text-lg mr-1">ج.م</span>
            </h3>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-full">
            <FaMoneyBillWave className="text-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
