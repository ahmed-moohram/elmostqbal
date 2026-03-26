"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FaEnvelope } from "react-icons/fa";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // التحقق من صحة البريد الإلكتروني
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) {
        setError("البريد الإلكتروني مطلوب");
        setLoading(false);
        return;
      }
      if (!emailRegex.test(email)) {
        setError("البريد الإلكتروني غير صالح");
        setLoading(false);
        return;
      }

      // التحقق من وجود حساب باستخدام API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/auth/check-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "حدث خطأ أثناء التحقق من الحساب");
        setLoading(false);
        return;
      }

      const userData = await response.json();
      if (!userData.isVerified) {
        setError("الرجاء تفعيل حسابك أولاً");
        setLoading(false);
        return;
      }

      // إنشاء رمز التحقق
      const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // إرسال البريد الإلكتروني مع رمز التحقق
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>طلب إعادة تعيين كلمة المرور</h2>
          <p>تم طلب إعادة تعيين كلمة المرور لحسابك.</p>
          <p>رمز التحقق: <strong>${verificationCode}</strong></p>
          <p>الرمز صالح لمدة 15 دقيقة فقط.</p>
          <p>إذا لم تقم أنت بطلب إعادة تعيين كلمة المرور، فيرجى تجاهل هذا البريد.</p>
        </div>
      `;

      // TODO: إرسال البريد الإلكتروني فعلياً
      console.log('سيتم إرسال البريد الإلكتروني التالي:', emailContent);

      // تخزين رمز التحقق في الخادم
      await fetch('http://localhost:5000/api/auth/store-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          verificationCode: verificationCode,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        })
      });

      setSuccess(true);
    } catch (err) {
      setError("حدث خطأ أثناء إرسال البريد الإلكتروني. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            نسيت كلمة المرور؟
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {success ? (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">تم إرسال البريد الإلكتروني</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>تم إرسال رابط لإعادة تعيين كلمة المرور إلى بريدك الإلكتروني.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">حدث خطأ</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  <label htmlFor="email" className="sr-only">
                    البريد الإلكتروني
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                    placeholder="البريد الإلكتروني"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "إرسال رابط إعادة تعيين"
                  )}
                </button>
              </div>

              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                <Link href="/login" className="font-medium text-primary hover:text-primary-dark dark:text-indigo-400 dark:hover:text-indigo-300">
                  العودة إلى تسجيل الدخول
                </Link>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
