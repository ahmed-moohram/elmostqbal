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
  const [publishImmediately, setPublishImmediately] = useState(true); // نشر الكورس مباشرة

  // إضافة قسم جديد
  const addSection = () => {
    setSections([...sections, {
      title: "",
      description: "",
      order: sections.length,
      lessons: []
    }]);
    toast.success('✅ تم إضافة قسم جديد');
  };

  // حذف قسم
  const removeSection = (index: number) => {
    if (sections.length > 1) {
      if (window.confirm(`هل أنت متأكد من حذف القسم "${sections[index].title || `القسم ${index + 1}`}"؟`)) {
        setSections(sections.filter((_, i) => i !== index));
        toast.success('✅ تم حذف القسم بنجاح');
      }
    } else {
      toast.error('❌ يجب أن يحتوي الكورس على قسم واحد على الأقل');
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
    toast.success('✅ تم إضافة درس جديد');
  };

  // حذف درس
  const removeLesson = (sectionIndex: number, lessonIndex: number) => {
    const lesson = sections[sectionIndex].lessons[lessonIndex];
    if (window.confirm(`هل أنت متأكد من حذف الدرس "${lesson.title || `الدرس ${lessonIndex + 1}`}"؟`)) {
      const newSections = [...sections];
      newSections[sectionIndex].lessons = newSections[sectionIndex].lessons.filter((_, i) => i !== lessonIndex);
      setSections(newSections);
      toast.success('✅ تم حذف الدرس بنجاح');
    }
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
    
    // ✅ استخدام localStorage مباشرة
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("❌ لا يوجد Token! يرجى تسجيل الدخول مرة أخرى.");
      router.push('/login');
      return;
    }
    
    console.log('💾 إنشاء دورة جديدة');
    console.log('🔑 Token:', token.substring(0, 20) + '...');

    // Validation
    if (description.length < 10) {
      toast.error("⚠️ الوصف يجب أن يكون 10 أحرف على الأقل");
      return;
    }

    // الحد الأقصى المسموح به للسعر حسب نوع الحقل DECIMAL(10,2)
    if (price > 99999999) {
      toast.error("⚠️ الحد الأقصى للسعر هو 99,999,999 جنيه");
      return;
    }

    console.log('📊 عدد الأقسام:', sections.length);
    console.log('📊 الأقسام:', sections);
    
    const validSections = sections.filter(s => s.title && s.lessons.length > 0);
    console.log('✅ الأقسام الصالحة:', validSections.length);
    
    if (validSections.length === 0) {
      toast.error("⚠️ يجب إضافة قسم واحد على الأقل مع درس واحد");
      console.log('❌ لا يوجد أقسام صالحة!');
      return;
    }

    console.log('⏳ بدء setLoading(true)...');
    setLoading(true);
    console.log('✅ Loading set to true');

    try {
      // استخدام دالة Supabase المحدثة
      const { createCourseWithLessons } = await import('@/lib/supabase-courses');
      
      console.log('🌐 استخدام Supabase لإنشاء الكورس');
      
      const courseData = {
        title,
        description,
        instructor_name: 'المدرب',
        price,
        level,
        category,
        duration_hours: getTotalStats().totalDuration / 60,
        lessons_count: getTotalStats().totalLessons,
        is_published: publishImmediately,
        // لا نضع أي تقييم افتراضي للكورس الجديد
        rating: 0,
        // عدد الطلاب سيبقى 0 فعلياً حتى يبدأ الطلاب في الاشتراك
        students_count: 0,
        language: 'ar',
        short_description: shortDescription || description.substring(0, 200),
        preview_video: previewVideo,
        thumbnail: imagePreview || thumbnail || '/placeholder-course.jpg',
        image: imagePreview || thumbnail || '/placeholder-course.jpg',
        discount_price: null,
        requirements: [],
        what_will_learn: [],
        has_certificate: true
      };

      console.log('📦 Course Data prepared:', {
        title: courseData.title,
        price: courseData.price,
        level: courseData.level,
        sectionsCount: sections.length
      });

      console.log('🚀 إنشاء الكورس والدروس في Supabase...');
      
      const result = await createCourseWithLessons(courseData, sections);

      console.log('📨 تم إنشاء الكورس!');
      console.log('📊 النتيجة:', result);

      if (!result.success) {
        console.error('❌ خطأ من Supabase:', result.error);
        toast.error('فشل إنشاء الدورة. تحقق من البيانات وحاول مرة أخرى.');
        throw new Error('فشل إنشاء الدورة');
      }
      
      toast.success("✅ تم إنشاء الدورة بنجاح!");
      router.replace("/admin/courses");
      
    } catch (err: any) {
      console.error('\n❌❌❌ خطأ في إنشاء الدورة ❌❌❌');
      console.error('Error type:', err.constructor.name);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      
      if (!err.message.includes('فشل إنشاء الدورة')) {
        toast.error(`❌ خطأ غير متوقع: ${err.message}`);
      }
    } finally {
      console.log('🏁 Finally block - setLoading(false)');
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
                <label className="block mb-2 font-medium">
                  الوصف الكامل * 
                  <span className="text-xs text-gray-500 mr-2">
                    ({description.length}/10 حرف على الأقل)
                  </span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field h-32"
                  placeholder="اكتب وصف تفصيلي عن محتوى الدورة، الأهداف، والمتطلبات... (10 أحرف على الأقل)"
                  minLength={10}
                  required
                />
                {description.length > 0 && description.length < 10 && (
                  <p className="text-xs text-red-500 mt-1">
                    ⚠️ يجب أن يكون الوصف 10 أحرف على الأقل (الحالي: {description.length})
                  </p>
                )}
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
                  placeholder="0 = مجاني (الحد الأقصى 99,999,999)"
                />
              </div>

              {/* حقل رفع صورة الكورس */}
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium">صورة الكورس *</label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="input-field"
                    id="course-image"
                  />
                  
                  {/* معاينة الصورة */}
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
                  
                  {/* رابط URL بديل للصورة */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">أو استخدم رابط صورة من الإنترنت:</label>
                    <input
                      type="url"
                      value={thumbnail}
                      onChange={(e) => {
                        setThumbnail(e.target.value);
                        if (!image) {
                          setImagePreview(e.target.value);
                        }
                      }}
                      className="input-field"
                      placeholder="https://example.com/course-image.jpg"
                    />
                  </div>
                </div>
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
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-bold shadow-lg transition transform hover:scale-105"
              >
                <FaPlus className="text-xl" /> إضافة قسم جديد
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
                        className="mr-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition flex items-center gap-2 font-medium shadow"
                        title="حذف القسم"
                      >
                        <FaTrash /> حذف القسم
                      </button>
                    )}
                  </div>

                  {/* Lessons */}
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
                          ⚠️ لم يتم إضافة أي دروس بعد. اضغط على زر "إضافة درس جديد" أعلاه.
                        </p>
                      </div>
                    )}

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
                            
                            <textarea
                              value={lesson.description}
                              onChange={(e) => updateLesson(sIndex, lIndex, 'description', e.target.value)}
                              className="input-field h-20"
                              placeholder="وصف الدرس (اختياري)"
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
                            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition h-fit flex items-center gap-2 font-medium shadow"
                            title="حذف الدرس"
                          >
                            <FaTrash /> حذف
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
                <span className="font-medium">نشر الكورس مباشرة بعد الإنشاء</span>
                <p className="text-sm text-gray-500 mt-1">
                  إذا لم تحدد هذا الخيار، سيبقى الكورس مسودة ولن يظهر للطلاب
                </p>
              </label>
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
