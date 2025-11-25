import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import supabase from '@/lib/supabase-client';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'course' | 'certificate' | 'payment' | 'announcement';
  link?: string;
  image?: string;
  is_read: boolean;
  created_at: string;
  metadata?: any;
}

export const useRealtimeNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // جلب الإشعارات من قاعدة البيانات
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // الاستماع للإشعارات الجديدة في الوقت الفعلي
  useEffect(() => {
    if (!userId) return;

    // جلب الإشعارات الأولية
    fetchNotifications();

    // الاشتراك في القناة الخاصة بالمستخدم
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          // إضافة الإشعار الجديد للقائمة
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // عرض toast notification
          showNotificationToast(newNotification);

          // تشغيل صوت الإشعار
          playNotificationSound();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          
          // تحديث الإشعار في القائمة
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
          
          // تحديث عدد غير المقروءة
          if (updatedNotification.is_read && !payload.old.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const deletedId = payload.old.id;
          
          // حذف الإشعار من القائمة
          setNotifications(prev => prev.filter(n => n.id !== deletedId));
          
          // تحديث عدد غير المقروءة
          if (!payload.old.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    // تنظيف عند الخروج
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  // وظيفة لتمييز إشعار كمقروء
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  // وظيفة لتمييز الكل كمقروء
  const markAllAsRead = async () => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all as read:', error);
        return false;
      }

      // تحديث القائمة المحلية
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  // وظيفة لحذف إشعار
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  // وظيفة لإرسال إشعار جديد
  const sendNotification = async (
    targetUserId: string,
    title: string,
    message: string,
    type: Notification['type'] = 'info',
    metadata?: any
  ) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          title,
          message,
          type,
          metadata,
          is_read: false
        });

      if (error) {
        console.error('Error sending notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendNotification,
    refetch: fetchNotifications
  };
};

// وظائف مساعدة
function showNotificationToast(notification: Notification) {
  const message = `${notification.title}: ${notification.message}`;
  
  switch (notification.type) {
    case 'success':
      toast.success(message, { duration: 5000 });
      break;
    case 'error':
      toast.error(message, { duration: 5000 });
      break;
    case 'warning':
      toast(message, { 
        icon: '⚠️',
        duration: 5000 
      });
      break;
    case 'payment':
      toast(message, { 
        icon: '💳',
        duration: 5000 
      });
      break;
    case 'course':
      toast(message, { 
        icon: '📚',
        duration: 5000 
      });
      break;
    case 'certificate':
      toast(message, { 
        icon: '🎓',
        duration: 5000 
      });
      break;
    default:
      toast(message, { duration: 5000 });
  }
}

function playNotificationSound() {
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Ignore errors if autoplay is blocked
    });
  } catch {
    // Ignore if audio fails
  }
}

export default useRealtimeNotifications;
