"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { FaUser, FaLock, FaEye, FaEyeSlash, FaGoogle, FaFacebook, FaTwitter } from "react-icons/fa";
import Link from "next/link";
import { Cairo } from 'next/font/google';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';

const cairo = Cairo({ subsets: ['latin'], weight: ['400', '700'] });

export default function LoginPage() {
  const { login: loginUser, isAuthenticated, user } = useAuth();
  const [loginPhone, setLoginPhone] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrolled, setScrolled] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const eyeRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const calculateEyeRotation = (eyeRef: React.RefObject<HTMLButtonElement>, isTyping: boolean, passwordRef: React.RefObject<HTMLInputElement>) => {
    if (!eyeRef.current || !passwordRef.current) return { x: 0, y: 0 };

    const eyeRect = eyeRef.current.getBoundingClientRect();
    const passwordRect = passwordRef.current.getBoundingClientRect();
    
    const centerX = eyeRect.width / 2;
    const centerY = eyeRect.height / 2;

    // حساب موقع حقل كلمة المرور بالنسبة للزر
    const passwordX = (passwordRect.left + passwordRect.width / 2) - eyeRect.left;
    const passwordY = (passwordRect.top + passwordRect.height / 2) - eyeRect.top;

    // عند الكتابة، نجعل العين تنظر إلى حقل كلمة المرور
    if (isTyping) {
      const targetX = (passwordX - centerX) / (centerX * 2);
      const targetY = (passwordY - centerY) / (centerY * 2);
      
      return {
        x: Math.min(Math.max(targetX, -1), 1) * 20,
        y: Math.min(Math.max(targetY, -1), 1) * 20
      };
    }

    // عند عدم الكتابة، نجعل العين تتبع مؤشر الماوس
    const mouseX = mousePosition.x;
    const mouseY = mousePosition.y;
    
    return {
      x: (mouseX - centerX) / (centerX * 2) * 20,
      y: (mouseY - centerY) / (centerY * 2) * 20
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
    setMousePosition({ x, y });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginPassword(e.target.value);
    setIsTyping(true);
    
    // تحديث حالة الكتابة فقط
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    typingTimeout.current = setTimeout(() => setIsTyping(false), 500);
  };

  useEffect(() => {
    const savedPhone = localStorage.getItem("rememberedPhone");
    const savedPass = localStorage.getItem("rememberedPass");
    if (savedPhone) {
      setLoginPhone(savedPhone);
      setRememberMe(true);
    }
    if (savedPass) {
      setLoginPassword(savedPass);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardPath = user.role === 'student' ? '/student/dashboard' : 
                           user.role === 'admin' ? '/admin' : 
                           '/teachers/dashboard';
      router.replace(dashboardPath);
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    // التأكد من تطابق العناصر
    const container = document.querySelector('.login-container');
    if (container) {
      // إزالة أي عناصر مؤقتة قد تم إضافتها
      const tempElements = container.querySelectorAll('.temp-element');
      tempElements.forEach(el => el.remove());
    }

    // التحقق من حالة التمرير
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // التحقق من المدخلات
      if (!loginPhone) {
        setError("رقم الهاتف مطلوب");
        setLoading(false);
        return;
      }
      if (!loginPassword) {
        setError("كلمة المرور مطلوبة");
        setLoading(false);
        return;
      }
      
      // تحقق خاص لحساب الأدمن
      if (loginPhone === "01005209667" && loginPassword === "Ahmed@010052") {
        // دخول مباشر كأدمن
        const adminUser = {
          id: 'admin-001',
          name: 'أحمد - مدير المنصة',
          email: 'admin@platform.com',
          phone: '01005209667',
          role: 'admin',
          avatar: '/admin-avatar.png'
        };
        
        // حفظ بيانات الأدمن
        localStorage.setItem('user', JSON.stringify(adminUser));
        localStorage.setItem('token', 'admin-token-' + Date.now());
        localStorage.setItem('userRole', 'admin');
        
        // توجيه مباشر للوحة الأدمن
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 500);
        
        setLoading(false);
        return;
      }
      
      if (loginPassword.length < 8) {
        setError("يجب أن تكون كلمة المرور أطول من 8 أحرف");
        setLoading(false);
        return;
      }

      // حفظ بيانات "تذكرني"
      if (rememberMe) {
        localStorage.setItem("rememberedPhone", loginPhone);
        localStorage.setItem("rememberedPass", loginPassword);
      } else {
        localStorage.removeItem("rememberedPhone");
        localStorage.removeItem("rememberedPass");
      }
      
      // تسجيل الدخول عبر AuthContext
      const result = await loginUser(loginPhone, loginPassword);
      
      if (!result.success) {
        setError(result.error || 'فشل تسجيل الدخول');
        setLoading(false);
      }
      // useEffect سيتولى التوجيه تلقائياً
    } catch (err: any) {
      console.error("Login error:", err);
      const errorMessage = err.response?.data?.message || err.message || 'فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-primary via-purple-600 to-pink-500 flex items-center justify-center p-4 ${cairo.className}`}>
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-900 shadow-2xl rounded-xl p-8 md:p-10"
        >
          <div className="flex justify-center mb-8">
            <Image
              src="/logo.png"
              alt="شعار المنصة"
              width={120}
              height={120}
              className="rounded-full shadow-lg"
            />
          </div>
          <h2 className="text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-3">
            أهلاً بك مجدداً!
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
            سجل الدخول للمتابعة إلى حسابك
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-md"
              role="alert"
            >
              <p className="font-bold">خطأ!</p>
              <p>{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">
                رقم الهاتف
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <FaUser className="text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  className="appearance-none block w-full px-3 py-3.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white pr-10 dir-rtl"
                  placeholder="01XXXXXXXXX"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password-login" className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={loginPassword}
                  onChange={handlePasswordChange}
                  ref={passwordRef}
                  className={`block w-full pr-10 py-3 border ${error ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                  placeholder="**********"
                  dir="ltr"
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  onMouseMove={handleMouseMove}
                  ref={eyeRef}
                  className="absolute inset-y-0 right-0 flex items-center pr-11 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <div className="relative w-10 h-7 flex items-center justify-center">
                    {/* عين واقعية باستخدام SVG */}
                    <svg width="100%" height="100%" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{overflow: 'visible'}}>
                      {/* الشكل الخارجي للعين */}
                      <motion.path
                        d="M98 30C98 30 76.5 55 50 55C23.5 55 2 30 2 30C2 30 23.5 5 50 5C76.5 5 98 30 98 30Z"
                        fill="white" 
                        stroke="#888888" 
                        strokeWidth="2"
                        initial={false}
                        animate={!showPassword ? {scaleY: 0.05, scaleX: 0.95} : {scaleY: 1, scaleX: 1}}
                        transition={{duration: 0.3}}
                        style={{transformOrigin: '50% 50%', filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.2))'}}
                      />
                      
                      {/* القزحية والبؤبؤ */}
                      <motion.g
                        animate={
                          !showPassword 
                            ? { 
                                scale: 0.4, 
                                x: 0, 
                                y: 0 
                              }
                            : {
                                scale: 1,
                                x: calculateEyeRotation(eyeRef, isTyping, passwordRef).x * 0.2,
                                y: calculateEyeRotation(eyeRef, isTyping, passwordRef).y * 0.2
                              }
                        }
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 15
                        }}
                        style={{
                          transformOrigin: '50% 50%',
                          transformBox: 'fill-box'
                        }}
                      >
                        {/* القزحية */}
                        <motion.circle 
                          cx="50" 
                          cy="30" 
                          r="15" 
                          fill="url(#eyeGradient1)"
                          animate={
                            !showPassword 
                              ? { 
                                  scale: 0.4,
                                  x: 0,
                                  y: 0
                                }
                              : {
                                  scale: 1,
                                  x: isTyping 
                                    ? calculateEyeRotation(eyeRef, isTyping, passwordRef).x * 0.1
                                    : 0,
                                  y: isTyping 
                                    ? calculateEyeRotation(eyeRef, isTyping, passwordRef).y * 0.1
                                    : 0
                                }
                          }
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 10
                          }}
                          style={{
                            transformOrigin: '50% 50%',
                            transformBox: 'fill-box'
                          }}
                        />
                        
                        {/* البؤبؤ */}
                        <motion.circle 
                          cx="50" 
                          cy="30" 
                          r="7" 
                          fill="black" 
                          animate={
                            !showPassword 
                              ? { 
                                  scale: 0.4,
                                  x: 0,
                                  y: 0 
                                }
                              : {
                                  scale: 1,
                                  x: isTyping 
                                    ? -5
                                    : calculateEyeRotation(eyeRef, isTyping, passwordRef).x * 0.8,
                                  y: calculateEyeRotation(eyeRef, isTyping, passwordRef).y * 0.8
                                }
                          }
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 10
                          }}
                          style={{
                            transformOrigin: '50% 50%',
                            transformBox: 'fill-box'
                          }}
                        />
                        
                        {/* انعكاس الضوء في البؤبؤ */}
                        <circle cx="47" cy="27" r="2" fill="white" opacity="0.8" />
                        <circle cx="52" cy="33" r="1" fill="white" opacity="0.3" />
                      </motion.g>
                      
                      {/* انعكاس ضوء في بياض العين */}
                      <ellipse cx="30" cy="20" rx="5" ry="2" fill="white" opacity="0.5" />
                      
                      {/* تدرج للقزحية */}
                      <defs>
                        <motion.radialGradient 
                          id="eyeGradient1" 
                          cx="0.5" 
                          cy="0.5" 
                          r="0.5" 
                          fx="0.7" 
                          fy="0.3"
                          animate={
                            !showPassword 
                              ? { 
                                  scale: 0.4,
                                  x: 0,
                                  y: 0
                                }
                              : {
                                  scale: 1,
                                  x: isTyping ? -2 : 0,
                                  y: isTyping ? -2 : 0
                                }
                          }
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 10
                          }}
                          style={{
                            transformOrigin: '50% 50%'
                          }}
                        >
                          <stop offset="0%" stopColor="#6b5b2b" />
                          <stop offset="70%" stopColor="#8a7430" />
                          <stop offset="100%" stopColor="#573f17" />
                        </motion.radialGradient>
                      </defs>
                      
                      {/* الجفن العلوي */}
                      <motion.path
                        d="M5 30C5 30 26.5 6 50 6C73.5 6 95 30 95 30"
                        fill="none"
                        stroke="#666666"
                        strokeWidth="10"
                        strokeLinecap="round"
                        initial={false}
                        animate={
                          !showPassword 
                            ? {d: "M5 30C5 30 26.5 31 50 31C73.5 31 95 30 95 30"} 
                            : {d: "M5 20C5 20 26.5 -5 50 -5C73.5 -5 95 20 95 20"}
                        }
                        transition={{type: "spring", stiffness: 150, damping: 15}}
                        style={{transformOrigin: '50% 50%'}}
                      />
                      
                      {/* الجفن السفلي */}
                    </svg>
                  </div>
                </motion.button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-500 rounded ml-2"
                />
                <label htmlFor="remember-me" className="text-sm text-gray-700 dark:text-gray-300">
                  تذكرني
                </label>
              </div>
              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-primary hover:text-primary-dark dark:text-indigo-400 dark:hover:text-indigo-300">
                  نسيت كلمة المرور؟
                </Link>
              </div>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    أو تسجيل الدخول باستخدام
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <Link href="/forgot-password" className="font-medium text-primary hover:text-primary-dark dark:text-indigo-400 dark:hover:text-indigo-300">
                  نسيت كلمة المرور؟
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !loginPhone || !loginPassword}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all font-bold text-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'تسجيل الدخول'
                )}
              </button>
            </div>

            <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                <Link href="/forgot-password" className="font-medium text-primary hover:text-primary-dark dark:text-indigo-400 dark:hover:text-indigo-300">
                  نسيت كلمة المرور؟
                </Link>
              </div>

              <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4">
                ليس لديك حساب؟{" "}
                <Link href="/register" className="font-medium text-primary hover:text-primary-dark dark:text-indigo-400 dark:hover:text-indigo-300">
                  سجل الآن
                </Link>
              </div>


          </form>
        </motion.div>
      </div>
    </div>
  );
}