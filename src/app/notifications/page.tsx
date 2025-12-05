'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBell, FaCheck, FaTrash, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import GlowingText from '../../components/GlowingText';

// نوع الإشعار
interface Notification {
  id: string;
  title: string;
  message: string;
  date?: string;
  createdAt?: string;
  isRead: boolean;
  type: 'info' | 'success' | 'warning' | 'error' | 'course' | 'certificate' | 'reminder' | 'announcement' | string;
  icon?: string;
  link?: string;
  image?: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [dashboardPath, setDashboardPath] = useState('/');
  
  useEffect(() => {
    if (user) {
      const path = user.role === 'student' ? '/student/dashboard' : 
                   user.role === 'admin' ? '/admin' : 
                   '/teachers/dashboard';
      setDashboardPath(path);
    }
  }, [user]);
  
  // جلب الإشعارات من Supabase
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) {
          setNotifications([]);
          setIsLoading(false);
          return;
        }
        
        const user = JSON.parse(userData);
        const { getUserNotifications } = await import('@/services/supabase-service');
        const result = await getUserNotifications(user.id);
        
        if (result.success && result.data) {
          console.log(`✅ تم جلب ${result.data.length} إشعار`);
          setNotifications(result.data);
        } else {
          console.warn('⚠️ لا توجد إشعارات');
          // إشعارات تجريبية للعرض
          setNotifications([
            {
              id: '1',
              title: 'مرحباً بك في المنصة!',
              message: 'نتمنى لك رحلة تعليمية ممتعة ومفيدة',
              type: 'info',
              icon: '👋',
              isRead: false,
              createdAt: new Date().toISOString()
            },
            {
              id: '2',
              title: 'كورس جديد متاح',
              message: 'تم إضافة كورس Python للمبتدئين',
              type: 'course',
              icon: '📚',
              isRead: false,
              createdAt: new Date(Date.now() - 86400000).toISOString()
            }
          ]);
        }
      } catch (error) {
        console.error('❌ خطأ في جلب الإشعارات:', error);
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNotifications();
  }, []);
  
  // تصفية الإشعارات حسب التبويب النشط
  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(notif => !notif.isRead);
  
  // وظيفة لتمييز الإشعار كمقروء
  const markAsRead = async (id: string) => {
    try {
      // في بيئة الإنتاج، سيتم استبدال هذا بطلب API حقيقي
      await new Promise(resolve => setTimeout(resolve, 500)); // محاكاة تأخير الشبكة
      
      setNotifications(prev => 
        prev.map(notif => notif.id === id ? { ...notif, isRead: true } : notif)
      );
      toast.success('تم تحديث حالة الإشعار');
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث حالة الإشعار');
    }
  };
  
  // وظيفة لحذف الإشعار
  const deleteNotification = async (id: string) => {
    try {
      // في بيئة الإنتاج، سيتم استبدال هذا بطلب API حقيقي
      await new Promise(resolve => setTimeout(resolve, 500)); // محاكاة تأخير الشبكة
      
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      toast.success('تم حذف الإشعار');
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف الإشعار');
    }
  };
  
  // وظيفة لتمييز جميع الإشعارات كمقروءة
  const markAllAsRead = async () => {
    try {
      // في بيئة الإنتاج، سيتم استبدال هذا بطلب API حقيقي
      await new Promise(resolve => setTimeout(resolve, 800)); // محاكاة تأخير الشبكة
      
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
      toast.success('تم تمييز جميع الإشعارات كمقروءة');
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث حالة الإشعارات');
    }
  };
  
  // تنسيق التاريخ بشكل مقروء مع التعامل مع القيم غير الموجودة
  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';

    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
            {/* رأس الصفحة */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center">
                <Link 
                  href={dashboardPath} 
                  className="inline-flex items-center justify-center p-2 mr-4 rounded-full text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <FaArrowLeft />
                </Link>
                <h1 className="text-2xl font-bold flex items-center">
                  <FaBell className="text-primary mr-2" />
                  إشعارات <GlowingText text="المستقبل" className="mr-1 text-[1.6rem]" />
                </h1>
              </div>
              <button
                onClick={markAllAsRead}
                disabled={!notifications.some(n => !n.isRead)}
                className="px-4 py-2 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaCheck className="inline-block ml-1" />
                تمييز الكل كمقروء
              </button>
            </div>
            
            {/* شريط التبويب */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-3 px-4 text-center transition-colors ${
                  activeTab === 'all'
                    ? 'border-b-2 border-primary text-primary font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-gray-300'
                }`}
              >
                جميع الإشعارات ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`flex-1 py-3 px-4 text-center transition-colors ${
                  activeTab === 'unread'
                    ? 'border-b-2 border-primary text-primary font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-gray-300'
                }`}
              >
                غير مقروءة ({notifications.filter(n => !n.isRead).length})
              </button>
            </div>
            
            {/* قائمة الإشعارات */}
            {isLoading ? (
              <div className="p-10 text-center">
                <div className="inline-block w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                <p className="mt-3 text-gray-600 dark:text-gray-400">جاري تحميل الإشعارات...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaBell className="text-gray-400 text-xl" />
                </div>
                <h3 className="font-medium text-lg">لا توجد إشعارات</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  {activeTab === 'unread' 
                    ? 'ليس لديك أي إشعارات غير مقروءة حالياً' 
                    : 'ستظهر الإشعارات الجديدة هنا'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredNotifications.map(notification => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${
                      !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex">
                      {/* الرمز حسب نوع الإشعار */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mr-4 ${
                        notification.type === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                        notification.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                        notification.type === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                        notification.type === 'reminder' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                        notification.type === 'certificate' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        notification.type === 'course' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' :
                        notification.type === 'announcement' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' :
                        'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        <FaBell />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {notification.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            <div className="mt-2 flex items-center gap-4">
                              <span className="text-xs text-gray-500 dark:text-gray-500">
                                {formatDate(notification.date || notification.createdAt || '')}
                              </span>
                              
                              {notification.link && (
                                <Link 
                                  href={notification.link} 
                                  className="text-xs text-primary hover:underline"
                                >
                                  فتح الرابط
                                </Link>
                              )}
                              
                              {!notification.isRead && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                                >
                                  تمييز كمقروء
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors dark:hover:bg-red-900/20"
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            
            {/* تذييل */}
            <div className="p-4 text-center border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
              يتم تحديث الإشعارات تلقائياً كل 5 دقائق
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
