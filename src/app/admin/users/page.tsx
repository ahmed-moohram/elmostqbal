'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { FaUsers, FaSearch, FaUserGraduate, FaChalkboardTeacher, FaCog } from 'react-icons/fa';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const usersData = data.users || data || [];
        console.log(`✅ تم جلب ${usersData.length} مستخدم من قاعدة البيانات`);
        setUsers(usersData);
      } else {
        console.warn('⚠️ لا يوجد مستخدمون');
        setUsers([]);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب المستخدمين:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FaUsers className="text-primary" />
            جميع المستخدمين
          </h1>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">الطلاب</p>
                <p className="text-2xl font-bold text-blue-600">{users.filter((u: any) => u.role === 'student').length}</p>
              </div>
              <FaUserGraduate className="text-4xl text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">المدرسين</p>
                <p className="text-2xl font-bold text-green-600">{users.filter((u: any) => u.role === 'teacher').length}</p>
              </div>
              <FaChalkboardTeacher className="text-4xl text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">المشرفين</p>
                <p className="text-2xl font-bold text-purple-600">1</p>
              </div>
              <FaCog className="text-4xl text-purple-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* بحث */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="relative">
            <FaSearch className="absolute right-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث عن مستخدم..."
              className="w-full pr-10 pl-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* قائمة المستخدمين */}
        <div className="bg-white rounded-lg shadow p-6">
          {loading ? (
            <p className="text-center text-gray-500 py-8">جاري التحميل...</p>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-500 py-8">لا توجد بيانات</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الاسم</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">البريد</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الدور</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الحالة</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">تاريخ الانضمام</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.filter(u => !searchTerm || u.name.includes(searchTerm) || u.email.includes(searchTerm)).map((user: any) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{user.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.role === 'teacher' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'teacher' ? 'مدرس' : 'طالب'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.status === 'active' ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.joinDate}</td>
                      <td className="px-4 py-3 text-sm">
                        {user.role === 'student' && (
                          <Link
                            href={`/admin/students/${user.id}`}
                            className="text-primary hover:text-primary-dark font-medium"
                          >
                            عرض التفاصيل →
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
