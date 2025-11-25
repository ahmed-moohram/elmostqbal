'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaVideo, FaEye, FaEyeSlash, FaLock, FaUnlock, FaSave, FaTimes } from 'react-icons/fa';

interface Video {
  _id?: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  thumbnail?: string;
  order: number;
  isPreview: boolean;
  allowDownload: boolean;
  allowSharing: boolean;
}

interface Section {
  _id?: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  isPublished: boolean;
  videos: Video[];
}

interface Course {
  _id: string;
  title: string;
}

export default function SectionsManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [sections, setSections] = useState<Section[]>([]);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchSections(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/courses?t=${Date.now()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        const coursesData = data.courses || data || [];
        console.log(`✅ تم جلب ${coursesData.length} دورة من Backend`);
        setCourses(coursesData);
      } else {
        console.warn('⚠️ فشل جلب الدورات');
        setCourses([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('❌ خطأ في جلب الدورات:', error);
      setCourses([]);
      setLoading(false);
    }
  };

  const fetchSections = async (courseId: string) => {
    try {
      
      const token = localStorage.getItem('token');
      
      console.log('📡 جلب Sections للدورة:', courseId);
      
      const response = await fetch(`/api/sections?courseId=${courseId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const sectionsData = data.sections || data || [];
        console.log(`✅ تم جلب ${sectionsData.length} قسم`);
        setSections(sectionsData);
      } else {
        const errorText = await response.text();
        console.error('❌ فشل جلب الأقسام:', response.status, errorText);
        setSections([]);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب الأقسام:', error);
      setSections([]);
    }
  };

  const handleSaveSection = async () => {
    if (!editingSection) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('❌ لا يوجد Token! يرجى تسجيل الدخول مرة أخرى.');
        window.location.href = '/login';
        return;
      }
      
      console.log('💾 حفظ Section:', editingSection);
      console.log('🔑 Token:', token.substring(0, 20) + '...');

      if (editingSection._id) {
        // Update existing section
        const response = await fetch(`${API_URL}/api/sections/${editingSection._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(editingSection)
        });

        if (response.ok) {
          const updated = await response.json();
          setSections(prev =>
            prev.map(s => s._id === editingSection._id ? updated : s)
          );
          console.log('✅ تم تحديث القسم');
          alert('✅ تم تحديث القسم بنجاح!');
        } else {
          const errorData = await response.json().catch(() => ({ message: 'خطأ غير معروف' }));
          console.error('❌ فشل تحديث القسم:', response.status, errorData);
          alert(`❌ فشل تحديث القسم (${response.status}): ${errorData.message || errorData}`);
          
          if (response.status === 401) {
            alert('🔐 انتهت الجلسة! يرجى تسجيل الدخول مرة أخرى.');
            window.location.href = '/login';
          }
          return;
        }
      } else {
        // Add new section
        const response = await fetch(`${API_URL}/api/sections`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(editingSection)
        });

        if (response.ok) {
          const newSection = await response.json();
          setSections(prev => [...prev, newSection]);
          console.log('✅ تم إنشاء القسم');
          alert('✅ تم إنشاء القسم بنجاح!');
        } else {
          const errorData = await response.json().catch(() => ({ message: 'خطأ غير معروف' }));
          console.error('❌ فشل إنشاء القسم:', response.status, errorData);
          alert(`❌ فشل إنشاء القسم (${response.status}): ${errorData.message || errorData}`);
          
          if (response.status === 401) {
            alert('🔐 انتهت الجلسة! يرجى تسجيل الدخول مرة أخرى.');
            window.location.href = '/login';
          }
          return;
        }
      }

      setEditingSection(null);
      setShowSectionForm(false);
    } catch (error) {
      console.error('❌ خطأ في حفظ القسم:', error);
      alert('❌ حدث خطأ أثناء حفظ القسم!');
    }
  };
  
  const handleSaveSectionOld = () => {
    if (!editingSection) return;

    if (editingSection._id) {
      // Update existing section
      setSections(prev =>
        prev.map(s => s._id === editingSection._id ? editingSection : s)
      );
    } else {
      // Add new section
      const newSection = {
        ...editingSection,
        _id: `s_${Date.now()}`,
        courseId: selectedCourse,
        videos: []
      };
      setSections(prev => [...prev, newSection]);
    }

    setShowSectionForm(false);
    setEditingSection(null);
  };

  const handleDeleteSection = (sectionId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القسم وجميع فيديوهاته؟')) return;
    setSections(prev => prev.filter(s => s._id !== sectionId));
  };

  const handleSaveVideo = () => {
    if (!editingVideo || !currentSectionId) return;

    setSections(prev =>
      prev.map(section => {
        if (section._id === currentSectionId) {
          let videos = section.videos;
          if (editingVideo._id) {
            // Update existing video
            videos = videos.map(v => v._id === editingVideo._id ? editingVideo : v);
          } else {
            // Add new video
            const newVideo = { ...editingVideo, _id: `v_${Date.now()}` };
            videos = [...videos, newVideo];
          }
          return { ...section, videos };
        }
        return section;
      })
    );

    setShowVideoForm(false);
    setEditingVideo(null);
    setCurrentSectionId(null);
  };

  const handleDeleteVideo = (sectionId: string, videoId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟')) return;

    setSections(prev =>
      prev.map(section => {
        if (section._id === sectionId) {
          return {
            ...section,
            videos: section.videos.filter(v => v._id !== videoId)
          };
        }
        return section;
      })
    );
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            إدارة الأقسام والفيديوهات
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            أضف وأدِر الأقسام والفيديوهات للدورات
          </p>
        </div>

        {/* Course Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            اختر الدورة
          </label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
          >
            <option value="">-- اختر دورة --</option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        {selectedCourse && (
          <>
            {/* Add Section Button */}
            <div className="mb-6">
              <button
                onClick={() => {
                  setEditingSection({
                    courseId: selectedCourse,
                    title: '',
                    description: '',
                    order: sections.length + 1,
                    isPublished: false,
                    videos: []
                  });
                  setShowSectionForm(true);
                }}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
              >
                <FaPlus /> إضافة قسم جديد
              </button>
            </div>

            {/* Sections List */}
            <div className="space-y-6">
              {sections.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center text-gray-500 dark:text-gray-400">
                  لا توجد أقسام لهذه الدورة
                </div>
              ) : (
                sections.map((section) => (
                  <div
                    key={section._id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
                  >
                    {/* Section Header */}
                    <div className="p-6 bg-gradient-to-r from-primary/10 to-transparent border-r-4 border-primary">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                              {section.order}. {section.title}
                            </h3>
                            {section.isPublished ? (
                              <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                <FaEye /> منشور
                              </span>
                            ) : (
                              <span className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                <FaEyeSlash /> مسودة
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-gray-400">
                            {section.description}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                            {section.videos.length} فيديو
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingSection(section);
                              setShowSectionForm(true);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                            <FaEdit /> تعديل
                          </button>
                          <button
                            onClick={() => section._id && handleDeleteSection(section._id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Videos List */}
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <FaVideo className="text-primary" />
                          الفيديوهات
                        </h4>
                        <button
                          onClick={() => {
                            setCurrentSectionId(section._id || null);
                            setEditingVideo({
                              title: '',
                              description: '',
                              videoUrl: '',
                              duration: 0,
                              order: section.videos.length + 1,
                              isPreview: false,
                              allowDownload: false,
                              allowSharing: false
                            });
                            setShowVideoForm(true);
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                        >
                          <FaPlus /> إضافة فيديو
                        </button>
                      </div>

                      {section.videos.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                          لا توجد فيديوهات في هذا القسم
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {section.videos.map((video) => (
                            <div
                              key={video._id}
                              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex items-center gap-4 flex-1">
                                <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                                  <FaVideo className="text-2xl text-gray-500 dark:text-gray-400" />
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-semibold text-gray-900 dark:text-white">
                                    {video.order}. {video.title}
                                  </h5>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {video.description}
                                  </p>
                                  <div className="flex gap-3 mt-2 text-xs">
                                    <span className="text-gray-500">
                                      {formatDuration(video.duration)}
                                    </span>
                                    {video.isPreview && (
                                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded">
                                        معاينة
                                      </span>
                                    )}
                                    <span className={`px-2 py-0.5 rounded flex items-center gap-1 ${
                                      video.allowSharing
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                    }`}>
                                      {video.allowSharing ? <FaUnlock /> : <FaLock />}
                                      {video.allowSharing ? 'مشاركة مسموحة' : 'محمي من المشاركة'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setCurrentSectionId(section._id || null);
                                    setEditingVideo(video);
                                    setShowVideoForm(true);
                                  }}
                                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => section._id && video._id && handleDeleteVideo(section._id, video._id)}
                                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Section Form Modal */}
      {showSectionForm && editingSection && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowSectionForm(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {editingSection._id ? 'تعديل القسم' : 'إضافة قسم جديد'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  عنوان القسم
                </label>
                <input
                  type="text"
                  value={editingSection.title}
                  onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="مثال: المقدمة وأساسيات HTML"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الوصف
                </label>
                <textarea
                  value={editingSection.description}
                  onChange={(e) => setEditingSection({ ...editingSection, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="وصف مختصر للقسم"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الترتيب
                  </label>
                  <input
                    type="number"
                    value={editingSection.order}
                    onChange={(e) => setEditingSection({ ...editingSection, order: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الحالة
                  </label>
                  <select
                    value={editingSection.isPublished ? 'published' : 'draft'}
                    onChange={(e) => setEditingSection({ ...editingSection, isPublished: e.target.value === 'published' })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="draft">مسودة</option>
                    <option value="published">منشور</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveSection}
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                >
                  <FaSave /> حفظ
                </button>
                <button
                  onClick={() => setShowSectionForm(false)}
                  className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors flex items-center gap-2"
                >
                  <FaTimes /> إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Form Modal */}
      {showVideoForm && editingVideo && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowVideoForm(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {editingVideo._id ? 'تعديل الفيديو' : 'إضافة فيديو جديد'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  عنوان الفيديو
                </label>
                <input
                  type="text"
                  value={editingVideo.title}
                  onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الوصف
                </label>
                <textarea
                  value={editingVideo.description}
                  onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  رابط الفيديو
                </label>
                <input
                  type="url"
                  value={editingVideo.videoUrl}
                  onChange={(e) => setEditingVideo({ ...editingVideo, videoUrl: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    المدة (بالثواني)
                  </label>
                  <input
                    type="number"
                    value={editingVideo.duration}
                    onChange={(e) => setEditingVideo({ ...editingVideo, duration: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الترتيب
                  </label>
                  <input
                    type="number"
                    value={editingVideo.order}
                    onChange={(e) => setEditingVideo({ ...editingVideo, order: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="1"
                  />
                </div>
              </div>

              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingVideo.isPreview}
                    onChange={(e) => setEditingVideo({ ...editingVideo, isPreview: e.target.checked })}
                    className="w-5 h-5 text-primary"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    فيديو معاينة (يمكن مشاهدته بدون تسجيل)
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingVideo.allowDownload}
                    onChange={(e) => setEditingVideo({ ...editingVideo, allowDownload: e.target.checked })}
                    className="w-5 h-5 text-primary"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    السماح بتحميل الفيديو
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingVideo.allowSharing}
                    onChange={(e) => setEditingVideo({ ...editingVideo, allowSharing: e.target.checked })}
                    className="w-5 h-5 text-red-600"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      السماح بمشاركة الفيديو
                    </span>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      ⚠️ غير مُنصح به - يسمح للطلاب بمشاركة الفيديو
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveVideo}
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                >
                  <FaSave /> حفظ
                </button>
                <button
                  onClick={() => setShowVideoForm(false)}
                  className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors flex items-center gap-2"
                >
                  <FaTimes /> إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
