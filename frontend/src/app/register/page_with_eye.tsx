"use client";

import React, { useState, useRef } from 'react';
import supabase from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { motion } from "framer-motion";
import { FaUser, FaPhone, FaEnvelope, FaLock, FaMapMarkerAlt, FaGraduationCap } from "react-icons/fa";
import Image from 'next/image';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<any>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const eyeRef = useRef<HTMLButtonElement>(null);
  const eyeRef2 = useRef<HTMLButtonElement>(null);
  
  // بيانات النموذج
  const [name, setName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [motherPhone, setMotherPhone] = useState('');
  const [email, setEmail] = useState('');
  const [guardianJob, setGuardianJob] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [city, setCity] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // تحريك العين
  const handleMouseMove = (e: React.MouseEvent) => {
    if (eyeRef.current) {
      const rect = eyeRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left - rect.width / 2) / rect.width) * 20;
      const y = ((e.clientY - rect.top - rect.height / 2) / rect.height) * 20;
      setMousePosition({ x, y });
    }
  };

  // التحقق من صحة البيانات
  const validateStep1 = () => {
    const newErrors: any = {};
    
    if (!name) newErrors.name = 'الاسم مطلوب';
    if (!studentPhone) newErrors.studentPhone = 'رقم هاتف الطالب مطلوب';
    if (!parentPhone) newErrors.parentPhone = 'رقم هاتف ولي الأمر مطلوب';
    if (!city) newErrors.city = 'المدينة مطلوبة';
    if (!gradeLevel) newErrors.gradeLevel = 'المرحلة الدراسية مطلوبة';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateStep2 = () => {
    const newErrors: any = {};
    
    if (!password) newErrors.password = 'كلمة المرور مطلوبة';
    if (password.length < 8) newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    if (password !== confirmPassword) newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
      return;
    }
    
    if (!validateStep2()) {
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      console.log('🔵 التسجيل عبر Supabase...');
      
      
      // استخدام عميل Supabase الموحد لتجنب تحذيرات التخزين المتزامن
      
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
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          name: name,
          email: email || `${studentPhone}@student.com`,
          phone: studentPhone,
          password: btoa(password), // تشفير بسيط
          role: 'student'
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('خطأ في التسجيل:', insertError);
        setErrors({ general: insertError.message || 'فشل التسجيل' });
        setIsLoading(false);
        return;
      }
      
      console.log('✅ تم التسجيل بنجاح:', newUser);
      
      // حفظ بيانات المستخدم
      const userData = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', 'supabase-token-' + Date.now());
      
      // التوجيه إلى الصفحة الرئيسية
      router.push('/dashboard');
      
    } catch (error: any) {
      console.error('🔴 خطأ في التسجيل:', error);
      setErrors({ general: error.message || 'حدث خطأ في التسجيل' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-md w-full border border-white/20"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="شعار المنصة"
              width={80}
              height={80}
              className="rounded-full"
            />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            إنشاء حساب جديد
          </h2>
          <p className="text-blue-200">انضم إلى منصة المستقبل التعليمية</p>
        </div>
        
        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          <div className={`flex-1 text-center ${currentStep >= 1 ? 'text-cyan-300' : 'text-gray-500'}`}>
            <div className={`w-10 h-10 mx-auto rounded-full ${currentStep >= 1 ? 'bg-gradient-to-r from-cyan-400 to-blue-500' : 'bg-gray-600'} text-white flex items-center justify-center font-bold`}>
              1
            </div>
            <span className="text-sm mt-2 text-white/80">البيانات الأساسية</span>
          </div>
          <div className={`flex-1 text-center ${currentStep >= 2 ? 'text-cyan-300' : 'text-gray-500'}`}>
            <div className={`w-10 h-10 mx-auto rounded-full ${currentStep >= 2 ? 'bg-gradient-to-r from-cyan-400 to-blue-500' : 'bg-gray-600'} text-white flex items-center justify-center font-bold`}>
              2
            </div>
            <span className="text-sm mt-2 text-white/80">كلمة المرور</span>
          </div>
        </div>
        
        {errors.general && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-lg mb-4 backdrop-blur"
          >
            {errors.general}
          </motion.div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-white text-sm font-bold mb-2">
                  <FaUser className="inline ml-2" />
                  اسم الطالب
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3 py-2 bg-white/10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-white placeholder-gray-400 ${errors.name ? 'border-red-400' : 'border-white/30'}`}
                  placeholder="أدخل اسم الطالب"
                />
                {errors.name && <p className="text-red-300 text-xs mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <label className="block text-white text-sm font-bold mb-2">
                  <FaPhone className="inline ml-2" />
                  رقم هاتف الطالب
                </label>
                <input
                  type="tel"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  className={`w-full px-3 py-2 bg-white/10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-white placeholder-gray-400 ${errors.studentPhone ? 'border-red-400' : 'border-white/30'}`}
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                />
                {errors.studentPhone && <p className="text-red-300 text-xs mt-1">{errors.studentPhone}</p>}
              </div>
              
              <div>
                <label className="block text-white text-sm font-bold mb-2">
                  <FaPhone className="inline ml-2" />
                  رقم هاتف ولي الأمر
                </label>
                <input
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className={`w-full px-3 py-2 bg-white/10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-white placeholder-gray-400 ${errors.parentPhone ? 'border-red-400' : 'border-white/30'}`}
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                />
                {errors.parentPhone && <p className="text-red-300 text-xs mt-1">{errors.parentPhone}</p>}
              </div>
              
              <div>
                <label className="block text-white text-sm font-bold mb-2">
                  <FaEnvelope className="inline ml-2" />
                  البريد الإلكتروني (اختياري)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-white placeholder-gray-400"
                  placeholder="example@email.com"
                  dir="ltr"
                />
              </div>
              
              <div>
                <label className="block text-white text-sm font-bold mb-2">
                  <FaMapMarkerAlt className="inline ml-2" />
                  المدينة
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={`w-full px-3 py-2 bg-white/10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-white placeholder-gray-400 ${errors.city ? 'border-red-400' : 'border-white/30'}`}
                  placeholder="أدخل المدينة"
                />
                {errors.city && <p className="text-red-300 text-xs mt-1">{errors.city}</p>}
              </div>
              
              <div>
                <label className="block text-white text-sm font-bold mb-2">
                  <FaGraduationCap className="inline ml-2" />
                  المرحلة الدراسية
                </label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className={`w-full px-3 py-2 bg-white/10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-white ${errors.gradeLevel ? 'border-red-400' : 'border-white/30'}`}
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <option value="" className="bg-gray-800 text-white">اختر المرحلة</option>
                  <option value="primary" className="bg-gray-800 text-white">ابتدائي</option>
                  <option value="middle" className="bg-gray-800 text-white">إعدادي</option>
                  <option value="high" className="bg-gray-800 text-white">ثانوي</option>
                  <option value="university" className="bg-gray-800 text-white">جامعي</option>
                </select>
                {errors.gradeLevel && <p className="text-red-300 text-xs mt-1">{errors.gradeLevel}</p>}
              </div>
            </motion.div>
          )}
          
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <div className="relative">
                <label className="block text-white text-sm font-bold mb-2">
                  <FaLock className="inline ml-2" />
                  كلمة المرور
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-3 py-2 bg-white/10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-white placeholder-gray-400 pl-12 ${errors.password ? 'border-red-400' : 'border-white/30'}`}
                  placeholder="أدخل كلمة المرور"
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  onMouseMove={handleMouseMove}
                  ref={eyeRef}
                  className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 hover:text-gray-300 mt-7"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg width="24" height="24" viewBox="0 0 100 100" className="w-6 h-6">
                    {/* العين الخارجية */}
                    <ellipse 
                      cx="50" 
                      cy="50" 
                      rx="45" 
                      ry="25" 
                      fill="white" 
                      stroke="#888888" 
                      strokeWidth="2"
                    />
                    
                    {/* القزحية */}
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="15"
                      fill="#3B82F6"
                      animate={{
                        cx: 50 + mousePosition.x,
                        cy: 50 + mousePosition.y
                      }}
                    />
                    
                    {/* البؤبؤ */}
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="7"
                      fill="black"
                      animate={{
                        cx: 50 + mousePosition.x,
                        cy: 50 + mousePosition.y
                      }}
                    />
                    
                    {/* الجفن */}
                    {!showPassword && (
                      <motion.path
                        d="M5 50 Q50 75 95 50"
                        fill="none"
                        stroke="#888888"
                        strokeWidth="3"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </svg>
                </motion.button>
                {errors.password && <p className="text-red-300 text-xs mt-1">{errors.password}</p>}
              </div>
              
              <div className="relative">
                <label className="block text-white text-sm font-bold mb-2">
                  <FaLock className="inline ml-2" />
                  تأكيد كلمة المرور
                </label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-3 py-2 bg-white/10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-white placeholder-gray-400 pl-12 ${errors.confirmPassword ? 'border-red-400' : 'border-white/30'}`}
                  placeholder="أعد إدخال كلمة المرور"
                />
                <motion.button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  ref={eyeRef2}
                  className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 hover:text-gray-300 mt-7"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg width="24" height="24" viewBox="0 0 100 100" className="w-6 h-6">
                    {/* العين الخارجية */}
                    <ellipse 
                      cx="50" 
                      cy="50" 
                      rx="45" 
                      ry="25" 
                      fill="white" 
                      stroke="#888888" 
                      strokeWidth="2"
                    />
                    
                    {/* القزحية */}
                    <circle
                      cx="50"
                      cy="50"
                      r="15"
                      fill="#3B82F6"
                    />
                    
                    {/* البؤبؤ */}
                    <circle
                      cx="50"
                      cy="50"
                      r="7"
                      fill="black"
                    />
                    
                    {/* الجفن */}
                    {!showConfirmPassword && (
                      <motion.path
                        d="M5 50 Q50 75 95 50"
                        fill="none"
                        stroke="#888888"
                        strokeWidth="3"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </svg>
                </motion.button>
                {errors.confirmPassword && <p className="text-red-300 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            </motion.div>
          )}
          
          <div className="flex justify-between mt-6">
            {currentStep > 1 && (
              <motion.button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="bg-white/20 text-white px-6 py-3 rounded-lg hover:bg-white/30 transition-all duration-300 backdrop-blur border border-white/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                السابق
              </motion.button>
            )}
            
            <motion.button
              type="submit"
              disabled={isLoading}
              className={`${currentStep === 1 ? 'w-full' : 'flex-1 ml-2'} bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 font-bold shadow-lg`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 ml-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  جاري التسجيل...
                </span>
              ) : currentStep === 2 ? 'إنشاء الحساب' : 'التالي'}
            </motion.button>
          </div>
        </form>
        
        <p className="text-center mt-6 text-white/70">
          لديك حساب بالفعل؟{' '}
          <Link href="/login" className="text-cyan-300 hover:text-cyan-200 hover:underline transition-colors">
            تسجيل الدخول
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
