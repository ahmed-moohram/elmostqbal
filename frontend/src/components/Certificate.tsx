'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { FaDownload, FaShare, FaMedal, FaStar } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface CertificateProps {
  studentName: string;
  courseName: string;
  completionDate: string;
  instructorName: string;
  courseHours: number;
  grade?: number;
}

export default function Certificate({
  studentName,
  courseName,
  completionDate,
  instructorName,
  courseHours,
  grade = 100
}: CertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const downloadCertificate = async () => {
    if (!certificateRef.current) return;

    const canvas = await html2canvas(certificateRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 297; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`شهادة-${courseName}.pdf`);
  };

  const shareCertificate = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'شهادة إتمام الدورة',
          text: `لقد أتممت دورة ${courseName} بنجاح!`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Certificate Preview */}
      <div
        ref={certificateRef}
        className="relative bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 p-12 rounded-2xl shadow-2xl border-8 border-double border-primary"
        style={{ aspectRatio: '16/11' }}
      >
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
        <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-primary rounded-br-2xl" />
        
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <FaMedal className="text-9xl text-primary" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center space-y-6">
          {/* Logo/Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="mb-4"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-xl">
              <FaMedal className="text-5xl text-white" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
          >
            شهادة إتمام
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-gray-600 dark:text-gray-400"
          >
            تُمنح هذه الشهادة تقديراً للإنجاز المتميز
          </motion.p>

          {/* Student Name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="my-6"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">تُمنح لـ</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white border-b-2 border-primary pb-2 px-8">
              {studentName}
            </h2>
          </motion.div>

          {/* Course Details */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-2"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">لإتمام دورة</p>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {courseName}
            </h3>
            <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-2">
                <FaStar className="text-yellow-500" />
                الدرجة: {grade}%
              </span>
              <span>•</span>
              <span>{courseHours} ساعة</span>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex items-center justify-between w-full px-12 pt-6 border-t border-gray-300 dark:border-gray-600"
          >
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">المدرس</p>
              <p className="font-semibold text-gray-800 dark:text-gray-200">{instructorName}</p>
            </div>
            <div className="text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400">تاريخ الإتمام</p>
              <p className="font-semibold text-gray-800 dark:text-gray-200">{completionDate}</p>
            </div>
          </motion.div>

          {/* Serial Number */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">
            الرقم التسلسلي: CERT-{Date.now().toString(36).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={downloadCertificate}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors shadow-lg"
        >
          <FaDownload />
          تحميل الشهادة
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={shareCertificate}
          className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border-2 border-primary text-primary rounded-xl hover:bg-primary hover:text-white transition-colors shadow-lg"
        >
          <FaShare />
          مشاركة
        </motion.button>
      </div>
    </div>
  );
}
