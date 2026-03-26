'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';

// تعريف نموذج النجمة مع خصائص الحركة
interface Star {
  id: number;
  top: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
  color: string;
  moveX: number; // مسافة الحركة الأفقية
  moveY: number; // مسافة الحركة العمودية
  moveDuration: number; // مدة الحركة
}

export default function NightSkyWithMoon() {
  const [mounted, setMounted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [moonOpacity, setMoonOpacity] = useState(1);
  const [moonPosition, setMoonPosition] = useState(150);
  const [screenWidth, setScreenWidth] = useState(0);
  const moonRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  
  const { theme, systemTheme } = useTheme();
  const actualTheme = theme === 'system' ? systemTheme : theme;
  const isDark = actualTheme === 'dark';

  // إنشاء النجوم باستخدام useMemo لتحسين الأداء
  const stars = useMemo(() => {
    const newStars: Star[] = [];
    const starCount = 60; // زيادة عدد النجوم قليلاً
    
    for (let i = 0; i < starCount; i++) {
      // استخدام حجم متنوع للنجوم
      const isBright = Math.random() < 0.3;
      const size = isBright ? 2.5 : 1.5;
      
      // شفافية واضحة
      const opacity = isBright ? 1 : 0.7;
      
      newStars.push({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: size,
        delay: Math.random() * 5,
        duration: Math.random() * 2 + 2, // من 2 إلى 4 ثواني للتلألؤ
        opacity: opacity,
        color: 'rgb(255, 255, 255)',
        moveX: (Math.random() - 0.5) * 100, // حركة من -50 إلى 50 بكسل أفقياً
        moveY: (Math.random() - 0.5) * 100, // حركة من -50 إلى 50 بكسل عمودياً
        moveDuration: Math.random() * 20 + 15 // من 15 إلى 35 ثانية للحركة
      });
    }
    
    return newStars;
  }, []); // مُحسَّن: النجوم تُنشأ مرة واحدة فقط

  // تهيئة المكون وإضافة مراقبة السكرول وحجم الشاشة - محسّنة
  useEffect(() => {
    setMounted(true);
    
    // التأكد من وجود المتصفح
    if (typeof window !== 'undefined') {
      // تعيين حجم الشاشة الأولي
      setScreenWidth(window.innerWidth);
      
      // استخدام requestAnimationFrame لأداء أفضل
      let ticking = false;
      
      // مراقبة حدث السكرول - محسّنة
      const handleScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            
            // تحديد شفافية القمر بناءً على موضع السكرول
            const scrollThreshold = 300;
            const newOpacity = 1 - (scrollY / scrollThreshold);
            setMoonOpacity(Math.max(0, newOpacity));
            
            // تحريك القمر لأعلى أثناء السكرول
            const initialPosition = 150;
            const newPosition = initialPosition - (scrollY / 1.5);
            setMoonPosition(newPosition);
            
            ticking = false;
          });
          ticking = true;
        }
      };
      
      // إضافة مستمع لتغيير حجم الشاشة مع debounce
      let resizeTimeout: NodeJS.Timeout;
      const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          setScreenWidth(window.innerWidth);
        }, 150);
      };
      
      // إضافة المستمعين
      window.addEventListener('resize', handleResize, { passive: true });
      window.addEventListener('scroll', handleScroll, { passive: true });
      
      // استدعاء حدث السكرول مرة للتهيئة
      handleScroll();
      
      // إزالة المستمعين عند تفكيك المكون
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll);
        clearTimeout(resizeTimeout);
      };
    }
  }, []);

  // عرض الشمس في الوضع الفاتح
  if (!mounted) return null;

  // إذا كان الوضع الفاتح، نعرض خلفية زرقاء مع قمر صغير ذهبي
  if (!isDark) {
    return (
      <>
        {/* خلفية زرقاء سماوية */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to bottom, #87CEEB 0%, #B0E0E6 50%, #ADD8E6 100%)',
            pointerEvents: 'none',
            zIndex: -1, // تغيير الى -1 حتى لا تغطي المحتوى
            opacity: 0.8 // تقليل الشفافية لتحسين ظهور المحتوى
          }}
        />

        {/* قمر صغير ذهبي في أعلى يسار الموقع */}
        <div
          style={{
            position: 'fixed',
            top: '12px',
            left: '12px',
            width: '2px',
            height: '2px',
            backgroundColor: '#FFD700', // لون ذهبي للقمر في الوضع الصباحي
            borderRadius: '50%',
            boxShadow: '0 0 2px 1px rgba(255, 215, 0, 0.7)',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        />
        
        <style jsx global>{`
          
          body {
            background-color: #f5f7fa; /* لون أفتح للسماء الصباحية */
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      {/* تأثير ضوء القمر على الموقع كله */}
      <div 
        ref={glowRef}
        style={{
          position: 'fixed',
          inset: 0,
          background: `radial-gradient(circle at 150px ${moonPosition}px, rgba(255, 255, 255, ${0.15 * moonOpacity}) 0%, rgba(240, 240, 255, ${0.07 * moonOpacity}) 40%, transparent 70%)`,
          zIndex: 999995,
          pointerEvents: 'none',
          mixBlendMode: 'screen',
          opacity: moonOpacity,
          transition: 'all 0.3s ease-out'
        }}></div>

      {/* القمر الكبير جداً */}
      <div 
        ref={moonRef}
        style={{ 
          position: 'fixed',
          zIndex: 999999, 
          top: `${moonPosition}px`, 
          left: '50px',
          // تغيير حجم القمر بناءً على حجم الشاشة
          width: screenWidth < 480 ? '40px' : screenWidth < 768 ? '90px' : '120px',
          height: screenWidth < 480 ? '40px' : screenWidth < 768 ? '90px' : '120px',
          backgroundColor: 'white',
          borderRadius: '50%',
          // ضبط حجم الهالة الضوئية حسب حجم الشاشة
          boxShadow: screenWidth < 480 ?
            `0 0 8px 4px rgba(255, 255, 255, ${0.9 * moonOpacity}), 0 0 16px 8px rgba(240, 240, 255, ${0.7 * moonOpacity}), 0 0 30px 15px rgba(255, 255, 255, ${0.5 * moonOpacity})` :
            `0 0 15px 8px rgba(255, 255, 255, ${0.9 * moonOpacity}), 0 0 30px 15px rgba(240, 240, 255, ${0.7 * moonOpacity}), 0 0 60px 30px rgba(255, 255, 255, ${0.5 * moonOpacity})`,
          filter: 'blur(0.7px)',
          animation: 'subtle-pulse 8s infinite alternate ease-in-out',
          opacity: moonOpacity,
          transition: 'all 0.3s ease-out'
        }} />
      
      {/* النجوم المتحركة والمتوهجة */}
      {stars.map((star) => (
        <div
          key={star.id}
          style={{
            position: 'fixed',
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: 'white',
            borderRadius: '50%',
            opacity: star.opacity,
            zIndex: 10,
            boxShadow: `0 0 ${Math.ceil(star.size * 2)}px ${Math.ceil(star.size)}px rgba(255, 255, 255, 0.8)`,
            animation: `simpleTwinkle ${star.duration}s infinite ease-in-out ${star.delay}s alternate, starFloat-${star.id} ${star.moveDuration}s infinite ease-in-out ${star.delay}s alternate`,
            willChange: 'transform, opacity'
          }}
        />
      ))}
      
      {/* أنيميشن للقمر والنجوم */}
      <style jsx global>{`
        @keyframes subtle-pulse {
          0% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 0.9; }
        }
        
        @keyframes simpleTwinkle {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
        
        /* حركات فريدة لكل نجمة */
        ${stars.map((star) => `
          @keyframes starFloat-${star.id} {
            0% { transform: translate(0, 0); }
            25% { transform: translate(${star.moveX * 0.3}px, ${star.moveY * 0.3}px); }
            50% { transform: translate(${star.moveX * 0.6}px, ${star.moveY * 0.6}px); }
            75% { transform: translate(${star.moveX * 0.3}px, ${star.moveY * 0.8}px); }
            100% { transform: translate(0, 0); }
          }
        `).join('\n')}
      `}</style>
    </>
  );
}
