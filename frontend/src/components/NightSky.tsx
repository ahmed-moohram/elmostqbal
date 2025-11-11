"use client"; // Mark this as a Client Component

import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';
import styles from '../styles/NightSky.module.css';

const NUM_STARS = 150;

interface Star {
  id: number;
  className: string;
  style: React.CSSProperties;
}

const NightSky: React.FC = () => {
  const { theme } = useTheme();
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    if (theme === 'dark') {
      const generatedStars = Array.from({ length: NUM_STARS }).map((_, i) => {
        const size = Math.random() * 1.8 + 0.8; 
        const baseOpacity = Math.random() * 0.4 + 0.3; 
        
        const r = 255;
        const g = 255;
        const b = Math.random() > 0.65 ? 220 : 255; 
        
        const isBright = Math.random() < 0.07; 
        const starClassName = isBright ? `${styles.star} ${styles.brightStar}` : styles.star;

        return {
          id: i,
          className: starClassName,
          style: {
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: isBright ? `${size + 0.5}px` : `${size}px`, 
            height: isBright ? `${size + 0.5}px` : `${size}px`,
            backgroundColor: `rgba(${r}, ${g}, ${b}, ${baseOpacity + (isBright ? 0.25 : 0)})`, 
            animationDelay: `${Math.random() * 8}s`, 
            animationDuration: `${Math.random() * 5 + 3}s`, 
          },
        };
      });
      setStars(generatedStars);
    } else {
      setStars([]);
    }
  }, [theme]);

  if (theme !== 'dark') {
    return null;
  }

  return (
    <div className={styles.nightSkyContainer}>
      <div className={styles.moon}></div>
      <div className={styles.starsContainer}>
        {stars.map(star => (
          <div key={star.id} className={star.className} style={star.style}></div>
        ))}
      </div>
    </div>
  );
};

export default NightSky;
