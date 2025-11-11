'use client';

import { useEffect, useState, useRef } from 'react';
import { useTheme } from 'next-themes';

/**
 * مكون لإضافة قمر صغير جداً في الموقع
 */
const TinyMoon = () => {
  const [mounted, setMounted] = useState(false);
  const moonRef = useRef<HTMLDivElement>(null);
  const [screenWidth, setScreenWidth] = useState(0);

  const { theme, systemTheme } = useTheme();
  const actualTheme = theme === 'system' ? systemTheme : theme;
  const isDarkMode = actualTheme === 'dark';

  // تحديث حجم الشاشة
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setScreenWidth(window.innerWidth);
      
      const handleResize = () => {
        setScreenWidth(window.innerWidth);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // تهيئة المكون
  useEffect(() => {
    setMounted(true);
  }, []);

  // عدم عرض أي شيء قبل تحميل الصفحة أو في الوضع الفاتح
  if (!mounted || !isDarkMode) {
    return null;
  }

  // تحديد ما إذا كان الجهاز هاتفاً صغيراً
  const isSmallScreen = screenWidth <= 500;
  
  // موقع القمر المصغر - بعيداً عن شريط التنقل
  const moonTop = isSmallScreen ? '85px' : '100px';
  const moonLeft = isSmallScreen ? '15px' : '25px';
  
  return (
    <div className="tiny-moon-container">
      {/* قمر صغير جداً */}
      <div 
        className="tiny-moon" 
        ref={moonRef} 
        style={{ 
          zIndex: 999999, 
          position: 'fixed',
          width: '3px',
          height: '3px',
          background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #fcfcff 20%, #f5f5ff 50%, #f0f0ff 75%, #e8e8ff 100%)',
          boxShadow: '0 0 2px 1px rgba(255, 255, 255, 1), 0 0 4px 2px rgba(240, 240, 255, 0.9), 0 0 6px 3px rgba(255, 255, 255, 0.6)',
          borderRadius: '50%',
          border: 'none',
          top: moonTop,
          left: moonLeft, 
          filter: 'blur(0.2px)',
          animation: 'subtle-pulse 8s infinite alternate ease-in-out'
        }}
      />
      
      {/* هالة القمر المصغرة */}
      <div 
        style={{
          position: 'fixed',
          top: isSmallScreen ? '82px' : '97px',
          left: isSmallScreen ? '12px' : '22px',
          width: isSmallScreen ? '9px' : '12px',
          height: isSmallScreen ? '9px' : '12px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, rgba(250, 250, 255, 0.1) 30%, rgba(240, 240, 255, 0.05) 60%, transparent 80%)',
          filter: 'blur(2px)',
          zIndex: 999998,
          opacity: 0.6,
          animation: 'moon-glow 10s infinite alternate ease-in-out'
        }}
      />
      
      {/* أنيميشن للقمر */}
      <style jsx global>{`
        @keyframes subtle-pulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        
        @keyframes moon-glow {
          0% { opacity: 0.6; filter: blur(2px); }
          50% { opacity: 0.7; filter: blur(3px); }
          100% { opacity: 0.6; filter: blur(2px); }
        }
      `}</style>
    </div>
  );
};

export default TinyMoon;
