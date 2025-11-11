'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  FaUsers, FaUserCheck, FaUserTimes, FaBookOpen, 
  FaGraduationCap, FaChartLine, FaSearch, FaFilter,
  FaEye, FaBan, FaCheckCircle, FaClock, FaSchool,
  FaChalkboardTeacher, FaEnvelope, FaPhone
} from 'react-icons/fa';

interface PendingTeacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  grade_levels: string[];
  subjects: string[];
  experience_years: number;
  qualifications: string;
  bio: string;
  profile_image?: string;
  applied_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

// المواد الدراسية حسب المرحلة
const SUBJECTS_BY_GRADE = {
  'primary': [
    'اللغة العربية',
    'الرياضيات', 
    'العلوم',
    'الدراسات الاجتماعية',
    'اللغة الإنجليزية',
    'التربية الدينية',
    'التربية الفنية'
  ],
  'preparatory': [
    'اللغة العربية',
    'الرياضيات',
    'العلوم',
    'الدراسات الاجتماعية',
    'اللغة الإنجليزية',
    'اللغة الفرنسية/الألمانية',
    'التربية الدينية',
    'الحاسب الآلي'
  ],
  'secondary': [
    'اللغة العربية',
    'اللغة الإنجليزية',
    'اللغة الفرنسية/الألمانية',
    'الرياضيات البحتة',
    'الرياضيات التطبيقية',
    'الفيزياء',
    'الكيمياء',
    'الأحياء',
    'الجيولوجيا',
    'التاريخ',
    'الجغرافيا',
    'الفلسفة والمنطق',
    'علم النفس والاجتماع',
    'التربية الوطنية'
  ]
};

export default function AdminPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingTeachers, setPendingTeachers] = useState<PendingTeacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<PendingTeacher | null>(null);
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalStudents: 0,
    totalCourses: 0
  });

  useEffect(() => {
    // التحقق من صلاحيات الأدمن
    const checkAdminAuth = () => {
      const user = localStorage.getItem('user');
      if (!user) {
        toast.error('يجب تسجيل الدخول كأدمن');
        router.push('/admin/login');
        return false;
      }
      
      const userData = JSON.parse(user);
      if (userData.role !== 'admin') {
        toast.error('غير مصرح لك بدخول هذه الصفحة');
        router.push('/');
        return false;
      }
      
      return true;
    };

    if (checkAdminAuth()) {
      loadPendingTeachers();
      loadStats();
    }
  }, []);

  const loadPendingTeachers = () => {
    // محاكاة جلب المدرسين المعلقين
    const mockTeachers: PendingTeacher[] = [
      {
        id: '1',
        name: 'أ. أحمد محمد سعيد',
        email: 'ahmed.math@example.com',
        phone: '01012345678',
        specialization: 'مدرس رياضيات',
        grade_levels: ['الثانوية العامة', 'الإعدادية'],
        subjects: ['الرياضيات البحتة', 'الرياضيات التطبيقية'],
        experience_years: 8,
        qualifications: 'بكالوريوس علوم رياضيات - جامعة القاهرة\nدبلومة تربوية\nماجستير في التربية',
        bio: 'مدرس رياضيات خبرة 8 سنوات في تدريس المناهج المصرية',
        profile_image: '/teacher1.jpg',
        applied_at: '2024-01-15',
        status: 'pending'
      },
      {
        id: '2',
        name: 'أ. فاطمة عبد الله',
        email: 'fatma.arabic@example.com',
        phone: '01098765432',
        specialization: 'مدرسة لغة عربية',
        grade_levels: ['الإعدادية', 'الابتدائية'],
        subjects: ['اللغة العربية'],
        experience_years: 5,
        qualifications: 'ليسانس آداب قسم اللغة العربية\nدبلومة تربوية',
        bio: 'متخصصة في تدريس اللغة العربية والنحو والبلاغة',
        profile_image: '/teacher2.jpg',
        applied_at: '2024-01-16',
        status: 'pending'
      },
      {
        id: '3',
        name: 'أ. محمود حسن',
        email: 'mahmoud.science@example.com',
        phone: '01234567890',
        specialization: 'مدرس علوم',
        grade_levels: ['الثانوية العامة'],
        subjects: ['الفيزياء', 'الكيمياء'],
        experience_years: 10,
        qualifications: 'بكالوريوس علوم - كلية العلوم\nماجستير في الفيزياء النظرية',
        bio: 'خبرة 10 سنوات في تدريس الفيزياء والكيمياء للثانوية العامة',
        profile_image: '/teacher3.jpg',
        applied_at: '2024-01-17',
        status: 'pending'
      }
    ];

    setPendingTeachers(mockTeachers);
  };

  const loadStats = () => {
    setStats({
      totalPending: 12,
      totalApproved: 45,
      totalRejected: 8,
      totalStudents: 1250,
      totalCourses: 89
    });
  };

  const handleApproveTeacher = async (teacherId: string) => {
    setIsLoading(true);
    try {
      // محاكاة الموافقة على المدرس
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPendingTeachers(prev => 
        prev.map(teacher => 
          teacher.id === teacherId 
            ? { ...teacher, status: 'approved' as const }
            : teacher
        )
      );
      
      toast.success('✅ تمت الموافقة على المدرس بنجاح');
      setSelectedTeacher(null);
      
      // إرسال إيميل للمدرس (محاكاة)
      console.log('إرسال إيميل موافقة للمدرس');
    } catch (error) {
      toast.error('حدث خطأ في الموافقة على المدرس');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectTeacher = async (teacherId: string, reason?: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPendingTeachers(prev => 
        prev.map(teacher => 
          teacher.id === teacherId 
            ? { ...teacher, status: 'rejected' as const }
            : teacher
        )
      );
      
      toast.success('تم رفض طلب المدرس');
      setSelectedTeacher(null);
      
      // إرسال إيميل بالرفض مع السبب
      console.log('إرسال إيميل رفض مع السبب:', reason);
    } catch (error) {
      toast.error('حدث خطأ في رفض المدرس');
    } finally {
      setIsLoading(false);
    }
  };

  // فلترة المدرسين
  const filteredTeachers = pendingTeachers.filter(teacher => {
    const matchesStatus = 
      (activeTab === 'pending' && teacher.status === 'pending') ||
      (activeTab === 'approved' && teacher.status === 'approved') ||
      (activeTab === 'rejected' && teacher.status === 'rejected') ||
      activeTab === 'all';
    
    const matchesGrade = 
      filterGrade === 'all' || 
      teacher.grade_levels.some(level => level.includes(filterGrade));
    
    const matchesSubject = 
      filterSubject === 'all' || 
      teacher.subjects.includes(filterSubject);
    
    const matchesSearch = 
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.subjects.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesGrade && matchesSubject && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <FaSchool />
                لوحة تحكم الإدارة - منصة التعليم
              </h1>
              <p className="text-purple-100 mt-1">إدارة المدرسين والمناهج الدراسية</p>
            </div>
            
            <button
              onClick={() => router.push('/admin/logout')}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>

      {/* الإحصائيات */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">طلبات معلقة</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.totalPending}</p>
              </div>
              <FaClock className="text-4xl text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">مدرسين معتمدين</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalApproved}</p>
              </div>
              <FaUserCheck className="text-4xl text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">طلبات مرفوضة</p>
                <p className="text-3xl font-bold text-red-600">{stats.totalRejected}</p>
              </div>
              <FaUserTimes className="text-4xl text-red-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">إجمالي الطلاب</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalStudents}</p>
              </div>
              <FaGraduationCap className="text-4xl text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">الكورسات النشطة</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalCourses}</p>
              </div>
              <FaBookOpen className="text-4xl text-purple-500" />
            </div>
          </div>
        </div>

        {/* التبويبات والفلاتر */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6">
            {/* التبويبات */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  activeTab === 'pending' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                معلق ({pendingTeachers.filter(t => t.status === 'pending').length})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  activeTab === 'approved' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                موافق عليه
              </button>
              <button
                onClick={() => setActiveTab('rejected')}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  activeTab === 'rejected' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                مرفوض
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  activeTab === 'all' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                الكل
              </button>
            </div>

            {/* الفلاتر */}
            <div className="flex gap-3 items-center">
              <div className="relative">
                <FaSearch className="absolute right-3 top-3 text-gray-400" />
                <input
                  type="search"
                  placeholder="بحث..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 pl-4 py-2 border rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
              
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-500"
              >
                <option value="all">كل المراحل</option>
                <option value="الابتدائية">الابتدائية</option>
                <option value="الإعدادية">الإعدادية</option>
                <option value="الثانوية">الثانوية العامة</option>
              </select>
              
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-500"
              >
                <option value="all">كل المواد</option>
                {Array.from(new Set([
                  ...SUBJECTS_BY_GRADE.primary,
                  ...SUBJECTS_BY_GRADE.preparatory,
                  ...SUBJECTS_BY_GRADE.secondary
                ])).map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
          </div>

          {/* قائمة المدرسين */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المدرس
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المواد
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المراحل
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الخبرة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاريخ التقديم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={teacher.profile_image || '/default-avatar.png'}
                          alt={teacher.name}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/default-avatar.png';
                          }}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {teacher.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {teacher.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {teacher.subjects.map(subject => (
                          <span
                            key={subject}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {teacher.grade_levels.map(level => (
                          <span
                            key={level}
                            className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full"
                          >
                            {level}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {teacher.experience_years} سنوات
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(teacher.applied_at).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        teacher.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : teacher.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {teacher.status === 'pending' ? 'معلق' 
                          : teacher.status === 'approved' ? 'موافق عليه' 
                          : 'مرفوض'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => setSelectedTeacher(teacher)}
                        className="text-purple-600 hover:text-purple-900 ml-2"
                        title="عرض التفاصيل"
                      >
                        <FaEye />
                      </button>
                      {teacher.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveTeacher(teacher.id)}
                            className="text-green-600 hover:text-green-900 ml-2"
                            title="موافقة"
                          >
                            <FaCheckCircle />
                          </button>
                          <button
                            onClick={() => handleRejectTeacher(teacher.id)}
                            className="text-red-600 hover:text-red-900"
                            title="رفض"
                          >
                            <FaBan />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* نافذة تفاصيل المدرس */}
      {selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">تفاصيل المدرس</h2>
                <button
                  onClick={() => setSelectedTeacher(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-start gap-6 mb-6">
                <img
                  src={selectedTeacher.profile_image || '/default-avatar.png'}
                  alt={selectedTeacher.name}
                  className="w-32 h-32 rounded-xl object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-avatar.png';
                  }}
                />
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{selectedTeacher.name}</h3>
                  <p className="text-gray-600 mb-3">{selectedTeacher.specialization}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">البريد الإلكتروني:</span>
                      <p className="font-medium flex items-center gap-1">
                        <FaEnvelope className="text-gray-400" />
                        {selectedTeacher.email}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">رقم الهاتف:</span>
                      <p className="font-medium flex items-center gap-1">
                        <FaPhone className="text-gray-400" />
                        {selectedTeacher.phone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-gray-700 mb-2">المواد الدراسية:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTeacher.subjects.map(subject => (
                      <span
                        key={subject}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-700 mb-2">المراحل الدراسية:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTeacher.grade_levels.map(level => (
                      <span
                        key={level}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full"
                      >
                        {level}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-700 mb-2">سنوات الخبرة:</h4>
                  <p className="text-gray-600">{selectedTeacher.experience_years} سنوات</p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-700 mb-2">المؤهلات:</h4>
                  <p className="text-gray-600 whitespace-pre-line">{selectedTeacher.qualifications}</p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-700 mb-2">نبذة تعريفية:</h4>
                  <p className="text-gray-600">{selectedTeacher.bio}</p>
                </div>
              </div>

              {selectedTeacher.status === 'pending' && (
                <div className="flex gap-3 mt-6 pt-6 border-t">
                  <button
                    onClick={() => handleApproveTeacher(selectedTeacher.id)}
                    disabled={isLoading}
                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition disabled:opacity-50"
                  >
                    {isLoading ? 'جاري المعالجة...' : 'الموافقة على المدرس'}
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('سبب الرفض (اختياري):');
                      handleRejectTeacher(selectedTeacher.id, reason || undefined);
                    }}
                    disabled={isLoading}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition disabled:opacity-50"
                  >
                    رفض الطلب
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
