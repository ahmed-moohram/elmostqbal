'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { FaChalkboardTeacher, FaPlus, FaEnvelope, FaPhone, FaStar } from 'react-icons/fa';

export default function InstructorsPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/users?role=teacher`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const teachersData = data.users || data || [];
        console.log(`✅ تم جلب ${teachersData.length} مدرس`);
        setTeachers(teachersData);
      } else {
        console.warn('⚠️ لا يوجد مدرسون');
        setTeachers([]);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب المدرسين:', error);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FaChalkboardTeacher className="text-primary" />
            المدرسين
          </h1>
          <button className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-dark">
            <FaPlus /> إضافة مدرس
          </button>
        </div>

        {/* إحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <p className="text-sm text-gray-600">إجمالي المدرسين</p>
            <p className="text-3xl font-bold text-blue-600">{teachers.length}</p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <p className="text-sm text-gray-600">إجمالي الدورات</p>
            <p className="text-3xl font-bold text-green-600">{teachers.reduce((sum, t) => sum + t.courses, 0)}</p>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg">
            <p className="text-sm text-gray-600">إجمالي الطلاب</p>
            <p className="text-3xl font-bold text-purple-600">{teachers.reduce((sum, t) => sum + t.students, 0)}</p>
          </div>
        </div>

        {/* قائمة المدرسين */}
        <div className="bg-white rounded-lg shadow p-6">
          {loading ? (
            <p className="text-center text-gray-500 py-8">جاري التحميل...</p>
          ) : teachers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">لا يوجد مدرسين</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold">
                      {teacher.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{teacher.name}</h3>
                      <p className="text-sm text-gray-600">{teacher.specialization}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaEnvelope className="text-primary" />
                      {teacher.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaPhone className="text-primary" />
                      {teacher.phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FaStar className="text-yellow-500" />
                      <span className="font-bold">{teacher.rating}</span>
                      <span className="text-gray-600">({teacher.students} طالب)</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-blue-50 p-3 rounded text-center">
                      <p className="text-2xl font-bold text-blue-600">{teacher.courses}</p>
                      <p className="text-xs text-gray-600">دورة</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded text-center">
                      <p className="text-2xl font-bold text-green-600">{teacher.students}</p>
                      <p className="text-xs text-gray-600">طالب</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
