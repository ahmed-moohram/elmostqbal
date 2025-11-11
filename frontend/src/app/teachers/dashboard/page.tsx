'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  FaChalkboardTeacher, 
  FaUsers, 
  FaVideo, 
  FaChartLine,
  FaUpload,
  FaEye,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaClock,
  FaPlus,
  FaComment,
  FaEnvelope
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface Teacher {
  id: string;
  name: string;
  email: string;
  specialty: string;
  role: 'teacher';
}

interface Course {
  id: string;
  title: string;
  studentsCount: number;
  lessonsCount: number;
  status: 'published' | 'draft';
}

interface Student {
  id: string;
  name: string;
  email: string;
  enrolledCourses: string[];
  progress: number;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'students' | 'upload'>('overview');
  
  // Mock data
  const [courses] = useState<Course[]>([
    {
      id: '1',
      title: 'الرياضيات للثانوية العامة 2024',
      studentsCount: 1450,
      lessonsCount: 45,
      status: 'published'
    },
    {
      id: '2',
      title: 'الجبر المتقدم',
      studentsCount: 320,
      lessonsCount: 30,
      status: 'draft'
    }
  ]);

  const [students] = useState<Student[]>([
    {
      id: '1',
      name: 'أحمد محمد',
      email: 'ahmed@example.com',
      enrolledCourses: ['1'],
      progress: 75
    },
    {
      id: '2',
      name: 'سارة علي',
      email: 'sara@example.com',
      enrolledCourses: ['1', '2'],
      progress: 45
    }
  ]);

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

      setTeacher(user);
      setIsLoading(false);
    };

    checkTeacherAuth();
  }, [router]);

  const handleUploadVideo = () => {
    toast.success('جاري فتح نافذة رفع الفيديو...');
    // TODO: Implement video upload
  };

  const handleOpenChat = (studentId: string, studentName: string) => {
    toast.success(`فتح محادثة مع ${studentName}...`);
    // توجيه للشات
    router.push(`/messages?user=${studentId}`);
  };

  const handleViewStudent = (studentId: string) => {
    toast('عرض تفاصيل الطالب...');
    // TODO: فتح modal أو صفحة تفاصيل الطالب
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
              <h1 className="text-2xl font-bold text-gray-800">لوحة تحكم المدرس</h1>
              <p className="text-gray-600">مرحباً، {teacher?.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleUploadVideo}
                className="bg-primary text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-primary-dark transition"
              >
                <FaUpload /> رفع فيديو جديد
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex gap-6">
            {[
              { id: 'overview', label: 'نظرة عامة', icon: FaChartLine },
              { id: 'courses', label: 'الكورسات', icon: FaChalkboardTeacher },
              { id: 'students', label: 'الطلاب', icon: FaUsers },
              { id: 'upload', label: 'رفع المحتوى', icon: FaUpload }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-gray-600 hover:text-primary'
                }`}
              >
                <tab.icon />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <FaChalkboardTeacher className="text-3xl opacity-80" />
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">الكورسات</span>
                </div>
                <h3 className="text-3xl font-bold mb-1">{courses.length}</h3>
                <p className="text-sm opacity-90">إجمالي الكورسات</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <FaUsers className="text-3xl opacity-80" />
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">الطلاب</span>
                </div>
                <h3 className="text-3xl font-bold mb-1">
                  {courses.reduce((sum, c) => sum + c.studentsCount, 0)}
                </h3>
                <p className="text-sm opacity-90">إجمالي الطلاب</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <FaVideo className="text-3xl opacity-80" />
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">الفيديوهات</span>
                </div>
                <h3 className="text-3xl font-bold mb-1">
                  {courses.reduce((sum, c) => sum + c.lessonsCount, 0)}
                </h3>
                <p className="text-sm opacity-90">إجمالي الفيديوهات</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <FaCheckCircle className="text-3xl opacity-80" />
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">منشور</span>
                </div>
                <h3 className="text-3xl font-bold mb-1">
                  {courses.filter(c => c.status === 'published').length}
                </h3>
                <p className="text-sm opacity-90">كورسات منشورة</p>
              </motion.div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">النشاط الأخير</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <FaCheckCircle />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">تم نشر درس جديد</p>
                    <p className="text-sm text-gray-600">المعادلات التربيعية - الرياضيات</p>
                  </div>
                  <span className="text-sm text-gray-500">منذ 2 ساعات</span>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <FaUsers />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">طالب جديد انضم</p>
                    <p className="text-sm text-gray-600">أحمد محمد - الرياضيات للثانوية</p>
                  </div>
                  <span className="text-sm text-gray-500">منذ 5 ساعات</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">كورساتي</h2>
              <button 
                onClick={() => router.replace('/teachers/courses/create')}
                className="bg-primary text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-dark transition"
              >
                <FaPlus /> إضافة كورس جديد
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(course => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden"
                >
                  <div className="h-40 bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                    <FaChalkboardTeacher className="text-6xl text-white opacity-50" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      {course.status === 'published' ? (
                        <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <FaCheckCircle /> منشور
                        </span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-600 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <FaClock /> مسودة
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-lg mb-2">{course.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1">
                        <FaUsers /> {course.studentsCount} طالب
                      </span>
                      <span className="flex items-center gap-1">
                        <FaVideo /> {course.lessonsCount} درس
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 bg-primary text-white py-2 rounded-lg flex items-center justify-center gap-1 hover:bg-primary-dark transition">
                        <FaEye /> عرض
                      </button>
                      <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg flex items-center justify-center gap-1 hover:bg-gray-200 transition">
                        <FaEdit /> تعديل
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">طلابي</h2>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">الاسم</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">البريد</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">الكورسات</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">التقدم</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {students.map(student => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold">{student.name}</td>
                      <td className="px-6 py-4 text-gray-600">{student.email}</td>
                      <td className="px-6 py-4">{student.enrolledCourses.length} كورس</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${student.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold">{student.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleViewStudent(student.id)}
                            className="text-primary hover:text-primary-dark transition"
                            title="عرض التفاصيل"
                          >
                            <FaEye />
                          </button>
                          <button 
                            onClick={() => handleOpenChat(student.id, student.name)}
                            className="text-blue-600 hover:text-blue-800 transition"
                            title="فتح محادثة"
                          >
                            <FaComment />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">رفع المحتوى</h2>
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                <FaUpload className="text-6xl text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">رفع فيديو جديد</h3>
                <p className="text-gray-600 mb-6">اسحب الفيديو هنا أو اضغط للاختيار</p>
                <button className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary-dark transition">
                  اختيار ملف
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
