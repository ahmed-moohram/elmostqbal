"use client";
import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaPlusCircle, FaClipboardList, FaBook } from "react-icons/fa";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "react-hot-toast";

interface Course {
  _id: string;
  title: string;
  description: string;
  price?: number;
  image?: string;
  isPublished?: boolean;
  paymentOptions?: Array<{
    type: string;
    price: number;
    currency?: string;
  }>;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState<number>(0);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    setError('');
    
    try {
      // استخدام Supabase مباشرة
      const { createClient } = await import('@supabase/supabase-js');
      const SUPABASE_URL = 'https://wnqifmvgvlmxgswhcwnc.supabase.co';
      const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWlmbXZndmxteGdzd2hjd25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MzYwNTUsImV4cCI6MjA3ODAxMjA1NX0.LqWhTZYmr7nu-dIy2uBBqntOxoWM-waluYIR9bipC9M';
      
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      
      console.log('🔍 جاري جلب الدورات من Supabase...');
      
      // جلب الدورات من قاعدة البيانات
      const { data: coursesData, error: fetchError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        console.error('❌ خطأ من Supabase:', fetchError);
        throw new Error(fetchError.message);
      }
      
      console.log(`✅ تم جلب ${coursesData?.length || 0} دورة من قاعدة البيانات`);
      console.log('📋 الدورات:', coursesData);
      
      // تحويل البيانات للشكل المطلوب
      const formattedCourses = (coursesData || []).map(course => ({
        _id: course.id,
        title: course.title || 'بدون عنوان',
        description: course.description || 'بدون وصف',
        price: course.price || 0,
        image: course.thumbnail || '/course-placeholder.png',
        isPublished: course.is_published || false,
        instructor: course.instructor_name || 'غير محدد',
        category: course.category || 'عام',
        level: course.level || 'مبتدئ',
        duration: course.duration_hours || 0,
        paymentOptions: [
          {
            type: 'full',
            price: course.price || 0,
            currency: 'EGP'
          }
        ]
      }));
      
      setCourses(formattedCourses);
      setLoading(false);
      
    } catch (error: any) {
      console.error('❌ خطأ في جلب الدورات:', error);
      setError('فشل في تحميل الدورات. الرجاء المحاولة مرة أخرى.');
      setCourses([]);
      setLoading(false);
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const SUPABASE_URL = 'https://wnqifmvgvlmxgswhcwnc.supabase.co';
      const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWlmbXZndmxteGdzd2hjd25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MzYwNTUsImV4cCI6MjA3ODAxMjA1NX0.LqWhTZYmr7nu-dIy2uBBqntOxoWM-waluYIR9bipC9M';
      
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      
      const { error } = await supabase
        .from('courses')
        .update({ is_published: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      // تحديث القائمة المحلية
      setCourses(courses.map(c => 
        c._id === id ? { ...c, isPublished: !currentStatus } : c
      ));
      toast.success(!currentStatus ? '✅ تم نشر الدورة!' : '⚠️ تم إلغاء نشر الدورة');
    } catch (error) {
      console.error('❌ خطأ في تحديث حالة النشر:', error);
      toast.error('❌ حدث خطأ!');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الدورة؟')) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const SUPABASE_URL = 'https://wnqifmvgvlmxgswhcwnc.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWlmbXZndmxteGdzd2hjd25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MzYwNTUsImV4cCI6MjA3ODAxMjA1NX0.LqWhTZYmr7nu-dIy2uBBqntOxoWM-waluYIR9bipC9M';
        
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        
        const { error } = await supabase
          .from('courses')
          .delete()
          .eq('id', id);
        
        if (!error) {
          // ✅ حذف فوري من القائمة المحلية
          setCourses(courses.filter(c => c._id !== id));
          
          // ✅ مسح أي Cache موجود
          sessionStorage.clear();
          localStorage.removeItem('coursesCache');
          
          console.log('✅ تم حذف الدورة فوراً!');
          
          // ✅ إشعار نجاح
          alert('✅ تم حذف الدورة بنجاح! التغييرات ستظهر فوراً في جميع الصفحات.');
        } else {
          alert('❌ فشل حذف الدورة!');
        }
      } catch (error) {
        console.error('❌ خطأ في حذف الدورة:', error);
        alert('❌ حدث خطأ أثناء الحذف!');
      }
    }
  };

  const handleEdit = (course: Course) => {
    setEditId(course._id);
    setEditTitle(course.title);
    setEditDescription(course.description);
    setEditPrice(course.price ?? 0);
  };

  const handleSave = () => {
    setCourses(
      courses.map((c) =>
        c._id === editId ? { ...c, title: editTitle, description: editDescription, price: editPrice } : c
      )
    );
    setEditId(null);
    toast.success("تم تحديث الدورة بنجاح");
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex flex-wrap gap-3 items-center mb-6 justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FaBook className="text-primary" />
            إدارة الدورات
          </h1>
          <div className="flex gap-2">
            <Link
              href="/admin/enrollments"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg shadow font-medium transition"
            >
              <FaClipboardList />
              قائمة الاشتراكات
            </Link>
            <Link
              href="/admin/courses/new"
              className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg shadow font-medium transition"
            >
              <FaPlusCircle />
              إضافة دورة
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">جاري التحميل...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">العنوان</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الوصف</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">السعر</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">الحالة</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">تعديل</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">حذف</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {courses.map((course) => (
              <tr key={course._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  {editId === course._id ? (
                    <input 
                      value={editTitle} 
                      onChange={(e) => setEditTitle(e.target.value)} 
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : (
                    <span className="font-medium">{course.title}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {editId === course._id ? (
                    <input 
                      value={editDescription} 
                      onChange={(e) => setEditDescription(e.target.value)} 
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : (
                    course.description
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {editId === course._id ? (
                    <input 
                      type="number" 
                      value={editPrice} 
                      onChange={(e) => setEditPrice(Number(e.target.value))} 
                      className="w-24 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : (
                    <span className="font-bold text-green-600">
                      {course.paymentOptions && course.paymentOptions.length > 0 
                        ? course.paymentOptions[0].price 
                        : (course.price || 0)
                      } ج.م
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleTogglePublish(course._id, course.isPublished || false)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      course.isPublished 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    }`}
                  >
                    {course.isPublished ? '✅ منشورة' : '⏸️ غير منشورة'}
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  {editId === course._id ? (
                    <button 
                      onClick={handleSave} 
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium"
                    >
                      حفظ
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleEdit(course)} 
                      className="text-blue-600 hover:text-blue-800 p-2"
                      title="تعديل"
                    >
                      <FaEdit className="text-lg" />
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button 
                    onClick={() => handleDelete(course._id)} 
                    className="text-red-600 hover:text-red-800 p-2"
                    title="حذف"
                  >
                    <FaTrash className="text-lg" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
