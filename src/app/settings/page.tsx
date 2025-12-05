'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCog, FaUser, FaBell, FaLock, FaLanguage, FaMoon, FaSun, FaArrowLeft, FaBook, FaStar } from 'react-icons/fa';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import GlowingText from '../../components/GlowingText';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'security' | 'appearance'>('account');
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardPath, setDashboardPath] = useState('/');
  
  // إعدادات الحساب
  const [accountSettings, setAccountSettings] = useState({
    name: '',
    email: '',
    phone: '',
    language: 'ar',
    timeZone: 'Asia/Riyadh',
  });
  
  // تحميل بيانات المستخدم عند فتح الصفحة
  useEffect(() => {
    if (user) {
      const path = user.role === 'student' ? '/student/dashboard' : 
                   user.role === 'admin' ? '/admin' : 
                   '/teachers/dashboard';
      setDashboardPath(path);
      
      // تحميل بيانات المستخدم الحقيقية
      setAccountSettings({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        language: 'ar',
        timeZone: 'Asia/Riyadh',
      });
    }
  }, [user]);
  
  // إعدادات الإشعارات
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    courseUpdates: true,
    marketingEmails: false,
    newMessages: true,
    reminderAlerts: true,
  });
  
  // إعدادات الأمان
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: '30',
    rememberDevice: true,
  });
  
  // إعدادات المظهر
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'system',
    fontSize: 'medium',
    reducedMotion: false,
    highContrast: false,
  });
  
  // تحديث إعدادات الحساب
  const handleAccountSettingsChange = (e) => {
    const { name, value } = e.target;
    setAccountSettings(prev => ({ ...prev, [name]: value }));
  };
  
  // تحديث إعدادات الإشعارات
  const handleNotificationSettingsChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings(prev => ({ ...prev, [name]: checked }));
  };
  
  // تحديث إعدادات الأمان
  const handleSecuritySettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecuritySettings(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };
  
  // تحديث إعدادات المظهر
  const handleAppearanceSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAppearanceSettings(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };
  
  // حفظ الإعدادات
  const handleSaveSettings = async () => {
    setIsLoading(true);
    
    try {
      // تحديث بيانات المستخدم في localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...currentUser,
        name: accountSettings.name,
        email: accountSettings.email,
        phone: accountSettings.phone,
        token: currentUser.token || localStorage.getItem('token') // الحفاظ على التوكن
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // تحديث Context إذا كانت دالة updateUser موجودة
      if (updateUser) {
        updateUser(updatedUser);
      }
      
      // محاكاة طلب API
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('تم حفظ الإعدادات بنجاح ✅');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
            {/* رأس الصفحة */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center">
              <Link 
                href={dashboardPath} 
                className="inline-flex items-center justify-center p-2 mr-4 rounded-full text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FaArrowLeft />
              </Link>
              <h1 className="text-2xl font-bold flex items-center">
                <FaCog className="text-primary mr-2 animate-spin-slow" />
                إعدادات <GlowingText text="المستقبل" className="mr-1 text-[1.6rem]" />
              </h1>
            </div>
            
            <div className="flex flex-col md:flex-row">
              {/* شريط الإعدادات الجانبي */}
              <div className="w-full md:w-64 p-4 border-b md:border-b-0 md:border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveTab('account')}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'account'
                        ? 'bg-primary text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <FaUser className="mr-3" />
                    <span>الحساب الشخصي</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'notifications'
                        ? 'bg-primary text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <FaBell className="mr-3" />
                    <span>الإشعارات</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'security'
                        ? 'bg-primary text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <FaLock className="mr-3" />
                    <span>الأمان</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('appearance')}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'appearance'
                        ? 'bg-primary text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {appearanceSettings.theme === 'dark' ? (
                      <FaMoon className="mr-3" />
                    ) : (
                      <FaSun className="mr-3" />
                    )}
                    <span>المظهر</span>
                  </button>
                </nav>
              </div>
              
              {/* محتوى الإعدادات */}
              <div className="flex-1 p-6">
                {/* إعدادات الحساب */}
                {activeTab === 'account' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                        <FaUser className="text-2xl text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">إعدادات الحساب الشخصي</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">يمكنك تعديل بياناتك بحرية</p>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        💡 <strong>ملاحظة:</strong> يمكنك تحديث معلوماتك الشخصية في أي وقت. التغييرات ستظهر فوراً في جميع أنحاء المنصة.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block mb-2 font-medium">
                          الاسم الكامل
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={accountSettings.name}
                          onChange={handleAccountSettingsChange}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block mb-2 font-medium">
                          البريد الإلكتروني
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={accountSettings.email}
                          onChange={handleAccountSettingsChange}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="phone" className="block mb-2 font-medium">
                          رقم الهاتف
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={accountSettings.phone}
                          onChange={handleAccountSettingsChange}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="language" className="block mb-2 font-medium">
                          اللغة المفضلة
                        </label>
                        <select
                          id="language"
                          name="language"
                          value={accountSettings.language}
                          onChange={handleAccountSettingsChange}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                        >
                          <option value="ar">العربية</option>
                          <option value="en">الإنجليزية</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* زر حفظ التغييرات */}
                    <div className="flex items-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={handleSaveSettings}
                        disabled={isLoading}
                        className="px-8 py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            جاري الحفظ...
                          </span>
                        ) : (
                          'حفظ التغييرات'
                        )}
                      </button>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        سيتم تحديث بياناتك في جميع أنحاء المنصة
                      </p>
                    </div>
                  </motion.div>
                )}
                
                {/* إعدادات الإشعارات */}
                {activeTab === 'notifications' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg">
                        <FaBell className="text-2xl text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">إعدادات الإشعارات</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">اختر الإشعارات التي تريد استلامها</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <FaBell className="text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 dark:text-white">إشعارات البريد الإلكتروني</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">استلام إشعارات عبر البريد الإلكتروني</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer group">
                          <input
                            type="checkbox"
                            name="emailNotifications"
                            checked={notificationSettings.emailNotifications}
                            onChange={handleNotificationSettingsChange}
                            className="sr-only peer"
                          />
                          <div className="w-14 h-7 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-primary peer-checked:to-blue-600 shadow-lg"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <FaBook className="text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 dark:text-white">تحديثات الدورات</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">إشعارات عند إضافة محتوى جديد للدورات المسجلة</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer group">
                          <input
                            type="checkbox"
                            name="courseUpdates"
                            checked={notificationSettings.courseUpdates}
                            onChange={handleNotificationSettingsChange}
                            className="sr-only peer"
                          />
                          <div className="w-14 h-7 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-green-600 shadow-lg"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <FaStar className="text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 dark:text-white">رسائل تسويقية</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">عروض وخصومات وإعلانات جديدة</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer group">
                          <input
                            type="checkbox"
                            name="marketingEmails"
                            checked={notificationSettings.marketingEmails}
                            onChange={handleNotificationSettingsChange}
                            className="sr-only peer"
                          />
                          <div className="w-14 h-7 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-purple-600 shadow-lg"></div>
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* إعدادات الأمان */}
                {activeTab === 'security' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                        <FaLock className="text-2xl text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">إعدادات الأمان</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">حماية حسابك وبياناتك</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div>
                          <h3 className="font-medium">المصادقة الثنائية</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">تأمين إضافي لحسابك عند تسجيل الدخول</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer group">
                          <input
                            type="checkbox"
                            name="twoFactorAuth"
                            checked={securitySettings.twoFactorAuth}
                            onChange={handleSecuritySettingsChange}
                            className="sr-only peer"
                          />
                          <div className="w-14 h-7 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-red-500 peer-checked:to-red-600 shadow-lg"></div>
                        </label>
                      </div>
                      
                      <div>
                        <label htmlFor="password" className="block mb-2 font-medium">
                          تغيير كلمة المرور
                        </label>
                        <div className="flex">
                          <input
                            type="password"
                            id="password"
                            placeholder="••••••••"
                            className="w-full px-4 py-2 rounded-l-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                          />
                          <button
                            className="px-4 py-2 bg-primary text-white rounded-r-lg hover:bg-primary-dark transition-colors"
                          >
                            تغيير
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* إعدادات المظهر */}
                {activeTab === 'appearance' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <FaSun className="text-2xl text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">إعدادات المظهر</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">خصص شكل واجهة المستخدم</p>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block mb-2 font-medium">
                          وضع العرض
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                          <label className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-colors ${
                            appearanceSettings.theme === 'light' ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            <input
                              type="radio"
                              name="theme"
                              value="light"
                              checked={appearanceSettings.theme === 'light'}
                              onChange={handleAppearanceSettingsChange}
                              className="sr-only"
                            />
                            <FaSun className="text-2xl mb-2 text-yellow-500" />
                            <span>فاتح</span>
                          </label>
                          
                          <label className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-colors ${
                            appearanceSettings.theme === 'dark' ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            <input
                              type="radio"
                              name="theme"
                              value="dark"
                              checked={appearanceSettings.theme === 'dark'}
                              onChange={handleAppearanceSettingsChange}
                              className="sr-only"
                            />
                            <FaMoon className="text-2xl mb-2 text-blue-600" />
                            <span>داكن</span>
                          </label>
                          
                          <label className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-colors ${
                            appearanceSettings.theme === 'system' ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            <input
                              type="radio"
                              name="theme"
                              value="system"
                              checked={appearanceSettings.theme === 'system'}
                              onChange={handleAppearanceSettingsChange}
                              className="sr-only"
                            />
                            <div className="flex text-2xl mb-2">
                              <FaSun className="text-yellow-500" />
                              <FaMoon className="text-blue-600 -mr-1" />
                            </div>
                            <span>تلقائي</span>
                          </label>
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="fontSize" className="block mb-2 font-medium">
                          حجم الخط
                        </label>
                        <select
                          id="fontSize"
                          name="fontSize"
                          value={appearanceSettings.fontSize}
                          onChange={handleAppearanceSettingsChange}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                        >
                          <option value="small">صغير</option>
                          <option value="medium">متوسط</option>
                          <option value="large">كبير</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div>
                          <h3 className="font-medium">تقليل الحركة</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">تقليل الرسوم المتحركة في واجهة المستخدم</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer group">
                          <input
                            type="checkbox"
                            name="reducedMotion"
                            checked={appearanceSettings.reducedMotion}
                            onChange={handleAppearanceSettingsChange}
                            className="sr-only peer"
                          />
                          <div className="w-14 h-7 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-primary peer-checked:to-blue-600 shadow-lg"></div>
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* زر الحفظ */}
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    disabled={isLoading}
                    className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70"
                  >
                    {isLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        جاري الحفظ...
                      </>
                    ) : (
                      <>حفظ الإعدادات</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
