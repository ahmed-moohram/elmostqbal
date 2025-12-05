'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTheme } from 'next-themes';

// تعريف نموذج النجمة
interface Star {
  id: number;
  top: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
  color: string;
}

/**
 * مكون لإضافة تأثير سماء ليلية مع قمر صغير ونجوم متلألئة
 */
const NightSkyEffect = () => {
  const [mounted, setMounted] = useState(false);
  const [stars, setStars] = useState<Star[]>([]);
  const [screenWidth, setScreenWidth] = useState(0);
  const moonRef = useRef<HTMLDivElement>(null);

  const { theme, systemTheme } = useTheme();
  const actualTheme = theme === 'system' ? systemTheme : theme;
  const isDarkMode = actualTheme === 'dark';

  // إنشاء النجوم
  const createStars = useCallback(() => {
    const newStars: Star[] = [];
    const starCount = 120; // عدد أكبر من النجوم للتأثير الجميل
    
    for (let i = 0; i < starCount; i++) {
      // حجم عشوائي مع بعض النجوم اللامعة
      const isBright = Math.random() < 0.1;
      const size = isBright ? Math.random() * 2 + 1.5 : Math.random() * 1.5 + 0.5;
      
      // سطوع عشوائي
      const opacity = isBright ? Math.random() * 0.4 + 0.6 : Math.random() * 0.3 + 0.3;
      
      // تباين بسيط في اللون
      const r = 255;
      const g = Math.random() > 0.8 ? Math.floor(Math.random() * 30) + 225 : 255;
      const b = Math.random() > 0.6 ? Math.floor(Math.random() * 55) + 200 : 255;
      
      newStars.push({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: size,
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 2,
        opacity: opacity,
        color: `rgb(${r}, ${g}, ${b})`
      });
    }
    
    setStars(newStars);
  }, []);

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
    createStars();
  }, [createStars]);

  // عدم عرض أي شيء قبل تحميل الصفحة أو في الوضع الفاتح
  if (!mounted || !isDarkMode) {
    return null;
  }

  // تحديد ما إذا كان الجهاز هاتفاً صغيراً
  const isSmallScreen = screenWidth <= 500;
  
  // ملاحظة: نحن لا نستخدم هذه الدالة حالياً لأننا نضع الحجم مباشرة
  // في خصائص style للقمر
  const getMoonSize = (screenWidth: number) => {
    return '3px'; // حجم ثابت صغير جداً
  };
  
  // دالة تحديد موقع القمر
  const getMoonPosition = (screenWidth: number) => {
    const isSmall = screenWidth <= 500;
    return {
      top: isSmall ? '80px' : '90px',
      left: isSmall ? '15px' : '25px'
    };
  };
  
  // استخدام الدالة لتحديد حجم وموقع القمر
  const moonSize = getMoonSize(screenWidth);
  const moonPosition = getMoonPosition(screenWidth);
  const moonTop = moonPosition.top;
  const moonLeft = moonPosition.left;
  
  return (
    <div className="night-sky" style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 999 }}>
      {/* قمر صغير ومضيء */}
      <div 
        className="moon" 
        ref={moonRef} 
        style={{ 
          zIndex: 999999, 
          position: 'fixed',
          width: '2px', // حجم القمر المصغر بشكل كبير
          height: '2px',
          background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #fcfcff 20%, #f5f5ff 50%, #f0f0ff 75%, #e8e8ff 100%)',
          boxShadow: '0 0 1px 0.5px rgba(255, 255, 255, 1), 0 0 2px 1px rgba(240, 240, 255, 0.7), 0 0 3px 1.5px rgba(255, 255, 255, 0.4)',
          borderRadius: '50%',
          border: 'none',
          top: '20px',
          left: '20px', 
          filter: 'blur(0.3px)',
          animation: 'subtle-pulse 8s infinite alternate ease-in-out'
        }}
      >
        <div style={{
          position: 'absolute',
          top: '15%',
          left: '15%',
          width: '30%',
          height: '30%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgb(255, 255, 255) 0%, rgba(255, 255, 255, 0) 100%)',
          filter: 'blur(0.7px)',
          opacity: 1
        }}></div>
      </div>
      
      {/* هالة القمر */}
      <div 
        style={{
          position: 'fixed',
          top: '17px',
          left: '17px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.25) 0%, rgba(250, 250, 255, 0.15) 30%, rgba(240, 240, 255, 0.1) 60%, transparent 80%)',
          filter: 'blur(8px)',
          zIndex: 999998,
          opacity: 0.85,
          animation: 'moon-glow 10s infinite alternate ease-in-out'
        }}>
      </div>
      
      {/* تأثير ضوء القمر على الصفحة */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(circle at 20px 20px, rgba(255, 255, 255, 0.08) 0%, transparent 50%)',
        zIndex: 999996,
        mixBlendMode: 'screen'
      }}></div>
      
      {/* النجوم المتلألئة */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            position: 'absolute',
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: star.color,
            borderRadius: '50%',
            opacity: star.opacity,
            zIndex: 999990,
            boxShadow: star.size > 1.5 ? `0 0 ${star.size}px rgba(255, 255, 255, 0.8)` : 'none',
            animation: `twinkle ${star.duration}s infinite ease-in-out ${star.delay}s alternate`
          }}
        />
      ))}
      
      {/* أنيميشن للقمر والنجوم */}
      <style jsx global>{`
        @keyframes subtle-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
        
        @keyframes moon-glow {
          0% { opacity: 0.8; filter: blur(8px); }
          50% { opacity: 0.9; filter: blur(10px); }
          100% { opacity: 0.8; filter: blur(8px); }
        }
        
        @keyframes twinkle {
          0% { opacity: 0.1; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default NightSkyEffect;
