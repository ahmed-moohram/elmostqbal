"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaLock } from "react-icons/fa";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showVerification, setShowVerification] = useState(true); // إظهار نموذج التحقق أولاً

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // التحقق من رمز التحقق أولاً
      if (showVerification) {
        // TODO: التحقق من رمز التحقق مع الخادم
        await new Promise(resolve => setTimeout(resolve, 1000));
        setShowVerification(false);
        return;
      }

      // التحقق من تطابق كلمات المرور
      if (password !== confirmPassword) {
        setError("كلمات المرور غير متطابقة");
        setLoading(false);
        return;
      }

      // التحقق من قوة كلمة المرور
      if (password.length < 8) {
        setError("يجب أن تكون كلمة المرور أطول من 8 أحرف");
        setLoading(false);
        return;
      }

      // التحقق من وجود حرف كبير وصغير ورقم
      if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        setError("يجب أن تحتوي كلمة المرور على حرف كبير وحرف صغير ورقم");
        setLoading(false);
        return;
      }

      // TODO: Update password with the server
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
    } catch (err) {
      setError("حدث خطأ أثناء إعادة تعيين كلمة المرور. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            إعادة تعيين كلمة المرور
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            أدخل كلمة المرور الجديدة
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
                  <h3 className="text-sm font-medium text-green-800">تم إعادة تعيين كلمة المرور</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.</p>
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
                {showVerification ? (
                  <div>
                    <label htmlFor="verificationCode" className="sr-only">
                      رمز التحقق
                    </label>
                    <input
                      id="verificationCode"
                      name="verificationCode"
                      type="text"
                      autoComplete="off"
                      required
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                      placeholder="رمز التحقق (تم إرساله إلى بريدك الإلكتروني)"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label htmlFor="password" className="sr-only">
                        كلمة المرور الجديدة
                      </label>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                        placeholder="كلمة المرور الجديدة"
                      />
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="sr-only">
                        تأكيد كلمة المرور
                      </label>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                        placeholder="تأكيد كلمة المرور"
                      />
                    </div>
                  </>
                )}
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
                    "تغيير كلمة المرور"
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
