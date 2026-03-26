'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeProvider';

export const ThemeEffect = () => {
  const { theme, isTransitioning } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Apply theme transition class to prevent flickering
  useEffect(() => {
    if (!mounted) {
      setMounted(true);
      return;
    }
    
    if (isTransitioning) {
      document.documentElement.classList.add('theme-transition');
      
      const timeout = setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [isTransitioning, mounted]);
  
  if (!mounted) return null;
  
  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div 
          className={`theme-overlay ${theme === 'dark' ? 'theme-overlay-night' : 'theme-overlay-day'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          {/* Sun/Moon Animation Elements */}
          {theme === 'dark' ? (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0.8] }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 1.5 }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              >
                <div className="h-24 w-24 rounded-full bg-white opacity-20 blur-xl"></div>
              </motion.div>
              <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: [-50, 0], opacity: [0, 1, 0] }}
                transition={{ duration: 1 }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              >
                <div className="h-12 w-12 rounded-full bg-gray-200 shadow-xl shadow-white/10"></div>
              </motion.div>
            </div>
          ) : (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.8, 1.2], opacity: [0, 1, 0.7] }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 1.5 }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              >
                <div className="h-32 w-32 rounded-full bg-yellow-300 opacity-30 blur-xl"></div>
              </motion.div>
              <motion.div 
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: [50, 0], opacity: [0, 1, 0.6] }}
                transition={{ duration: 1 }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              >
                <div className="h-16 w-16 rounded-full bg-yellow-400 shadow-xl shadow-yellow-400/50"></div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ThemeEffect; 