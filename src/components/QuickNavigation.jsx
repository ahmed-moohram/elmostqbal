import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './QuickNavigation.css';

/**
 * مكون التنقل الفوري
 * Instant Navigation Component
 */

const QuickNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);

  // التنقل الفوري بدون تأخير
  const instantNavigate = useCallback((path) => {
    if (isNavigating || location.pathname === path) return;
    
    setIsNavigating(true);
    
    // تنقل فوري بدون أي تأخير
    requestAnimationFrame(() => {
      navigate(path);
      setIsNavigating(false);
    });
  }, [navigate, location.pathname, isNavigating]);

  // اختصارات لوحة المفاتيح للتنقل السريع
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Alt + رقم للتنقل السريع
      if (e.altKey) {
        switch(e.key) {
          case '1':
            instantNavigate('/dashboard');
            break;
          case '2':
            instantNavigate('/courses');
            break;
          case '3':
            instantNavigate('/live-sessions');
            break;
          case '4':
            instantNavigate('/assignments');
            break;
          case '5':
            instantNavigate('/profile');
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [instantNavigate]);

  // تحميل مسبق للصفحات عند تحميل التطبيق
  useEffect(() => {
    const pages = ['/dashboard', '/courses', '/profile', '/live-sessions'];
    pages.forEach(page => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = page;
      document.head.appendChild(link);
    });
  }, []);

  return null; // مكون خفي للتنقل
};

/**
 * زر التنقل السريع
 */
export const QuickNavButton = ({ to, children, className = '', icon, ...props }) => {
  const navigate = useNavigate();
  const [isPrefetched, setIsPrefetched] = useState(false);

  // تحميل مسبق عند مرور الماوس
  const handleMouseEnter = useCallback(() => {
    if (!isPrefetched) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = to;
      document.head.appendChild(link);
      setIsPrefetched(true);
    }
  }, [to, isPrefetched]);

  // التنقل الفوري عند النقر
  const handleClick = useCallback((e) => {
    e.preventDefault();
    
    // تأثير نقر سريع
    const button = e.currentTarget;
    button.style.transform = 'scale(0.95)';
    
    requestAnimationFrame(() => {
      navigate(to);
      setTimeout(() => {
        if (button) button.style.transform = 'scale(1)';
      }, 100);
    });
  }, [navigate, to]);

  return (
    <button
      className={`quick-nav-button ${className}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {icon && <span className="button-icon">{icon}</span>}
      {children}
    </button>
  );
};

/**
 * شريط التنقل السريع
 */
export const QuickNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'الرئيسية', icon: '🏠' },
    { path: '/courses', label: 'الكورسات', icon: '📚' },
    { path: '/live-sessions', label: 'البث المباشر', icon: '📡' },
    { path: '/assignments', label: 'الواجبات', icon: '📝' },
    { path: '/profile', label: 'الملف الشخصي', icon: '👤' }
  ];

  return (
    <nav className="quick-nav-bar">
      {navItems.map(item => (
        <QuickNavButton
          key={item.path}
          to={item.path}
          className={location.pathname === item.path ? 'active' : ''}
          icon={item.icon}
        >
          {item.label}
        </QuickNavButton>
      ))}
    </nav>
  );
};

/**
 * مكون Preloader للصفحات
 */
export const PagePreloader = ({ pages = [] }) => {
  useEffect(() => {
    pages.forEach(page => {
      // إنشاء iframe مخفي لتحميل الصفحة
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = page;
      document.body.appendChild(iframe);
      
      // إزالة الـ iframe بعد التحميل
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 3000);
    });
  }, [pages]);

  return null;
};

/**
 * Hook للتنقل المحسّن
 */
export const useQuickNavigation = () => {
  const navigate = useNavigate();
  const [navigationHistory, setNavigationHistory] = useState([]);

  const quickNavigate = useCallback((to, options = {}) => {
    // حفظ في السجل
    setNavigationHistory(prev => [...prev, to].slice(-10));
    
    // تنقل فوري
    requestAnimationFrame(() => {
      navigate(to, options);
    });
  }, [navigate]);

  const goBack = useCallback(() => {
    window.history.back();
  }, []);

  const goForward = useCallback(() => {
    window.history.forward();
  }, []);

  const goToHome = useCallback(() => {
    quickNavigate('/dashboard');
  }, [quickNavigate]);

  return {
    navigate: quickNavigate,
    goBack,
    goForward,
    goToHome,
    history: navigationHistory
  };
};

export default QuickNavigation;
