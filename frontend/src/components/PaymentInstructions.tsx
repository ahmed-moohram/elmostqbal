"use client";

import React from "react";
import { IoLogoWhatsapp, IoClose, IoCheckmarkCircle } from "react-icons/io5";
import { FaCopy, FaCheck } from "react-icons/fa"; 

interface PaymentInstructionsProps {
  courseName: string;
  courseId: number;
  userId?: number;
  userName?: string;
  phoneNumber: string;
  onClose: () => void;
}

const PaymentInstructions: React.FC<PaymentInstructionsProps> = ({ courseName, courseId, userId, userName, phoneNumber, onClose }) => {
  const [copied, setCopied] = React.useState(false);
  const [receiptSent, setReceiptSent] = React.useState(false);
  const [whatsappButtonClicked, setWhatsappButtonClicked] = React.useState(false);

  const vodafoneCashNumber = phoneNumber; 
  const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    `أرغب في تأكيد اشتراكي في دورة "${courseName}". مرفق صورة الإيصال.`
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(vodafoneCashNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReceiptSent = async () => {
    // أولاً, إرسال البيانات إلى الخادم
    if (userId && courseId) { // فقط إذا كانت البيانات الأساسية موجودة
      try {
        const response = await fetch('/api/payment/confirm-receipt', { // افترض أن هذا هو الـ API endpoint
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            userName: userName || 'Unknown User',
            courseId: courseId,
            courseName: courseName,
            claimedAt: new Date().toISOString(),
            status: 'pending_verification' // حالة أولية
          }),
        });

        if (!response.ok) {
          // يمكنك هنا معالجة الخطأ من الخادم، مثلاً عرض رسالة للمستخدم
          console.error('Failed to submit receipt confirmation to backend:', await response.text());
          //  قد تقرر عدم إظهار رسالة النجاح في الواجهة إذا فشل الإرسال للخادم
          //  لكن للتبسيط الآن، سنكمل ونظهر رسالة النجاح في الواجهة
        } else {
          console.log('Receipt confirmation successfully sent to backend.');
        }
      } catch (error) {
        console.error('Error sending receipt confirmation to backend:', error);
        // معالجة أخطاء الشبكة أو أخطاء أخرى
      }
    }

    // ثانياً, تحديث الواجهة لإظهار رسالة النجاح
    setReceiptSent(true);
    setTimeout(() => {
      onClose(); 
    }, 2000);
  };

  const handleWhatsAppButtonClick = () => {
    setWhatsappButtonClicked(true);
  };

  if (receiptSent) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-md flex justify-center items-center p-4 z-[999] animate-fadeIn">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700 text-center">
          <IoCheckmarkCircle className="text-7xl text-green-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">تم بنجاح!</h2>
          <p className="text-gray-300 mb-6">
            لقد أبلغتنا بإرسالك للإيصال. سيتم مراجعة طلبك وتفعيل اشتراكك في أقرب وقت.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
          >
            حسنًا
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-md flex justify-center items-center p-4 z-[999] animate-fadeIn">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-lg border border-gray-700 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-2xl z-10"
          aria-label="إغلاق"
        >
          <IoClose />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-2">
            تعليمات الدفع
          </h2>
          <p className="text-gray-300 text-sm">
            لدورة: <span className="font-semibold text-purple-300">{courseName}</span>
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-700 bg-opacity-50 p-5 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">1. تحويل المبلغ عبر فودافون كاش</h3>
            <p className="text-gray-300 text-sm mb-3">
              يرجى تحويل قيمة الاشتراك إلى الرقم التالي:
            </p>
            <div className="flex items-center justify-between bg-gray-900 p-3 rounded-md">
              <span className="text-xl font-mono text-purple-300 select-all">
                {vodafoneCashNumber}
              </span>
              <button
                onClick={handleCopy}
                title={copied ? "تم النسخ!" : "نسخ الرقم"}
                className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors text-lg"
              >
                {copied ? <FaCheck /> : <FaCopy />}
              </button>
            </div>
          </div>

          <div className="bg-gray-700 bg-opacity-50 p-5 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">2. إرسال صورة الإيصال عبر واتساب</h3>
            <p className="text-gray-300 text-sm mb-4">
              بعد التحويل، يرجى الضغط على الزر أدناه لإرسال صورة واضحة من إيصال الدفع عبر واتساب إلى نفس الرقم.
            </p>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsAppButtonClick}
              className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 text-lg"
            >
              <IoLogoWhatsapp className="text-2xl" />
              إرسال الإيصال عبر واتساب
            </a>
          </div>

          {whatsappButtonClicked && (
            <div className="bg-gray-700 bg-opacity-50 p-5 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-3">3. تأكيد إرسال الإيصال</h3>
              <p className="text-gray-300 text-sm mb-4">
                بعد إرسال الإيصال عبر واتساب، يرجى الضغط على الزر أدناه لتأكيد إتمام هذه الخطوة.
              </p>
              <button
                onClick={handleReceiptSent}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 text-lg disabled:opacity-50"
              >
                لقد أرسلت الإيصال بنجاح
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-500 mt-8">
          سيتم مراجعة طلبك وتفعيل الاشتراك خلال ساعات قليلة بعد استلام وتأكيد الإيصال.
        </p>
      </div>
    </div>
  );
};

export default PaymentInstructions;
