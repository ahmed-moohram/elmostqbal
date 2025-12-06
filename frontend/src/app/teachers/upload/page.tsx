'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { 
  FaUpload, 
  FaVideo, 
  FaCheckCircle, 
  FaTimes,
  FaSpinner,
  FaPlay,
  FaArrowRight
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import supabase from '@/lib/supabase-client';

interface UploadedVideo {
  file: File;
  preview: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
}

export default function UploadVideoPage() {
  const router = useRouter();
  const [uploadedVideos, setUploadedVideos] = useState<UploadedVideo[]>([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [googleDriveUrl, setGoogleDriveUrl] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');

  // التحقق من صلاحيات المدرس
  useEffect(() => {
    const checkTeacherAuth = async () => {
      const userJson = localStorage.getItem('user');
      if (!userJson) {
        toast.error('يرجى تسجيل الدخول أولاً');
        router.replace('/login');
        setIsLoading(false);
        return;
      }

      const user = JSON.parse(userJson);
      
      // التحقق من أن المستخدم مدرس
      if (user.role !== 'teacher') {
        toast.error('ليس لديك صلاحية الوصول لهذه الصفحة');
        router.replace('/');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('courses')
          .select('id, title')
          .eq('instructor_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('خطأ في جلب كورسات المدرس:', error);
        } else {
          setCourses(data || []);
        }
      } catch (err) {
        console.error('خطأ غير متوقع أثناء جلب الكورسات:', err);
      }

      setIsLoading(false);
    };

    checkTeacherAuth();
  }, [router]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const videoFiles = acceptedFiles.filter(file => 
      file.type.startsWith('video/')
    );

    if (videoFiles.length === 0) {
      toast.error('يرجى رفع ملفات فيديو فقط');
      return;
    }

    const newVideos: UploadedVideo[] = videoFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'uploading'
    }));

    setUploadedVideos(prev => [...prev, ...newVideos]);

    // محاكاة رفع الفيديو
    newVideos.forEach((video, index) => {
      simulateUpload(uploadedVideos.length + index);
    });
  }, [uploadedVideos.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv']
    },
    multiple: true
  });

  const simulateUpload = (index: number) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      
      setUploadedVideos(prev => {
        const newVideos = [...prev];
        if (newVideos[index]) {
          newVideos[index] = {
            ...newVideos[index],
            progress,
            status: progress === 100 ? 'success' : 'uploading'
          };
        }
        return newVideos;
      });

      if (progress >= 100) {
        clearInterval(interval);
        toast.success('تم رفع الفيديو بنجاح! ✅');
      }
    }, 500);
  };

  const handleRemoveVideo = (index: number) => {
    setUploadedVideos(prev => prev.filter((_, i) => i !== index));
  };

  const normalizeGoogleDriveUrl = (url: string) => {
    const trimmed = (url || '').trim();
    if (!trimmed) return '';

    try {
      const parsed = new URL(trimmed);

      if (parsed.hostname.includes('drive.google.com')) {
        let fileId = '';

        const pathParts = parsed.pathname.split('/').filter(Boolean);
        const fileIndex = pathParts.indexOf('d');
        if (fileIndex !== -1 && pathParts[fileIndex + 1]) {
          fileId = pathParts[fileIndex + 1];
        }

        if (!fileId) {
          const idParam = parsed.searchParams.get('id');
          if (idParam) fileId = idParam;
        }

        if (fileId) {
          return `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
      }

      return trimmed;
    } catch {
      return trimmed;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCourse) {
      toast.error('يرجى اختيار الكورس');
      return;
    }

    if (!lessonTitle) {
      toast.error('يرجى إدخال عنوان الدرس');
      return;
    }

    if (uploadedVideos.length === 0 && !googleDriveUrl.trim()) {
      toast.error('يرجى رفع فيديو أو إدخال رابط فيديو');
      return;
    }

    try {
      if (googleDriveUrl.trim()) {
        const normalizedUrl = normalizeGoogleDriveUrl(googleDriveUrl);

        // حساب ترتيب الدرس داخل الكورس
        let nextOrderIndex = 1;
        try {
          const { data: existingLessons, error: existingError } = await supabase
            .from('lessons')
            .select('order_index')
            .eq('course_id', selectedCourse);

          if (!existingError && Array.isArray(existingLessons) && existingLessons.length > 0) {
            const maxOrder = existingLessons.reduce((max, lesson: any) => {
              const value = typeof lesson.order_index === 'number' ? lesson.order_index : 0;
              return value > max ? value : max;
            }, 0);
            nextOrderIndex = maxOrder + 1;
          }
        } catch (orderError) {
          console.error('خطأ في حساب ترتيب الدرس:', orderError);
        }

        const durationValue = Math.max(1, Number(durationMinutes) || 1);

        const { error: insertError } = await supabase
          .from('lessons')
          .insert({
            course_id: selectedCourse,
            title: lessonTitle,
            description: description || '',
            video_url: normalizedUrl,
            duration: durationValue,
            duration_minutes: durationValue,
            order_index: nextOrderIndex,
            is_free: true,
            content_type: 'video',
            is_published: true,
          })
          .select()
          .single();

        if (insertError) {
          console.error('خطأ في حفظ الدرس:', insertError);
          toast.error('حدث خطأ أثناء حفظ الدرس');
          return;
        }
      } else {
        // في حالة استخدام رفع ملف فقط، نكتفي بالمحاكاة الحالية
        toast.success('تم حفظ بيانات الدرس (رفع الملف تجريبي فقط)');
      }

      toast.success('تم حفظ الدرس بنجاح! 🎉');

      // إعادة تعيين النموذج
      setCourseTitle('');
      setLessonTitle('');
      setDescription('');
      setUploadedVideos([]);
      setSelectedCourse('');
      setGoogleDriveUrl('');
      setDurationMinutes('');
    } catch (error) {
      console.error('خطأ غير متوقع أثناء حفظ الدرس:', error);
      toast.error('حدث خطأ غير متوقع أثناء حفظ الدرس');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">رفع فيديو جديد</h1>
              <p className="text-gray-600">أضف محتوى جديد للكورس</p>
            </div>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800"
            >
              <FaTimes className="text-2xl" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course Selection */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">معلومات الدرس</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    الكورس
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">اختر الكورس</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title || 'كورس بدون عنوان'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    عنوان الدرس <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="مثال: المعادلات التربيعية"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    وصف الدرس
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="اكتب وصف مختصر للدرس..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    رابط فيديو من Google Drive (اختياري)
                  </label>
                  <input
                    type="text"
                    value={googleDriveUrl}
                    onChange={(e) => setGoogleDriveUrl(e.target.value)}
                    placeholder="الصق هنا رابط الفيديو من Google Drive"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    يتم استخدام هذا الرابط مباشرة في مشغل الفيديو مع علامة مائية باسم ورقم الطالب.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    مدة الفيديو (بالدقائق)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    placeholder="مثال: 30"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Upload Area */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">رفع الفيديو</h3>
              
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-300 hover:border-primary'
                }`}
              >
                <input {...getInputProps()} />
                <FaUpload className="text-6xl text-gray-400 mx-auto mb-4" />
                {isDragActive ? (
                  <p className="text-lg font-semibold text-primary">
                    أفلت الملفات هنا...
                  </p>
                ) : (
                  <>
                    <p className="text-lg font-semibold mb-2">
                      اسحب الفيديو هنا أو اضغط للاختيار
                    </p>
                    <p className="text-sm text-gray-500">
                      الصيغ المدعومة: MP4, MOV, AVI, MKV
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Uploaded Videos List */}
            {uploadedVideos.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold mb-4">
                  الفيديوهات المرفوعة ({uploadedVideos.length})
                </h3>
                
                <div className="space-y-4">
                  {uploadedVideos.map((video, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-4">
                        {/* Video Preview */}
                        <div className="relative w-24 h-16 bg-gray-900 rounded-lg overflow-hidden flex-shrink-0">
                          {video.status === 'success' && (
                            <video
                              src={video.preview}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            {video.status === 'uploading' && (
                              <FaSpinner className="text-white text-2xl animate-spin" />
                            )}
                            {video.status === 'success' && (
                              <FaPlay className="text-white text-2xl opacity-70" />
                            )}
                          </div>
                        </div>

                        {/* Video Info */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold truncate">
                              {video.file.name}
                            </h4>
                            <button
                              type="button"
                              onClick={() => handleRemoveVideo(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FaTimes />
                            </button>
                          </div>
                          
                          <p className="text-sm text-gray-500 mb-2">
                            {formatFileSize(video.file.size)}
                          </p>

                          {/* Progress Bar */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  video.status === 'success'
                                    ? 'bg-green-500'
                                    : video.status === 'error'
                                    ? 'bg-red-500'
                                    : 'bg-primary'
                                }`}
                                style={{ width: `${video.progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-700">
                              {video.progress}%
                            </span>
                            {video.status === 'success' && (
                              <FaCheckCircle className="text-green-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={uploadedVideos.length === 0 || !lessonTitle}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                حفظ الدرس
                <FaArrowRight />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
