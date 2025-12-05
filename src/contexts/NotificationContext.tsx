"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'course' | 'payment' | 'announcement';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
  actionText?: string;
  icon?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // تحميل الإشعارات من localStorage
  useEffect(() => {
    if (user) {
      loadNotifications();
      
      // إعداد WebSocket للإشعارات الفورية (اختياري)
      // setupWebSocket();
    }
  }, [user]);

  const loadNotifications = () => {
    try {
      const stored = localStorage.getItem(`notifications_${user?.id || 'guest'}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setNotifications(parsed.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt)
        })));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const saveNotifications = (notifs: Notification[]) => {
    try {
      localStorage.setItem(`notifications_${user?.id || 'guest'}`, JSON.stringify(notifs));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36),
      read: false,
      createdAt: new Date(),
    };

    const updatedNotifications = [newNotification, ...notifications].slice(0, 50); // Keep last 50
    setNotifications(updatedNotifications);
    saveNotifications(updatedNotifications);

    // عرض Toast notification
    const getIcon = () => {
      switch (notification.type) {
        case 'success': return '✅';
        case 'error': return '❌';
        case 'warning': return '⚠️';
        case 'course': return '📚';
        case 'payment': return '💳';
        case 'announcement': return '📢';
        default: return 'ℹ️';
      }
    };

    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <span className="text-2xl">{getIcon()}</span>
              </div>
              <div className="mr-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
              </div>
            </div>
          </div>
          <div className="flex border-r border-gray-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-l-lg p-4 flex items-center justify-center text-sm font-medium text-primary hover:text-primary-dark focus:outline-none"
            >
              إغلاق
            </button>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  };

  const markAsRead = (id: string) => {
    const updatedNotifications = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);
    saveNotifications(updatedNotifications);
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifications);
    saveNotifications(updatedNotifications);
  };

  const deleteNotification = (id: string) => {
    const updatedNotifications = notifications.filter(n => n.id !== id);
    setNotifications(updatedNotifications);
    saveNotifications(updatedNotifications);
  };

  const clearAll = () => {
    setNotifications([]);
    saveNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
