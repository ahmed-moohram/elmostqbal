"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface LoadingLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  showSpinner?: boolean;
}

export default function LoadingLink({ 
  href, 
  children, 
  className = '',
  showSpinner = true 
}: LoadingLinkProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    // إظهار Loading عند الضغط
    setLoading(true);
    
    // إخفاء Loading بعد ثانية (في حالة فشل التنقل)
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <Link 
      href={href} 
      onClick={handleClick}
      className={`relative inline-flex items-center gap-2 ${className}`}
    >
      {children}
      {loading && showSpinner && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-block"
        >
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </motion.div>
      )}
    </Link>
  );
}
