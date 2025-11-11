'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaGraduationCap, FaBook, FaUpload, FaLinkedin, FaYoutube } from 'react-icons/fa';
import { ImSpinner9 } from 'react-icons/im';

export default function TeacherRegister() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    bio: '',
    specialization: '',
    experience: '',
    qualifications: '',
    profileImage: '',
    linkedIn: '',
    youtube: '',
    pricePerCourse: '',
    languages: [] as string[],
    gradeLevels: [] as string[],
    teachingSubjects: [] as string[],
    status: 'pending' // حالة الموافقة
  });

  const specializations = [
    'مدرس رياضيات',
    'مدرس لغة عربية',
    'مدرس لغة إنجليزية',
    'مدرس علوم',
    'مدرس فيزياء',
    'مدرس كيمياء',
    'مدرس أحياء',
    'مدرس دراسات اجتماعية',
    'مدرس تاريخ',
    'مدرس جغرافيا',
    'مدرس فلسفة ومنطق',
    'مدرس لغة فرنسية',
    'مدرس لغة ألمانية',
    'مدرس تربية دينية',
    'مدرس حاسب آلي'
  ];

  const availableLanguages = ['العربية', 'English', 'Français', 'Deutsch'];

  // المراحل الدراسية
  const gradeLevels = [
    'الصف الأول الابتدائي',
    'الصف الثاني الابتدائي',
    'الصف الثالث الابتدائي',
    'الصف الرابع الابتدائي',
    'الصف الخامس الابتدائي',
    'الصف السادس الابتدائي',
    'الصف الأول الإعدادي',
    'الصف الثاني الإعدادي',
    'الصف الثالث الإعدادي',
    'الصف الأول الثانوي',
    'الصف الثاني الثانوي',
    'الصف الثالث الثانوي'
  ];

  // المواد حسب المرحلة
  const subjects = {
    primary: ['اللغة العربية', 'الرياضيات', 'العلوم', 'الدراسات الاجتماعية', 'اللغة الإنجليزية'],
    preparatory: ['اللغة العربية', 'الرياضيات', 'العلوم', 'اللغة الإنجليزية', 'الدراسات الاجتماعية', 'الحاسب الآلي'],
    secondary: ['اللغة العربية', 'اللغة الإنجليزية', 'الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء', 'التاريخ', 'الجغرافيا', 'الفلسفة']
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من كلمة المرور
    if (formData.password !== formData.confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setIsLoading(true);

    try {
      // حفظ بيانات المدرس في localStorage مؤقتاً
      const teacherData = {
        ...formData,
        role: 'teacher',
        createdAt: new Date().toISOString(),
        id: `teacher_${Date.now()}`,
        rating: 0,
        studentsCount: 0,
        coursesCount: 0,
        isVerified: false
      };

      // حفظ في localStorage
      localStorage.setItem('teacher', JSON.stringify(teacherData));
      localStorage.setItem('userRole', 'teacher');
      
      toast.success('✅ تم إرسال طلبك بنجاح! سيتم مراجعته من الإدارة');
      
      // التوجيه إلى صفحة الانتظار
      setTimeout(() => {
        router.push('/teacher/pending');
      }, 2000);

    } catch (error) {
      console.error('خطأ في التسجيل:', error);
      toast.error('حدث خطأ في التسجيل');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profileImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
      toast.success('تم رفع الصورة بنجاح');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12">
      <div className="container mx-auto px-4">
        {/* العنوان */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            انضم كمدرس 👨‍🏫
          </h1>
          <p className="text-gray-600">
            شارك معرفتك وابني مجتمعك التعليمي الخاص
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          {/* معلومات أساسية */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
              📝 المعلومات الأساسية
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* الاسم */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  <FaUser className="inline ml-2" />
                  الاسم الكامل *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-500 focus:outline-none transition"
                  placeholder="أحمد محمد"
                />
              </div>

              {/* البريد الإلكتروني */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  <FaEnvelope className="inline ml-2" />
                  البريد الإلكتروني *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-500 focus:outline-none transition"
                  placeholder="teacher@example.com"
                />
              </div>

              {/* رقم الهاتف */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  <FaPhone className="inline ml-2" />
                  رقم الهاتف *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-500 focus:outline-none transition"
                  placeholder="01234567890"
                  dir="ltr"
                />
              </div>

              {/* التخصص */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  <FaBook className="inline ml-2" />
                  التخصص *
                </label>
                <select
                  required
                  value={formData.specialization}
                  onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-500 focus:outline-none transition"
                >
                  <option value="">اختر التخصص</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              {/* كلمة المرور */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  <FaLock className="inline ml-2" />
                  كلمة المرور *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-500 focus:outline-none transition"
                  placeholder="••••••••"
                />
              </div>

              {/* تأكيد كلمة المرور */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  <FaLock className="inline ml-2" />
                  تأكيد كلمة المرور *
                </label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-500 focus:outline-none transition"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {/* المعلومات المهنية */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
              💼 المعلومات المهنية
            </h2>

            {/* نبذة تعريفية */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                نبذة تعريفية *
              </label>
              <textarea
                required
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                rows={4}
                className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-500 focus:outline-none transition"
                placeholder="أخبر الطلاب عن نفسك وخبراتك..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* سنوات الخبرة */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  <FaGraduationCap className="inline ml-2" />
                  سنوات الخبرة *
                </label>
                <input
                  type="number"
                  required
                  value={formData.experience}
                  onChange={(e) => setFormData({...formData, experience: e.target.value})}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-500 focus:outline-none transition"
                  placeholder="5"
                  min="0"
                />
              </div>

              {/* السعر الافتراضي */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  💰 السعر الافتراضي للكورس
                </label>
                <input
                  type="number"
                  value={formData.pricePerCourse}
                  onChange={(e) => setFormData({...formData, pricePerCourse: e.target.value})}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-500 focus:outline-none transition"
                  placeholder="299"
                  min="0"
                />
              </div>

              {/* المؤهلات */}
              <div className="md:col-span-2">
                <label className="block text-gray-700 font-medium mb-2">
                  🎓 المؤهلات والشهادات
                </label>
                <textarea
                  value={formData.qualifications}
                  onChange={(e) => setFormData({...formData, qualifications: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-500 focus:outline-none transition"
                  placeholder="بكالوريوس هندسة برمجيات، شهادات معتمدة..."
                />
              </div>
            </div>
          </div>

          {/* الصورة الشخصية والروابط */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
              🌐 الصورة والروابط
            </h2>

            {/* صورة الملف الشخصي */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                <FaUpload className="inline ml-2" />
                صورة الملف الشخصي
              </label>
              <div className="flex items-center gap-4">
                {formData.profileImage && (
                  <img
                    src={formData.profileImage}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-purple-200"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="flex-1 px-4 py-3 border-2 rounded-lg focus:border-purple-500 focus:outline-none transition"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* LinkedIn */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  <FaLinkedin className="inline ml-2 text-blue-600" />
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  value={formData.linkedIn}
                  onChange={(e) => setFormData({...formData, linkedIn: e.target.value})}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-500 focus:outline-none transition"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              {/* YouTube */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  <FaYoutube className="inline ml-2 text-red-600" />
                  YouTube Channel
                </label>
                <input
                  type="url"
                  value={formData.youtube}
                  onChange={(e) => setFormData({...formData, youtube: e.target.value})}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:border-purple-500 focus:outline-none transition"
                  placeholder="https://youtube.com/@channel"
                />
              </div>
            </div>

            {/* اللغات */}
            <div className="mt-6">
              <label className="block text-gray-700 font-medium mb-2">
                🌍 اللغات المتاحة
              </label>
              <div className="flex flex-wrap gap-3">
                {availableLanguages.map(lang => (
                  <label key={lang} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.languages.includes(lang)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, languages: [...formData.languages, lang]});
                        } else {
                          setFormData({...formData, languages: formData.languages.filter(l => l !== lang)});
                        }
                      }}
                      className="w-5 h-5 text-purple-600"
                    />
                    <span className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                      {lang}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* الأزرار */}
          <div className="flex gap-4 justify-center">
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <ImSpinner9 className="animate-spin" />
                  جاري التسجيل...
                </>
              ) : (
                <>
                  <FaGraduationCap />
                  إنشاء حساب مدرس
                </>
              )}
            </button>
            
            <Link
              href="/teacher/login"
              className="px-8 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition"
            >
              لديك حساب بالفعل؟
            </Link>
          </div>
        </form>

        {/* ميزات المدرس */}
        <div className="mt-12 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">لماذا تنضم كمدرس؟</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white rounded-xl shadow-lg">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💰</span>
              </div>
              <h4 className="font-bold text-lg mb-2">دخل إضافي</h4>
              <p className="text-gray-600">احصل على دخل من خلال مشاركة معرفتك</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl shadow-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🌍</span>
              </div>
              <h4 className="font-bold text-lg mb-2">وصول عالمي</h4>
              <p className="text-gray-600">علّم طلاب من جميع أنحاء العالم</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl shadow-lg">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📈</span>
              </div>
              <h4 className="font-bold text-lg mb-2">نمو مهني</h4>
              <p className="text-gray-600">طور مهاراتك وابني سمعتك المهنية</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
