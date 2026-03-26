'use client';

import { useState, useEffect } from 'react';
import { FaTrophy, FaStar, FaMedal, FaAward, FaCertificate, FaSearch, FaFilter, FaChartLine } from 'react-icons/fa';

interface Achievement {
  _id: string;
  type: 'quiz_completed' | 'lesson_completed' | 'course_completed' | 'certificate_earned' | 'assignment_submitted' | 'milestone_reached';
  title: string;
  description: string;
  points: number;
  earnedAt: string;
  metadata?: {
    score?: number;
    grade?: string;
  };
}

interface StudentAchievements {
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  totalPoints: number;
  achievements: Achievement[];
  coursesCompleted: number;
  quizzesCompleted: number;
}

export default function AchievementsManagement() {
  const [students, setStudents] = useState<StudentAchievements[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentAchievements[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentAchievements | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      // جلب إsنجازات الطلاب من API
      const response = await fetch(`${API_URL}/api/admin/achievements`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const achievementsData = data.achievements || data || [];
        console.log(`✅ تم جلب ${achievementsData.length} إنجاز من قاعدة البيانات`);
        setStudents(achievementsData);
      } else {
        console.warn('⚠️ لا توجد بيانات إنجازات متاحة');
        setStudents([]);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب الإنجازات:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentPhone.includes(searchTerm)
      );
    }

    // Sort by total points
    filtered.sort((a, b) => b.totalPoints - a.totalPoints);

    setFilteredStudents(filtered);
  };

  const getAchievementIcon = (type: string) => {
    const icons = {
      quiz_completed: <FaStar className="text-yellow-500" />,
      lesson_completed: <FaMedal className="text-blue-500" />,
      course_completed: <FaTrophy className="text-green-500" />,
      certificate_earned: <FaCertificate className="text-purple-500" />,
      assignment_submitted: <FaAward className="text-red-500" />,
      milestone_reached: <FaChartLine className="text-indigo-500" />
    };
    return icons[type as keyof typeof icons] || <FaStar />;
  };

  const getAchievementTypeLabel = (type: string) => {
    const labels = {
      quiz_completed: 'إكمال اختبار',
      lesson_completed: 'إكمال درس',
      course_completed: 'إكمال دورة',
      certificate_earned: 'الحصول على شهادة',
      assignment_submitted: 'تقديم واجب',
      milestone_reached: 'تحقيق إنجاز'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <FaTrophy className="text-yellow-500" />
            إنجازات الطلاب
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            تتبع وعرض إنجازات كل طالب
          </p>
        </div>

        {/* Search and Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          {/* Search */}
          <div className="relative mb-6">
            <FaSearch className="absolute right-3 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="البحث بالاسم، الهاتف أو البريد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg">
              <FaTrophy className="text-3xl text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {students.reduce((sum, s) => sum + s.totalPoints, 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي النقاط</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
              <FaCertificate className="text-3xl text-green-600 dark:text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {students.reduce((sum, s) => sum + s.coursesCompleted, 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">دورات مكتملة</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
              <FaStar className="text-3xl text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {students.reduce((sum, s) => sum + s.quizzesCompleted, 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">اختبارات مكتملة</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
              <FaChartLine className="text-3xl text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {students.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">طلاب نشطين</p>
            </div>
          </div>
        </div>

        {/* Students Leaderboard */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FaMedal className="text-yellow-500" />
              لوحة المتصدرين
            </h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredStudents.length === 0 ? (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                لا توجد نتائج
              </div>
            ) : (
              filteredStudents.map((student, index) => (
                <div
                  key={student.studentId}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedStudent(student)}
                >
                  <div className="flex items-center justify-between">
                    {/* Rank and Student Info */}
                    <div className="flex items-center gap-4 flex-1">
                      {/* Rank Badge */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                          index === 2 ? 'bg-orange-400 text-orange-900' :
                            'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}>
                        {index + 1}
                      </div>

                      {/* Student Details */}
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                          {student.studentName}
                        </h3>
                        <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <span>{student.studentEmail}</span>
                          <span>{student.studentPhone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6 items-center">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">
                          {student.totalPoints}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">نقطة</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                          {student.coursesCompleted}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">دورات</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                          {student.quizzesCompleted}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">اختبارات</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                          {student.achievements.length}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">إنجازات</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedStudent.studentName}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {selectedStudent.studentEmail} • {selectedStudent.studentPhone}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Student Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center p-3 bg-primary/10 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{selectedStudent.totalPoints}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">إجمالي النقاط</p>
                </div>
                <div className="text-center p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {selectedStudent.coursesCompleted}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">دورات مكتملة</p>
                </div>
                <div className="text-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {selectedStudent.achievements.length}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">إنجازات</p>
                </div>
              </div>
            </div>

            {/* Achievements List */}
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FaTrophy className="text-yellow-500" />
                الإنجازات ({selectedStudent.achievements.length})
              </h3>

              <div className="space-y-3">
                {selectedStudent.achievements.map((achievement) => (
                  <div
                    key={achievement._id}
                    className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-r-4 border-primary"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl mt-1">
                        {getAchievementIcon(achievement.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white">
                              {achievement.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {achievement.description}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                              {getAchievementTypeLabel(achievement.type)} •
                              {new Date(achievement.earnedAt).toLocaleDateString('ar-EG', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="text-lg font-bold text-primary">
                              +{achievement.points}
                            </p>
                            <p className="text-xs text-gray-500">نقطة</p>
                          </div>
                        </div>

                        {achievement.metadata && (
                          <div className="mt-3 flex gap-3 text-sm">
                            {achievement.metadata.score && (
                              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                النتيجة: {achievement.metadata.score}%
                              </span>
                            )}
                            {achievement.metadata.grade && (
                              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                                التقدير: {achievement.metadata.grade}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
