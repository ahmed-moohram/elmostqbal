'use client';

import React from 'react';

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

interface CertificateCardProps {
  certificate: Certificate;
  onDownload?: (certificateId: string) => void;
  onVerify?: (certificateNumber: string) => void;
}

const CertificateCard: React.FC<CertificateCardProps> = ({ 
  certificate, 
  onDownload, 
  onVerify 
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'revoked':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'issued':
        return 'صادرة';
      case 'pending':
        return 'قيد الانتظار';
      case 'revoked':
        return 'ملغية';
      default:
        return 'غير معروف';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">شهادة إكمال</h3>
            <p className="text-sm opacity-90">{certificate.certificateNumber}</p>
          </div>
          <div className="text-4xl">🎓</div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Course Info */}
        <div className="mb-4">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            {certificate.courseId.title}
          </h4>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {certificate.courseId.description}
          </p>
        </div>

        {/* Details */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">تاريخ الإصدار:</span>
            <span className="font-medium text-gray-800 dark:text-white">
              {formatDate(certificate.issueDate)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">تاريخ الإكمال:</span>
            <span className="font-medium text-gray-800 dark:text-white">
              {formatDate(certificate.completionDate)}
            </span>
          </div>

          {certificate.grade && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">الدرجة:</span>
              <span className="font-medium text-gray-800 dark:text-white">
                {certificate.grade}%
              </span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">الحالة:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(certificate.status)}`}>
              {getStatusText(certificate.status)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          {certificate.status === 'issued' && onDownload && (
            <button
              onClick={() => onDownload(certificate._id)}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              تحميل الشهادة
            </button>
          )}
          
          {onVerify && (
            <button
              onClick={() => onVerify(certificate.certificateNumber)}
              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              التحقق من الشهادة
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificateCard; 