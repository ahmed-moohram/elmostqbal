'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FaArrowRight, FaPlus, FaVideo, FaTrash, FaEdit, FaSpinner } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import supabase from '@/lib/supabase-client';
import { uploadLessonVideo } from '@/lib/supabase-upload';

interface Section {
  id: string;
  title: string;
  description: string;
  order_index: number;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string | null;
  duration_minutes: number;
  order_index: number;
  is_free: boolean;
  is_preview: boolean;
  section_id: string | null;
}

interface LessonFormState {
  title: string;
  description: string;
  videoUrl: string;
  durationMinutes: string;
  orderIndex: string;
  isFree: boolean;
  isPreview: boolean;
}

const initialLessonForm: LessonFormState = {
  title: '',
  description: '',
  videoUrl: '',
  durationMinutes: '',
  orderIndex: '',
  isFree: false,
  isPreview: false,
};

export default function TeacherCourseLessonsPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, isLoading } = useAuth();

  const courseId = (params as any)?.courseId as string | undefined;

  const [courseTitle, setCourseTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState(false);
  const [savingLesson, setSavingLesson] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const [sections, setSections] = useState<Section[]>([]);
  const [lessonsBySection, setLessonsBySection] = useState<Record<string, Lesson[]>>({});
  const [unsectionedLessons, setUnsectionedLessons] = useState<Lesson[]>([]);

  const [selectedSectionId, setSelectedSectionId] = useState<string>('');

  const [showNewSectionForm, setShowNewSectionForm] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');
  const [newSectionOrder, setNewSectionOrder] = useState('');

  const [lessonForm, setLessonForm] = useState<LessonFormState>(initialLessonForm);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const loadData = async () => {
      if (!user || !courseId) return;

      if (user.role !== 'teacher') {
        toast.error('يجب تسجيل الدخول كمدرس');
        router.replace('/');
        return;
      }

      try {
        setLoading(true);

        // التحقق من أن الكورس تابع لهذا المدرس
        const { data: courseRow, error: courseError } = await supabase
          .from('courses')
          .select('id, title, instructor_id')
          .eq('id', courseId)
          .maybeSingle();

        if (courseError || !courseRow) {
          console.error('Error loading course for teacher lessons page:', courseError);
          toast.error('تعذر تحميل بيانات الكورس');
          router.replace('/teacher/dashboard');
          return;
        }

        if (courseRow.instructor_id !== user.id) {
          toast.error('لا يمكنك إدارة محتوى كورس لا تملكه');
          router.replace('/teacher/dashboard');
          return;
        }

        setCourseTitle(courseRow.title || 'كورس بدون عنوان');

        // جلب الأقسام من API sections (باستخدام Service Role على الخادم)
        const sectionsRes = await fetch(`/api/sections?courseId=${courseId}`);
        let sectionsData: any = [];

        if (sectionsRes.ok) {
          const raw = await sectionsRes.json();
          sectionsData = raw.sections || raw || [];
        } else {
          console.error('Failed to load sections for course', await sectionsRes.text());
        }

        const mappedSections: Section[] = (sectionsData || []).map((s: any) => ({
          id: String(s.id),
          title: s.title || 'قسم بدون عنوان',
          description: s.description || '',
          order_index: Number(s.order_index) || 0,
        }));

        mappedSections.sort((a, b) => a.order_index - b.order_index);
        setSections(mappedSections);

        // جلب الدروس من جدول lessons
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select(
            'id, section_id, title, description, video_url, duration_minutes, order_index, is_free, is_preview'
          )
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });

        if (lessonsError) {
          console.error('Error loading lessons for teacher lessons page:', lessonsError);
        }

        const bySection: Record<string, Lesson[]> = {};
        const unsectioned: Lesson[] = [];

        (lessonsData || []).forEach((l: any) => {
          const lesson: Lesson = {
            id: String(l.id),
            title: l.title || 'درس بدون عنوان',
            description: l.description || '',
            video_url: l.video_url || null,
            duration_minutes: Number(l.duration_minutes) || 0,
            order_index: Number(l.order_index) || 0,
            is_free: !!l.is_free,
            is_preview: !!l.is_preview,
            section_id: l.section_id ? String(l.section_id) : null,
          };

          if (lesson.section_id) {
            if (!bySection[lesson.section_id]) {
              bySection[lesson.section_id] = [];
            }
            bySection[lesson.section_id].push(lesson);
          } else {
            unsectioned.push(lesson);
          }
        });

        Object.keys(bySection).forEach((key) => {
          bySection[key].sort((a, b) => a.order_index - b.order_index);
        });

        unsectioned.sort((a, b) => a.order_index - b.order_index);

        setLessonsBySection(bySection);
        setUnsectionedLessons(unsectioned);

        // اختيار أول قسم بشكل افتراضي إن وجد
        if (mappedSections.length > 0) {
          setSelectedSectionId(mappedSections[0].id);
        }
      } catch (error) {
        console.error('Unexpected error loading teacher course content:', error);
        toast.error('حدث خطأ أثناء تحميل محتوى الكورس');
      } finally {
        setLoading(false);
      }
    };

    if (!isLoading && isAuthenticated && user && courseId) {
      loadData();
    }
  }, [isLoading, isAuthenticated, user, courseId, router]);

  const handleCreateSection = async () => {
    if (!courseId) return;
    if (!newSectionTitle.trim()) {
      toast.error('يرجى إدخال عنوان للقسم');
      return;
    }

    try {
      setSavingSection(true);
      const orderIndex = newSectionOrder ? Number(newSectionOrder) : sections.length + 1;

      const res = await fetch('/api/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          title: newSectionTitle.trim(),
          description: newSectionDescription.trim(),
          orderIndex,
          lessons: [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Failed to create section:', data);
        toast.error(data?.error || 'فشل إنشاء القسم');
        return;
      }

      const rawSection = data.section || data;
      const section: Section = {
        id: String(rawSection.id),
        title: rawSection.title || newSectionTitle,
        description: rawSection.description || newSectionDescription,
        order_index: Number(rawSection.order_index) || orderIndex,
      };

      setSections((prev) => {
        const updated = [...prev, section];
        updated.sort((a, b) => a.order_index - b.order_index);
        return updated;
      });

      setSelectedSectionId(section.id);
      setNewSectionTitle('');
      setNewSectionDescription('');
      setNewSectionOrder('');
      setShowNewSectionForm(false);
      toast.success('تم إنشاء القسم بنجاح');
    } catch (error) {
      console.error('Unexpected error creating section:', error);
      toast.error('حدث خطأ أثناء إنشاء القسم');
    } finally {
      setSavingSection(false);
    }
  };

  const handleResetLessonForm = () => {
    setLessonForm(initialLessonForm);
    setEditingLessonId(null);
  };

  const handleStartCreateLesson = () => {
    if (!selectedSectionId) {
      toast.error('يرجى اختيار قسم أولاً');
      return;
    }
    handleResetLessonForm();
  };

  const handleStartEditLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson.id);
    setSelectedSectionId(lesson.section_id || '');
    setLessonForm({
      title: lesson.title || '',
      description: lesson.description || '',
      videoUrl: lesson.video_url || '',
      durationMinutes: lesson.duration_minutes ? String(lesson.duration_minutes) : '',
      orderIndex: lesson.order_index ? String(lesson.order_index) : '',
      isFree: !!lesson.is_free,
      isPreview: !!lesson.is_preview,
    });
  };

  const handleVideoFileChange = async (event: any) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    try {
      setUploadingVideo(true);

      const uploadResult = await uploadLessonVideo(file);

      if (!uploadResult.success || !uploadResult.url) {
        toast.error('فشل رفع الفيديو، حاول مرة أخرى');
        return;
      }

      setLessonForm((prev) => ({ ...prev, videoUrl: uploadResult.url || '' }));
      toast.success('تم رفع الفيديو وربطه بالدرس بنجاح');
    } catch (error) {
      console.error('Error uploading lesson video from teacher lessons page:', error);
      toast.error('حدث خطأ أثناء رفع الفيديو');
    } finally {
      setUploadingVideo(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!courseId) return;
    if (!lessonForm.title.trim()) {
      toast.error('يرجى إدخال عنوان للدرس');
      return;
    }

    if (!selectedSectionId) {
      toast.error('يرجى اختيار قسم للدرس (لا يمكن حفظ درس بدون قسم)');
      return;
    }

    const duration = Math.max(1, Number(lessonForm.durationMinutes) || 1);
    const orderIndex = lessonForm.orderIndex
      ? Number(lessonForm.orderIndex)
      : (lessonsBySection[selectedSectionId]?.length || 0) + 1;

    const targetSectionId = selectedSectionId;

    try {
      setSavingLesson(true);

      const payload: any = {
        course_id: courseId,
        section_id: targetSectionId,
        title: lessonForm.title.trim(),
        description: lessonForm.description.trim(),
        video_url: lessonForm.videoUrl.trim() || null,
        duration_minutes: duration,
        order_index: orderIndex,
        is_free: lessonForm.isFree,
        is_preview: lessonForm.isPreview,
        is_published: true,
      };

      const method = editingLessonId ? 'PUT' : 'POST';
      const body = editingLessonId ? { id: editingLessonId, ...payload } : payload;

      const res = await fetch(`/api/courses/${courseId}/lessons`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.lesson) {
        console.error('Error saving lesson via API:', json);
        toast.error(editingLessonId ? 'فشل تحديث الدرس' : 'فشل إنشاء الدرس');
        return;
      }

      const data = json.lesson;

      if (editingLessonId) {
        const updated: Lesson = {
          id: String(data.id),
          title: data.title || payload.title,
          description: data.description || payload.description,
          video_url: data.video_url || payload.video_url,
          duration_minutes: Number(data.duration_minutes) || duration,
          order_index: Number(data.order_index) || orderIndex,
          is_free: !!data.is_free,
          is_preview: !!data.is_preview,
          section_id: data.section_id ? String(data.section_id) : null,
        };

        setLessonsBySection((prev) => {
          const copy: Record<string, Lesson[]> = {};
          Object.keys(prev).forEach((k) => {
            copy[k] = [...prev[k]];
          });

          let updatedUnsectioned = [...unsectionedLessons];

          // حذف من المجموعة القديمة
          Object.keys(copy).forEach((k) => {
            copy[k] = copy[k].filter((l) => l.id !== updated.id);
          });
          updatedUnsectioned = updatedUnsectioned.filter((l) => l.id !== updated.id);

          // إضافة إلى المجموعة الجديدة
          if (updated.section_id) {
            if (!copy[updated.section_id]) copy[updated.section_id] = [];
            copy[updated.section_id].push(updated);
            copy[updated.section_id].sort((a, b) => a.order_index - b.order_index);
          } else {
            updatedUnsectioned.push(updated);
            updatedUnsectioned.sort((a, b) => a.order_index - b.order_index);
          }

          setUnsectionedLessons(updatedUnsectioned);
          return copy;
        });

        toast.success('تم تحديث الدرس بنجاح');
      } else {
        const created: Lesson = {
          id: String(data.id),
          title: data.title || payload.title,
          description: data.description || payload.description,
          video_url: data.video_url || payload.video_url,
          duration_minutes: Number(data.duration_minutes) || duration,
          order_index: Number(data.order_index) || orderIndex,
          is_free: !!data.is_free,
          is_preview: !!data.is_preview,
          section_id: data.section_id ? String(data.section_id) : null,
        };

        if (created.section_id) {
          setLessonsBySection((prev) => {
            const sectionKey = String(created.section_id);
            const list = prev[sectionKey] ? [...prev[sectionKey]] : [];
            list.push(created);
            list.sort((a, b) => a.order_index - b.order_index);
            return { ...prev, [sectionKey]: list };
          });
        } else {
          setUnsectionedLessons((prev) => {
            const list = [...prev, created];
            list.sort((a, b) => a.order_index - b.order_index);
            return list;
          });
        }

        toast.success('تم إنشاء الدرس بنجاح');
      }

      handleResetLessonForm();
    } catch (error) {
      console.error('Unexpected error saving lesson:', error);
      toast.error('حدث خطأ أثناء حفظ الدرس');
    } finally {
      setSavingLesson(false);
    }
  };

  const handleDeleteLesson = async (lesson: Lesson) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الدرس؟')) return;

    try {
      if (!courseId) return;

      const res = await fetch(`/api/courses/${courseId}/lessons`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: lesson.id }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        console.error('Error deleting lesson via API:', json);
        toast.error('فشل حذف الدرس');
        return;
      }

      if (lesson.section_id) {
        const sectionKey = String(lesson.section_id);
        setLessonsBySection((prev) => {
          const list = prev[sectionKey] ? prev[sectionKey].filter((l) => l.id !== lesson.id) : [];
          return { ...prev, [sectionKey]: list };
        });
      } else {
        setUnsectionedLessons((prev) => prev.filter((l) => l.id !== lesson.id));
      }

      if (editingLessonId === lesson.id) {
        handleResetLessonForm();
      }

      toast.success('تم حذف الدرس بنجاح');
    } catch (error) {
      console.error('Unexpected error deleting lesson:', error);
      toast.error('حدث خطأ أثناء حذف الدرس');
    }
  };

  const totalSections = sections.length;
  const totalLessons =
    Object.values(lessonsBySection).reduce((acc, list) => acc + (list ? list.length : 0), 0) +
    unsectionedLessons.length;

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-600">
          <FaSpinner className="animate-spin text-3xl" />
          <p>جاري تحميل محتوى الكورس...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== 'teacher' || !courseId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => router.push('/teacher/dashboard')}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-purple-700 mb-1"
            >
              <FaArrowRight />
              العودة إلى لوحة المدرس
            </button>
            <h1 className="text-2xl font-bold text-gray-800">إدارة محتوى الكورس</h1>
            <p className="text-gray-600 text-sm mt-1">{courseTitle}</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* قائمة الأقسام */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg">الأقسام</h2>
              <button
                type="button"
                onClick={() => setShowNewSectionForm((v) => !v)}
                className="flex items-center gap-1 text-sm text-purple-700 hover:text-purple-900"
              >
                <FaPlus />
                قسم جديد
              </button>
            </div>

            {sections.length === 0 && (
              <p className="text-sm text-gray-500">لا توجد أقسام بعد، ابدأ بإضافة أول قسم.</p>
            )}

            <div className="space-y-2 mt-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setSelectedSectionId(section.id)}
                  className={`w-full text-right px-3 py-2 rounded-lg text-sm border transition flex items-center justify-between ${
                    selectedSectionId === section.id
                      ? 'border-purple-500 bg-purple-50 text-purple-800'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium">
                    {section.order_index ? `${section.order_index}. ` : ''}
                    {section.title}
                  </span>
                  <span className="text-xs text-gray-500">
                    {(lessonsBySection[section.id] || []).length} درس
                  </span>
                </button>
              ))}

              {unsectionedLessons.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedSectionId('')}
                  className={`w-full text-right px-3 py-2 rounded-lg text-sm border transition flex items-center justify-between ${
                    selectedSectionId === ''
                      ? 'border-purple-500 bg-purple-50 text-purple-800'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium">دروس بدون قسم</span>
                  <span className="text-xs text-gray-500">{unsectionedLessons.length} درس</span>
                </button>
              )}
            </div>
          </div>

          {showNewSectionForm && (
            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="font-bold mb-3 text-sm">إضافة قسم جديد</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block font-medium mb-1">عنوان القسم</label>
                  <input
                    type="text"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="مثال: المقدمة"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">وصف مختصر (اختياري)</label>
                  <textarea
                    value={newSectionDescription}
                    onChange={(e) => setNewSectionDescription(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">الترتيب (اختياري)</label>
                  <input
                    type="number"
                    min={1}
                    value={newSectionOrder}
                    onChange={(e) => setNewSectionOrder(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowNewSectionForm(false)}
                    className="px-3 py-2 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateSection}
                    disabled={savingSection}
                    className="px-4 py-2 text-xs rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {savingSection ? 'جاري الحفظ...' : 'حفظ القسم'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* قائمة الدروس + نموذج الدرس */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <FaVideo />
                محتوى الدورة
              </h2>
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <span>الأقسام: {totalSections}</span>
                <span>الدروس: {totalLessons}</span>
              </div>
            </div>

            {sections.length === 0 && unsectionedLessons.length === 0 && (
              <p className="text-sm text-gray-500">
                لا توجد أقسام أو دروس بعد، ابدأ بإنشاء قسم جديد ثم أضف الدروس إليه.
              </p>
            )}

            <div className="space-y-4 mt-3 max-h-[520px] overflow-y-auto">
              {sections.map((section) => {
                const lessons = lessonsBySection[section.id] || [];
                return (
                  <div
                    key={section.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">
                          {section.order_index ? `${section.order_index}. ` : ''}
                          {section.title}
                        </h3>
                        {section.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {section.description}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSectionId(section.id);
                          handleStartCreateLesson();
                        }}
                        className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900"
                      >
                        <FaPlus className="text-[10px]" />
                        درس جديد
                      </button>
                    </div>

                    {lessons.length === 0 ? (
                      <p className="text-xs text-gray-500 bg-white border border-dashed border-gray-200 rounded-lg px-3 py-2">
                        لا توجد دروس في هذا القسم بعد.
                      </p>
                    ) : (
                      <div className="space-y-2 mt-2">
                        {lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="flex items-start justify-between gap-3 border rounded-lg px-3 py-2 text-sm bg-white"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">
                                  {lesson.order_index ? `${lesson.order_index}. ` : ''}
                                  {lesson.title}
                                </span>
                                {lesson.is_free && (
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                                    مجاني
                                  </span>
                                )}
                                {lesson.is_preview && (
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                                    معاينة
                                  </span>
                                )}
                              </div>
                              {lesson.description && (
                                <p className="text-gray-600 text-xs mb-1 line-clamp-2">{lesson.description}</p>
                              )}
                              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                <span>المدة: {lesson.duration_minutes || 0} دقيقة</span>
                                {lesson.video_url && (
                                  <a
                                    href={lesson.video_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    فتح الفيديو
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                              <button
                                type="button"
                                onClick={() => handleStartEditLesson(lesson)}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-white border text-xs text-gray-700 hover:bg-gray-100"
                              >
                                <FaEdit />
                                تعديل
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLesson(lesson)}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-xs text-red-700 hover:bg-red-100"
                              >
                                <FaTrash />
                                حذف
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {unsectionedLessons.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">دروس بدون قسم</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        هذه الدروس لا تنتمي إلى أي قسم محدد.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSectionId('');
                        handleStartCreateLesson();
                      }}
                      className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900"
                    >
                      <FaPlus className="text-[10px]" />
                      درس جديد
                    </button>
                  </div>

                  <div className="space-y-2 mt-2">
                    {unsectionedLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-start justify-between gap-3 border rounded-lg px-3 py-2 text-sm bg-white"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">
                              {lesson.order_index ? `${lesson.order_index}. ` : ''}
                              {lesson.title}
                            </span>
                            {lesson.is_free && (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                                مجاني
                              </span>
                            )}
                            {lesson.is_preview && (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                                معاينة
                              </span>
                            )}
                          </div>
                          {lesson.description && (
                            <p className="text-gray-600 text-xs mb-1 line-clamp-2">{lesson.description}</p>
                          )}
                          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                            <span>المدة: {lesson.duration_minutes || 0} دقيقة</span>
                            {lesson.video_url && (
                              <a
                                href={lesson.video_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                فتح الفيديو
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <button
                            type="button"
                            onClick={() => handleStartEditLesson(lesson)}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-white border text-xs text-gray-700 hover:bg-gray-100"
                          >
                            <FaEdit />
                            تعديل
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLesson(lesson)}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-xs text-red-700 hover:bg-red-100"
                          >
                            <FaTrash />
                            حذف
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* نموذج إضافة/تعديل الدرس */}
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-bold text-lg mb-3">
              {editingLessonId ? 'تعديل الدرس' : 'إضافة درس جديد'}
            </h2>
            <form onSubmit={handleSaveLesson} className="space-y-3 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">القسم</label>
                  <select
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">بدون قسم</option>
                    {sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.order_index ? `${section.order_index}. ` : ''}
                        {section.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">عنوان الدرس</label>
                  <input
                    type="text"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="مثال: مقدمة عن الكورس"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">وصف الدرس (اختياري)</label>
                <textarea
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium mb-1">مدة الفيديو (بالدقائق)</label>
                  <input
                    type="number"
                    min={1}
                    value={lessonForm.durationMinutes}
                    onChange={(e) => setLessonForm({ ...lessonForm, durationMinutes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">ترتيب الدرس (اختياري)</label>
                  <input
                    type="number"
                    min={1}
                    value={lessonForm.orderIndex}
                    onChange={(e) => setLessonForm({ ...lessonForm, orderIndex: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex items-center gap-3 mt-6">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={lessonForm.isFree}
                      onChange={(e) => setLessonForm({ ...lessonForm, isFree: e.target.checked })}
                    />
                    <span>درس مجاني</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={lessonForm.isPreview}
                      onChange={(e) => setLessonForm({ ...lessonForm, isPreview: e.target.checked })}
                    />
                    <span>درس معاينة</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">رابط الفيديو (Google Drive أو غيره)</label>
                <input
                  type="url"
                  value={lessonForm.videoUrl}
                  onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  يمكنك لصق رابط الفيديو من Google Drive أو أي مصدر آخر مدعوم في صفحة مشاهدة الكورس.
                </p>

                <div className="mt-3">
                  <label className="block font-medium mb-1">أو ارفع ملف فيديو من جهازك</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    disabled={uploadingVideo}
                    className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {uploadingVideo && (
                    <p className="text-xs text-blue-600 mt-1">جاري رفع الفيديو...</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                {editingLessonId && (
                  <button
                    type="button"
                    onClick={handleResetLessonForm}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    إلغاء التعديل
                  </button>
                )}
                <div className="ml-auto flex gap-2">
                  <button
                    type="submit"
                    disabled={savingLesson}
                    className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingLesson
                      ? 'جاري الحفظ...'
                      : editingLessonId
                      ? 'حفظ التعديلات'
                      : 'إضافة الدرس'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
