"use client";

import { useState, useEffect, useRef } from 'react';
import { hashPassword, validatePasswordStrength } from '@/lib/security/password-utils';
import { apiLimiter } from '@/lib/security/rate-limiter';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaPhone, FaGoogle, FaFacebook, FaTwitter, FaCheckCircle, FaSchool, FaMapMarkerAlt } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { Cairo } from 'next/font/google';
import supabase from '@/lib/supabase-client';

const cairo = Cairo({ 
  subsets: ['arabic'], 
  weight: ['400', '600', '700'],
  display: 'swap'
});

// مكون وسيط لإدخال رقم الهاتف
const PhoneInput = ({ 
  id, 
  value, 
  onChange, 
  placeholder, 
  error, 
  required = false, 
  label,
  highlightStyle = false
}: { 
  id: string; 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  placeholder: string;
  error?: string;
  required?: boolean;
  label: string;
  highlightStyle?: boolean;
}) => {
  return (
    <div className="mb-6">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <FaPhone className="text-gray-400" />
        </div>
        <input
          id={id}
          name={id}
          type="tel"
          required={required}
          value={value}
          onChange={onChange}
          className={`block w-full pr-10 py-3 border ${
            error ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
          } rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
          placeholder={placeholder}
          dir="ltr"
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};


const RegisterPage = () => {
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [email, setEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [motherPhone, setMotherPhone] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [city, setCity] = useState('القاهرة');
  const [gradeLevel, setGradeLevel] = useState('الصف الثالث الثانوي');
  const [guardianJob, setGuardianJob] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [passwordLength, setPasswordLength] = useState(0);
  const [typingEffect, setTypingEffect] = useState(0);
  const eyeRef1 = useRef<HTMLDivElement | null>(null);
  const eyeRef2 = useRef<HTMLDivElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement | null>(null);

  // إعادة توجيه المستخدم إذا كان مسجل الدخول بالفعل
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  // تتبع حركة الماوس
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  // تحديث طول كلمة المرور عند تغييرها
  useEffect(() => {
    setPasswordLength(password.length);
  }, [password]);
  
  // تفعيل تأثير الكتابة عند كتابة كلمة المرور
  useEffect(() => {
    if (passwordFocused || password.length > 0) {
      setTypingEffect(prev => prev + 1);
    }
  }, [password, passwordFocused]);
  
  useEffect(() => {
    if (confirmPasswordFocused || confirmPassword.length > 0) {
      setTypingEffect(prev => prev + 1);
    }
  }, [confirmPassword, confirmPasswordFocused]);
  
  // حساب زاوية نظر العين
  const calculateEyeRotation = (eyeRef: React.RefObject<HTMLDivElement | null>, isFocused: boolean, inputRef: React.RefObject<HTMLInputElement | null>, isPassword: boolean = false) => {
    if (!eyeRef.current) return { x: 0, y: 0 };
    
    // إذا كان الحقل مركّزًا، اجعل العين تنظر إليه وتحديدًا إلى يسار الحقل (حيث النص)
    if (isFocused && inputRef.current) {
      const eye = eyeRef.current.getBoundingClientRect();
      const input = inputRef.current.getBoundingClientRect();
      
      const eyeCenterX = eye.left + eye.width / 2;
      const eyeCenterY = eye.top + eye.height / 2;
      
      // ننظر للجزء الأيسر من الحقل (حيث يبدأ النص)
      const inputLeftX = input.left + 20; // نظرة للجهة اليسرى من الحقل
      const inputCenterY = input.top + input.height / 2;
      
      // الاتجاه من العين إلى الهدف
      const deltaX = inputLeftX - eyeCenterX;
      const deltaY = inputCenterY - eyeCenterY;
      
      // حساب المسافة والاتجاه المعياري
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const normalizedDeltaX = deltaX / (distance || 1);
      const normalizedDeltaY = deltaY / (distance || 1);
      
      // نضبط حدود حركة العين
      const maxMovement = 3;
      const moveX = normalizedDeltaX * Math.min(maxMovement, distance / 20);
      
      // إضافة حركة طفيفة عمودية عند الكتابة
      let moveY = normalizedDeltaY * Math.min(maxMovement, distance / 20);
      
      // إذا كان حقل كلمة مرور ويتم الكتابة، نضيف حركة للأعلى والأسفل
      if (isPassword) {
        // حركة طفيفة للأعلى والأسفل أثناء الكتابة
        moveY += Math.sin(typingEffect * 0.5) * 0.7;
      }
      
      return { x: moveX, y: moveY };
    } else {
      // إذا لم يكن الحقل مركّزًا، اتبع الماوس
      const eye = eyeRef.current.getBoundingClientRect();
      const eyeCenterX = eye.left + eye.width / 2;
      const eyeCenterY = eye.top + eye.height / 2;
      
      const deltaX = mousePosition.x - eyeCenterX;
      const deltaY = mousePosition.y - eyeCenterY;
      
      const maxMovement = 2.5; // حركة أصغر
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const normalizedDeltaX = deltaX / (distance || 1);
      const normalizedDeltaY = deltaY / (distance || 1);
      
      const moveX = normalizedDeltaX * Math.min(maxMovement, distance / 15);
      const moveY = normalizedDeltaY * Math.min(maxMovement, distance / 15);
      
      return { x: moveX, y: moveY };
    }
  };

  // التحقق من صحة المدخلات للخطوة الأولى
  const validateStep1 = () => {
    const stepErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      stepErrors.name = 'الاسم مطلوب';
    } else {
      // التحقق من أن الاسم يحتوي على ثلاثة أجزاء على الأقل
      const nameParts = name.trim().split(/\s+/);
      if (nameParts.length < 3) {
        stepErrors.name = 'يجب إدخال الاسم ثلاثي على الأقل (مثال: أحمد محمد محرم)';
      }
    }
    
    if (!fatherName.trim()) {
      stepErrors.fatherName = 'اسم الأب مطلوب';
    } else {
      // التحقق من أن اسم الأب يحتوي على ثلاثة أجزاء على الأقل
      const fatherNameParts = fatherName.trim().split(/\s+/);
      if (fatherNameParts.length < 3) {
        stepErrors.fatherName = 'يجب إدخال اسم الأب ثلاثي على الأقل';
      }
    }
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      stepErrors.email = 'البريد الإلكتروني غير صحيح';
    }
    
    if (!studentPhone.trim()) {
      stepErrors.studentPhone = 'رقم هاتف الطالب مطلوب';
    } else if (!/^01[0125][0-9]{8}$/.test(studentPhone)) {
      stepErrors.studentPhone = 'رقم الهاتف غير صحيح، يجب أن يبدأ بـ 01 ويتكون من 11 رقم';
    }
    
    if (!parentPhone.trim()) {
      stepErrors.parentPhone = 'رقم هاتف ولي الأمر مطلوب';
    } else if (!/^01[0125][0-9]{8}$/.test(parentPhone)) {
      stepErrors.parentPhone = 'رقم الهاتف غير صحيح، يجب أن يبدأ بـ 01 ويتكون من 11 رقم';
    }
    
    // التحقق من أن رقم ولي الأمر مختلف عن رقم الطالب
    if (studentPhone && parentPhone && studentPhone === parentPhone) {
      stepErrors.parentPhone = 'هتصيع علينا؟ مينفعش رقم ولي الأمر نفس رقمك يا بايظ 😂';
    }
    
    if (motherPhone && !/^01[0125][0-9]{8}$/.test(motherPhone)) {
      stepErrors.motherPhone = 'رقم الهاتف غير صحيح، يجب أن يبدأ بـ 01 ويتكون من 11 رقم';
    }
    
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };
  
  // التحقق من صحة المدخلات للخطوة الثانية
  const validateStep2 = () => {
    const stepErrors: Record<string, string> = {};
    
    if (!password) {
      stepErrors.password = 'كلمة المرور مطلوبة';
    } else if (password.length < 8) {
      stepErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    }
    
    if (!confirmPassword) {
      stepErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    } else if (confirmPassword !== password) {
      stepErrors.confirmPassword = 'كلمتا المرور غير متطابقتين';
    }
    
    if (!agreeTerms) {
      stepErrors.agreeTerms = 'يجب الموافقة على الشروط والأحكام';
    }
    
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  // التنقل بين خطوات التسجيل
  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // تحقق من اسم ولي الأمر ورقم هاتفه فقط في الخطوة الثانية
      const stepErrors: Record<string, string> = {};
      
      if (!parentPhone.trim()) {
        stepErrors.parentPhone = 'رقم هاتف ولي الأمر مطلوب';
      } else if (!/^01[0125][0-9]{8}$/.test(parentPhone)) {
        stepErrors.parentPhone = 'رقم الهاتف غير صحيح، يجب أن يبدأ بـ 01 ويتكون من 11 رقم';
      }
      
      setErrors(stepErrors);
      
      if (Object.keys(stepErrors).length === 0) {
        setCurrentStep(3);
      }
    }
  };
  
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };


  // إرسال نموذج التسجيل
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep === 3 && !validateStep2()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    
    try {
      console.log('🔵 التسجيل عبر Supabase مع تشفير آمن...');
      
      // التحقق من قوة كلمة المرور أولاً
      const { isValid, errors: passwordErrors } = validatePasswordStrength(password);
      if (!isValid) {
        setErrors({ password: passwordErrors.join(', ') });
        setIsLoading(false);
        return;
      }
      
      // تشفير كلمة المرور باستخدام bcrypt
      const hashedPassword = await hashPassword(password);
      
      // التحقق من وجود المستخدم
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.${email || `${studentPhone}@student.com`},phone.eq.${studentPhone}`)
        .single();
      
      if (existingUser) {
        setErrors({ general: 'رقم الهاتف أو البريد الإلكتروني مسجل مسبقاً' });
        setIsLoading(false);
        return;
      }
      
      // إنشاء المستخدم الجديد
      const fullName = `${name} ${fatherName}`;
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          name: fullName,
          email: email || `${studentPhone}@student.com`,
          phone: studentPhone,
          password_hash: hashedPassword, // استخدام كلمة المرور المشفرة بـ bcrypt
          role: 'student',
          // بيانات إضافية
          father_name: fatherName,
          student_phone: studentPhone,
          parent_phone: parentPhone,
          mother_phone: motherPhone || null,
          school_name: schoolName || null,
          city: city || 'القاهرة',
          grade_level: gradeLevel || 'الصف الثالث الثانوي',
          guardian_job: guardianJob || null
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('خطأ في التسجيل:', insertError);
        setErrors({ general: insertError.message || 'فشل التسجيل' });
        setIsLoading(false);
        return;
      }
      
      console.log('✅ تم التسجيل بنجاح');
      
      // حفظ بيانات المستخدم الكاملة
      const userData = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        // بيانات إضافية من النموذج
        fatherName: fatherName,
        studentPhone: studentPhone,
        parentPhone: parentPhone,
        motherPhone: motherPhone,
        schoolName: schoolName,
        city: city,
        gradeLevel: gradeLevel,
        guardianJob: guardianJob,
        registrationDate: new Date().toISOString()
      };
      
      // حفظ البيانات في localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('studentInfo', JSON.stringify({
        name: fullName,
        phone: studentPhone,
        email: email || `${studentPhone}@student.com`
      }));
      localStorage.setItem('token', 'supabase-token-' + Date.now());
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userRole', 'student');
      
      // إظهار رسالة ترحيب
      console.log('✅ تم التسجيل بنجاح! مرحباً', fullName);
      
      // التوجيه إلى الصفحة الرئيسية
      setTimeout(() => {
        router.push('/');
      }, 500);
      
    } catch (err: any) {
      console.error('🔴 خطأ في التسجيل:', err);
      setErrors({ 
        general: err.message || 'حدث خطأ في التسجيل'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // مكون مؤشر التقدم
  const ProgressIndicator = () => {
    return (
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center">
          <motion.div
            animate={{ 
              backgroundColor: currentStep >= 1 ? '#6d28d9' : '#e5e7eb',
              borderColor: currentStep >= 1 ? '#6d28d9' : '#e5e7eb',
              color: currentStep >= 1 ? '#ffffff' : '#9ca3af'
            }}
            className="flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium z-10"
          >
            {currentStep > 1 ? <FaCheckCircle /> : 1}
          </motion.div>
          <div className="w-16 h-1 mx-2 bg-gray-200 dark:bg-gray-700">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: currentStep > 1 ? '100%' : '0%' }}
              className="h-full bg-primary"
            />
          </div>
          <motion.div
            animate={{ 
              backgroundColor: currentStep >= 2 ? '#6d28d9' : '#e5e7eb',
              borderColor: currentStep >= 2 ? '#6d28d9' : '#e5e7eb',
              color: currentStep >= 2 ? '#ffffff' : '#9ca3af'
            }}
            className="flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium"
          >
            {currentStep > 2 ? <FaCheckCircle /> : 2}
          </motion.div>
          <div className="w-16 h-1 mx-2 bg-gray-200 dark:bg-gray-700">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: currentStep > 2 ? '100%' : '0%' }}
              className="h-full bg-primary"
            />
          </div>
          <motion.div
            animate={{ 
              backgroundColor: currentStep >= 3 ? '#6d28d9' : '#e5e7eb',
              borderColor: currentStep >= 3 ? '#6d28d9' : '#e5e7eb',
              color: currentStep >= 3 ? '#ffffff' : '#9ca3af'
            }}
            className="flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium"
          >
            3
          </motion.div>
        </div>
      </div>
    );
  };

  // قائمة محافظات مصر
  const egyptGovernorates = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة', 'الفيوم',
    'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية', 'الوادي الجديد',
    'السويس', 'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط', 'الشرقية',
    'جنوب سيناء', 'كفر الشيخ', 'مطروح', 'الأقصر', 'قنا', 'شمال سيناء', 'سوهاج'
  ];

  // قائمة المراحل الدراسية
  const educationalLevels = [
    // المرحلة الإعدادية
    'الصف الأول الإعدادي',
    'الصف الثاني الإعدادي',
    'الصف الثالث الإعدادي',
    // المرحلة الثانوية
    'الصف الأول الثانوي',
    'الصف الثاني الثانوي',
    'الصف الثالث الثانوي'
  ];

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 ${cairo.className}`}>
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/30 to-gray-900 opacity-80" />
      </div>
      
      <div className="w-full max-w-5xl">
        <div className="flex flex-col md:flex-row bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* الجانب الأيسر - صورة وشعار */}
          <div className="w-full md:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 relative p-8 hidden md:block">
            <div className="absolute inset-0 opacity-10">
              <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="url(#grid-pattern)" />
              </svg>
              <defs>
                <pattern id="grid-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M0,0 L10,0 L10,10 L0,10 Z" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
            </div>
            
            <div className="relative h-full flex flex-col justify-between">
              <div className="mb-8">
            <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center gap-3"
                >
                  <div className="relative w-12 h-12 overflow-hidden">
              <Image
                src="/logo.png"
                      alt="شعار المنصة"
                      fill
                      sizes="48px"
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <div className={`text-white text-2xl font-bold ${cairo.className}`} style={{ letterSpacing: '0.5px' }}>المستقبل</div>
                    <div className="text-white/80 text-sm">منصة تعليمية متكاملة</div>
                  </div>
                </motion.div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <h1 className="text-white text-3xl font-bold mb-4">انضم إلينا اليوم!</h1>
                <p className="text-white/80 mb-8">
                  ابدأ رحلة التعلم مع منصة <span className="font-bold text-white">المستقبل</span> واكتسب المهارات التي تحتاجها لتطوير مستقبلك المهني.
                </p>
                
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
                  <div className="text-white font-medium mb-3">مزايا العضوية</div>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-white/80 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                      <span>وصول غير محدود لجميع الدورات التعليمية</span>
                    </li>
                    <li className="flex items-center gap-2 text-white/80 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                      <span>شهادات معتمدة بعد إكمال الدورات</span>
                    </li>
                    <li className="flex items-center gap-2 text-white/80 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                      <span>دعم فني على مدار الساعة</span>
                    </li>
                    <li className="flex items-center gap-2 text-white/80 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                      <span>مجتمع تعليمي نشط ومتفاعل</span>
                    </li>
                  </ul>
                </div>
            </motion.div>
            
              <div className="mt-auto">
                <div className="text-white/60 text-sm">© 2024 منصة المستقبل التعليمية. جميع الحقوق محفوظة.</div>
              </div>
            </div>
          </div>

          {/* الجانب الأيمن - نموذج التسجيل */}
          <div className="w-full md:w-1/2 p-8 md:p-12 bg-white dark:bg-gray-900">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-md mx-auto"
            >
              <div className="text-center mb-6">
                <h2 className={`text-2xl font-bold text-gray-800 dark:text-white mb-2 ${cairo.className}`}>إنشاء حساب جديد</h2>
                <p className="text-gray-500 dark:text-gray-400">أدخل بياناتك لإنشاء حساب جديد</p>
              </div>
              
              <ProgressIndicator />
              
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-3 rounded-lg mb-6 text-sm">
                الرجاء إكمال المعلومات المطلوبة في كل خطوة. ستقوم بإدخال معلومات ولي الأمر في الخطوة الثانية.
              </div>
              
              {errors.general && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-6 text-sm"
                >
                  <div dangerouslySetInnerHTML={{ __html: errors.general }} />
                  {errors.general.includes('قاعدة البيانات') && (
                    <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-700">
                      <strong className="block mb-1">حلول ممكنة:</strong>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>تأكد أن خادم MongoDB يعمل على الخادم.</li>
                        <li>تحقق من سلسلة الاتصال في ملف .env.</li>
                        <li>اتصل بمسؤول النظام للتحقق من حالة قاعدة البيانات.</li>
                        <li>يمكنك تشغيل التطبيق في وضع "الاختبار المحلي" من خلال تعديل قيمة المتغير <code>useOfflineDebugMode</code> للقيمة <code>true</code>.</li>
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
              
              <form onSubmit={handleSubmit}>
                {currentStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* الخطوة الأولى: معلومات الطالب الأساسية */}
                    <div className="mb-6">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        الاسم الكامل
                      </label>
                  <div className="relative">
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <FaUser className="text-gray-400" />
                    </div>
                    <input
                          id="name"
                          name="name"
                      type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={`block w-full pr-10 py-3 border ${errors.name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                          placeholder="أدخل اسمك الكامل"
                    />
                  </div>
                      {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
                </div>

                    <div className="mb-6">
                      <label htmlFor="fatherName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        اسم الأب
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <FaUser className="text-gray-400" />
                        </div>
                        <input
                          id="fatherName"
                          name="fatherName"
                          type="text"
                          required
                          value={fatherName}
                          onChange={(e) => setFatherName(e.target.value)}
                          className={`block w-full pr-10 py-3 border ${errors.fatherName ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                          placeholder="أدخل اسم الأب"
                        />
                      </div>
                      {errors.fatherName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fatherName}</p>}
                    </div>

                    <div className="mb-6">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        البريد الإلكتروني (اختياري)
                      </label>
                  <div className="relative">
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <FaEnvelope className="text-gray-400" />
                    </div>
                    <input
                          id="email"
                          name="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`block w-full pr-10 py-3 border ${errors.email ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                          placeholder="example@email.com"
                          dir="ltr"
                    />
                  </div>
                      {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
                </div>

                    <div className="mb-6">
                      <label htmlFor="studentPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        رقم هاتف الطالب
                      </label>
                  <div className="relative">
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <FaPhone className="text-gray-400" />
                    </div>
                    <input
                          id="studentPhone"
                          name="studentPhone"
                          type="tel"
                          required
                          value={studentPhone}
                          onChange={(e) => setStudentPhone(e.target.value)}
                          className={`block w-full pr-10 py-3 border ${errors.studentPhone ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                          placeholder="01xxxxxxxxx"
                          dir="ltr"
                    />
                  </div>
                      {errors.studentPhone && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.studentPhone}</p>}
                    </div>

                    <PhoneInput
                      id="parentPhone"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      placeholder="01xxxxxxxxx"
                      error={errors.parentPhone}
                      required={true}
                      label="رقم هاتف ولي الأمر"
                      highlightStyle={false}
                    />

                    <div className="mb-6 text-xs text-gray-500 dark:text-gray-400 -mt-4 text-right">
                      <span className="text-orange-500">*</span> يجب أن يكون رقم هاتف ولي الأمر مختلفًا عن رقم هاتف الطالب
                </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleNextStep}
                      className="w-full py-3 px-2 md:px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 md:text-base text-sm shadow-lg hover:shadow-xl active:translate-y-0.5 touch-manipulation"
                      style={{ fontSize: '14px', fontWeight: 'bold' }}
                    >
                      <span className="flex items-center justify-center">التالي &#8594;</span>
                    </motion.button>
                  </motion.div>
                )}
                
                {currentStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* الخطوة الثانية: معلومات الأسرة والمدرسة */}
                    <div className="mb-6">
                      <label htmlFor="motherPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        رقم هاتف الأم (اختياري)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <FaPhone className="text-gray-400" />
                        </div>
                        <input
                          id="motherPhone"
                          name="motherPhone"
                          type="tel"
                          value={motherPhone}
                          onChange={(e) => setMotherPhone(e.target.value)}
                          className={`block w-full pr-10 py-3 border ${errors.motherPhone ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                          placeholder="01xxxxxxxxx"
                          dir="ltr"
                        />
                      </div>
                      {errors.motherPhone && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.motherPhone}</p>}
                    </div>

                    <div className="mb-6">
                      <label htmlFor="guardianJob" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        وظيفة ولي الأمر (اختياري)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <FaUser className="text-gray-400" />
                        </div>
                        <input
                          id="guardianJob"
                          name="guardianJob"
                          type="text"
                          value={guardianJob}
                          onChange={(e) => setGuardianJob(e.target.value)}
                          className={`block w-full pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                          placeholder="أدخل وظيفة ولي الأمر"
                        />
                      </div>
                    </div>

                    <div className="mb-6">
                      <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        اسم المدرسة
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <FaSchool className="text-gray-400" />
                        </div>
                        <input
                          id="schoolName"
                          name="schoolName"
                          type="text"
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          className={`block w-full pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                          placeholder="أدخل اسم المدرسة"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          المحافظة
                        </label>
                        <select
                          id="city"
                          name="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="block w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        >
                          {egyptGovernorates.map((governorate) => (
                            <option key={governorate} value={governorate}>
                              {governorate}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          الصف الدراسي
                        </label>
                        <select
                          id="gradeLevel"
                          name="gradeLevel"
                          value={gradeLevel}
                          onChange={(e) => setGradeLevel(e.target.value)}
                          className="block w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        >
                          {educationalLevels.map((level) => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-3 mb-6">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={handlePrevStep}
                        className="w-1/3 py-3 px-2 md:px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 md:text-base text-sm shadow-md hover:shadow-lg active:translate-y-0.5 flex items-center justify-center touch-manipulation"
                        style={{ fontSize: '14px', fontWeight: 'bold' }}
                      >
                        <span className="flex items-center justify-center">&#8592; السابق</span>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={handleNextStep}
                        className="w-2/3 py-3 px-2 md:px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 md:text-base text-sm shadow-lg hover:shadow-xl active:translate-y-0.5 touch-manipulation"
                        style={{ fontSize: '14px', fontWeight: 'bold' }}
                      >
                        <span className="flex items-center justify-center">التالي &#8594;</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
                
                {currentStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* الخطوة الثالثة: كلمة المرور والأمان */}
                    <div className="mb-6">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        كلمة المرور
                      </label>
                  <div className="relative">
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <FaLock className="text-gray-400" />
                    </div>
                    <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setPasswordFocused(true)}
                          onBlur={() => setPasswordFocused(false)}
                          ref={passwordInputRef}
                          className={`block w-full pr-10 py-3 border ${errors.password ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                          placeholder="**********"
                          dir="ltr"
                        />
                        <motion.button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-11 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <div 
                            ref={eyeRef1}
                            className="relative w-10 h-7 flex items-center justify-center"
                          >
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
                                    : (passwordFocused 
                                      ? {d: "M5 20C5 20 26.5 -5 50 -5C73.5 -5 95 20 95 20"} 
                                      : {d: "M5 10C5 10 26.5 -15 50 -15C73.5 -15 95 10 95 10"})
                                }
                                transition={{type: "spring", stiffness: 150, damping: 15}}
                                style={{transformOrigin: '50% 50%'}}
                              />
                              
                              {/* الجفن السفلي */}
                              <motion.path
                                d="M5 30C5 30 26.5 55 50 55C73.5 55 95 30 95 30"
                                fill="none"
                                stroke="#666666"
                                strokeWidth="10"
                                strokeLinecap="round"
                                initial={false}
                                animate={
                                  !showPassword 
                                    ? {d: "M5 30C5 30 26.5 29 50 29C73.5 29 95 30 95 30"} 
                                    : (passwordFocused 
                                      ? {d: "M5 40C5 40 26.5 60 50 60C73.5 60 95 40 95 40"} 
                                      : {d: "M5 50C5 50 26.5 68 50 68C73.5 68 95 50 95 50"})
                                }
                                transition={{type: "spring", stiffness: 150, damping: 15}}
                                style={{transformOrigin: '50% 50%'}}
                              />
                              
                              {/* القزحية والبؤبؤ */}
                              <motion.g
                                animate={showPassword ? {
                                  x: passwordFocused ? 
                                      Math.sin(typingEffect * 0.4) * 8 - 10 : // حركة جانبية مع كل حرف
                                      -10,
                                  y: calculateEyeRotation(eyeRef1, passwordFocused, passwordInputRef, true).y * 3
                                } : {x: 0, y: 0}} // عند إغلاق العين يعود للمنتصف
                                transition={{type: "spring", stiffness: 300, damping: 30}}
                              >
                                {/* القزحية */}
                                <circle 
                                  cx="50" 
                                  cy="30" 
                                  r="15" 
                                  fill="url(#eyeGradient1)" 
                                />
                                
                                {/* البؤبؤ */}
                                <motion.circle 
                                  cx="50" 
                                  cy="30" 
                                  r="7" 
                                  fill="black" 
                                  animate={
                                    !showPassword 
                                      ? { scale: 0.4, x: 0, y: 0 } // عند إغلاق العين يصغر البؤبؤ ويرجع للمركز
                                      : passwordFocused 
                                        ? { 
                                            scale: [1, 1.2, 1],
                                            x: Math.sin(typingEffect * 0.2) * 2, // حركة أفقية خفيفة عند الكتابة
                                            y: Math.cos(typingEffect * 0.3) * 2  // حركة رأسية خفيفة عند الكتابة
                                          }
                                        : { scale: [1, 0.8, 1] }
                                  }
                                  transition={{
                                    duration: passwordFocused ? 0.3 : 2,
                                    repeat: Infinity,
                                    repeatType: "reverse"
                                  }}
                                  style={{transformOrigin: '50px 30px'}}
                                />
                                
                                {/* انعكاس الضوء في البؤبؤ */}
                                <circle cx="47" cy="27" r="2" fill="white" opacity="0.8" />
                                <circle cx="52" cy="33" r="1" fill="white" opacity="0.3" />
                              </motion.g>
                              
                              {/* انعكاس ضوء في بياض العين */}
                              <ellipse cx="30" cy="20" rx="5" ry="2" fill="white" opacity="0.5" />
                              
                              {/* تدرج للقزحية */}
                              <defs>
                                <radialGradient id="eyeGradient1" cx="0.5" cy="0.5" r="0.5" fx="0.7" fy="0.3">
                                  <stop offset="0%" stopColor="#6b5b2b" />
                                  <stop offset="70%" stopColor="#8a7430" />
                                  <stop offset="100%" stopColor="#573f17" />
                                </radialGradient>
                              </defs>
                            </svg>
                          </div>
                        </motion.button>
                  </div>
                      {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل
                      </p>
                </div>

                    <div className="mb-6">
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        تأكيد كلمة المرور
                      </label>
                  <div className="relative">
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <FaLock className="text-gray-400" />
                        </div>
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          onFocus={() => setConfirmPasswordFocused(true)}
                          onBlur={() => setConfirmPasswordFocused(false)}
                          ref={confirmPasswordInputRef}
                          className={`block w-full pr-10 py-3 border ${errors.confirmPassword ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                          placeholder="**********"
                          dir="ltr"
                        />
                        <motion.button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-11 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <div
                            ref={eyeRef2} 
                            className="relative w-10 h-7 flex items-center justify-center"
                          >
                            {/* عين واقعية باستخدام SVG */}
                            <svg width="100%" height="100%" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{overflow: 'visible'}}>
                              {/* الشكل الخارجي للعين */}
                              <motion.path
                                d="M98 30C98 30 76.5 55 50 55C23.5 55 2 30 2 30C2 30 23.5 5 50 5C76.5 5 98 30 98 30Z"
                                fill="white" 
                                stroke="#888888" 
                                strokeWidth="2"
                                initial={false}
                                animate={!showConfirmPassword ? {scaleY: 0.05, scaleX: 0.95} : {scaleY: 1, scaleX: 1}}
                                transition={{duration: 0.3}}
                                style={{transformOrigin: '50% 50%', filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.2))'}}
                              />
                              
                              {/* الجفن العلوي */}
                              <motion.path
                                d="M5 30C5 30 26.5 6 50 6C73.5 6 95 30 95 30"
                                fill="none"
                                stroke="#666666"
                                strokeWidth="10"
                                strokeLinecap="round"
                                initial={false}
                                animate={
                                  !showConfirmPassword 
                                    ? {d: "M5 30C5 30 26.5 31 50 31C73.5 31 95 30 95 30"} 
                                    : (confirmPasswordFocused 
                                      ? {d: "M5 20C5 20 26.5 -5 50 -5C73.5 -5 95 20 95 20"} 
                                      : {d: "M5 10C5 10 26.5 -15 50 -15C73.5 -15 95 10 95 10"})
                                }
                                transition={{type: "spring", stiffness: 150, damping: 15}}
                                style={{transformOrigin: '50% 50%'}}
                              />
                              
                              {/* الجفن السفلي */}
                              <motion.path
                                d="M5 30C5 30 26.5 55 50 55C73.5 55 95 30 95 30"
                                fill="none"
                                stroke="#666666"
                                strokeWidth="10"
                                strokeLinecap="round"
                                initial={false}
                                animate={
                                  !showConfirmPassword 
                                    ? {d: "M5 30C5 30 26.5 29 50 29C73.5 29 95 30 95 30"} 
                                    : (confirmPasswordFocused 
                                      ? {d: "M5 40C5 40 26.5 60 50 60C73.5 60 95 40 95 40"} 
                                      : {d: "M5 50C5 50 26.5 68 50 68C73.5 68 95 50 95 50"})
                                }
                                transition={{type: "spring", stiffness: 150, damping: 15}}
                                style={{transformOrigin: '50% 50%'}}
                              />
                              
                              {/* القزحية والبؤبؤ */}
                              <motion.g
                                animate={showConfirmPassword ? {
                                  x: confirmPasswordFocused ? 
                                      Math.sin(typingEffect * 0.4) * 8 - 10 : // حركة جانبية مع كل حرف
                                      -10,
                                  y: calculateEyeRotation(eyeRef2, confirmPasswordFocused, confirmPasswordInputRef, true).y * 3
                                } : {x: 0, y: 0}} // عند إغلاق العين يعود للمنتصف
                                transition={{type: "spring", stiffness: 300, damping: 30}}
                              >
                                {/* القزحية */}
                                <circle 
                                  cx="50" 
                                  cy="30" 
                                  r="15" 
                                  fill="url(#eyeGradient2)" 
                                />
                                
                                {/* البؤبؤ */}
                                <motion.circle 
                                  cx="50" 
                                  cy="30" 
                                  r="7" 
                                  fill="black" 
                                  animate={
                                    !showConfirmPassword 
                                      ? { scale: 0.4, x: 0, y: 0 } // عند إغلاق العين يصغر البؤبؤ ويرجع للمركز
                                      : confirmPasswordFocused 
                                        ? { 
                                            scale: [1, 1.2, 1],
                                            x: Math.sin(typingEffect * 0.2) * 2, // حركة أفقية خفيفة عند الكتابة
                                            y: Math.cos(typingEffect * 0.3) * 2  // حركة رأسية خفيفة عند الكتابة
                                          }
                                        : { scale: [1, 0.8, 1] }
                                  }
                                  transition={{
                                    duration: confirmPasswordFocused ? 0.3 : 2,
                                    repeat: Infinity,
                                    repeatType: "reverse"
                                  }}
                                  style={{transformOrigin: '50px 30px'}}
                                />
                                
                                {/* انعكاس الضوء في البؤبؤ */}
                                <circle cx="47" cy="27" r="2" fill="white" opacity="0.8" />
                                <circle cx="52" cy="33" r="1" fill="white" opacity="0.3" />
                              </motion.g>
                              
                              {/* انعكاس ضوء في بياض العين */}
                              <ellipse cx="30" cy="20" rx="5" ry="2" fill="white" opacity="0.5" />
                              
                              {/* تدرج للقزحية */}
                              <defs>
                                <radialGradient id="eyeGradient2" cx="0.5" cy="0.5" r="0.5" fx="0.7" fy="0.3">
                                  <stop offset="0%" stopColor="#6b5b2b" />
                                  <stop offset="70%" stopColor="#8a7430" />
                                  <stop offset="100%" stopColor="#573f17" />
                                </radialGradient>
                              </defs>
                            </svg>
                          </div>
                        </motion.button>
                      </div>
                      {errors.confirmPassword && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>}
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                    <input
                            id="agreeTerms"
                            name="agreeTerms"
                            type="checkbox"
                            checked={agreeTerms}
                            onChange={(e) => setAgreeTerms(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:bg-gray-700"
                    />
                  </div>
                        <div className="mr-3 text-sm">
                          <label htmlFor="agreeTerms" className="text-gray-600 dark:text-gray-300">
                            أوافق على <Link href="/terms" className="text-indigo-600 hover:underline">الشروط والأحكام</Link> و <Link href="/privacy" className="text-indigo-600 hover:underline">سياسة الخصوصية</Link>
                          </label>
                </div>
                  </div>
                      {errors.agreeTerms && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.agreeTerms}</p>}
                </div>

                    <div className="flex gap-3 mb-6">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={handlePrevStep}
                        className="w-1/3 py-3 px-2 md:px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 md:text-base text-sm shadow-md hover:shadow-lg active:translate-y-0.5 flex items-center justify-center touch-manipulation"
                        style={{ fontSize: '14px', fontWeight: 'bold' }}
                      >
                        <span className="flex items-center justify-center">&#8592; السابق</span>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    type="submit"
                        disabled={isLoading}
                        className="w-2/3 py-3 px-2 md:px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center md:text-base text-sm shadow-lg hover:shadow-xl active:translate-y-0.5 touch-manipulation"
                        style={{ fontSize: '14px', fontWeight: 'bold' }}
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="whitespace-nowrap text-sm">جاري التسجيل...</span>
                          </>
                    ) : (
                          <span className="flex items-center justify-center whitespace-nowrap text-base md:text-lg font-bold">
                            إنشاء حساب
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 rtl:ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </span>
                    )}
                      </motion.button>
                </div>
                  </motion.div>
                )}
              </form>
              
              <div className="my-6 flex items-center">
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
                <div className="px-3 text-sm text-gray-500 dark:text-gray-400">أو</div>
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  className="flex items-center justify-center py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm hover:shadow-md active:translate-y-0.5"
                >
                  <FaGoogle className="text-red-500" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  className="flex items-center justify-center py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm hover:shadow-md active:translate-y-0.5"
                >
                  <FaFacebook className="text-blue-600" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  className="flex items-center justify-center py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm hover:shadow-md active:translate-y-0.5"
                >
                  <FaTwitter className="text-blue-400" />
                </motion.button>
              </div>
              
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  لديك حساب بالفعل؟{' '}
                  <Link href="/login" 
                    className="font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors duration-150 py-2 px-4 rounded-lg shadow-md hover:shadow-lg active:translate-y-0.5 inline-flex items-center justify-center touch-manipulation"
                  >
                    <span className="text-sm font-bold">تسجيل الدخول</span>
                  </Link>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 