'use client';

import { useEffect, useState } from 'react';

export function BackgroundWatermark() {
  const [userData, setUserData] = useState<{name?: string, fullName?: string, studentPhone?: string} | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Get user data from context or API only
    // If no data is available, do not display the watermark
    setUserData(null);
    // TODO: When integrating with real authentication, setUserData with real user info here.
  }, []);

  if (!isClient || !userData?.name) {
    return null;
  }

  // استخدام الاسم الرباعي مع الرقم في العلامة المائية
  const watermarkText = `${userData.fullName || userData.name} - ${userData.studentPhone}`;

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      <div className="absolute inset-0 flex flex-wrap content-center justify-center opacity-[0.04] select-none">
        {Array.from({ length: 200 }, (_, index) => (
          <div
            key={index}
            className="watermark-text whitespace-nowrap text-black dark:text-white text-2xl font-bold px-4 py-10"
            style={{
              transform: `rotate(-30deg) translateZ(0)`,
              animationDuration: `${Math.random() * 20 + 40}s`,
              animationDelay: `${Math.random() * 10}s`,
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          >
            {watermarkText}
          </div>
        ))}
      </div>
    </div>
  );
} 