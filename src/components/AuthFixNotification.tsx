"use client";

import { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

/**
 * مكون إشعار لإعلام المستخدمين بضرورة تسجيل الدخول مرة أخرى
 * بعد إصلاح مشكلة المصادقة
 * 
 * يمكن إزالة هذا المكون بعد أن يقوم جميع المستخدمين بتسجيل الدخول مرة أخرى
 */
export default function AuthFixNotification() {
  const [showNotification, setShowNotification] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // التحقق من حالة المصادقة
    const checkAuthStatus = () => {
      try {
        const user = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        // إذا كان المستخدم مسجل دخول ولكن البيانات قديمة
        if (user && token) {
          const userData = JSON.parse(user);
          
          // إذا لم يكن token موجود في user object
          if (!userData.token) {
            setShowNotification(true);
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      }
    };

    // تأخير بسيط قبل عرض الإشعار
    const timer = setTimeout(checkAuthStatus, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleFixAuth = () => {
    try {
      const user = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (user && token) {
        const userData = JSON.parse(user);
        userData.token = token;
        localStorage.setItem('user', JSON.stringify(userData));
        
        setShowNotification(false);
        setDismissed(true);
        
        // إعادة تحميل الصفحة
        window.location.reload();
      }
    } catch (error) {
      console.error('Error fixing auth:', error);
      // في حالة الفشل، مسح البيانات وإعادة التوجيه لتسجيل الدخول
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  const handleDismiss = () => {
    setShowNotification(false);
    setDismissed(true);
  };

  if (!showNotification || dismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <FaExclamationTriangle className="text-2xl flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">تحديث مهم في نظام المصادقة</h3>
              <p className="text-sm">
                تم إصلاح مشكلة في نظام المصادقة. يرجى الضغط على "إصلاح الآن" لتحديث بياناتك، 
                أو تسجيل الخروج ثم تسجيل الدخول مرة أخرى.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleFixAuth}
              className="bg-white text-yellow-600 px-4 py-2 rounded-lg font-bold hover:bg-yellow-50 transition whitespace-nowrap"
            >
              إصلاح الآن
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 hover:bg-yellow-600 rounded-lg transition"
              aria-label="إغلاق"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
