"use client";

import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FaTachometerAlt, FaBook, FaUsers, FaMoneyBillWave, FaChartLine, 
  FaCog, FaSignOutAlt, FaBars, FaTimes, FaChevronDown, 
  FaChevronLeft, FaSearch, FaMoon, FaSun, FaUserCircle,
  FaClipboardList, FaGraduationCap, FaLayerGroup,
  FaChalkboardTeacher, FaTicketAlt
} from 'react-icons/fa';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  title: string;
  icon: React.ReactNode;
  path: string;
  submenu?: { title: string; path: string; icon?: React.ReactNode }[];
}

const AdminLayout = memo(({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  
  // تم إيقاف نظام الإشعارات
  // const { 
  //   notifications: notificationItems, 
  //   unreadCount, 
  //   markAsRead, 
  //   markAllAsRead 
  // } = useRealTimeNotifications();

  // تحديد ما إذا كان الجهاز محمولاً
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // تطبيق الوضع المظلم
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
    }
  }, [darkMode]);

  // عناصر القائمة الجانبية
  const navItems: NavItem[] = [
    {
      title: 'لوحة التحكم',
      icon: <FaTachometerAlt />,
      path: '/admin/dashboard',
    },
    {
      title: 'الدورات',
      icon: <FaBook />,
      path: '/admin/courses',
      submenu: [
        { title: 'جميع الدورات', path: '/admin/courses', icon: <FaClipboardList /> },
        { title: 'إضافة دورة', path: '/admin/courses/new', icon: <FaLayerGroup /> },
        { title: 'الفئات', path: '/admin/courses/categories', icon: <FaLayerGroup /> },
      ],
    },
    {
      title: 'المستخدمون',
      icon: <FaUsers />,
      path: '/admin/users',
      submenu: [
        { title: 'جميع المستخدمين', path: '/admin/users', icon: <FaUsers /> },
        { title: 'جميع الطلاب', path: '/admin/all-students', icon: <FaGraduationCap /> },
        { title: 'المدرسين', path: '/admin/teachers', icon: <FaChalkboardTeacher /> },
        { title: 'المشرفين', path: '/admin/users/admins', icon: <FaCog /> },
      ],
    },
    {
      title: 'المبيعات',
      icon: <FaMoneyBillWave />,
      path: '/admin/sales',
      submenu: [
        { title: 'الطلبات', path: '/admin/sales/orders', icon: <FaClipboardList /> },
        { title: 'المدفوعات', path: '/admin/sales/payments', icon: <FaMoneyBillWave /> },
        { title: 'الكوبونات', path: '/admin/sales/coupons', icon: <FaTicketAlt /> },
      ],
    },
    {
      title: 'التقارير',
      icon: <FaChartLine />,
      path: '/admin/reports',
    },
    {
      title: 'الإعدادات',
      icon: <FaCog />,
      path: '/admin/settings',
    },
  ];

  // التحقق مما إذا كان العنصر نشطاً
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };

  // تبديل حالة القائمة الفرعية
  const toggleSubmenu = (title: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // تسجيل الخروج
  const handleLogout = () => {
    // حذف بيانات المستخدم من التخزين المحلي
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // إعادة توجيه المستخدم إلى صفحة تسجيل الدخول
    window.location.href = '/login';
  };

  // تم إيقاف حذف الإشعارات
  // const handleDeleteNotification = (id: string) => {
  //   console.log(`حذف الإشعار رقم ${id}`);
  // };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* الشريط العلوي */}
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md z-30 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between h-16 px-4">
          {/* زر القائمة الجانبية والشعار */}
          <div className="flex items-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            >
              {sidebarOpen && isMobile ? <FaTimes /> : <FaBars />}
            </motion.button>
            
            <Link href="/admin" className="flex items-center gap-2 mr-4">
              <motion.div 
                className="relative w-9 h-9 bg-primary/10 rounded-lg p-1.5 overflow-hidden"
                whileHover={{ scale: 1.05, rotate: [0, -5, 5, -5, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Image
                  src="/logo.png"
                  alt="شعار المنصة"
                  fill
                  sizes="36px"
                  className="object-contain"
                />
              </motion.div>
              <div>
                <span className="text-lg font-bold text-primary hidden md:block">لوحة الإدارة</span>
                <span className="text-xs text-gray-500 hidden md:block">المستقبل التعليمية</span>
              </div>
            </Link>
          </div>
          
          {/* البحث */}
          <div className="flex-1 max-w-lg mx-4 hidden md:block">
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                placeholder="بحث سريع..."
              />
            </div>
          </div>
          
          {/* أزرار الإجراءات */}
          <div className="flex items-center gap-2">
            {/* زر الوضع المظلم */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: [0, 20, 0] }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            >
              {darkMode ? <FaSun className="text-amber-500" /> : <FaMoon className="text-indigo-700" />}
            </motion.button>
            
            {/* نظام الإشعارات - تم إيقافه */}
            {/* <div className="relative text-gray-600 dark:text-gray-300">
              <NotificationSystem 
                notifications={notificationItems.map(n => ({
                  ...n,
                  isRead: n.read
                }))} 
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onDelete={handleDeleteNotification}
              />
            </div> */}
            
            {/* قائمة المستخدم */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-2 px-3 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none border border-gray-200 dark:border-gray-700"
              >
                <FaUserCircle className="text-primary text-xl" />
                <span className="hidden md:block">المشرف</span>
                <FaChevronDown className={`transition-transform duration-300 ${userDropdownOpen ? 'rotate-180' : ''}`} size={12} />
              </motion.button>
              
              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-2 z-50 border border-purple-100 dark:border-purple-900/30"
                  >
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
                        <FaUserCircle className="text-primary w-7 h-7" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-800 dark:text-white">أحمد محمد</div>
                      </div>
                    </div>
                    <Link href="/admin/profile" className="flex items-center gap-2 px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors">
                      <FaUserCircle className="text-primary" /> الملف الشخصي
                    </Link>
                    <Link href="/admin/settings" className="flex items-center gap-2 px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors">
                      <FaCog className="text-primary" /> الإعدادات
                    </Link>
                    <hr className="my-2 border-gray-200 dark:border-gray-700" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-right flex items-center gap-2 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <FaSignOutAlt /> تسجيل الخروج
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>
      
      {/* القائمة الجانبية */}
      <div className="flex pt-16">
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* طبقة الظل للأجهزة المحمولة */}
              {isMobile && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSidebarOpen(false)}
                  className="fixed inset-0 bg-black bg-opacity-50 z-20"
                />
              )}
              
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", stiffness: 400, damping: 40 }}
                className={`fixed md:sticky top-16 right-0 h-[calc(100vh-4rem)] w-72 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 z-20 overflow-y-auto`}
              >
                {/* بيانات المستخدم */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative h-14 w-14 rounded-full overflow-hidden border-2 border-primary">
                      <Image
                        src="/placeholder-avatar.png"
                        alt="صورة المستخدم"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-white">أحمد محمد</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">المشرف العام</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/admin/profile" className="flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-lg text-sm transition-colors">
                      <FaUserCircle /> الملف الشخصي
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg text-sm transition-colors"
                    >
                      <FaSignOutAlt /> تسجيل الخروج
                    </button>
                  </div>
                </div>
                
                {/* عناصر القائمة */}
                <nav className="p-4">
                  <ul className="space-y-2">
                    {navItems.map((item, index) => (
                      <li key={item.path}>
                        {/* رابط العنصر الرئيسي */}
                        {item.submenu ? (
                          <div className="mb-1">
                            <button
                              onClick={() => toggleSubmenu(item.title)}
                              className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                                isActive(item.path)
                                  ? 'bg-primary text-white'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{item.icon}</span>
                                <span>{item.title}</span>
                              </div>
                              <motion.span
                                animate={{ rotate: expandedItems[item.title] ? 90 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <FaChevronLeft size={14} />
                              </motion.span>
                            </button>
                            
                            {/* العناصر الفرعية */}
                            <AnimatePresence>
                              {expandedItems[item.title] && (
                                <motion.ul
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="overflow-hidden mr-4 mt-1 border-r-2 border-gray-200 dark:border-gray-700"
                                >
                                  {item.submenu.map((subitem) => (
                                    <motion.li
                                      key={subitem.path}
                                      initial={{ x: -10, opacity: 0 }}
                                      animate={{ x: 0, opacity: 1 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <Link
                                        href={subitem.path}
                                        className={`flex items-center gap-2 p-3 pr-4 rounded-lg transition-colors ${
                                          isActive(subitem.path) 
                                            ? 'bg-primary/10 text-primary font-bold' 
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                      >
                                        {subitem.icon && <span className="text-sm">{subitem.icon}</span>}
                                        <span className="text-sm">{subitem.title}</span>
                                      </Link>
                                    </motion.li>
                                  ))}
                                </motion.ul>
                              )}
                            </AnimatePresence>
                          </div>
                        ) : (
                          <Link
                            href={item.path}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                              isActive(item.path)
                                ? 'bg-primary text-white shadow-md shadow-primary/20' 
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            <span className="text-lg">{item.icon}</span>
                            <span>{item.title}</span>
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
        
        {/* المحتوى الرئيسي */}
        <main className="flex-grow p-4 md:p-6 pt-4 overflow-x-hidden">
          <div className={isMobile && !sidebarOpen ? "ml-0" : "ml-0 md:ml-0"}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
});

AdminLayout.displayName = 'AdminLayout';

export default AdminLayout; 