'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSun, FaMoon } from 'react-icons/fa'; 
import { useTheme } from 'next-themes'; 

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false); 
  const [stars, setStars] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);

  useEffect(() => {
    setMounted(true);
    const newStars = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
    }));
    setStars(newStars);
  }, []);

  const handleToggleTheme = () => {
    setIsTransitioning(true);
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    console.log(`تم التبديل إلى الوضع ${newTheme}`);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 1500);
  };

  if (!mounted) return null;

  return (
    <motion.button
      onClick={handleToggleTheme}
      disabled={isTransitioning}
      className={`
        relative overflow-hidden rounded-full w-12 h-12 flex items-center justify-center
        transition-colors duration-1000
        ${theme === 'dark' 
          ? 'bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900' 
          : 'bg-gradient-to-br from-blue-400 via-sky-400 to-sky-300'
        }
        cursor-pointer
        hover:shadow-lg shadow-md
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ 
        type: 'spring',
        stiffness: 400,
        damping: 15
      }}
    >
      <div className="absolute inset-0 w-full h-full">
        {stars.map((star) => (
          <motion.span
            key={star.id}
            className="absolute bg-white rounded-full"
            animate={{
              opacity: theme === 'dark' ? [0, 1, 0.8, 1] : 0,
              scale: theme === 'dark' ? [0.8, 1, 0.9, 1] : 0,
            }}
            transition={{
              duration: 2,
              repeat: theme === 'dark' ? Infinity : 0,
              repeatType: "reverse",
              delay: Math.random() * 2,
            }}
            style={{
              top: `${star.y}%`,
              left: `${star.x}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
            }}
          />
        ))}
        
        <motion.div
          animate={{
            y: theme === 'light' ? '0%' : '-100%',
            opacity: theme === 'light' ? 1 : 0,
          }}
          transition={{ duration: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <motion.div 
            className="w-8 h-8 bg-yellow-300 rounded-full flex items-center justify-center shadow-lg"
            animate={{ 
              boxShadow: theme === 'light' 
                ? "0 0 20px 5px rgba(250, 204, 21, 0.7)" 
                : "0 0 0px 0px rgba(250, 204, 21, 0)" 
            }}
            transition={{ duration: 1 }}
          >
            <FaSun className="text-yellow-600 text-xl" />
          </motion.div>
        </motion.div>
        
        <motion.div
          animate={{
            y: theme === 'dark' ? '0%' : '100%',
            opacity: theme === 'dark' ? 1 : 0,
          }}
          transition={{ duration: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center shadow-lg">
            <FaMoon className="text-blue-900 text-lg" />
          </div>
        </motion.div>

        <motion.div
          className="absolute right-1.5 top-2 w-5 h-3 bg-white/90 rounded-full"
          animate={{ 
            opacity: theme === 'light' ? 1 : 0,
            x: theme === 'light' ? [0, 5, -5, 0] : 20,
          }}
          transition={{ 
            opacity: { duration: 1 },
            x: { duration: 10, repeat: Infinity, repeatType: "reverse" }
          }}
        />
      </div>
    </motion.button>
  );
};

export default ThemeToggle;