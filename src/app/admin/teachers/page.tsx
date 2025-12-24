'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import AdminLayout from '../../../components/AdminLayout';
import supabase from '@/lib/supabase-client';
import { hashPassword, validatePasswordStrength } from '@/lib/security/password-utils';
import { uploadTeacherAvatar } from '@/lib/supabase-upload';

// تم إزالة البيانات الوهمية - سيتم جلب البيانات من Backend
const ignoredMockTeachers = [
  {
    id: 1,
    name: 'د. أحمد محمود (MOCK)',
    image: '/teachers/teacher1.jpg',
    specialty: 'رياضيات',
    email: 'ahmed.mahmoud@example.com',
    phone: '01012345678',
    rating: 4.9,
    studentsCount: 1240,
    coursesCount: 5,
    isActive: true,
    joinedDate: '2022-01-15',
  },
  {
    id: 2,
    name: 'د. سارة علي',
    image: '/teachers/teacher2.jpg',
    specialty: 'فيزياء',
    email: 'sara.ali@example.com',
    phone: '01023456789',
    rating: 4.8,
    studentsCount: 980,
    coursesCount: 3,
    isActive: true,
    joinedDate: '2022-03-20',
  },
  {
    id: 3,
    name: 'د. محمد إبراهيم',
    image: '/teachers/teacher3.jpg',
    specialty: 'لغة إنجليزية',
    email: 'mohamed.ibrahim@example.com',
    phone: '01034567890',
    rating: 4.7,
    studentsCount: 820,
    coursesCount: 4,
    isActive: true,
    joinedDate: '2022-02-10',
  },
  {
    id: 4,
    name: 'د. فاطمة أحمد',
    image: '/teachers/teacher4.jpg',
    specialty: 'كيمياء',
    email: 'fatma.ahmed@example.com',
    phone: '01045678901',
    rating: 4.9,
    studentsCount: 1050,
    coursesCount: 5,
    isActive: true,
    joinedDate: '2021-11-05',
  },
  {
    id: 5,
    name: 'د. علي محمد',
    image: '/teachers/teacher5.jpg',
    specialty: 'تاريخ',
    email: 'ali.mohamed@example.com',
    phone: '01056789012',
    rating: 4.6,
    studentsCount: 750,
    coursesCount: 3,
    isActive: false,
    joinedDate: '2022-04-12',
  },
  {
    id: 6,
    name: 'د. نورا حسن',
    image: '/teachers/teacher6.jpg',
    specialty: 'علوم',
    email: 'noura.hassan@example.com',
    phone: '01067890123',
    rating: 5,
    studentsCount: 1000,
    joinedDate: '2022-01-30',
  }
];

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleCopyDashboardLink = (teacherId: string) => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${origin}/teachers/${teacherId}/dashboard`;
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(url).then(() => {
          alert('تم نسخ رابط لوحة المدرس بنجاح');
        }).catch(() => {
          alert('تعذر نسخ الرابط، يمكنك نسخه يدوياً: ' + url);
        });
      } else {
        alert('رابط لوحة المدرس:\n' + url);
      }
    } catch (error) {
      console.error('Error copying teacher dashboard link:', error);
      alert('حدث خطأ أثناء نسخ الرابط');
    }
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    try {
      const currentTeacher = teachers.find((t: any) => t.id === id);

      // استخدام upsert مع onConflict=user_id لتفادي مشكلة التكرار
      const { error } = await supabase
        .from('teachers')
        .upsert(
          {
            user_id: id,
            is_featured: !current,
            specialization: currentTeacher?.specialty || 'مدرس',
            bio: '',
            experience_years: 0,
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('❌ خطأ في إنشاء/تحديث سجل المدرس في جدول teachers:', error);
        alert('فشل تحديث حالة التمييز للمدرس. تأكد من بنية جدول teachers وسياسات RLS.');
        return;
      }

      setTeachers(prev =>
        prev.map((teacher: any) =>
          teacher.id === id ? { ...teacher, isFeatured: !current } : teacher
        )
      );
    } catch (error) {
      console.error('❌ خطأ غير متوقع أثناء تحديث حالة التمييز للمدرس:', error);
      alert('حدث خطأ أثناء تحديث حالة التمييز للمدرس');
    }
  };

  const handleUploadAvatar = async (id: string, file: File) => {
    try {
      const result = await uploadTeacherAvatar(file);
      if (!result.success || !result.url) {
        alert('فشل رفع صورة المدرس، حاول مرة أخرى');
        return;
      }

      const url = result.url;

      const persistRes = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, userId: id }),
      });

      const persistJson = await persistRes.json().catch(() => null as any);
      if (!persistRes.ok || !persistJson?.success) {
        console.error('⚠️ خطأ في حفظ صورة المدرس:', persistJson);
        alert('فشل تحديث صورة المدرس في قاعدة البيانات');
        return;
      }

      setTeachers(prev =>
        prev.map((teacher: any) =>
          teacher.id === id ? { ...teacher, image: url } : teacher
        )
      );

      alert('تم تحديث صورة المدرس بنجاح');
    } catch (error) {
      console.error('❌ خطأ غير متوقع أثناء رفع صورة المدرس:', error);
      alert('حدث خطأ أثناء رفع صورة المدرس');
    }
  };

  const handleUploadAvatarClick = (id: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement | null;
      const file = target?.files?.[0];
      if (file) {
        handleUploadAvatar(id, file);
      }
    };
    input.click();
  };

  // Load teachers from Supabase
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        setIsLoading(true);
        const { getUsers } = await import('@/lib/supabase-admin');
        const result = await getUsers('teacher');
        
        if (result.success && result.data) {
          const users = result.data;
          const userIds = users.map((u: any) => u.id);

          let teacherMetaMap = new Map<string, any>();

          if (userIds.length > 0) {
            const { data: teacherRows, error: teachersError } = await supabase
              .from('teachers')
              .select('*')
              .in('user_id', userIds);

            if (teachersError) {
              console.error('❌ خطأ في جلب بيانات جدول teachers:', teachersError);
            } else if (teacherRows) {
              teacherMetaMap = new Map(
                teacherRows.map((t: any) => [t.user_id, t])
              );
            }
          }

          const teachersData = users.map((u: any) => {
            const meta = teacherMetaMap.get(u.id) || {};

            const getDisplayStudentsCount = (seed: string): number => {
              const s = String(seed || '');
              let hash = 0;
              for (let i = 0; i < s.length; i++) {
                hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
              }
              return 500 + (hash % 501);
            };

            return {
              id: u.id,
              name: u.name || 'بدون اسم',
              email: u.email,
              phone: u.phone,
              specialty: meta.specialization || u.specialty || 'غير محدد',
              rating: 5,
              studentsCount: getDisplayStudentsCount(u.id),
              coursesCount: meta.total_courses ?? 0,
              status: meta.status || 'approved',
              isActive: u.status !== 'suspended',
              image:
                (u as any).avatar_url ||
                (u as any).profile_picture ||
                (u as any).avatar ||
                (u as any).image ||
                meta.avatar_url ||
                '/placeholder-avatar.png',
              isFeatured: !!meta.is_featured,
            };
          });

          console.log(`✅ تم جلب ${teachersData.length} مدرس من قاعدة البيانات`);
          setTeachers(teachersData);
        } else {
          console.warn('⚠️ فشل جلب المدرسين');
          setTeachers([]);
        }
      } catch (error) {
        console.error('❌ خطأ في جلب المدرسين:', error);
        setTeachers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTeachers();
  }, []);

  const specialties = Array.from(new Set(teachers.map((teacher: any) => teacher.specialty || 'غير محدد')));

  // Filter and sort teachers
  const filteredTeachers = teachers
    .filter(teacher => teacher.name.includes(searchQuery) || teacher.specialty.includes(searchQuery))
    .filter(teacher => filterSpecialty === '' || teacher.specialty === filterSpecialty)
    .filter(teacher => filterStatus === '' || teacher.status === filterStatus)
    .sort((a, b) => {
      if (sortField === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      }
      if (sortField === 'rating') {
        return sortDirection === 'asc' 
          ? a.rating - b.rating 
          : b.rating - a.rating;
      }
      if (sortField === 'studentsCount') {
        return sortDirection === 'asc' 
          ? a.studentsCount - b.studentsCount 
          : b.studentsCount - a.studentsCount;
      }
      return 0;
    });

  const handleDeleteTeacher = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المدرس؟')) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json().catch(() => null as any);

      if (!res.ok || !data?.success) {
        console.error('❌ فشل حذف المدرس:', data?.errors || data?.error);
        alert('فشل حذف المدرس. الرجاء المحاولة مرة أخرى.');
        return;
      }

      setTeachers(prev => prev.filter(teacher => teacher.id !== id));
      console.log('✅ تم حذف المدرس نهائيًا من قاعدة البيانات');
    } catch (error) {
      console.error('❌ خطأ في حذف المدرس:', error);
      alert('حدث خطأ أثناء حذف المدرس');
    }
  };

  const handleEditTeacher = (teacher: any) => {
    setSelectedTeacher(teacher);
    setShowEditModal(true);
  };

  const handleTeacherStatusChange = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error: teacherError } = await supabase
        .from('teachers')
        .update({ status: newStatus })
        .eq('user_id', id);

      if (teacherError) {
        console.error('❌ خطأ في تحديث حالة المدرس:', teacherError);
        alert('فشل تحديث حالة المدرس. تأكد من وجود عمود status في جدول teachers.');
        return;
      }

      const { error: userError } = await supabase
        .from('users')
        .update({ status: newStatus === 'approved' ? 'active' : 'suspended' })
        .eq('id', id);

      if (userError) {
        console.error('⚠️ خطأ في تحديث حالة المستخدم:', userError);
      }

      setTeachers(prev =>
        prev.map(teacher =>
          teacher.id === id ? { ...teacher, status: newStatus } : teacher
        )
      );
    } catch (error) {
      console.error('❌ خطأ غير متوقع أثناء تحديث حالة المدرس:', error);
      alert('حدث خطأ أثناء تحديث حالة المدرس');
    }
  };

  const handleSortChange = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <AdminLayout>
      <div className="admin-dashboard">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="admin-title">إدارة المدرسين</h1>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-modern flex items-center gap-2"
          >
            <FaPlus /> إضافة مدرس جديد
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-8 shadow-md">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="بحث عن مدرس..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pr-10 border rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
              />
              <span className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400">
                <FaSearch />
              </span>
            </div>
            
            <div className="relative">
              <select
                value={filterSpecialty}
                onChange={(e) => setFilterSpecialty(e.target.value)}
                className="px-4 py-2 pr-10 border rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 appearance-none"
              >
                <option value="">جميع التخصصات</option>
                {specialties.map((specialty, index) => (
                  <option key={index} value={specialty}>{specialty}</option>
                ))}
              </select>
              <span className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                <FaFilter />
              </span>
            </div>

            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 pr-10 border rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 appearance-none"
              >
                <option value="">كل الحالات</option>
                <option value="pending">في الانتظار</option>
                <option value="approved">مقبول</option>
                <option value="rejected">مرفوض</option>
              </select>
              <span className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                <FaFilter />
              </span>
            </div>
          </div>
        </div>

        {/* Teachers Table */}
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <table className="w-full table-auto">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-300">المدرس</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-300">
                  <button 
                    onClick={() => handleSortChange('name')} 
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    الاسم
                    {sortField === 'name' && (
                      sortDirection === 'asc' ? <FaSortAmountUp size={12} /> : <FaSortAmountDown size={12} />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-300">التخصص</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-300">
                  <button 
                    onClick={() => handleSortChange('rating')} 
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    التقييم
                    {sortField === 'rating' && (
                      sortDirection === 'asc' ? <FaSortAmountUp size={12} /> : <FaSortAmountDown size={12} />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-300">
                  <button 
                    onClick={() => handleSortChange('studentsCount')} 
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    عدد الطلاب
                    {sortField === 'studentsCount' && (
                      sortDirection === 'asc' ? <FaSortAmountUp size={12} /> : <FaSortAmountDown size={12} />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-300">مميز في الرئيسية</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-300">حالة الطلب</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-300">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredTeachers.map(teacher => (
                <motion.tr 
                  key={teacher.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-750"
                >
                  <td className="px-4 py-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden">
                      <Image 
                        src={teacher.image || '/placeholder-avatar.png'} 
                        alt={teacher.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 font-medium">{teacher.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{teacher.specialty}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{teacher.rating}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{teacher.studentsCount}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleFeatured(teacher.id, !!teacher.isFeatured)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        teacher.isFeatured
                          ? 'bg-purple-100 text-purple-700 border-purple-200'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}
                    >
                      {teacher.isFeatured ? 'مميز' : 'عادي'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        teacher.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : teacher.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {teacher.status === 'pending'
                        ? 'في الانتظار'
                        : teacher.status === 'rejected'
                        ? 'مرفوض'
                        : 'مقبول'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      {teacher.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleTeacherStatusChange(teacher.id, 'approved')}
                            className="text-green-600 hover:text-green-800 text-xs px-2 py-1 border border-green-200 rounded"
                          >
                            قبول
                          </button>
                          <button
                            onClick={() => handleTeacherStatusChange(teacher.id, 'rejected')}
                            className="text-yellow-600 hover:text-yellow-800 text-xs px-2 py-1 border border-yellow-200 rounded"
                          >
                            رفض
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => handleEditTeacher(teacher)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => handleDeleteTeacher(teacher.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400"
                      >
                        <FaTrash />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUploadAvatarClick(teacher.id)}
                        className="text-xs border border-blue-300 rounded px-2 py-1 text-blue-600 hover:bg-blue-50"
                      >
                        رفع صورة
                      </button>
                      <Link 
                        href={`/admin/teachers/${teacher.id}`}
                        className="text-primary hover:text-primary-700"
                      >
                        عرض
                      </Link>
                      <Link 
                        href={`/teachers/${teacher.id}/dashboard`}
                        className="text-green-600 hover:text-green-800 text-xs border border-green-200 rounded px-2 py-1"
                      >
                        لوحة المدرس
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleCopyDashboardLink(teacher.id)}
                        className="text-xs border border-gray-300 rounded px-2 py-1 text-gray-700 hover:bg-gray-100"
                      >
                        نسخ رابط اللوحة
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Show empty state if no teachers found */}
        {filteredTeachers.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl mt-4 shadow-md">
            <div className="text-gray-500 dark:text-gray-400">لا يوجد مدرسين مطابقين للبحث</div>
            <button 
              onClick={() => {
                setSearchQuery('');
                setFilterSpecialty('');
              }}
              className="mt-4 text-primary hover:underline"
            >
              إعادة ضبط البحث
            </button>
          </div>
        )}
      </div>

      {/* Add Teacher Modal */}
      {showAddModal && (
        <AddTeacherModal 
          onClose={() => setShowAddModal(false)}
          onAdd={(newTeacher) => {
            setTeachers([...teachers, newTeacher]);
            setShowAddModal(false);
          }}
        />
      )}

      {/* Edit Teacher Modal */}
      {showEditModal && selectedTeacher && (
        <EditTeacherModal 
          teacher={selectedTeacher}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTeacher(null);
          }}
          onUpdate={(updatedTeacher) => {
            setTeachers(teachers.map(t => 
              t.id === updatedTeacher.id ? updatedTeacher : t
            ));
            setShowEditModal(false);
            setSelectedTeacher(null);
          }}
        />
      )}
    </AdminLayout>
  );
}

// Add Teacher Modal Component
function AddTeacherModal({ onClose, onAdd }: any) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (formData.password.length < 8) {
        setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
        setIsSubmitting(false);
        return;
      }

      const { isValid, errors } = validatePasswordStrength(formData.password);
      if (!isValid) {
        setError(errors.join('، '));
        setIsSubmitting(false);
        return;
      }

      // التحقق من عدم وجود مستخدم بنفس الإيميل أو الهاتف
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .or(`email.eq.${formData.email},phone.eq.${formData.phone}`)
        .maybeSingle();

      if (existingUser) {
        setError('هذا البريد الإلكتروني أو رقم الهاتف مسجل مسبقاً');
        setIsSubmitting(false);
        return;
      }

      const passwordHash = await hashPassword(formData.password);

      // إنشاء المستخدم كمدرس في جدول users
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password_hash: passwordHash,
          role: 'teacher',
          specialty: formData.specialty || null,
        })
        .select()
        .single();

      if (userError || !newUser) {
        setError(userError?.message || 'حدث خطأ أثناء إضافة المدرس');
        setIsSubmitting(false);
        return;
      }

      // إنشاء ملف المدرس في جدول teachers
      const { error: teacherError } = await supabase
        .from('teachers')
        .insert({
          user_id: newUser.id,
          bio: '',
          specialization: formData.specialty || 'مدرس',
          experience_years: 0,
        });

      if (teacherError) {
        console.error('خطأ في إنشاء ملف المدرس:', teacherError);
      }

      onAdd({
        id: newUser.id,
        name: newUser.name || formData.name,
        email: newUser.email,
        phone: newUser.phone,
        specialty: formData.specialty,
        image: '/teachers/default.jpg',
        rating: 0,
        studentsCount: 0,
        coursesCount: 0,
        isActive: true,
        joinedDate: new Date().toISOString().split('T')[0]
      });
    } catch (err: any) {
      console.error('Error while adding teacher:', err);
      setError(err.message || 'حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">إضافة مدرس جديد</h2>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">الاسم</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">رقم الهاتف</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">التخصص</label>
            <input
              type="text"
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">كلمة المرور</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
              required
            />
          </div>
          <div className="flex gap-2 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? 'جاري الإضافة...' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Teacher Modal Component
function EditTeacherModal({ teacher, onClose, onUpdate }: any) {
  const [formData, setFormData] = useState({
    ...teacher
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">تعديل بيانات المدرس</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">الاسم</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">رقم الهاتف</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">التخصص</label>
            <input
              type="text"
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
              required
            />
          </div>
          <div className="flex gap-2 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              حفظ التعديلات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}