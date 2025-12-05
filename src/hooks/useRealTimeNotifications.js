import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService } from '../services/api';

/**
 * Hook مخصص لإدارة الإشعارات في الوقت الحقيقي
 * 
 * @param {Object} options خيارات التكوين
 * @returns {Object} متغيرات ودوال لإدارة الإشعارات
 */
export default function useRealTimeNotifications(options = {}) {
  const {
    pollingInterval = 30000, // الفاصل الزمني للتحديث بالمللي ثانية
    autoFetch = false,       // إيقاف الجلب التلقائي (معطل)
  } = options;
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // المرجع للتحديث الدوري
  const pollingIntervalRef = useRef(null);
  const isPollingRef = useRef(false);
  
  // لا توجد إشعارات وهمية - تم إيقافها
  const getDummyNotifications = () => {
    return {
      notifications: [],
      unreadCount: 0
    };
  };
  
  // استرجاع الإشعارات من الخادم (معطل - بيانات فارغة فقط)
  const fetchNotifications = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    // إرجاع بيانات فارغة مباشرة بدون استدعاء API
    const dummyData = getDummyNotifications();
    setNotifications(dummyData.notifications);
    setUnreadCount(dummyData.unreadCount);
    setLastUpdate(new Date());
    setIsLoading(false);
    
    return dummyData;
  }, [isLoading]);
  
  // تمييز إشعار كمقروء
  const markAsRead = useCallback(async (notificationId) => {
    try {
      let result;
      
      try {
        // محاولة الاتصال بالخادم أولاً
        result = await notificationService.markAsRead(notificationId);
      } catch (err) {
        // في حالة فشل الاتصال، نستمر مع تحديث واجهة المستخدم فقط
        console.warn('تم تحديث حالة الإشعار محلياً فقط:', err);
      }
      
      // تحديث الحالة المحلية مباشرة
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
      
      // تحديث عدد الرسائل غير المقروءة
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      
      return result || { success: true, message: 'تم تحديث حالة الإشعار محلياً' };
    } catch (err) {
      console.error('خطأ في تمييز الإشعار كمقروء:', err);
      return null;
    }
  }, []);
  
  // تمييز جميع الإشعارات كمقروءة
  const markAllAsRead = useCallback(async () => {
    try {
      let result;
      
      try {
        // محاولة الاتصال بالخادم أولاً
        result = await notificationService.markAllAsRead();
      } catch (err) {
        // في حالة فشل الاتصال، نستمر مع تحديث واجهة المستخدم فقط
        console.warn('تم تحديث حالة جميع الإشعارات محلياً فقط:', err);
      }
      
      // تحديث الحالة المحلية
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      
      // إعادة ضبط عدد الرسائل غير المقروءة
      setUnreadCount(0);
      
      return result || { success: true, message: 'تم تحديث حالة جميع الإشعارات محلياً' };
    } catch (err) {
      console.error('خطأ في تمييز جميع الإشعارات كمقروءة:', err);
      return null;
    }
  }, []);
  
  // بدء دورة التحديث
  const startPolling = useCallback(() => {
    if (isPollingRef.current) return;
    
    isPollingRef.current = true;
    
    // التحديث الفوري
    fetchNotifications();
    
    // إعداد التحديث الدوري
    pollingIntervalRef.current = setInterval(() => {
      fetchNotifications();
    }, pollingInterval);
  }, [fetchNotifications, pollingInterval]);
  
  // إيقاف دورة التحديث
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    isPollingRef.current = false;
  }, []);
  
  // تحديث التحديث الدوري عند تغيير الفاصل الزمني
  useEffect(() => {
    if (isPollingRef.current) {
      stopPolling();
      startPolling();
    }
  }, [pollingInterval, startPolling, stopPolling]);
  
  // بدء التحديث التلقائي عند تحميل المكون
  useEffect(() => {
    if (autoFetch) {
      startPolling();
    }
    
    // التنظيف عند تفكيك المكون
    return () => {
      stopPolling();
    };
  }, [autoFetch, startPolling, stopPolling]);
  
  // محاكاة الإشعارات في الوقت الحقيقي (للاختبار فقط - سيتم استبداله بـ WebSockets في الإنتاج)
  useEffect(() => {
    // الاستماع إلى رسائل التلقيم في صفحات أخرى (للمحاكاة)
    const handleStorage = (event) => {
      if (event.key === 'notifications_update') {
        // تحديث الإشعارات عند استلام حدث من إطار آخر
        fetchNotifications();
      }
    };
    
    window.addEventListener('storage', handleStorage);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [fetchNotifications]);
  
  // تقديم واجهة برمجة التطبيق
  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    lastUpdate,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    startPolling,
    stopPolling,
  };
} 