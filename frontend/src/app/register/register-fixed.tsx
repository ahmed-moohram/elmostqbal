"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<any>({});
  
  // بيانات النموذج
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
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
  
  // التحقق من صحة البيانات
  const validateStep1 = () => {
    const newErrors: any = {};
    
    if (!name) newErrors.name = 'الاسم مطلوب';
    if (!fatherName) newErrors.fatherName = 'اسم الأب مطلوب';
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
  
  // إرسال نموذج التسجيل
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
      return;
    }
    
    if (currentStep === 2) {
      if (!validateStep2()) {
        return;
      }
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      console.log('🔵 التسجيل عبر Supabase...');
      
      // استيراد Supabase
      const { createClient } = await import('@supabase/supabase-js');
      const SUPABASE_URL = 'https://chikfjvpkqtivtyhvvzt.supabase.co';
      const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoaWtmanZwa3F0aXZ0eWh2dnp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1OTQ0MzUsImV4cCI6MjA3OTE3MDQzNX0.UhEmoTArWirw8-W3mozcHQFZxjKt31hiYZJv3L0j3SI';
      
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      
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
          name: `${name} ${fatherName}`,
          email: email || `${studentPhone}@student.com`,
          phone: studentPhone,
          password: btoa(password), // تشفير بسيط للتجربة
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
      localStorage.setItem('token', 'student-token-' + Date.now());
      
      // التوجيه لصفحة تسجيل الدخول
      alert('تم التسجيل بنجاح! يمكنك الآن تسجيل الدخول');
      router.push('/login');
      
    } catch (error: any) {
      console.error('🔴 خطأ في التسجيل:', error);
      setErrors({ general: error.message || 'حدث خطأ في التسجيل' });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
          إنشاء حساب جديد
        </h2>
        
        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          <div className={`flex-1 text-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 mx-auto rounded-full ${currentStep >= 1 ? 'bg-blue-600' : 'bg-gray-300'} text-white flex items-center justify-center`}>
              1
            </div>
            <span className="text-sm mt-2">البيانات الأساسية</span>
          </div>
          <div className={`flex-1 text-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 mx-auto rounded-full ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'} text-white flex items-center justify-center`}>
              2
            </div>
            <span className="text-sm mt-2">كلمة المرور</span>
          </div>
        </div>
        
        {errors.general && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {errors.general}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {currentStep === 1 && (
            <>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  اسم الطالب
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="أدخل اسم الطالب"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  اسم الأب
                </label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.fatherName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="أدخل اسم الأب"
                />
                {errors.fatherName && <p className="text-red-500 text-xs mt-1">{errors.fatherName}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  رقم هاتف الطالب
                </label>
                <input
                  type="tel"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.studentPhone ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="01xxxxxxxxx"
                />
                {errors.studentPhone && <p className="text-red-500 text-xs mt-1">{errors.studentPhone}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  رقم هاتف ولي الأمر
                </label>
                <input
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.parentPhone ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="01xxxxxxxxx"
                />
                {errors.parentPhone && <p className="text-red-500 text-xs mt-1">{errors.parentPhone}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  البريد الإلكتروني (اختياري)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="example@email.com"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  المدينة
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="أدخل المدينة"
                />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  المرحلة الدراسية
                </label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
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
            </>
          )}
          
          {currentStep === 2 && (
            <>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  كلمة المرور
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="أدخل كلمة المرور"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  تأكيد كلمة المرور
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="أعد إدخال كلمة المرور"
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            </>
          )}
          
          <div className="flex justify-between mt-6">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                السابق
              </button>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className={`${currentStep === 1 ? 'w-full' : 'flex-1 ml-2'} bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50`}
            >
              {isLoading ? 'جاري التسجيل...' : currentStep === 2 ? 'إنشاء الحساب' : 'التالي'}
            </button>
          </div>
        </form>
        
        <p className="text-center mt-4 text-gray-600">
          لديك حساب بالفعل؟{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            تسجيل الدخول
          </a>
        </p>
      </div>
    </div>
  );
}
