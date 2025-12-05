"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowRight, FaUpload, FaPlus, FaTrash, FaVideo, FaSave, FaEye } from "react-icons/fa";
import userStorage from "@/services/userStorage";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "react-hot-toast";

interface Lesson {
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  order: number;
  isPreview: boolean;
}

interface Section {
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export default function EnhancedNewCoursePage() {
  const router = useRouter();
  
  // معلومات أساسية
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [category, setCategory] = useState("برمجة");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced" | "all-levels">("all-levels");
  
  // الوسائط
  const [previewVideo, setPreviewVideo] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // المحتوى
  const [sections, setSections] = useState<Section[]>([
    {
      title: "المقدمة",
      description: "مقدمة عن الدورة",
      order: 0,
      lessons: []
    }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // إضافة قسم جديد
  const addSection = () => {
    setSections([...sections, {
      title: "",
      description: "",
      order: sections.length,
      lessons: []
    }]);
  };

  // حذف قسم
  const removeSection = (index: number) => {
    if (sections.length > 1) {
      setSections(sections.filter((_, i) => i !== index));
    }
  };

  // تحديث قسم
  const updateSection = (index: number, field: keyof Section, value: any) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setSections(newSections);
  };

  // إضافة درس لقسم
  const addLesson = (sectionIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].lessons.push({
      title: "",
      description: "",
      videoUrl: "",
      duration: 0,
      order: newSections[sectionIndex].lessons.length,
      isPreview: false
    });
    setSections(newSections);
  };

  // حذف درس
  const removeLesson = (sectionIndex: number, lessonIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].lessons = newSections[sectionIndex].lessons.filter((_, i) => i !== lessonIndex);
    setSections(newSections);
  };

  // تحديث درس
  const updateLesson = (sectionIndex: number, lessonIndex: number, field: keyof Lesson, value: any) => {
    const newSections = [...sections];
    newSections[sectionIndex].lessons[lessonIndex] = {
      ...newSections[sectionIndex].lessons[lessonIndex],
      [field]: value
    };
    setSections(newSections);
  };

  // معالجة الصورة
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // استخراج معرف الفيديو من رابط YouTube
  const extractYouTubeId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // حساب إجمالي الدروس والمدة
  const getTotalStats = () => {
    let totalLessons = 0;
    let totalDuration = 0;
    sections.forEach(section => {
      totalLessons += section.lessons.length;
      section.lessons.forEach(lesson => {
        totalDuration += lesson.duration || 0;
      });
    });
    return { totalLessons, totalDuration };
  };

  // إرسال البيانات
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim() || !shortDescription.trim()) {
      toast.error("الرجاء ملء جميع الحقول المطلوبة");
      return;
    }

    // التحقق من وجود دروس
    const hasLessons = sections.some(s => s.lessons.length > 0);
    if (!hasLessons) {
      toast.error("يجب إضافة درس واحد على الأقل");
      return;
    }

    setLoading(true);

    try {
      const token = userStorage.getAuthToken();
      if (!token) {
        throw new Error("غير مصرح به. الرجاء تسجيل الدخول");
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      const courseData = {
        title,
        slug: title.toLowerCase().replace(/\s+/g, '-'),
        description,
        shortDescription,
        category,
        level,
        language: 'ar',
        thumbnail: thumbnail || imagePreview || '/placeholder-course.png',
        previewVideo: previewVideo || '',
        paymentOptions: [{
          type: 'onetime',
          price: price || 0,
          currency: 'EGP'
        }],
        sections: sections.filter(s => s.title && s.lessons.length > 0),
        isPublished: false,
        isActive: true,
        // instructor سيتم تحديثه تلقائياً من المستخدم الحالي في الباك اند
        accessibility: {
          hasLifetimeAccess: true,
          hasCertificate: true
        }
      };

      const res = await fetch(`${apiUrl}/api/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(courseData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ خطأ من الخادم:', errorData);
        throw new Error(errorData.message || errorData.error || `فشل إنشاء الدورة: ${res.status}`);
      }

      const { course } = await res.json();
      
      toast.success("✅ تم إنشاء الدورة بنجاح!");
      console.log('✅ الدورة تم إنشاؤها:', course);
      router.replace("/admin/courses");
      
    } catch (err) {
      console.error("❌ خطأ في إنشاء الدورة:", err);
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ أثناء إنشاء الدورة";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const stats = getTotalStats();

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
              <h1 className="text-3xl font-bold">إنشاء دورة جديدة</h1>
              <p className="text-gray-500 mt-1">أضف محتوى تعليمي احترافي مع الفيديوهات</p>
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
            <div className="bg-green-500/10 px-4 py-2 rounded-lg">
              <div className="text-xs text-gray-500">المدة</div>
              <div className="text-2xl font-bold text-green-500">{Math.floor(stats.totalDuration / 60)}h {stats.totalDuration % 60}m</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* خطوة 1: معلومات أساسية */}
          <div className="card-premium">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">1</span>
              معلومات الدورة الأساسية
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium">عنوان الدورة *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field"
                  placeholder="مثال: دورة React المتقدمة - من الصفر للاحتراف"
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
                  placeholder="وصف قصير يظهر في البطاقة (200 حرف)"
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
                  placeholder="وصف تفصيلي عن محتوى الدورة، الأهداف، والمتطلبات..."
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
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="input-field"
                  placeholder="0 = مجاني"
                />
              </div>

              <div>
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

            {/* Preview الفيديو التعريفي */}
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

          {/* خطوة 2: المحتوى (Sections & Lessons) */}
          <div className="card-premium">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">2</span>
                محتوى الدورة
              </h2>
              <button
                type="button"
                onClick={addSection}
                className="btn-primary flex items-center gap-2"
              >
                <FaPlus /> إضافة قسم
              </button>
            </div>

            <div className="space-y-6">
              {sections.map((section, sIndex) => (
                <div key={sIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-800/50">
                  {/* Section Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 space-y-4">
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSection(sIndex, 'title', e.target.value)}
                        className="input-field"
                        placeholder={`عنوان القسم ${sIndex + 1}`}
                        required
                      />
                      <textarea
                        value={section.description}
                        onChange={(e) => updateSection(sIndex, 'description', e.target.value)}
                        className="input-field h-20"
                        placeholder="وصف القسم (اختياري)"
                      />
                    </div>
                    {sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSection(sIndex)}
                        className="mr-4 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>

                  {/* Lessons */}
                  <div className="space-y-4 mt-6">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-sm text-gray-500">الدروس</h4>
                      <button
                        type="button"
                        onClick={() => addLesson(sIndex)}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <FaPlus className="text-xs" /> إضافة درس
                      </button>
                    </div>

                    {section.lessons.map((lesson, lIndex) => (
                      <div key={lIndex} className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex gap-4">
                          <div className="flex-1 space-y-3">
                            <input
                              type="text"
                              value={lesson.title}
                              onChange={(e) => updateLesson(sIndex, lIndex, 'title', e.target.value)}
                              className="input-field"
                              placeholder={`عنوان الدرس ${lIndex + 1}`}
                              required
                            />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input
                                type="url"
                                value={lesson.videoUrl}
                                onChange={(e) => updateLesson(sIndex, lIndex, 'videoUrl', e.target.value)}
                                className="input-field"
                                placeholder="رابط الفيديو (YouTube/Vimeo)"
                                required
                              />
                              <input
                                type="number"
                                min="0"
                                value={lesson.duration}
                                onChange={(e) => updateLesson(sIndex, lIndex, 'duration', Number(e.target.value))}
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
                                  onChange={(e) => updateLesson(sIndex, lIndex, 'isPreview', e.target.checked)}
                                  className="rounded"
                                />
                                <span className="text-sm">معاينة مجانية</span>
                              </label>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => removeLesson(sIndex, lIndex)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition h-fit"
                          >
                            <FaTrash />
                          </button>
                        </div>

                        {/* Video Preview */}
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

                    {section.lessons.length === 0 && (
                      <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                        <FaVideo className="mx-auto text-3xl mb-2" />
                        <p>لا توجد دروس في هذا القسم</p>
                        <button
                          type="button"
                          onClick={() => addLesson(sIndex)}
                          className="text-primary hover:underline mt-2"
                        >
                          إضافة أول درس
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link href="/admin/courses" className="btn-secondary">
              إلغاء
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <FaSave /> حفظ الدورة
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
