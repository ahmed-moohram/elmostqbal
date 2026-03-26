import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface LoadingScreenProps {
  imageUrl: string;
  onLoadingComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ imageUrl, onLoadingComplete }) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('جاري التحضير');
  const [showLoadingDots, setShowLoadingDots] = useState(true);

  // تحديث النص مع تقدم التحميل
  useEffect(() => {
    const texts = [
      'جاري التحضير',
      'إعداد المحتوى',
      'تجهيز منصة التعلم',
      'تحميل الدورات',
      'جاهز تقريباً'
    ];
    
    if (loadingProgress < 20) setLoadingText(texts[0]);
    else if (loadingProgress < 40) setLoadingText(texts[1]);
    else if (loadingProgress < 60) setLoadingText(texts[2]);
    else if (loadingProgress < 90) setLoadingText(texts[3]);
    else setLoadingText(texts[4]);
  }, [loadingProgress]);

  // النقاط المتحركة
  useEffect(() => {
    if (loadingProgress === 100) {
      setShowLoadingDots(false);
      return;
    }
    
    const interval = setInterval(() => {
      setShowLoadingDots(prev => !prev);
    }, 500);
    
    return () => clearInterval(interval);
  }, [loadingProgress]);

  // تقدم التحميل
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        const newProgress = prev + Math.floor(Math.random() * 5) + 1;
        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return newProgress;
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  // اكتمال التحميل
  useEffect(() => {
    if (loadingProgress === 100) {
      const timer = setTimeout(() => {
        onLoadingComplete();
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [loadingProgress, onLoadingComplete]);

  // العناصر المتحركة
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const particles = Array.from({ length: 20 });
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
      className="fixed inset-0 flex flex-col items-center justify-center z-50 overflow-hidden"
    >
      {/* خلفية متدرجة */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/20 to-background z-0"></div>
      
      {/* جزيئات متحركة */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {particles.map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/20"
            initial={{
              x: isClient ? Math.random() * window.innerWidth : 0,
              y: isClient ? Math.random() * window.innerHeight : 0,
              scale: Math.random() * 0.5 + 0.5,
              opacity: Math.random() * 0.3 + 0.1,
            }}
            animate={{
              x: isClient ? [null, Math.random() * window.innerWidth, Math.random() * window.innerWidth] : [0, 0, 0],
              y: isClient ? [null, Math.random() * window.innerHeight, Math.random() * window.innerHeight] : [0, 0, 0],
              opacity: [null, Math.random() * 0.5 + 0.1, Math.random() * 0.3 + 0.1],
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              ease: "linear",
              repeat: Infinity,
              repeatType: "reverse",
            }}
            style={{
              width: `${Math.random() * 50 + 10}px`,
              height: `${Math.random() * 50 + 10}px`,
            }}
          />
        ))}
      </div>
      
      {/* شعار مع تأثير نبض */}
      <motion.div
        className="relative w-40 h-40 mb-10 z-10"
        animate={{
          scale: loadingProgress === 100 ? [1, 1.1, 1] : [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
        }}
      >
        <Image
          src={imageUrl}
          alt="منصة المستقبل التعليمية"
          fill
          sizes="(max-width: 768px) 120px, 160px"
          className="object-contain drop-shadow-2xl"
          priority
        />
        
        {/* حلقة متحركة حول الشعار */}
        <motion.div 
          className="absolute inset-[-10px] border-2 border-primary/40 rounded-full"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.5, 0.2],
            rotate: 360 
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            ease: "linear" 
          }}
        />
      </motion.div>
      
      {/* شريط التقدم */}
      <div className="relative w-80 h-2 bg-gray-200/30 rounded-full overflow-hidden mb-3 z-10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${loadingProgress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-primary/80 via-primary to-accent"
        />
        
        {/* تأثير توهج متحرك على شريط التقدم */}
        <motion.div 
          className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ 
            left: ["-10%", "110%"],
          }}
          transition={{ 
            repeat: Infinity,
            duration: 1.5,
            ease: "easeInOut",
            repeatDelay: 0.5
          }}
        />
      </div>
      
      {/* نسبة التحميل */}
      <motion.div 
        className="z-10 mb-2"
        animate={loadingProgress === 100 ? 
          { scale: [1, 1.2, 1], color: ["#6d28d9", "#ffffff", "#6d28d9"] } : {}}
        transition={{ duration: 0.8 }}
      >
        <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          {loadingProgress}%
        </span>
      </motion.div>
      
      {/* نص التحميل مع نقاط متحركة */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-lg font-medium text-gray-600 dark:text-gray-300 z-10 mt-3"
      >
        {loadingProgress === 100 ? (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            تم التحميل! جاري الانتقال...
          </motion.span>
        ) : (
          <>
            {loadingText}
            {showLoadingDots && <span>...</span>}
          </>
        )}
      </motion.p>
      
      {/* رسالة ترحيبية تظهر عند اكتمال التحميل */}
      {loadingProgress === 100 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8 text-center z-10"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            مرحباً بك في منصة المستقبل التعليمية
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default LoadingScreen; 