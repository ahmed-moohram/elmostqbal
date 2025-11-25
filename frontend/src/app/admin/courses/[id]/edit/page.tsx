"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { FaArrowRight, FaPlus, FaTrash, FaVideo, FaSave } from "react-icons/fa";
import AdminLayout from "@/components/AdminLayout";
import supabase from "@/lib/supabase-client";
import { toast } from "react-hot-toast";

interface LessonForm {
  id?: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  order: number;
  isPreview: boolean;
}

interface SectionForm {
  id?: string;
  title: string;
  description: string;
  order: number;
  lessons: LessonForm[];
}

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = Array.isArray(params?.id) ? params.id[0] : (params as any)?.id;

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [saving, setSaving] = useState(false);

  // بيانات الكورس
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [category, setCategory] = useState("برمجة");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced" | "all-levels">("all-levels");
  const [previewVideo, setPreviewVideo] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [publishImmediately, setPublishImmediately] = useState(true);

  // الأقسام والدروس
  const [sections, setSections] = useState<SectionForm[]>([]);

  // استخراج معرف YouTube من الرابط
  const extractYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // إحصائيات بسيطة
  const getTotalStats = () => {
    let totalLessons = 0;
    let totalDuration = 0;
    sections.forEach((section) => {
      totalLessons += section.lessons.length;
      section.lessons.forEach((lesson) => {
        totalDuration += lesson.duration || 0;
      });
    });
    return { totalLessons, totalDuration };
  };

  // تحميل بيانات الكورس والأقسام والدروس
  useEffect(() => {
    const loadData = async () => {
      if (!courseId) return;
      setLoadingInitial(true);
      try {
        // جلب بيانات الكورس
        const { data: course, error: courseError } = await supabase
          .from("courses")
          .select("*")
          .eq("id", courseId)
          .single();

        if (courseError || !course) {
          console.error("❌ خطأ في جلب الكورس:", courseError);
          toast.error("فشل في تحميل بيانات الكورس");
          setLoadingInitial(false);
          return;
        }

        setTitle(course.title || "");
        setDescription(course.description || "");
        setShortDescription(course.short_description || "");
        setPrice(course.price || 0);
        setCategory(course.category || "برمجة");
        setLevel((course.level as any) || "all-levels");
        setPreviewVideo(course.preview_video || "");
        setThumbnail(course.thumbnail || "");
        setImagePreview(course.thumbnail || null);
        setPublishImmediately(!!course.is_published);

        // جلب الأقسام مع الدروس
        const { data: sectionsData, error: sectionsError } = await supabase
          .from("sections")
          .select(
            `id, title, description, order_index, created_at,
             lessons:lessons(id, title, description, video_url, duration, duration_minutes, order_index, is_preview)`
          )
          .eq("course_id", courseId)
          .order("order_index", { ascending: true });

        if (sectionsError) {
          console.error("❌ خطأ في جلب الأقسام:", sectionsError);
        }

        const mappedSections: SectionForm[] = (sectionsData || []).map((section: any, sIndex: number) => ({
          id: section.id,
          title: section.title || "",
          description: section.description || "",
          order: section.order_index ?? sIndex,
          lessons: (section.lessons || [])
            .slice()
            .sort((a: any, b: any) => {
              const ao = a.order_index ?? 0;
              const bo = b.order_index ?? 0;
              return ao - bo;
            })
            .map((lesson: any, lIndex: number) => ({
              id: lesson.id,
              title: lesson.title || "",
              description: lesson.description || "",
              videoUrl: lesson.video_url || "",
              duration: lesson.duration_minutes || lesson.duration || 0,
              order: lesson.order_index ?? lIndex,
              isPreview: !!lesson.is_preview,
            })),
        }));

        if (mappedSections.length === 0) {
          setSections([
            {
              title: "المقدمة",
              description: "مقدمة عن الدورة",
              order: 0,
              lessons: [],
            },
          ]);
        } else {
          setSections(mappedSections);
        }
      } catch (err) {
        console.error("❌ خطأ غير متوقع أثناء تحميل بيانات الكورس:", err);
        toast.error("حدث خطأ أثناء تحميل البيانات");
      } finally {
        setLoadingInitial(false);
      }
    };

    loadData();
  }, [courseId]);

  // إضافة قسم جديد
  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        title: "",
        description: "",
        order: prev.length,
        lessons: [],
      },
    ]);
    toast.success("✅ تم إضافة قسم جديد");
  };

  // حذف قسم
  const removeSection = (index: number) => {
    setSections((prev) => {
      if (prev.length <= 1) {
        toast.error("❌ يجب أن يحتوي الكورس على قسم واحد على الأقل");
        return prev;
      }
      if (!window.confirm(`هل أنت متأكد من حذف القسم "${prev[index].title || `القسم ${index + 1}`}"؟`)) {
        return prev;
      }
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((s, idx) => ({ ...s, order: idx }));
    });
  };

  // تحديث قسم
  const updateSection = (index: number, field: keyof SectionForm, value: any) => {
    setSections((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // إضافة درس لقسم
  const addLesson = (sectionIndex: number) => {
    setSections((prev) => {
      const copy = [...prev];
      const sec = copy[sectionIndex];
      const nextLessons = [
        ...sec.lessons,
        {
          title: "",
          description: "",
          videoUrl: "",
          duration: 0,
          order: sec.lessons.length,
          isPreview: false,
        },
      ];
      copy[sectionIndex] = { ...sec, lessons: nextLessons };
      return copy;
    });
    toast.success("✅ تم إضافة درس جديد");
  };

  // حذف درس
  const removeLesson = (sectionIndex: number, lessonIndex: number) => {
    setSections((prev) => {
      const copy = [...prev];
      const sec = copy[sectionIndex];
      const lesson = sec.lessons[lessonIndex];
      if (!window.confirm(`هل أنت متأكد من حذف الدرس "${lesson.title || `الدرس ${lessonIndex + 1}`}"؟`)) {
        return prev;
      }
      const nextLessons = sec.lessons.filter((_, i) => i !== lessonIndex).map((l, idx) => ({ ...l, order: idx }));
      copy[sectionIndex] = { ...sec, lessons: nextLessons };
      toast.success("✅ تم حذف الدرس بنجاح");
      return copy;
    });
  };

  // تحديث درس
  const updateLesson = (
    sectionIndex: number,
    lessonIndex: number,
    field: keyof LessonForm,
    value: any
  ) => {
    setSections((prev) => {
      const copy = [...prev];
      const sec = copy[sectionIndex];
      const lessons = [...sec.lessons];
      lessons[lessonIndex] = { ...lessons[lessonIndex], [field]: value };
      copy[sectionIndex] = { ...sec, lessons };
      return copy;
    });
  };

  // إرسال التعديلات إلى API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;

    if (description.length < 10) {
      toast.error("⚠️ الوصف يجب أن يكون 10 أحرف على الأقل");
      return;
    }

    const validSections = sections.filter((s) => s.title && s.lessons.length > 0);
    if (validSections.length === 0) {
      toast.error("⚠️ يجب أن يحتوي الكورس على قسم واحد على الأقل مع درس واحد");
      return;
    }

    setSaving(true);
    try {
      const stats = getTotalStats();

      const courseUpdates = {
        title,
        description,
        short_description: shortDescription || description.substring(0, 200),
        price,
        category,
        level,
        preview_video: previewVideo,
        thumbnail: imagePreview || thumbnail || "/placeholder-course.jpg",
        is_published: publishImmediately,
        total_lessons: stats.totalLessons,
        total_duration_minutes: stats.totalDuration,
      };

      const response = await fetch(`/api/admin/courses/${courseId}/content`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseUpdates, sections: validSections }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error("❌ خطأ من API تعديل الكورس:", err);
        toast.error(err.error || "فشل حفظ التعديلات");
        return;
      }

      toast.success("✅ تم حفظ تعديلات الكورس ومحتواه بنجاح");
      router.push("/admin/courses");
    } catch (err) {
      console.error("❌ خطأ غير متوقع أثناء حفظ التعديلات:", err);
      toast.error("حدث خطأ غير متوقع أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const stats = getTotalStats();

  if (loadingInitial) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">جاري تحميل بيانات الكورس...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/courses"
              className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 p-3 rounded-full transition"
            >
              <FaArrowRight />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">تعديل الكورس</h1>
              <p className="text-gray-500 mt-1">تعديل معلومات الكورس والأقسام والدروس</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div className="bg-primary/10 px-4 py-2 rounded-lg">
              <div className="text-xs text-gray-500">الأقسام</div>
              <div className="text-2xl font-bold text-primary">{sections.length}</div>
            </div>
            <div className="bg-accent/10 px-4 py-2 rounded-lg">
              <div className="text-xs text-gray-500">الدروس</div>
              <div className="text-2xl font-bold text-accent">{stats.totalLessons}</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* معلومات أساسية */}
          <div className="card-premium">
            <h2 className="text-2xl font-bold mb-6">معلومات الكورس</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium">عنوان الكورس *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 font-medium">وصف مختصر *</label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="input-field"
                  maxLength={200}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 font-medium">الوصف الكامل *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field h-32"
                  minLength={10}
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">التصنيف</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-field"
                >
                  <option value="برمجة">برمجة</option>
                  <option value="تصميم">تصميم</option>
                  <option value="تسويق">تسويق</option>
                  <option value="أعمال">أعمال</option>
                  <option value="لغات">لغات</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium">المستوى</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="input-field"
                >
                  <option value="beginner">مبتدئ</option>
                  <option value="intermediate">متوسط</option>
                  <option value="advanced">متقدم</option>
                  <option value="all-levels">جميع المستويات</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium">السعر (ج.م)</label>
                <input
                  type="number"
                  min="0"
                  max="99999999"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="input-field"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 font-medium">رابط صورة الكورس (thumbnail)</label>
                <input
                  type="url"
                  value={thumbnail}
                  onChange={(e) => {
                    setThumbnail(e.target.value);
                    setImagePreview(e.target.value || null);
                  }}
                  className="input-field"
                  placeholder="https://example.com/course.jpg"
                />

                {imagePreview && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">معاينة الصورة:</p>
                    <img
                      src={imagePreview}
                      alt="معاينة"
                      className="w-full max-w-md h-48 object-cover rounded-lg shadow-md"
                    />
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 font-medium">فيديو تعريفي (YouTube URL)</label>
                <input
                  type="url"
                  value={previewVideo}
                  onChange={(e) => setPreviewVideo(e.target.value)}
                  className="input-field"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </div>

            {previewVideo && extractYouTubeId(previewVideo) && (
              <div className="mt-6">
                <p className="mb-2 font-medium">معاينة الفيديو التعريفي:</p>
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${extractYouTubeId(previewVideo)}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>

          {/* الأقسام والدروس */}
          <div className="card-premium">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">
                  2
                </span>
                محتوى الكورس (الأقسام والدروس)
              </h2>
              <button
                type="button"
                onClick={addSection}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-bold shadow-lg transition transform hover:scale-105"
              >
                <FaPlus className="text-xl" /> إضافة قسم جديد
              </button>
            </div>

            <div className="space-y-6">
              {sections.map((section, sIndex) => (
                <div
                  key={sIndex}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 space-y-4">
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSection(sIndex, "title", e.target.value)}
                        className="input-field"
                        placeholder={`عنوان القسم ${sIndex + 1}`}
                        required
                      />
                      <textarea
                        value={section.description}
                        onChange={(e) => updateSection(sIndex, "description", e.target.value)}
                        className="input-field h-20"
                        placeholder="وصف القسم (اختياري)"
                      />
                    </div>
                    {sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSection(sIndex)}
                        className="mr-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition flex items-center gap-2 font-medium shadow"
                      >
                        <FaTrash /> حذف القسم
                      </button>
                    )}
                  </div>

                  {/* الدروس */}
                  <div className="space-y-4 mt-6">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-lg">📚 الدروس ({section.lessons.length})</h4>
                      <button
                        type="button"
                        onClick={() => addLesson(sIndex)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow transition transform hover:scale-105"
                      >
                        <FaPlus /> إضافة درس جديد
                      </button>
                    </div>

                    {section.lessons.length === 0 && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
                        <p className="text-yellow-800 dark:text-yellow-200">
                          ⚠️ لا توجد دروس في هذا القسم. اضغط على "إضافة درس جديد".
                        </p>
                      </div>
                    )}

                    {section.lessons.map((lesson, lIndex) => (
                      <div
                        key={lIndex}
                        className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex gap-4">
                          <div className="flex-1 space-y-3">
                            <input
                              type="text"
                              value={lesson.title}
                              onChange={(e) => updateLesson(sIndex, lIndex, "title", e.target.value)}
                              className="input-field"
                              placeholder={`عنوان الدرس ${lIndex + 1}`}
                              required
                            />
                            <textarea
                              value={lesson.description}
                              onChange={(e) => updateLesson(sIndex, lIndex, "description", e.target.value)}
                              className="input-field h-20"
                              placeholder="وصف الدرس (اختياري)"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input
                                type="url"
                                value={lesson.videoUrl}
                                onChange={(e) => updateLesson(sIndex, lIndex, "videoUrl", e.target.value)}
                                className="input-field"
                                placeholder="رابط الفيديو (YouTube/Vimeo)"
                                required
                              />
                              <input
                                type="number"
                                min="0"
                                value={lesson.duration}
                                onChange={(e) => updateLesson(sIndex, lIndex, "duration", Number(e.target.value))}
                                className="input-field"
                                placeholder="المدة (بالدقائق)"
                                required
                              />
                            </div>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={lesson.isPreview}
                                  onChange={(e) => updateLesson(sIndex, lIndex, "isPreview", e.target.checked)}
                                  className="rounded"
                                />
                                <span className="text-sm">معاينة مجانية</span>
                              </label>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLesson(sIndex, lIndex)}
                            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition h-fit flex items-center gap-2 font-medium shadow"
                          >
                            <FaTrash /> حذف
                          </button>
                        </div>

                        {lesson.videoUrl && extractYouTubeId(lesson.videoUrl) && (
                          <div className="mt-3 aspect-video rounded-lg overflow-hidden bg-black">
                            <iframe
                              width="100%"
                              height="100%"
                              src={`https://www.youtube.com/embed/${extractYouTubeId(lesson.videoUrl)}`}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* خيار النشر */}
          <div className="card-premium mb-6">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="publishImmediately"
                checked={publishImmediately}
                onChange={(e) => setPublishImmediately(e.target.checked)}
                className="w-5 h-5 text-primary rounded focus:ring-primary"
              />
              <label htmlFor="publishImmediately" className="cursor-pointer select-none">
                <span className="font-medium">نشر الكورس بعد حفظ التعديلات</span>
                <p className="text-sm text-gray-500 mt-1">
                  في حالة إلغاء التحديد، سيتم حفظ الكورس كمسودة ولن يظهر للطلاب.
                </p>
              </label>
            </div>
          </div>

          {/* حفظ */}
          <div className="flex justify-end gap-4">
            <Link href="/admin/courses" className="btn-secondary">
              إلغاء
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <FaSave /> حفظ التعديلات
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
