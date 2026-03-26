"use client";
import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaPlusCircle, FaClipboardList, FaBook, FaKey, FaUsers } from "react-icons/fa";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "react-hot-toast";
import supabase from '@/lib/supabase-client';

interface Course {
  _id: string;
  title: string;
  description: string;
  price?: number;
  image?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  instructor?: string;
  category?: string;
  level?: string;
  duration?: number;
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
  const [editImage, setEditImage] = useState<string>("");
  const [generatingCodesFor, setGeneratingCodesFor] = useState<string | null>(null);
  const [codeCount, setCodeCount] = useState<string>("10");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    setError('');
    
    try {
      // استخدام Supabase مباشرة (العميل الموحد)
      console.log('🔍 جاري جلب الدورات من Supabase...');
      
      // جلب الدورات من قاعدة البيانات
      const { data: coursesData, error: fetchError } = await supabase
        .from('courses')
        .select('*, instructor_user:users!courses_instructor_id_fkey(id, name, avatar_url, profile_picture)')
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
        isFeatured: course.is_featured || false,
        instructor: course?.instructor_user?.name || 'غير محدد',
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
      const nextPublished = !currentStatus;
      const formData = new FormData();
      formData.append('isPublished', String(nextPublished));

      const response = await fetch(`/api/courses/${id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'فشل تحديث حالة النشر');
      }
      
      // تحديث القائمة المحلية
      setCourses(courses.map(c => 
        c._id === id ? { ...c, isPublished: nextPublished } : c
      ));
      toast.success(!currentStatus ? '✅ تم نشر الدورة!' : '⚠️ تم إلغاء نشر الدورة');
    } catch (error) {
      console.error('❌ خطأ في تحديث حالة النشر:', error);
      toast.error('❌ حدث خطأ!');
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    try {
      const nextFeatured = !currentFeatured;
      const formData = new FormData();
      formData.append('isFeatured', String(nextFeatured));

      const response = await fetch(`/api/courses/${id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'فشل تحديث حالة التمييز');
      }

      setCourses(courses.map(c =>
        c._id === id ? { ...c, isFeatured: nextFeatured } : c
      ));
      toast.success(!currentFeatured ? '✅ تم تعيين الدورة كـ مميزة' : '⚠️ تم إلغاء تمييز الدورة');
    } catch (error) {
      console.error('❌ خطأ في تحديث حالة التمييز:', error);
      toast.error('❌ حدث خطأ في تمييز الدورة!');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الدورة كاملة من قاعدة البيانات؟')) return;
    try {
      const res = await fetch(`/api/courses/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `فشل حذف الدورة (${res.status})`);
      }
      setCourses(courses.filter(c => c._id !== id));
      sessionStorage.clear();
      localStorage.removeItem('coursesCache');
      toast.success('✅ تم حذف الدورة وكل محتواها');
    } catch (error: any) {
      console.error('❌ خطأ في حذف الدورة:', error);
      toast.error(error.message || '❌ حدث خطأ أثناء الحذف');
    }
  };

  const handleEdit = (course: Course) => {
    setEditId(course._id);
    setEditTitle(course.title);
    setEditDescription(course.description);
    setEditPrice(course.price ?? 0);
    setEditImage(course.image || "");
  };

  const handleGenerateCodes = async (courseId: string) => {
    const count = parseInt(codeCount) || 10;
    if (count <= 0 || count > 500) {
      toast.error('يرجى إدخال عدد بين 1 و 500');
      return;
    }

    if (!window.confirm(`هل تريد إنشاء ${count} كود للكورس؟`)) {
      return;
    }

    try {
      setGeneratingCodesFor(courseId);
      const response = await fetch(`/api/admin/courses/${courseId}/generate-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          count,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'فشل إنشاء الأكواد');
      }

      // نسخ الأكواد إلى الحافظة
      const codesText = data.codes.map((c: any) => c.code).join('\n');
      try {
        await navigator.clipboard.writeText(codesText);
        toast.success(`✅ تم إنشاء ${data.count} كود ونسخهم إلى الحافظة`);
      } catch (clipboardError) {
        // عرض الأكواد في نافذة منبثقة
        const codesDisplay = data.codes.map((c: any) => c.code).join('\n');
        alert(`تم إنشاء ${data.count} كود:\n\n${codesDisplay}`);
        toast.success(`✅ تم إنشاء ${data.count} كود`);
      }
    } catch (error: any) {
      console.error('Error generating codes:', error);
      toast.error(error.message || 'حدث خطأ أثناء إنشاء الأكواد');
    } finally {
      setGeneratingCodesFor(null);
    }
  };

  const handleSave = async () => {
    if (!editId) return;

    try {
      // تحديث بيانات الكورس في Supabase
      const { error: updateError } = await supabase
        .from('courses')
        .update({
          title: editTitle,
          description: editDescription,
          price: editPrice,
          thumbnail: editImage || null,
        })
        .eq('id', editId);

      if (updateError) {
        console.error('❌ خطأ في تحديث بيانات الكورس في Supabase:', updateError);
        toast.error('حدث خطأ أثناء حفظ التعديلات في قاعدة البيانات');
        return;
      }

      // تحديث الحالة المحلية بعد نجاح الحفظ
      setCourses(
        courses.map((c) =>
          c._id === editId
            ? { ...c, title: editTitle, description: editDescription, price: editPrice, image: editImage || c.image }
            : c
        )
      );
      setEditId(null);
      toast.success('تم تحديث الدورة بنجاح');
    } catch (err) {
      console.error('❌ خطأ غير متوقع أثناء حفظ تعديلات الكورس:', err);
      toast.error('حدث خطأ غير متوقع أثناء الحفظ');
    }
  };

  return (
    <AdminLayout>
      <div className="p-3 sm:p-6">
        <div className="flex flex-col md:flex-row md:flex-wrap gap-3 items-start md:items-center mb-6 md:justify-between">
          <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2">
            <FaBook className="text-primary" />
            إدارة الدورات
          </h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-sm text-gray-700 font-medium">عدد الأكواد:</label>
              <input
                type="number"
                min="1"
                max="500"
                value={codeCount}
                onChange={(e) => setCodeCount(e.target.value)}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="10"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Link
                href="/admin/payment-requests"
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg shadow font-medium transition w-full sm:w-auto"
              >
                <FaClipboardList />
                قائمة الاشتراكات
              </Link>
              <Link
                href="/admin/courses/new"
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg shadow font-medium transition w-full sm:w-auto"
              >
                <FaPlusCircle />
                إضافة دورة
              </Link>
            </div>
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 whitespace-nowrap">العنوان</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 hidden md:table-cell">الوصف</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 whitespace-nowrap">السعر</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 whitespace-nowrap">الحالة</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 whitespace-nowrap">دورة مميزة</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 whitespace-nowrap">تعديل</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 whitespace-nowrap">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {courses.map((course) => (
              <tr key={course._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  {editId === course._id ? (
                    <div className="space-y-2">
                      <input 
                        value={editTitle} 
                        onChange={(e) => setEditTitle(e.target.value)} 
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="عنوان الكورس"
                      />
                      <input
                        value={editImage}
                        onChange={(e) => setEditImage(e.target.value)}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="رابط صورة الكورس (thumbnail)"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {course.image && (
                        // عرض صورة مصغرة للكورس إن وجدت
                        // (نستخدم <img> العادي لتفادي الحاجة لاستيراد Image هنا)
                        <img
                          src={course.image}
                          alt={course.title}
                          className="w-10 h-10 rounded object-cover border border-gray-200"
                        />
                      )}
                      <span className="font-medium">{course.title}</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
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
                  <button
                    onClick={() => handleToggleFeatured(course._id, course.isFeatured || false)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      course.isFeatured
                        ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {course.isFeatured ? '⭐ مميزة' : '☆ عادية'}
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  {editId === course._id ? (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                      <button 
                        onClick={handleSave} 
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium"
                      >
                        حفظ بسيط
                      </button>
                      <Link
                        href={`/admin/courses/${course._id}/edit`}
                        className="inline-flex items-center px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-300"
                      >
                        فتح صفحة التعديل الكاملة
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                      <button 
                        onClick={() => handleEdit(course)} 
                        className="text-blue-600 hover:text-blue-800 p-2"
                        title="تعديل سريع"
                      >
                        <FaEdit className="text-lg" />
                      </button>
                      <Link
                        href={`/admin/courses/${course._id}/edit`}
                        className="inline-flex items-center px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-300"
                      >
                        تعديل كامل
                      </Link>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Link
                      href={`/admin/courses/${course._id}/students`}
                      className="text-blue-600 hover:text-blue-800 p-2"
                      title="عرض طلاب الكورس"
                    >
                      <FaUsers className="text-lg" />
                    </Link>
                    <button 
                      onClick={() => handleGenerateCodes(course._id)} 
                      disabled={generatingCodesFor === course._id}
                      className="text-purple-600 hover:text-purple-800 p-2 disabled:opacity-50"
                      title="إنشاء أكواد للكورس"
                    >
                      <FaKey className="text-lg" />
                    </button>
                    <button 
                      onClick={() => handleDelete(course._id)} 
                      className="text-red-600 hover:text-red-800 p-2"
                      title="حذف"
                    >
                      <FaTrash className="text-lg" />
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
      </div>
    </AdminLayout>
  );
}
