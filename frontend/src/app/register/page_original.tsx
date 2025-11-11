"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FaUser, FaPhone, FaEnvelope, FaLock, FaMapMarkerAlt, FaGraduationCap, FaEye, FaEyeSlash, FaUserTie, FaSchool, FaBriefcase } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<any>({});
  
  // بيانات النموذج - جميع الحقول الأصلية
  const [formData, setFormData] = useState({
    firstName: '',
    secondName: '',
    thirdName: '',
    fourthName: '',
    studentPhone: '',
    parentPhone: '',
    motherPhone: '',
    email: '',
    guardianName: '',
    guardianJob: '',
    schoolName: '',
    city: '',
    gradeLevel: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // مسح الخطأ عند الكتابة
    if (errors[name]) {
      setErrors((prev: any) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: any = {};
    
    // التحقق من الحقول المطلوبة
    if (!formData.firstName) newErrors.firstName = 'الاسم الأول مطلوب';
    if (!formData.secondName) newErrors.secondName = 'الاسم الثاني مطلوب';
    if (!formData.thirdName) newErrors.thirdName = 'الاسم الثالث مطلوب';
    if (!formData.fourthName) newErrors.fourthName = 'الاسم الرابع مطلوب';
    if (!formData.studentPhone) newErrors.studentPhone = 'رقم هاتف الطالب مطلوب';
    if (!formData.parentPhone) newErrors.parentPhone = 'رقم هاتف ولي الأمر مطلوب';
    if (!formData.city) newErrors.city = 'المدينة مطلوبة';
    if (!formData.gradeLevel) newErrors.gradeLevel = 'المرحلة الدراسية مطلوبة';
    if (!formData.password) newErrors.password = 'كلمة المرور مطلوبة';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    
    // التحقق من كلمة المرور
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
    }
    
    // التحقق من رقم الهاتف
    const phoneRegex = /^01[0125][0-9]{8}$/;
    if (formData.studentPhone && !phoneRegex.test(formData.studentPhone)) {
      newErrors.studentPhone = 'رقم الهاتف غير صحيح';
    }
    if (formData.parentPhone && !phoneRegex.test(formData.parentPhone)) {
      newErrors.parentPhone = 'رقم الهاتف غير صحيح';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // استيراد Supabase
      const { createClient } = await import('@supabase/supabase-js');
      const SUPABASE_URL = 'https://wnqifmvgvlmxgswhcwnc.supabase.co';
      const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWlmbXZndmxteGdzd2hjd25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MzYwNTUsImV4cCI6MjA3ODAxMjA1NX0.LqWhTZYmr7nu-dIy2uBBqntOxoWM-waluYIR9bipC9M';
      
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      
      // التحقق من وجود المستخدم
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.${formData.email || `${formData.studentPhone}@student.com`},phone.eq.${formData.studentPhone}`)
        .single();
      
      if (existingUser) {
        setErrors({ general: 'رقم الهاتف أو البريد الإلكتروني مسجل مسبقاً' });
        setIsLoading(false);
        return;
      }
      
      // إنشاء المستخدم الجديد
      const fullName = `${formData.firstName} ${formData.secondName} ${formData.thirdName} ${formData.fourthName}`;
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          name: fullName,
          email: formData.email || `${formData.studentPhone}@student.com`,
          phone: formData.studentPhone,
          password: btoa(formData.password), // تشفير بسيط
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
      
      console.log('✅ تم التسجيل بنجاح');
      
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
      console.error('خطأ في التسجيل:', error);
      setErrors({ general: error.message || 'حدث خطأ في التسجيل' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="/logo.png"
                alt="شعار المنصة"
                width={100}
                height={100}
                className="rounded-full bg-white p-2"
              />
            </div>
            <h1 className="text-4xl font-bold mb-2">منصة المستقبل التعليمية</h1>
            <p className="text-xl">إنشاء حساب جديد</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8">
            {errors.general && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                {errors.general}
              </div>
            )}

            {/* الأسماء الأربعة */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FaUser className="ml-2 text-blue-600" />
                الاسم الرباعي
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    الاسم الأول
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="محمد"
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    الاسم الثاني
                  </label>
                  <input
                    type="text"
                    name="secondName"
                    value={formData.secondName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.secondName ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="أحمد"
                  />
                  {errors.secondName && <p className="text-red-500 text-xs mt-1">{errors.secondName}</p>}
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    الاسم الثالث
                  </label>
                  <input
                    type="text"
                    name="thirdName"
                    value={formData.thirdName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.thirdName ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="علي"
                  />
                  {errors.thirdName && <p className="text-red-500 text-xs mt-1">{errors.thirdName}</p>}
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    الاسم الرابع
                  </label>
                  <input
                    type="text"
                    name="fourthName"
                    value={formData.fourthName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.fourthName ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="حسن"
                  />
                  {errors.fourthName && <p className="text-red-500 text-xs mt-1">{errors.fourthName}</p>}
                </div>
              </div>
            </div>

            {/* معلومات الاتصال */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FaPhone className="ml-2 text-blue-600" />
                معلومات الاتصال
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    رقم هاتف الطالب
                  </label>
                  <input
                    type="tel"
                    name="studentPhone"
                    value={formData.studentPhone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.studentPhone ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="01xxxxxxxxx"
                    dir="ltr"
                  />
                  {errors.studentPhone && <p className="text-red-500 text-xs mt-1">{errors.studentPhone}</p>}
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    رقم هاتف ولي الأمر
                  </label>
                  <input
                    type="tel"
                    name="parentPhone"
                    value={formData.parentPhone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.parentPhone ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="01xxxxxxxxx"
                    dir="ltr"
                  />
                  {errors.parentPhone && <p className="text-red-500 text-xs mt-1">{errors.parentPhone}</p>}
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    رقم هاتف الأم (اختياري)
                  </label>
                  <input
                    type="tel"
                    name="motherPhone"
                    value={formData.motherPhone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="01xxxxxxxxx"
                    dir="ltr"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    البريد الإلكتروني (اختياري)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="example@email.com"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* معلومات ولي الأمر */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FaUserTie className="ml-2 text-blue-600" />
                معلومات ولي الأمر
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    اسم ولي الأمر
                  </label>
                  <input
                    type="text"
                    name="guardianName"
                    value={formData.guardianName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="اسم ولي الأمر"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    وظيفة ولي الأمر
                  </label>
                  <input
                    type="text"
                    name="guardianJob"
                    value={formData.guardianJob}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="المهنة"
                  />
                </div>
              </div>
            </div>

            {/* المعلومات الدراسية */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FaGraduationCap className="ml-2 text-blue-600" />
                المعلومات الدراسية
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    المدينة
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="القاهرة"
                  />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    اسم المدرسة
                  </label>
                  <input
                    type="text"
                    name="schoolName"
                    value={formData.schoolName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="اسم المدرسة"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    المرحلة الدراسية
                  </label>
                  <select
                    name="gradeLevel"
                    value={formData.gradeLevel}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.gradeLevel ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">اختر المرحلة</option>
                    <option value="primary">ابتدائي</option>
                    <option value="middle">إعدادي</option>
                    <option value="high">ثانوي</option>
                    <option value="university">جامعي</option>
                  </select>
                  {errors.gradeLevel && <p className="text-red-500 text-xs mt-1">{errors.gradeLevel}</p>}
                </div>
              </div>
            </div>

            {/* كلمة المرور */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FaLock className="ml-2 text-blue-600" />
                كلمة المرور
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    كلمة المرور
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="أدخل كلمة المرور"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 hover:text-gray-700 mt-7"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>
                
                <div className="relative">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    تأكيد كلمة المرور
                  </label>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="أعد إدخال كلمة المرور"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 hover:text-gray-700 mt-7"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            {/* زر التسجيل */}
            <div className="mt-8">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 ml-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    جاري إنشاء الحساب...
                  </span>
                ) : 'إنشاء حساب جديد'}
              </button>
            </div>

            {/* رابط تسجيل الدخول */}
            <div className="text-center mt-6">
              <p className="text-gray-600">
                لديك حساب بالفعل؟{' '}
                <Link href="/login" className="text-blue-600 hover:text-blue-800 font-bold">
                  تسجيل الدخول
                </Link>
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
