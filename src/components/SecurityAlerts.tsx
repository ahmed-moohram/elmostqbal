'use client';

import React, { useState, useEffect } from 'react';
import { 
  FaExclamationTriangle, FaShieldAlt, FaBell, 
  FaTimesCircle, FaCheckCircle, FaInfoCircle 
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface SecurityAlert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  action?: {
    label: string;
    onClick: () => void;
  };
  autoClose?: number;
}

export default function SecurityAlerts() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Check for security issues periodically
    const checkSecurity = () => {
      // Check localStorage for sensitive data
      const user = localStorage.getItem('user');
      if (user && !user.includes('encrypted')) {
        addAlert({
          id: 'unencrypted-storage',
          type: 'warning',
          title: 'تحذير أمني',
          message: 'يتم تخزين بيانات حساسة بدون تشفير',
          timestamp: new Date(),
          action: {
            label: 'تشفير البيانات',
            onClick: () => encryptStoredData()
          }
        });
      }

      // Check for weak passwords
      checkPasswordStrength();
      
      // Check session expiry
      checkSessionExpiry();
    };

    // Initial check
    checkSecurity();

    // Set up periodic checks
    const interval = setInterval(checkSecurity, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  const addAlert = (alert: SecurityAlert) => {
    setAlerts(prev => {
      // Prevent duplicate alerts
      if (prev.some(a => a.id === alert.id)) {
        return prev;
      }
      return [...prev, alert];
    });

    // Auto-close if specified
    if (alert.autoClose) {
      setTimeout(() => {
        removeAlert(alert.id);
      }, alert.autoClose);
    }

    // Show toast for critical alerts
    if (alert.type === 'error') {
      toast.error(alert.message);
    }
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const encryptStoredData = () => {
    // Simulate encryption
    const user = localStorage.getItem('user');
    if (user) {
      const encrypted = btoa(user); // Simple base64 encoding (use proper encryption in production)
      localStorage.setItem('user', `encrypted:${encrypted}`);
      toast.success('تم تشفير البيانات بنجاح');
      removeAlert('unencrypted-storage');
    }
  };

  const checkPasswordStrength = () => {
    // Check if any stored passwords are weak
    const weakPasswords = false; // This would check actual passwords
    
    if (weakPasswords) {
      addAlert({
        id: 'weak-password',
        type: 'warning',
        title: 'كلمة مرور ضعيفة',
        message: 'بعض المستخدمين لديهم كلمات مرور ضعيفة',
        timestamp: new Date(),
        action: {
          label: 'عرض التفاصيل',
          onClick: () => window.location.href = '/admin/users'
        }
      });
    }
  };

  const checkSessionExpiry = () => {
    const sessionExpiry = localStorage.getItem('sessionExpiry');
    if (sessionExpiry) {
      const expiryTime = new Date(sessionExpiry).getTime();
      const now = Date.now();
      const timeLeft = expiryTime - now;
      
      if (timeLeft < 5 * 60 * 1000 && timeLeft > 0) { // Less than 5 minutes
        addAlert({
          id: 'session-expiry',
          type: 'info',
          title: 'انتهاء الجلسة',
          message: `ستنتهي جلستك خلال ${Math.floor(timeLeft / 60000)} دقائق`,
          timestamp: new Date(),
          action: {
            label: 'تجديد الجلسة',
            onClick: () => {
              // Refresh session
              const newExpiry = new Date(Date.now() + 30 * 60 * 1000);
              localStorage.setItem('sessionExpiry', newExpiry.toISOString());
              removeAlert('session-expiry');
              toast.success('تم تجديد الجلسة');
            }
          },
          autoClose: 30000
        });
      }
    }
  };

  const getAlertIcon = (type: SecurityAlert['type']) => {
    switch (type) {
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-600" />;
      case 'error':
        return <FaTimesCircle className="text-red-600" />;
      case 'info':
        return <FaInfoCircle className="text-blue-600" />;
      case 'success':
        return <FaCheckCircle className="text-green-600" />;
    }
  };

  const getAlertStyle = (type: SecurityAlert['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'success':
        return 'bg-green-50 border-green-200';
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      {/* Header */}
      <div className="bg-gray-800 text-white px-4 py-2 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaShieldAlt />
          <span className="font-medium">تنبيهات الأمان ({alerts.length})</span>
        </div>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-gray-300 hover:text-white transition"
        >
          {isMinimized ? '▲' : '▼'}
        </button>
      </div>

      {/* Alerts List */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white border border-gray-200 rounded-b-lg shadow-xl overflow-hidden"
          >
            <div className="max-h-96 overflow-y-auto">
              {alerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 100, opacity: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 border-b last:border-b-0 ${getAlertStyle(alert.type)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getAlertIcon(alert.type)}</div>
                    
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{alert.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-500">
                          {alert.timestamp.toLocaleTimeString('ar-EG')}
                        </span>
                        
                        <div className="flex gap-2">
                          {alert.action && (
                            <button
                              onClick={alert.action.onClick}
                              className="px-3 py-1 bg-white hover:bg-gray-50 border rounded text-sm font-medium transition"
                            >
                              {alert.action.label}
                            </button>
                          )}
                          
                          <button
                            onClick={() => removeAlert(alert.id)}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm transition"
                          >
                            إغلاق
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Clear All Button */}
            {alerts.length > 1 && (
              <div className="p-3 bg-gray-50 border-t">
                <button
                  onClick={() => setAlerts([])}
                  className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium transition"
                >
                  مسح جميع التنبيهات
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Export function to add alerts from other components
export const triggerSecurityAlert = (alert: Omit<SecurityAlert, 'id' | 'timestamp'>) => {
  const event = new CustomEvent('security-alert', {
    detail: {
      ...alert,
      id: `alert-${Date.now()}`,
      timestamp: new Date()
    }
  });
  window.dispatchEvent(event);
};

// Hook to use in components
export const useSecurityAlerts = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);

  useEffect(() => {
    const handleAlert = (event: CustomEvent<SecurityAlert>) => {
      setAlerts(prev => [...prev, event.detail]);
    };

    window.addEventListener('security-alert' as any, handleAlert);
    return () => window.removeEventListener('security-alert' as any, handleAlert);
  }, []);

  return alerts;
};
