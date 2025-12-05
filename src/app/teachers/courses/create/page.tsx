'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  FaArrowRight, 
  FaArrowLeft,
  FaBook,
  FaGraduationCap,
  FaListUl,
  FaStar,
  FaUser,
  FaCheckCircle
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { createCourse } from '@/services/supabase-service';

export default function CreateCoursePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Course Basic Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  
  // Course Details (Optional)
  const [requirements, setRequirements] = useState<string[]>(['']);
  const [targetAudience, setTargetAudience] = useState('');
  const [features, setFeatures] = useState<string[]>(['']);
  const [instructorBio, setInstructorBio] = useState('');

  // التحقق من صلاحيات المدرس
  useEffect(() => {
    const checkTeacherAuth = () => {
      const userJson = localStorage.getItem('user');
      if (!userJson) {
        toast.error('يرجى تسجيل الدخول أولاً');
        router.replace('/login');
        return;
      }

      const user = JSON.parse(userJson);
      
      // التحقق من أن المستخدم مدرس
      if (user.role !== 'teacher') {
        toast.error('ليس لديك صلاحية الوصول لهذه الصفحة');
        router.replace('/');
        return;
      }

      setIsLoading(false);
    };

    checkTeacherAuth();
  }, [router]);

  const categories = [
    'رياضيات',
    'فيزياء',
    'كيمياء',
    'أحياء',
    'لغة عربية',
    'لغة إنجليزية',
    'لغة فرنسية',
    'تاريخ',
    'جغرافيا',
    'علوم'
  ];

  const levels = [
    { value: 'beginner', label: 'الابتدائية' },
    { value: 'intermediate', label: 'الإعدادية' },
    { value: 'advanced', label: 'الثانوية العامة' },
    { value: 'advanced', label: 'الجامعة' },
    { value: 'all-levels', label: 'جميع المستويات' }
  ];

  const handleAddRequirement = () => {
    setRequirements([...requirements, '']);
  };

  const handleRemoveRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleRequirementChange = (index: number, value: string) => {
    const newRequirements = [...requirements];
    newRequirements[index] = value;
    setRequirements(newRequirements);
  };

  const handleAddFeature = () => {
    setFeatures([...features, '']);
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!title || !description || !category || !level || !price) {
        toast.error('يرجى ملء جميع الحقول المطلوبة');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      toast.error('يرجى تسجيل الدخول أولاً');
      router.replace('/login');
      return;
    }

    const user = JSON.parse(userJson);

    const baseData = {
      title,
      description,
      category,
      level,
      price: parseFloat(price) || 0,
      discountPrice: discountPrice ? parseFloat(discountPrice) : null,
    };

    const courseDataForSupabase = {
      ...baseData,
      instructorId: user.id,
      instructor: user.name || 'مدرس',
      thumbnail: '/placeholder-course.jpg',
      previewVideo: null,
      duration: 0,
      isPublished: false,
      isFeatured: false,
    };

    try {
      setIsSubmitting(true);
      const result = await createCourse(courseDataForSupabase);

      if (!result.success) {
        toast.error('حدث خطأ أثناء إنشاء الكورس');
        return;
      }

      toast.success('تم إنشاء الكورس بنجاح! 🎉');
      router.replace(`/teachers/${user.id}/dashboard`);
    } catch (error) {
      console.error('Error creating course from teacher page:', error);
      toast.error('حدث خطأ أثناء إنشاء الكورس');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">إنشاء كورس جديد</h1>
              <p className="text-gray-600">املأ البيانات لإنشاء كورس احترافي</p>
            </div>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
            >
              <FaArrowLeft /> رجوع
            </button>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-4">
            {[
              { num: 1, label: 'المعلومات الأساسية' },
              { num: 2, label: 'التفاصيل (اختياري)' },
              { num: 3, label: 'المراجعة والنشر' }
            ].map((s) => (
              <div key={s.num} className="flex items-center">
                <div className={`flex items-center gap-2 ${step >= s.num ? 'text-primary' : 'text-gray-400'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step >= s.num ? 'bg-primary text-white' : 'bg-gray-200'
                  }`}>
                    {step > s.num ? <FaCheckCircle /> : s.num}
                  </div>
                  <span className="hidden md:block font-semibold">{s.label}</span>
                </div>
                {s.num < 3 && (
                  <div className={`w-20 h-1 mx-2 ${step > s.num ? 'bg-primary' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-lg p-8 space-y-6"
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <FaBook className="text-primary" />
                  المعلومات الأساسية
                </h2>

                <div>
                  <label className="block text-sm font-bold mb-2">
                    عنوان الكورس <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: الرياضيات للثانوية العامة 2024"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">
                    وصف الكورس <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="اكتب وصف شامل للكورس..."
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">
                      الفئة <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    >
                      <option value="">اختر الفئة</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">
                      المستوى <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    >
                      <option value="">اختر المستوى</option>
                      {levels.map((lvl) => (
                        <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">
                      السعر (جنيه) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="999"
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">
                      السعر بعد الخصم (اختياري)
                    </label>
                    <input
                      type="number"
                      value={discountPrice}
                      onChange={(e) => setDiscountPrice(e.target.value)}
                      placeholder="799"
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Details (Optional) */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Target Audience */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FaUser className="text-primary" />
                    الشخص المناسب للكورس (اختياري)
                  </h3>
                  <textarea
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="مثال: طلاب الثانوية العامة الذين يريدون التفوق في الرياضيات"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    وصف مختصر للطلاب المستهدفين
                  </p>
                </div>

                {/* Requirements */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FaListUl className="text-primary" />
                    المتطلبات (اختياري)
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    ما يجب أن يعرفه الطالب قبل البدء في الكورس
                  </p>
                  
                  {requirements.map((req, index) => (
                    <div key={index} className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={req}
                        onChange={(e) => handleRequirementChange(index, e.target.value)}
                        placeholder="مثال: معرفة أساسيات الجبر"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      {requirements.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRequirement(index)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={handleAddRequirement}
                    className="mt-2 text-primary hover:text-primary-dark font-semibold"
                  >
                    + إضافة متطلب
                  </button>
                </div>

                {/* Features */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FaStar className="text-primary" />
                    مميزات الكورس (اختياري)
                  </h3>
                  
                  {features.map((feature, index) => (
                    <div key={index} className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                        placeholder="مثال: 40 محاضرة متكاملة"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      {features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(index)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="mt-2 text-primary hover:text-primary-dark font-semibold"
                  >
                    + إضافة ميزة
                  </button>
                </div>

                {/* Instructor Bio */}
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FaGraduationCap className="text-primary" />
                    نبذة عن المدرس (اختياري)
                  </h3>
                  <textarea
                    value={instructorBio}
                    onChange={(e) => setInstructorBio(e.target.value)}
                    placeholder="اكتب نبذة مختصرة عنك وخبراتك..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-lg p-8"
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <FaCheckCircle className="text-green-500" />
                  مراجعة البيانات
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-lg mb-2">{title}</h3>
                    <p className="text-gray-600">{description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">الفئة:</span>
                      <p className="font-semibold">{category}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">المستوى:</span>
                      <p className="font-semibold">{levels.find((l) => l.value === level)?.label || level}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">السعر:</span>
                      <p className="font-semibold">{price} ج.م</p>
                    </div>
                    {discountPrice && (
                      <div>
                        <span className="text-sm text-gray-500">بعد الخصم:</span>
                        <p className="font-semibold text-green-600">{discountPrice} ج.م</p>
                      </div>
                    )}
                  </div>

                  {targetAudience && (
                    <div>
                      <span className="text-sm text-gray-500">الشخص المناسب:</span>
                      <p className="font-semibold">{targetAudience}</p>
                    </div>
                  )}

                  {requirements.filter(r => r.trim()).length > 0 && (
                    <div>
                      <span className="text-sm text-gray-500">المتطلبات:</span>
                      <ul className="list-disc list-inside">
                        {requirements.filter(r => r.trim()).map((req, i) => (
                          <li key={i} className="font-semibold">{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {features.filter(f => f.trim()).length > 0 && (
                    <div>
                      <span className="text-sm text-gray-500">المميزات:</span>
                      <ul className="list-disc list-inside">
                        {features.filter(f => f.trim()).map((feat, i) => (
                          <li key={i} className="font-semibold">{feat}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <FaArrowLeft /> السابق
                </button>
              )}
              
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="mr-auto px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition flex items-center gap-2"
                >
                  التالي <FaArrowRight />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mr-auto px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'جاري الإنشاء...' : (
                    <>
                      <FaCheckCircle /> إنشاء الكورس
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
