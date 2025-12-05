'use client';

import React, { useState, useEffect } from 'react';
import CertificateCard from '../../components/Certificates/CertificateCard';

interface Certificate {
  _id: string;
  certificateNumber: string;
  issueDate: string;
  completionDate: string;
  grade?: number;
  status: 'issued' | 'pending' | 'revoked';
  courseId: {
    _id: string;
    title: string;
    description: string;
    image?: string;
  };
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/certificates/student', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCertificates(data.data);
      } else {
        setError('فشل في تحميل الشهادات');
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setError('حدث خطأ أثناء تحميل الشهادات');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certificateId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/certificates/${certificateId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Here you would typically generate and download a PDF
        // For now, we'll just show an alert
        alert('سيتم تحميل الشهادة قريباً');
      } else {
        alert('فشل في تحميل الشهادة');
      }
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('حدث خطأ أثناء تحميل الشهادة');
    }
  };

  const handleVerify = (certificateNumber: string) => {
    // Open verification in new tab
    window.open(`/api/certificates/verify/${certificateNumber}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل الشهادات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
            شهاداتي
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            جميع الشهادات التي حصلت عليها من الدورات المكتملة
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Certificates Grid */}
        {certificates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎓</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              لا توجد شهادات بعد
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              أكمل الدورات للحصول على شهادات الإنجاز
            </p>
            <a
              href="/courses"
              className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              استكشف الدورات
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((certificate) => (
              <CertificateCard
                key={certificate._id}
                certificate={certificate}
                onDownload={handleDownload}
                onVerify={handleVerify}
              />
            ))}
          </div>
        )}

        {/* Stats */}
        {certificates.length > 0 && (
          <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              إحصائيات الشهادات
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {certificates.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  إجمالي الشهادات
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {certificates.filter(c => c.status === 'issued').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  شهادات صادرة
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">
                  {certificates.filter(c => c.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  قيد الانتظار
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 