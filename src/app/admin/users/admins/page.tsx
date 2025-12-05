'use client';

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { FaCog, FaPlus, FaShieldAlt, FaEnvelope, FaCalendar, FaCheckCircle } from 'react-icons/fa';

export default function AdminsPage() {
  const [admins] = useState([
    {
      id: 1,
      name: 'المشرف الرئيسي',
      email: 'admin@example.com',
      role: 'Super Admin',
      permissions: ['كل الصلاحيات'],
      createdAt: '2024-01-01',
      status: 'active'
    }
  ]);

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FaCog className="text-primary" />
            المشرفين
          </h1>
          <button className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-dark">
            <FaPlus /> إضافة مشرف
          </button>
        </div>

        {/* الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المشرفين</p>
                <p className="text-3xl font-bold text-purple-600">{admins.length}</p>
              </div>
              <FaShieldAlt className="text-4xl text-purple-600 opacity-20" />
            </div>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">نشطين</p>
                <p className="text-3xl font-bold text-green-600">{admins.filter(a => a.status === 'active').length}</p>
              </div>
              <FaCheckCircle className="text-4xl text-green-600 opacity-20" />
            </div>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">الصلاحيات الكاملة</p>
                <p className="text-3xl font-bold text-blue-600">{admins.filter(a => a.role === 'Super Admin').length}</p>
              </div>
              <FaCog className="text-4xl text-blue-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* قائمة المشرفين */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-bold text-lg mb-4">قائمة المشرفين</h2>
          <div className="space-y-4">
            {admins.map((admin) => (
              <div key={admin.id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                      {admin.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl">{admin.name}</h3>
                      <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                        {admin.role}
                      </span>
                    </div>
                  </div>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <FaCheckCircle /> نشط
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaEnvelope className="text-primary" />
                    <span>{admin.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaCalendar className="text-primary" />
                    <span>انضم في: {admin.createdAt}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">الصلاحيات:</p>
                  <div className="flex flex-wrap gap-2">
                    {admin.permissions.map((permission, idx) => (
                      <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded text-sm">
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ملاحظة أمان */}
        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
          <div className="flex items-start gap-3">
            <FaShieldAlt className="text-yellow-600 text-xl mt-1" />
            <div>
              <p className="font-bold text-yellow-800">تنبيه أمان</p>
              <p className="text-sm text-yellow-700">
                يرجى توخي الحذر عند إضافة مشرفين جدد. المشرفون لديهم صلاحيات كاملة على النظام.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
