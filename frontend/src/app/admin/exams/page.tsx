"use client";

import { useState, useEffect } from "react";
import { Exam, Question } from "@/types/exam";
import { useRouter } from "next/navigation";
import { FaPlus, FaEdit, FaTrash, FaClock, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import AdminLayout from "../../../components/AdminLayout";
import userStorage from "@/services/userStorage";

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const token = userStorage.getAuthToken();
        if (!token) {
          setError("غير مصرح به. الرجاء تسجيل الدخول");
          setLoading(false);
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/exams`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`فشل جلب الاختبارات: ${response.status}`);
        }

        const data = await response.json();
        setExams(data.exams || []);
      } catch (error) {
        console.error('خطأ في تحميل الاختبارات:', error);
        setError("تعذر تحميل الاختبارات. يرجى المحاولة مرة أخرى لاحقًا.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchExams();
  }, []);

  // حذف اختبار
  const handleDeleteExam = async (examId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الاختبار؟')) {
      try {
        const token = userStorage.getAuthToken();
        if (!token) {
          setError("غير مصرح به. الرجاء تسجيل الدخول");
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/exams/${examId}`, { 
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`فشل حذف الاختبار: ${response.status}`);
        }

        setExams(exams.filter(exam => exam.id !== examId));
      } catch (error) {
        console.error('خطأ في حذف الاختبار:', error);
        setError("تعذر حذف الاختبار. يرجى المحاولة مرة أخرى لاحقًا.");
      }
    }
  };

  // إنشاء اختبار جديد
  const handleCreateExam = async (examData: Exam) => {
    try {
      const token = userStorage.getAuthToken();
      if (!token) {
        setError("غير مصرح به. الرجاء تسجيل الدخول");
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/exams`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(examData)
      });

      if (!response.ok) {
        throw new Error(`فشل إنشاء الاختبار: ${response.status}`);
      }

      const newExam = await response.json();
      setExams([...exams, newExam.exam]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('خطأ في إنشاء الاختبار:', error);
      setError("تعذر إنشاء الاختبار. يرجى المحاولة مرة أخرى لاحقًا.");
    }
  };

  // تحديث اختبار
  const handleUpdateExam = async (examData: Exam) => {
    try {
      const token = userStorage.getAuthToken();
      if (!token) {
        setError("غير مصرح به. الرجاء تسجيل الدخول");
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/exams/${examData.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(examData)
      });

      if (!response.ok) {
        throw new Error(`فشل تحديث الاختبار: ${response.status}`);
      }

      setExams(exams.map(exam => exam.id === examData.id ? examData : exam));
      setShowEditModal(false);
    } catch (error) {
      console.error('خطأ في تحديث الاختبار:', error);
      setError("تعذر تحديث الاختبار. يرجى المحاولة مرة أخرى لاحقًا.");
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">إدارة الاختبارات</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <FaPlus className="mr-2" />
            إضافة اختبار جديد
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error && exams.length === 0 ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <p>{error}</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded relative" role="alert">
            <p>لا توجد اختبارات متاحة حاليًا. أضف اختبارًا جديدًا للبدء.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">العنوان</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">المادة</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">المدة</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">عدد الأسئلة</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {exams.map((exam) => (
                  <tr key={exam.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{exam.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{exam.courseId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{exam.duration} دقيقة</td>
                    <td className="px-6 py-4 whitespace-nowrap">{exam.questions.length}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedExam(exam);
                          setShowEditModal(true);
                        }}
                        className="text-green-600 hover:text-green-800 mr-4"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteExam(exam.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Modal لإنشاء اختبار جديد */}
      {showCreateModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-white rounded-lg p-6 max-w-2xl w-full"
          >
            <h2 className="text-xl font-bold mb-4">إنشاء اختبار جديد</h2>
            {/* نموذج إنشاء الاختبار */}
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">العنوان</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">المادة</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">المدة (دقائق)</label>
                  <input
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">نوع الأسئلة</label>
                  <select
                    multiple
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  >
                    <option value="multipleChoice">اختيار من متعدد</option>
                    <option value="trueFalse">صحيح/خطأ</option>
                    <option value="fillIn">إكمال النقص</option>
                    <option value="matching">تطابق</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  onClick={() => {
                    // هنا نقوم بإرسال البيانات إلى الخادم
                    setShowCreateModal(false);
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                >
                  إنشاء
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Modal لتعديل الاختبار */}
      {showEditModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-white rounded-lg p-6 max-w-2xl w-full"
          >
            <h2 className="text-xl font-bold mb-4">تعديل الاختبار</h2>
            {/* نموذج تعديل الاختبار */}
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">العنوان</label>
                  <input
                    type="text"
                    defaultValue={selectedExam?.title}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">المادة</label>
                  <input
                    type="text"
                    defaultValue={selectedExam?.courseId}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">المدة (دقائق)</label>
                  <input
                    type="number"
                    defaultValue={selectedExam?.duration}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">نوع الأسئلة</label>
                  <select
                    multiple
                    defaultValue={selectedExam?.questions.map(q => q.type)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  >
                    <option value="multipleChoice">اختيار من متعدد</option>
                    <option value="trueFalse">صحيح/خطأ</option>
                    <option value="fillIn">إكمال النقص</option>
                    <option value="matching">تطابق</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  onClick={() => {
                    // هنا نقوم بإرسال البيانات المحدثة إلى الخادم
                    setShowEditModal(false);
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                >
                  حفظ التغييرات
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      
      {/* Mostrar mensaje de error si existe */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg">
          <p>{error}</p>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
