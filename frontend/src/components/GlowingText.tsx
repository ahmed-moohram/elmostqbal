'use client';

import { useEffect, useState } from 'react';

interface GlowingTextProps {
  text: string;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
  color?: 'blue' | 'purple' | 'golden' | 'rainbow';
}

const GlowingText = ({ 
  text, 
  className = '',
  intensity = 'high',
  color = 'rainbow'
}: GlowingTextProps) => {
  const [animate, setAnimate] = useState(false);
  
  // تأثير التوهج المتنفس
  useEffect(() => {
    setAnimate(true);
    const interval = setInterval(() => {
      setAnimate(prev => !prev);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  // ضبط مستوى التوهج حسب الكثافة
  const getIntensity = () => {
    switch(intensity) {
      case 'low':
        return {
          textShadow: '0 0 4px rgba(59,130,246,0.5)',
          filter: 'drop-shadow(0 0 2px rgba(99,102,241,0.3))'
        };
      case 'medium':
        return {
          textShadow: '0 0 8px rgba(59,130,246,0.7), 0 0 4px rgba(59,130,246,0.4)',
          filter: 'drop-shadow(0 0 3px rgba(99,102,241,0.5))'
        };
      case 'high':
      default:
        return {
          textShadow: '0 0 8px rgba(255,255,255,0.7), 0 0 15px rgba(255,255,255,0.5), 0 0 20px rgba(59,130,246,0.6), 0 0 30px rgba(59,130,246,0.4)',
          filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.4))'
        };
    }
  };
  
  // ضبط تدرج الألوان حسب اللون المحدد
  const getColorGradient = () => {
    switch(color) {
      case 'blue':
        return 'bg-gradient-to-r from-blue-400 to-cyan-400';
      case 'purple':
        return 'bg-gradient-to-r from-purple-500 to-indigo-500';
      case 'golden':
        return 'bg-gradient-to-r from-amber-400 to-yellow-300';
      case 'rainbow':
      default:
        return 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500';
    }
  };
  
  const intensityStyle = getIntensity();
  const colorClass = getColorGradient();
  
  return (
    <span
      className={`inline-block font-extrabold tracking-normal text-transparent ${colorClass} bg-clip-text ${className}`}
      style={{
        textShadow: intensityStyle.textShadow,
        WebkitTextStroke: '0.7px rgba(255,255,255,0.2)',
        textDecoration: 'none',
        borderBottom: 'none',
        transition: 'all 1.5s ease-in-out',
        filter: `${intensityStyle.filter} ${animate ? 'brightness(1.2)' : 'brightness(1)'}`,
        animation: `${animate ? 'pulse 2s infinite' : 'none'}`,
      }}
    >
      {text}
    </span>
  );
};

export default GlowingText;
