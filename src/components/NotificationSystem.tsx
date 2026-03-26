'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBell, FaInfoCircle, FaCheckCircle, FaExclamationCircle, 
  FaExclamationTriangle, FaTimes, FaArrowLeft, FaCheck, 
  FaBook, FaCertificate, FaClock, FaBullhorn
} from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'course' | 'certificate' | 'reminder' | 'announcement';

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  type: NotificationType;
  link?: string;
  image?: string;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
}

export const NotificationSystem = ({ 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead,
  onDelete
}: NotificationSystemProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [animatingIds, setAnimatingIds] = useState<string[]>([]);

  // دالة للحصول على أيقونة مناسبة لنوع الإشعار
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'info':
        return <FaInfoCircle />;
      case 'success':
        return <FaCheckCircle />;
      case 'warning':
        return <FaExclamationTriangle />;
      case 'error':
        return <FaExclamationCircle />;
      case 'course':
        return <FaBook />;
      case 'certificate':
        return <FaCertificate />;
      case 'reminder':
        return <FaClock />;
      case 'announcement':
        return <FaBullhorn />;
      default:
        return <FaBell />;
    }
  };

  // دالة للحصول على أنماط CSS المناسبة لنوع الإشعار
  const getNotificationTypeStyles = (type: NotificationType) => {
    switch (type) {
      case 'info':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'success':
        return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
      case 'warning':
        return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
      case 'error':
        return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      case 'course':
        return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'certificate':
        return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'reminder':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      case 'announcement':
        return 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  // دالة لتنسيق التاريخ بشكل أفضل
  const formatNotificationDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'الآن';
      if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      if (diffDays < 7) return `منذ ${diffDays} يوم`;
      
      return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const handleDeleteWithAnimation = (id: string) => {
    setAnimatingIds(prev => [...prev, id]);
    setTimeout(() => {
      onDelete(id);
      setAnimatingIds(prev => prev.filter(item => item !== id));
    }, 300); // يجب أن يتوافق هذا مع مدة الرسم المتحرك للخروج
  };

  const handleMarkAllAsRead = () => {
    onMarkAllAsRead();
  };

  return (
    <div className="relative z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden w-80 sm:w-96 border border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-primary/10 to-indigo-500/10 dark:from-primary/20 dark:to-indigo-500/20">
              <h3 className="font-semibold text-gray-800 dark:text-white flex items-center">
                <FaBell className="ml-2 text-primary" />
                الإشعارات
              </h3>
              <button
                onClick={handleMarkAllAsRead}
                disabled={!notifications.some(n => !n.isRead)}
                className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <FaCheck size={10} />
                تمييز الكل كمقروء
              </button>
            </div>
            
            <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                    <FaBell className="text-gray-400" />
                  </div>
                  لا توجد إشعارات جديدة
                </div>
              ) : (
                <div>
                  {notifications.map(notification => (
                    <motion.div
                      layout
                      key={notification.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700 transition-colors ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationTypeStyles(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {notification.title || 'إشعار جديد'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="mt-2 flex justify-between items-center">
                            <span className="text-xs text-gray-500">{formatNotificationDate(notification.date)}</span>
                            <div className="flex items-center gap-2">
                              {!notification.isRead && (
                                <button
                                  onClick={() => onMarkAsRead(notification.id)}
                                  className="text-xs text-primary hover:underline"
                                >
                                  تمييز كمقروء
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteWithAnimation(notification.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                              >
                                <FaTimes size={10} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
              <Link 
                href="/notifications" 
                className="text-primary hover:text-primary-dark transition-colors text-sm flex items-center justify-center gap-2 font-medium"
                onClick={() => setIsOpen(false)}
              >
                عرض جميع الإشعارات
                <FaArrowLeft size={10} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationSystem;