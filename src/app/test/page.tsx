"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function TestPage() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white">
          صفحة الاختبار
        </h1>
        
        <div className="text-center mb-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            العداد: {count}
          </p>
          <button 
            onClick={() => setCount(count + 1)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            زيادة العداد
          </button>
        </div>

        <div className="space-y-4">
          <Link 
            href="/login" 
            className="block w-full bg-green-500 hover:bg-green-600 text-white text-center py-3 rounded-lg transition-colors"
          >
            صفحة الدخول
          </Link>
          
          <Link 
            href="/register" 
            className="block w-full bg-purple-500 hover:bg-purple-600 text-white text-center py-3 rounded-lg transition-colors"
          >
            صفحة التسجيل
          </Link>
          
          <Link 
            href="/" 
            className="block w-full bg-gray-500 hover:bg-gray-600 text-white text-center py-3 rounded-lg transition-colors"
          >
            الصفحة الرئيسية
          </Link>
        </div>

        <div className="mt-6 p-4 bg-green-100 dark:bg-green-900 rounded-lg">
          <p className="text-green-800 dark:text-green-200 text-sm">
            ✅ إذا كنت ترى هذه الصفحة، فالمشروع يعمل بشكل صحيح!
          </p>
        </div>
      </div>
    </div>
  );
} 