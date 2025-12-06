'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FaArrowRight, FaSave } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import supabase from '@/lib/supabase-client';
import { uploadCourseImage } from '@/lib/supabase-upload';
import { updateCourse } from '@/services/supabase-service';

interface OriginalMeta {
  duration: number;
  isFeatured: boolean;
}

export default function TeacherEditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const courseId = (params as any)?.courseId as string | undefined;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [isPublished, setIsPublished] = useState<boolean>(true);

  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');

  const [originalMeta, setOriginalMeta] = useState<OriginalMeta>({
    duration: 0,
    isFeatured: false,
  });

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
    'علوم',
  ];

  const levels = [
    { value: 'beginner', label: 'الابتدائية' },
    { value: 'intermediate', label: 'الإعدادية' },
    { value: 'advanced', label: 'الثانوية العامة' },
    { value: 'university', label: 'الجامعة' },
    { value: 'all-levels', label: 'جميع المستويات' },
  ];

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const loadCourse = async () => {
      if (authLoading || !isAuthenticated || !user || !courseId) return;

      if (user.role !== 'teacher') {
        toast.error('يجب تسجيل الدخول كمدرس');
        router.replace('/');
        return;
      }

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (error || !data) {
          console.error('Error loading course for teacher edit page:', error);
          toast.error('تعذر تحميل بيانات الكورس');
          router.replace('/teacher/dashboard');
          return;
        }

        if (data.instructor_id !== user.id) {
          toast.error('لا يمكنك تعديل كورس لا تملكه');
          router.replace('/teacher/dashboard');
          return;
        }

        setTitle(data.title || '');
        setDescription(data.description || '');
        setCategory(data.category || '');
        setLevel(data.level || '');
        setPrice(
          data.price !== null && data.price !== undefined ? String(data.price) : ''
        );
        setDiscountPrice(
          data.discount_price !== null && data.discount_price !== undefined
            ? String(data.discount_price)
            : ''
        );
        setIsPublished(!!data.is_published);

        const thumb = data.thumbnail || '/placeholder-course.jpg';
        setThumbnailUrl(thumb);
        setThumbnailPreview(thumb);

        setOriginalMeta({
          duration: data.duration_hours || 0,
          isFeatured: !!data.is_featured,
        });
      } catch (err) {
        console.error('Unexpected error loading course for teacher edit:', err);
        toast.error('حدث خطأ أثناء تحميل بيانات الكورس');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && isAuthenticated && user && courseId) {
      loadCourse();
    }
  }, [authLoading, isAuthenticated, user, courseId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!courseId || !user) return;

    if (!title || !description || !category || !level || !price) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const priceValue = parseFloat(price);
    const discountValue = discountPrice ? parseFloat(discountPrice) : null;

    if (isNaN(priceValue) || priceValue <= 0) {
      toast.error('السعر يجب أن يكون أكبر من صفر');
      return;
    }

    if (discountValue !== null) {
      if (isNaN(discountValue) || discountValue <= 0) {
        toast.error('السعر بعد الخصم يجب أن يكون أكبر من صفر');
        return;
      }
      if (discountValue >= priceValue) {
        toast.error('السعر بعد الخصم يجب أن يكون أقل من السعر الأصلي');
        return;
      }
    }

    try {
      setSaving(true);

      let finalThumbnail = thumbnailUrl || '/placeholder-course.jpg';

      if (thumbnailFile) {
        const uploadResult = await uploadCourseImage(thumbnailFile);

        if (!uploadResult.success || !uploadResult.url) {
          toast.error('فشل في رفع صورة الكورس');
          setSaving(false);
          return;
        }

        finalThumbnail = uploadResult.url;
      }

      const updates = {
        title,
        description,
        category,
        level,
        price: priceValue,
        discountPrice: discountValue,
        thumbnail: finalThumbnail,
        duration: originalMeta.duration,
        isPublished,
        isFeatured: originalMeta.isFeatured,
      };

      const result = await updateCourse(courseId, updates);

      if (!result.success) {
        console.error('Error updating course from teacher edit page:', result.error);
        toast.error('فشل حفظ تعديلات الكورس');
        return;
      }

      toast.success('تم تحديث بيانات الكورس بنجاح');
      router.push('/teacher/dashboard');
    } catch (err) {
      console.error('Unexpected error updating course from teacher edit page:', err);
      toast.error('حدث خطأ أثناء حفظ التعديلات');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-600">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p>جاري تحميل بيانات الكورس...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== 'teacher' || !courseId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/teacher/dashboard')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full flex items-center justify-center"
            >
              <FaArrowRight />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">تعديل الكورس</h1>
              <p className="text-gray-600 text-sm">تعديل معلومات الكورس الأساسية وصورته</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold mb-2">عنوان الكورس *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold mb-2">وصف الكورس *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none h-28"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">الفئة *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">اختر الفئة</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">المستوى *</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">اختر المستوى</option>
                {levels.map((lvl) => (
                  <option key={lvl.value} value={lvl.value}>
                    {lvl.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">السعر (جنيه) *</label>
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">السعر بعد الخصم (اختياري)</label>
              <input
                type="number"
                min={0}
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">صورة الكورس</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setThumbnailFile(file);
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    if (event.target?.result) {
                      setThumbnailPreview(event.target.result as string);
                    }
                  };
                  reader.readAsDataURL(file);
                } else {
                  setThumbnailPreview(thumbnailUrl || '');
                }
              }}
              className="w-full"
            />
            {(thumbnailPreview || thumbnailUrl) && (
              <div className="mt-3">
                <img
                  src={thumbnailPreview || thumbnailUrl}
                  alt="معاينة صورة الكورس"
                  className="w-full max-h-56 object-cover rounded-lg border"
                />
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              يمكنك ترك الحقل فارغًا للاحتفاظ بالصورة الحالية، أو رفع صورة جديدة لاستبدالها.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="publishCourse"
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="publishCourse" className="text-sm text-gray-700 cursor-pointer">
              جعل الكورس منشورًا ومتاحًا للطلاب
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push('/teacher/dashboard')}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-lg bg-purple-600 text-white flex items-center gap-2 hover:bg-purple-700 disabled:opacity-50"
            >
              {saving ? (
                'جاري الحفظ...'
              ) : (
                <>
                  <FaSave /> حفظ التعديلات
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
