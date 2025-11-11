'use client';

import { useState, useEffect } from 'react';
import { 
  FaSearch, FaFilter, FaCalendar, FaUserGraduate, FaEnvelope, 
  FaPhone, FaBook, FaClock, FaChevronDown, FaDownload, FaEye,
  FaSortAmountDown, FaSortAmountUp
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Student {
  _id: string;
  name: string;
  email: string;
  phone: string;
  parentPhone?: string;
  grade?: string;
  enrolledCourses: number;
  totalProgress: number;
  joinDate: string;
  lastActive?: string;
  avatar?: string;
}

export default function AllStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [displayedStudents, setDisplayedStudents] = useState<Student[]>([]);
  
  // State للبحث والفلترة
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'courses'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // State للـ Pagination
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);

  // تحميل البيانات
  useEffect(() => {
    fetchStudents();
  }, []);

  // تطبيق الفلترة والبحث
  useEffect(() => {
    applyFiltersAndSort();
  }, [students, searchTerm, dateFilter, customStartDate, customEndDate, sortBy, sortOrder]);

  // تحديث الطلاب المعروضين
  useEffect(() => {
    updateDisplayedStudents();
  }, [filteredStudents, currentPage, itemsPerPage]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      let fetchedStudents: Student[] = [];
      
      // محاولة جلب من الـ Backend
      try {
        const response = await fetch(`${API_URL}/api/users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          const usersData = result.data || result || [];
          
          // تصفية المستخدمين لعرض الطلاب فقط
          const students = Array.isArray(usersData) ? usersData.filter((u: any) => u.role === 'student') : [];
          
          // تحويل البيانات للصيغة المطلوبة
          fetchedStudents = students.map((student: any) => ({
            _id: student._id || student.id,
            name: student.name || 'طالب',
            email: student.email || '',
            phone: student.studentPhone || student.phone || '',
            parentPhone: student.parentPhone || '',
            grade: student.gradeLevel || student.grade,
            enrolledCourses: student.enrolledCourses?.length || 0,
            totalProgress: student.totalProgress || 0,
            joinDate: student.createdAt || student.joinDate || new Date().toISOString(),
            lastActive: student.lastActive || student.updatedAt,
            avatar: student.avatar || student.profilePicture
          }));
          
          console.log(`تم جلب ${fetchedStudents.length} طالب من السيرفر`);
        }
      } catch (error) {
        console.log('Could not fetch from backend, using local data');
      }
      
      // ⚠️ إذا لم يكن هناك بيانات، عرض رسالة بدلاً من بيانات وهمية
      if (fetchedStudents.length === 0) {
        console.warn('⚠️ لا يوجد طلاب مسجلون في قاعدة البيانات');
      }

      console.log(`✅ تم جلب ${fetchedStudents.length} طالب من قاعدة البيانات`);
      setStudents(fetchedStudents);
      setTotalStudents(fetchedStudents.length);
    } catch (error) {
      console.error('❌ خطأ في جلب الطلاب:', error);
      // عدم استخدام بيانات وهمية - عرض قائمة فارغة
      setStudents([]);
      setTotalStudents(0);
    } finally {
      setLoading(false);
    }
  };

  const generateMockStudents = (count: number): Student[] => {
    const names = [
      'أحمد محمد', 'فاطمة حسن', 'علي أحمد', 'مريم خالد', 'محمود سعيد',
      'نور الدين', 'سارة عبدالله', 'يوسف إبراهيم', 'هدى محمد', 'كريم حسين',
      'ليلى عمر', 'طارق علي', 'رنا سامي', 'عمر فاروق', 'منى أحمد'
    ];

    return Array.from({ length: count }, (_, i) => {
      const daysAgo = Math.floor(Math.random() * 365);
      const joinDate = new Date();
      joinDate.setDate(joinDate.getDate() - daysAgo);

      return {
        _id: `student-${i + 1}`,
        name: names[Math.floor(Math.random() * names.length)] + ' ' + (i + 1),
        email: `student${i + 1}@example.com`,
        phone: `0${Math.floor(Math.random() * 900000000) + 100000000}`,
        parentPhone: `0${Math.floor(Math.random() * 900000000) + 100000000}`,
        grade: ['الصف الأول', 'الصف الثاني', 'الصف الثالث'][Math.floor(Math.random() * 3)],
        enrolledCourses: Math.floor(Math.random() * 8) + 1,
        totalProgress: Math.floor(Math.random() * 100),
        joinDate: joinDate.toISOString(),
        lastActive: new Date().toISOString()
      };
    });
  };

  const applyFiltersAndSort = () => {
    let filtered = [...students];

    // البحث
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.phone.includes(searchTerm)
      );
    }

    // فلترة بالتاريخ
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate = new Date();

      switch (dateFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'custom':
          if (customStartDate && customEndDate) {
            startDate = new Date(customStartDate);
            const endDate = new Date(customEndDate);
            filtered = filtered.filter(student => {
              const studentDate = new Date(student.joinDate);
              return studentDate >= startDate && studentDate <= endDate;
            });
          }
          break;
      }

      if (dateFilter !== 'custom') {
        filtered = filtered.filter(student =>
          new Date(student.joinDate) >= startDate
        );
      }
    }

    // الترتيب
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'ar');
          break;
        case 'date':
          comparison = new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
          break;
        case 'courses':
          comparison = a.enrolledCourses - b.enrolledCourses;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredStudents(filtered);
    setCurrentPage(1); // إعادة تعيين الصفحة للأولى
  };

  const updateDisplayedStudents = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedStudents(filteredStudents.slice(startIndex, endIndex));
  };

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const toggleSort = (field: 'name' | 'date' | 'courses') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const exportToCSV = () => {
    const headers = ['الاسم', 'البريد الإلكتروني', 'الهاتف', 'تاريخ التسجيل', 'عدد الكورسات', 'التقدم'];
    const rows = filteredStudents.map(s => [
      s.name,
      s.email,
      s.phone,
      new Date(s.joinDate).toLocaleDateString('ar-EG'),
      s.enrolledCourses.toString(),
      s.totalProgress + '%'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const hasMore = currentPage < totalPages;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <FaUserGraduate className="text-primary" />
            جميع الطلاب
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            إجمالي الطلاب: <span className="font-bold text-primary">{totalStudents}</span> طالب
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute right-3 top-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث بالاسم، البريد أو الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Date Filter */}
            <div className="relative">
              <FaCalendar className="absolute right-3 top-3.5 text-gray-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full pr-10 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
              >
                <option value="all">جميع التواريخ</option>
                <option value="today">اليوم</option>
                <option value="week">آخر أسبوع</option>
                <option value="month">آخر شهر</option>
                <option value="custom">تخصيص</option>
              </select>
            </div>

            {/* Items per page */}
            <div className="relative">
              <FaFilter className="absolute right-3 top-3.5 text-gray-400" />
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="w-full pr-10 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
              >
                <option value={10}>10 طلاب</option>
                <option value={20}>20 طالب</option>
                <option value={50}>50 طالب</option>
                <option value={100}>100 طالب</option>
              </select>
            </div>
          </div>

          {/* Custom Date Range */}
          {dateFilter === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  من تاريخ
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  إلى تاريخ
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                />
              </div>
            </motion.div>
          )}

          {/* Stats and Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              عرض <span className="font-bold text-primary">{displayedStudents.length}</span> من أصل{' '}
              <span className="font-bold text-primary">{filteredStudents.length}</span> طالب
            </div>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <FaDownload /> تصدير CSV
            </button>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleSort('name')}
                      className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
                    >
                      الاسم
                      {sortBy === 'name' && (
                        sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    معلومات الاتصال
                  </th>
                  <th className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleSort('courses')}
                      className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
                    >
                      الكورسات
                      {sortBy === 'courses' && (
                        sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleSort('date')}
                      className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
                    >
                      تاريخ التسجيل
                      {sortBy === 'date' && (
                        sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <AnimatePresence>
                  {displayedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        لا توجد نتائج
                      </td>
                    </tr>
                  ) : (
                    displayedStudents.map((student, index) => (
                      <motion.tr
                        key={student._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        {/* Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold">
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {student.name}
                              </p>
                              {student.grade && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {student.grade}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact Info */}
                        <td className="px-6 py-4">
                          <div className="text-sm space-y-1">
                            <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <FaEnvelope className="text-xs" />
                              {student.email}
                            </p>
                            <p className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <FaPhone className="text-xs" />
                              {student.phone}
                            </p>
                          </div>
                        </td>

                        {/* Courses */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FaBook className="text-primary" />
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {student.enrolledCourses}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              كورس
                            </span>
                          </div>
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full transition-all"
                                style={{ width: `${student.totalProgress}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {student.totalProgress}% مكتمل
                            </p>
                          </div>
                        </td>

                        {/* Join Date */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <FaCalendar className="text-xs" />
                            {new Date(student.joinDate).toLocaleDateString('ar-EG', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          {student.lastActive && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mt-1">
                              <FaClock className="text-xs" />
                              آخر نشاط: {new Date(student.lastActive).toLocaleDateString('ar-EG')}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/students/${student._id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
                          >
                            <FaEye /> عرض التفاصيل
                          </Link>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleLoadMore}
                className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                <FaChevronDown />
                عرض المزيد ({itemsPerPage} طالب إضافي)
              </button>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3">
                الصفحة {currentPage} من {totalPages}
              </p>
            </div>
          )}

          {/* No More Data */}
          {!hasMore && filteredStudents.length > 0 && (
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                ✅ تم عرض جميع الطلاب ({filteredStudents.length} طالب)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
