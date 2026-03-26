'use client';

import { useEffect, useState } from 'react';

interface VideoWatermarkProps {
  userName: string;
  userPhone: string;
  opacity?: number;
}

/**
 * مكون العلامة المائية للفيديوهات
 * يعرض العلامة المائية بشكل ديناميكي متحرك على الفيديو
 */
export default function VideoWatermark({ 
  userName, 
  userPhone, 
  opacity = 0.4 
}: VideoWatermarkProps) {
  const [position, setPosition] = useState({ top: 20, left: 20 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // تغيير موضع العلامة المائية كل 30 ثانية لمنع التعديل
    const interval = setInterval(() => {
      const top = Math.random() * 70 + 10; // من 10% إلى 80%
      const left = Math.random() * 70 + 10; // من 10% إلى 80%
      setPosition({ top, left });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted || !userName || !userPhone) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: `${position.top}%`,
        left: `${position.left}%`,
        transform: 'translate(-50%, -50%)',
        color: `rgba(255, 255, 255, ${opacity})`,
        fontSize: '14px',
        fontWeight: 600,
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 10,
        fontFamily: 'Cairo, sans-serif',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
        padding: '4px 12px',
        borderRadius: '4px',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(4px)',
        transition: 'all 2s ease-in-out',
        whiteSpace: 'nowrap',
        letterSpacing: '0.5px'
      }}
    >
      {userName} • {userPhone}
    </div>
  );
}
