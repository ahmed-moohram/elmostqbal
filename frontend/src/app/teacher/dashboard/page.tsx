'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { 
  FaUsers, FaBookOpen, FaChartLine, FaDollarSign, 
  FaVideo, FaComments, FaBell, FaPlus, FaEdit, 
  FaTrash, FaEye, FaCog, FaSignOutAlt, FaGraduationCap,
  FaStar, FaClock, FaCheckCircle
} from 'react-icons/fa';

interface TeacherData {
  id: string;
  name: string;
  email: string;
  bio: string;
  specialization: string;
  profileImage: string;
  rating: number;
  studentsCount: number;
  coursesCount: number;
  isVerified: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  studentsCount: number;
  lessonsCount: number;
  rating: number;
  isPublished: boolean;
  createdAt: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string;
  enrolledDate: string;
  progress: number;
  lastActive: string;
  courseName: string;
}

interface Message {
  id: string;
  studentName: string;
  studentAvatar: string;
  content: string;
  time: string;
  isRead: boolean;
  courseTitle: string;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [teacher, setTeacher] = useState<TeacherData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalStudents: 0,
    activeStudents: 0,
    totalCourses: 0,
    averageRating: 0,
    totalLessons: 0,
    completionRate: 0
  });

  useEffect(() => {
    // تحميل بيانات المدرس
    const teacherData = localStorage.getItem('teacher');
    if (!teacherData) {
      toast.error('يجب تسجيل الدخول كمدرس');
      router.push('/teacher/login');
      return;
    }

    const parsedTeacher = JSON.parse(teacherData);
    setTeacher(parsedTeacher);

    // تحميل البيانات التجريبية
    loadMockData();
  }, []);

  const loadMockData = () => {
    // كورسات تجريبية
    setCourses([
      {
        id: '1',
        title: 'أساسيات البرمجة بلغة JavaScript',
        description: 'تعلم أساسيات JavaScript من الصفر',
        thumbnail: '/course1.jpg',
        price: 299,
        studentsCount: 156,
        lessonsCount: 24,
        rating: 4.8,
        isPublished: true,
        createdAt: '2024-01-15'
      },
      {
        id: '2',
        title: 'React.js المتقدم',
        description: 'احترف React وبناء تطبيقات ويب احترافية',
        thumbnail: '/course2.jpg',
        price: 399,
        studentsCount: 89,
        lessonsCount: 32,
        rating: 4.9,
        isPublished: true,
        createdAt: '2024-02-10'
      },
      {
        id: '3',
        title: 'Node.js والـ Backend',
        description: 'بناء APIs احترافية باستخدام Node.js',
        thumbnail: '/course3.jpg',
        price: 349,
        studentsCount: 67,
        lessonsCount: 28,
        rating: 4.7,
        isPublished: false,
        createdAt: '2024-03-05'
      }
    ]);

    // طلاب تجريبيين
    setStudents([
      {
        id: '1',
        name: 'أحمد محمد',
        email: 'ahmad@example.com',
        avatar: '/avatar1.jpg',
        enrolledDate: '2024-01-20',
        progress: 75,
        lastActive: 'منذ ساعة',
        courseName: 'JavaScript أساسيات'
      },
      {
        id: '2',
        name: 'فاطمة علي',
        email: 'fatma@example.com',
        avatar: '/avatar2.jpg',
        enrolledDate: '2024-02-15',
        progress: 45,
        lastActive: 'منذ يومين',
        courseName: 'React.js المتقدم'
      },
      {
        id: '3',
        name: 'محمود حسن',
        email: 'mahmoud@example.com',
        avatar: '/avatar3.jpg',
        enrolledDate: '2024-03-01',
        progress: 90,
        lastActive: 'الآن',
        courseName: 'Node.js والـ Backend'
      }
    ]);

    // رسائل تجريبية
    setMessages([
      {
        id: '1',
        studentName: 'أحمد محمد',
        studentAvatar: '/avatar1.jpg',
        content: 'استاذ، لدي سؤال عن الدرس الخامس',
        time: 'منذ 10 دقائق',
        isRead: false,
        courseTitle: 'JavaScript أساسيات'
      },
      {
        id: '2',
        studentName: 'فاطمة علي',
        studentAvatar: '/avatar2.jpg',
        content: 'شكراً على الشرح الرائع!',
        time: 'منذ ساعة',
        isRead: true,
        courseTitle: 'React.js المتقدم'
      }
    ]);

    // إحصائيات
    setStats({
      totalRevenue: 45600,
      monthlyRevenue: 8900,
      totalStudents: 312,
      activeStudents: 186,
      totalCourses: 3,
      averageRating: 4.8,
      totalLessons: 84,
      completionRate: 78
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('teacher');
    localStorage.removeItem('userRole');
    toast.success('تم تسجيل الخروج بنجاح');
    router.push('/teacher/login');
  };

  if (!teacher) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* الشريط الجانبي */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6">
          {/* معلومات المدرس */}
          <div className="flex items-center gap-4 mb-8">
            <img
              src={teacher.profileImage || '/default-avatar.png'}
              alt={teacher.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-purple-200"
            />
            <div>
              <h3 className="font-bold">{teacher.name}</h3>
              <p className="text-sm text-gray-500">{teacher.specialization}</p>
            </div>
          </div>

          {/* القائمة */}
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'overview' 
                  ? 'bg-purple-100 text-purple-700 font-medium' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <FaChartLine />
              نظرة عامة
            </button>

            <button
              onClick={() => setActiveTab('courses')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'courses' 
                  ? 'bg-purple-100 text-purple-700 font-medium' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <FaBookOpen />
              الكورسات
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'students' 
                  ? 'bg-purple-100 text-purple-700 font-medium' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <FaUsers />
              الطلاب
            </button>

            <button
              onClick={() => setActiveTab('messages')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition relative ${
                activeTab === 'messages' 
                  ? 'bg-purple-100 text-purple-700 font-medium' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <FaComments />
              الرسائل
              {messages.filter(m => !m.isRead).length > 0 && (
                <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('earnings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'earnings' 
                  ? 'bg-purple-100 text-purple-700 font-medium' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <FaDollarSign />
              الأرباح
            </button>

            <hr className="my-4" />

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === 'settings' 
                  ? 'bg-purple-100 text-purple-700 font-medium' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <FaCog />
              الإعدادات
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition hover:bg-red-50 text-red-600"
            >
              <FaSignOutAlt />
              تسجيل الخروج
            </button>
          </nav>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 p-8">
        {/* الهيدر */}
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {activeTab === 'overview' && 'نظرة عامة'}
              {activeTab === 'courses' && 'إدارة الكورسات'}
              {activeTab === 'students' && 'الطلاب المشتركين'}
              {activeTab === 'messages' && 'الرسائل والمحادثات'}
              {activeTab === 'earnings' && 'الأرباح والمدفوعات'}
              {activeTab === 'settings' && 'الإعدادات'}
            </h1>
            <p className="text-gray-600 mt-1">
              {new Date().toLocaleDateString('ar-EG', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          {/* زر إضافة كورس */}
          {activeTab === 'courses' && (
            <Link
              href="/teacher/courses/new"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition"
            >
              <FaPlus />
              إضافة كورس جديد
            </Link>
          )}
        </header>

        {/* نظرة عامة */}
        {activeTab === 'overview' && (
          <div>
            {/* الإحصائيات */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <FaDollarSign className="text-3xl text-green-500" />
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                    +12% هذا الشهر
                  </span>
                </div>
                <h3 className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} ج.م</h3>
                <p className="text-gray-500 text-sm">إجمالي الأرباح</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <FaUsers className="text-3xl text-blue-500" />
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {stats.activeStudents} نشط
                  </span>
                </div>
                <h3 className="text-2xl font-bold">{stats.totalStudents}</h3>
                <p className="text-gray-500 text-sm">إجمالي الطلاب</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <FaBookOpen className="text-3xl text-purple-500" />
                  <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                    {stats.totalLessons} درس
                  </span>
                </div>
                <h3 className="text-2xl font-bold">{stats.totalCourses}</h3>
                <p className="text-gray-500 text-sm">الكورسات المنشورة</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <FaStar className="text-3xl text-yellow-500" />
                  <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                    ممتاز
                  </span>
                </div>
                <h3 className="text-2xl font-bold">{stats.averageRating}</h3>
                <p className="text-gray-500 text-sm">متوسط التقييم</p>
              </div>
            </div>

            {/* آخر النشاطات */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">آخر النشاطات</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <FaCheckCircle className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">أحمد محمد أكمل درس "المتغيرات في JavaScript"</p>
                    <p className="text-sm text-gray-500">منذ 15 دقيقة</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FaUsers className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">3 طلاب جدد انضموا لكورس React.js</p>
                    <p className="text-sm text-gray-500">منذ ساعة</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <FaComments className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">لديك 2 رسائل جديدة من الطلاب</p>
                    <p className="text-sm text-gray-500">منذ ساعتين</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* إدارة الكورسات */}
        {activeTab === 'courses' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {courses.map(course => (
              <div key={course.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-course.jpg';
                  }}
                />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg">{course.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded ${
                      course.isPublished 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {course.isPublished ? 'منشور' : 'مسودة'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {course.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <FaUsers />
                      <span>{course.studentsCount} طالب</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaVideo />
                      <span>{course.lessonsCount} درس</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaStar className="text-yellow-500" />
                      <span>{course.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaDollarSign />
                      <span>{course.price} ج.م</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/teacher/courses/${course.id}/edit`}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
                    >
                      <FaEdit />
                      تعديل
                    </Link>
                    <Link
                      href={`/teacher/courses/${course.id}/lessons`}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                    >
                      <FaVideo />
                      الدروس
                    </Link>
                    <button className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition">
                      <FaEye />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* قائمة الطلاب */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">الطلاب المشتركين</h2>
                <div className="flex gap-2">
                  <input
                    type="search"
                    placeholder="بحث..."
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-500"
                  />
                  <select className="px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-500">
                    <option>كل الكورسات</option>
                    {courses.map(course => (
                      <option key={course.id}>{course.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الطالب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الكورس
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التقدم
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الانضمام
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      آخر نشاط
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map(student => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className="w-10 h-10 rounded-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/default-avatar.png';
                            }}
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{student.courseName}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${student.progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{student.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.enrolledDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded ${
                          student.lastActive === 'الآن' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {student.lastActive}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-purple-600 hover:text-purple-900 ml-3">
                          <FaComments />
                        </button>
                        <button className="text-blue-600 hover:text-blue-900">
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* الرسائل */}
        {activeTab === 'messages' && (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">الرسائل والمحادثات</h2>
            </div>
            <div className="divide-y">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`p-6 hover:bg-gray-50 cursor-pointer ${
                    !message.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={message.studentAvatar}
                      alt={message.studentName}
                      className="w-12 h-12 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default-avatar.png';
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="font-medium">{message.studentName}</span>
                          <span className="text-sm text-gray-500 mr-2">• {message.courseTitle}</span>
                        </div>
                        <span className="text-sm text-gray-500">{message.time}</span>
                      </div>
                      <p className="text-gray-700">{message.content}</p>
                      <button className="mt-2 text-purple-600 hover:text-purple-700 text-sm font-medium">
                        الرد على الرسالة ←
                      </button>
                    </div>
                    {!message.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
