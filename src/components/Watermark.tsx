'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

interface WatermarkProps {
  userName: string;
  userPhone: string;
  opacity?: number;
  fontSize?: number;
}

/**
 * مكون العلامة المائية - يعرض اسم المستخدم ورقم هاتفه بشكل أنيق وغير مزعج
 */
export default function Watermark({ 
  userName, 
  userPhone, 
  opacity = 0.15, 
  fontSize = 12 
}: WatermarkProps) {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !userName || !userPhone) return null;

  const watermarkText = `${userName} • ${userPhone}`;
  
  // إنشاء نمط عشوائي للموضع لمنع التعديل السهل
  const positions = [
    { top: '15%', left: '10%', rotate: -15 },
    { top: '45%', right: '15%', rotate: 15 },
    { top: '75%', left: '20%', rotate: -10 },
    { top: '25%', right: '25%', rotate: 12 },
    { bottom: '20%', left: '35%', rotate: -18 },
  ];

  return (
    <>
      {/* علامة مائية متعددة في أماكن مختلفة */}
      {positions.map((pos, index) => (
        <div
          key={index}
          style={{
            position: 'fixed',
            ...pos,
            transform: `rotate(${pos.rotate}deg)`,
            color: isDark ? 'rgba(255, 255, 255, ' + opacity + ')' : 'rgba(0, 0, 0, ' + opacity + ')',
            fontSize: `${fontSize}px`,
            fontWeight: 500,
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 9999,
            fontFamily: 'Cairo, sans-serif',
            letterSpacing: '0.5px',
            textShadow: isDark 
              ? '0 1px 2px rgba(0, 0, 0, 0.3)' 
              : '0 1px 2px rgba(255, 255, 255, 0.3)',
            whiteSpace: 'nowrap'
          }}
        >
          {watermarkText}
        </div>
      ))}

      {/* علامة مائية في وسط الصفحة (خفيفة جداً) */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-45deg)',
          color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          fontSize: `${fontSize * 3}px`,
          fontWeight: 600,
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 1,
          fontFamily: 'Cairo, sans-serif',
          whiteSpace: 'nowrap'
        }}
      >
        {watermarkText}
      </div>

      {/* منع الطباعة والتقاط الشاشة */}
      <style jsx global>{`
        @media print {
          body::after {
            content: "${watermarkText}";
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 48px;
            opacity: 0.3;
            pointer-events: none;
          }
        }
      `}</style>
    </>
  );
}
