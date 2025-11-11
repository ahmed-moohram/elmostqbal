'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

// مكون النجوم المتوهجة في محتوى الموقع - نسخة خفيفة جدًا
const ContentStars: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    setMounted(true);
    
    // تعديل الصور لتصبح جزءًا من الموقع
    if (mounted && isDarkMode) {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        // جعل الصور جزءًا من الموقع
        img.style.transition = 'all 0.3s ease';
        img.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.15)';
        img.style.border = 'none';
        img.style.borderRadius = '8px';
        img.style.opacity = '0.95';
        
        // إزالة أي تأثيرات عند التحويم
        const originalTransform = img.style.transform;
        const originalBoxShadow = img.style.boxShadow;
        
        img.addEventListener('mouseenter', () => {
          img.style.transform = originalTransform;
          img.style.boxShadow = originalBoxShadow;
        });
        
        img.addEventListener('mouseleave', () => {
          img.style.transform = originalTransform;
          img.style.boxShadow = originalBoxShadow;
        });
      });
    }
  }, [mounted, isDarkMode]);

  // عدم عرض أي شيء حتى اكتمال تحميل الصفحة وتفعيل الوضع الداكن
  if (!mounted || !isDarkMode) {
    return null;
  }

  // نجوم مبسطة جدًا لتخفيف الموقع
  return (
    <div className="fixed pointer-events-none z-[1]" style={{ top: 0, left: 0, width: '300px', height: '300px' }}>
      {/* نجوم بسيطة */}
      <div className="absolute rounded-full" style={{ left: '50px', top: '70px', width: '2px', height: '2px', background: 'white', boxShadow: '0 0 2px white', animation: 'simpleContentStar 3s ease-in-out infinite' }} />
      <div className="absolute rounded-full" style={{ left: '120px', top: '40px', width: '2px', height: '2px', background: 'white', boxShadow: '0 0 2px white', animation: 'simpleContentStar 4s ease-in-out infinite' }} />
      <div className="absolute rounded-full" style={{ left: '200px', top: '90px', width: '2px', height: '2px', background: 'white', boxShadow: '0 0 2px white', animation: 'simpleContentStar 3.5s ease-in-out infinite' }} />
      <div className="absolute rounded-full" style={{ left: '80px', top: '150px', width: '2px', height: '2px', background: 'white', boxShadow: '0 0 2px white', animation: 'simpleContentStar 2.5s ease-in-out infinite' }} />
      <div className="absolute rounded-full" style={{ left: '250px', top: '30px', width: '2px', height: '2px', background: 'white', boxShadow: '0 0 2px white', animation: 'simpleContentStar 3.2s ease-in-out infinite' }} />

      {/* تأثير توهج بسيط للنجوم */}
      <style jsx global>{`
        @keyframes simpleContentStar {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.9; }
        }
      `}</style>
    </div>
  );
};

export default ContentStars;
