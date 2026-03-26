'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { 
  FaUser, FaPhone, FaEnvelope, FaGraduationCap, FaTrophy,
  FaArrowLeft, FaChartLine, FaClock, FaCheckCircle, FaStar
} from 'react-icons/fa';

export default function StudentDetailsPage() {
  const params = useParams();
  const studentId = params?.id as string;
  const [student, setStudent] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentDetails();
  }, [studentId]);

  const fetchStudentDetails = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/users/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const studentData = data.user || data;
        console.log('✅ تم جلب بيانات الطالب من قاعدة البيانات');
        setStudent(studentData);
        
        // جلب إنجازات الطالب
        const achResponse = await fetch(`${API_URL}/api/users/${studentId}/achievements`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (achResponse.ok) {
          const achData = await achResponse.json();
          setAchievements(achData.achievements || []);
        }
      } else {
        console.warn('⚠️ لم يتم العثور على الطالب');
      }
    } catch (error) {
      console.error('❌ خطأ في جلب بيانات الطالب:', error);
    } finally {
      setLoading(false);
    }
  };

  const mockStudent = {
    id: 1,
    name: 'معتصم',
    grade: 'الصف الأول',
    email: 'mohammed@example.com',
    phone: '0123456789',
    parentPhone: '0123456789',
    totalPoints: 100,
    joinDate: '2022-01-01',
    isActive: true,
    courses: [
      {
        id: 1,
        title: 'دورة Python',
        grade: 'A',
        progress: 50,
        lastAccessed: '2024-10-04',
        timeSpent: 3600
      },
      {
        id: 2,
        title: 'دورة JavaScript',
        grade: 'B',
        progress: 30,
        lastAccessed: '2024-10-04',
        timeSpent: 1800,
        badge: '🏆'
      }
    ],
    achievements: [
      {
        id: 1,
        type: 'course_completed',
        title: 'أول دورة',
        description: 'أكمل أول دورة',
        courseTitle: 'دورة Python للمبتدئين',
        date: '2024-09-15',
        icon: '🎓'
      },
      {
        id: 2,
        type: 'streak',
        title: 'أسبوع متواصل',
        description: 'تعلم لمدة 7 أيام متواصلة',
        date: '2024-09-20',
        icon: '🔥'
      },
      {
        id: 3,
        type: 'milestone_reached',
        title: 'وصل لـ 50%',
        description: 'أتم 50% من دورة Python',
        courseTitle: 'دورة Python للمبتدئين',
        date: '2024-09-25',
        icon: '🏆'
      }
    ]
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <p className="text-gray-500 text-lg">جاري التحميل...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!student) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p className="text-red-500">الطالب غير موجود</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/admin/users"
            className="text-primary hover:text-primary-dark flex items-center gap-2 mb-4"
          >
            <FaArrowLeft /> رجوع للطلاب
          </Link>
          <h1 className="text-3xl font-bold">تفاصيل الطالب</h1>
        </div>

        {/* معلومات الطالب الأساسية */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* البطاقة الشخصية */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-primary to-purple-600 rounded-lg p-6 text-white shadow-lg">
              <div className="flex items-center justify-center mb-4">
                <div className="w-24 h-24 bg-white text-primary rounded-full flex items-center justify-center text-4xl font-bold">
                  {student.name.charAt(0)}
                </div>
              </div>
              <h2 className="text-2xl font-bold text-center mb-2">{student.name}</h2>
              <p className="text-center text-blue-100 mb-4">{student.grade}</p>
              
              <div className="space-y-3 mt-4">
                <div className="flex items-center gap-3 bg-white bg-opacity-20 p-3 rounded">
                  <FaEnvelope />
                  <div className="text-sm">
                    <p className="opacity-80">البريد الإلكتروني</p>
                    <p className="font-medium">{student.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-white bg-opacity-20 p-3 rounded">
                  <FaPhone />
                  <div className="text-sm">
                    <p className="opacity-80">رقم الطالب</p>
                    <p className="font-medium">{student.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-white bg-opacity-20 p-3 rounded">
                  <FaPhone />
                  <div className="text-sm">
                    <p className="opacity-80">رقم ولي الأمر</p>
                    <p className="font-medium">{student.parentPhone}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white border-opacity-20">
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-80">إجمالي النقاط</span>
                  <span className="text-2xl font-bold">{student.totalPoints} 🏆</span>
                </div>
              </div>
            </div>
          </div>

          {/* الإحصائيات */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">الكورسات المسجل فيها</p>
                    <p className="text-3xl font-bold text-blue-600">{student.courses.length}</p>
                  </div>
                  <FaGraduationCap className="text-5xl text-blue-600 opacity-20" />
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">إجمالي الإنجازات</p>
                    <p className="text-3xl font-bold text-green-600">{achievements.length}</p>
                  </div>
                  <FaTrophy className="text-5xl text-green-600 opacity-20" />
                </div>
              </div>

              <div className="bg-purple-50 p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">متوسط التقدم</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {Math.round(student.courses.reduce((sum: number, c: any) => sum + c.progress, 0) / student.courses.length)}%
                    </p>
                  </div>
                  <FaChartLine className="text-5xl text-purple-600 opacity-20" />
                </div>
              </div>

              <div className="bg-orange-50 p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">الوقت المستغرق</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {Math.round(student.courses.reduce((sum: number, c: any) => sum + c.timeSpent, 0) / 60)}h
                    </p>
                  </div>
                  <FaClock className="text-5xl text-orange-600 opacity-20" />
                </div>
              </div>
            </div>

            {/* الحالة */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-lg mb-4">معلومات إضافية</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">تاريخ الانضمام</p>
                  <p className="font-medium">{student.joinDate}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">الحالة</p>
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    student.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {student.isActive ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* الكورسات */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
            <FaGraduationCap className="text-primary" />
            الكورسات ({student.courses.length})
          </h3>
          <div className="space-y-4">
            {student.courses.map((course: any) => (
              <div key={course.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-lg">{course.title}</h4>
                    <p className="text-sm text-gray-600">آخر دخول: {course.lastAccessed}</p>
                  </div>
                  <span className="bg-primary text-white px-3 py-1 rounded font-bold">
                    {course.grade}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">التقدم</span>
                    <span className="text-sm font-bold text-primary">{course.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-primary to-purple-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-2xl font-bold text-blue-600">{course.completedLessons}/{course.totalLessons}</p>
                    <p className="text-xs text-gray-600">الدروس المكتملة</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-2xl font-bold text-green-600">{Math.round(course.timeSpent / 60)}h</p>
                    <p className="text-xs text-gray-600">الوقت المستغرق</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="text-2xl font-bold text-purple-600">{course.progress}%</p>
                    <p className="text-xs text-gray-600">نسبة الإنجاز</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* الإنجازات */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
            <FaTrophy className="text-yellow-500" />
            الإنجازات ({achievements.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement: any) => (
              <div key={achievement.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="text-4xl">{achievement.badge}</div>
                  <div className="flex-1">
                    <h4 className="font-bold mb-1">{achievement.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">{achievement.courseTitle}</span>
                      <span className="text-sm font-bold text-yellow-600">+{achievement.points} نقطة</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{achievement.earnedAt}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
