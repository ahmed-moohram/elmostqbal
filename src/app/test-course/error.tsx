'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error in test-course:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-red-50 p-8">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-red-600 mb-4">حدث خطأ!</h2>
        <p className="text-gray-700 mb-4">{error.message}</p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
