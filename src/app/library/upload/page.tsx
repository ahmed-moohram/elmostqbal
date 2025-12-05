'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaFilePdf, FaUpload, FaTrash, FaEye, FaDownload, FaBook } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import supabase from '@/lib/supabase-client';

interface PDFBook {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  file_url: string;
  file_size: number;
  thumbnail_url?: string;
  uploaded_by: string;
  course_id?: string;
  is_public: boolean;
  download_count: number;
  view_count: number;
  created_at: string;
  metadata?: {
    pages?: number;
    language?: string;
    isbn?: string;
    publisher?: string;
    year?: number;
  };
}

export default function LibraryUpload() {
  const [uploading, setUploading] = useState(false);
  const [books, setBooks] = useState<PDFBook[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    category: 'general',
    course_id: '',
    is_public: true
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (file && file.type === 'application/pdf') {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast.error('حجم الملف كبير جداً (الحد الأقصى 50MB)');
        return;
      }
      
      setSelectedFile(file);
      
      // Auto-fill title from filename
      const fileName = file.name.replace('.pdf', '');
      setFormData(prev => ({
        ...prev,
        title: fileName
      }));
      
      toast.success('تم اختيار الملف بنجاح');
    } else {
      toast.error('يجب اختيار ملف PDF فقط');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  // Upload PDF to Supabase Storage
  const uploadPDF = async () => {
    if (!selectedFile) {
      toast.error('يرجى اختيار ملف PDF');
      return;
    }

    if (!formData.title || !formData.author) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return;
      }

      // Upload file to Supabase Storage
      const fileName = `${Date.now()}-${selectedFile.name}`;
      const filePath = `library/${user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pdf-library')
        .upload(filePath, selectedFile, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('فشل رفع الملف');
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pdf-library')
        .getPublicUrl(filePath);

      // Save book metadata to database
      const { data: book, error: dbError } = await supabase
        .from('library_books')
        .insert({
          title: formData.title,
          author: formData.author,
          description: formData.description,
          category: formData.category,
          file_url: publicUrl,
          file_size: selectedFile.size,
          file_path: filePath,
          uploaded_by: user.id,
          course_id: formData.course_id || null,
          is_public: formData.is_public,
          download_count: 0,
          view_count: 0,
          metadata: {
            original_name: selectedFile.name,
            upload_date: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        // Try to delete uploaded file if database insert fails
        await supabase.storage
          .from('pdf-library')
          .remove([filePath]);
        toast.error('فشل حفظ معلومات الكتاب');
        return;
      }

      toast.success('تم رفع الكتاب بنجاح!');
      
      // Reset form
      setSelectedFile(null);
      setFormData({
        title: '',
        author: '',
        description: '',
        category: 'general',
        course_id: '',
        is_public: true
      });

      // Refresh books list
      await fetchBooks();

      // Send notification
      await sendUploadNotification(user.id, book);

    } catch (error) {
      console.error('Error:', error);
      toast.error('حدث خطأ في رفع الكتاب');
    } finally {
      setUploading(false);
    }
  };

  // Fetch user's books
  const fetchBooks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: userBooks, error } = await supabase
        .from('library_books')
        .select('*')
        .or(`uploaded_by.eq.${user.id},is_public.eq.true`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching books:', error);
        return;
      }

      setBooks(userBooks || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Delete book
  const deleteBook = async (book: PDFBook) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكتاب؟')) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('pdf-library')
        .remove([book.file_url.split('/').slice(-3).join('/')]);

      if (storageError) {
        console.error('Storage error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('library_books')
        .delete()
        .eq('id', book.id);

      if (dbError) {
        console.error('Database error:', dbError);
        toast.error('فشل حذف الكتاب');
        return;
      }

      toast.success('تم حذف الكتاب بنجاح');
      await fetchBooks();
    } catch (error) {
      console.error('Error:', error);
      toast.error('حدث خطأ في حذف الكتاب');
    }
  };

  // View PDF
  const viewPDF = async (book: PDFBook) => {
    // Update view count
    await supabase
      .from('library_books')
      .update({ view_count: book.view_count + 1 })
      .eq('id', book.id);

    // Open PDF in new tab
    window.open(book.file_url, '_blank');
  };

  // Download PDF
  const downloadPDF = async (book: PDFBook) => {
    // Update download count
    await supabase
      .from('library_books')
      .update({ download_count: book.download_count + 1 })
      .eq('id', book.id);

    // Start download
    const link = document.createElement('a');
    link.href = book.file_url;
    link.download = `${book.title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('جاري تحميل الكتاب...');
  };

  const sendUploadNotification = async (userId: string, book: any) => {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'تم رفع كتاب جديد',
          message: `تم رفع كتاب "${book.title}" بنجاح إلى المكتبة`,
          type: 'success',
          link: `/library/${book.id}`,
          metadata: {
            book_id: book.id,
            book_title: book.title
          }
        });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  useState(() => {
    fetchBooks();
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <FaBook className="text-blue-600" />
                مكتبة الكتب الإلكترونية
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                ارفع وشارك الكتب والمراجع التعليمية
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{books.length}</p>
              <p className="text-sm text-gray-600">كتاب في المكتبة</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">رفع كتاب جديد</h2>

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
            >
              <input {...getInputProps()} />
              <FaUpload className="text-4xl text-gray-400 mx-auto mb-4" />
              {selectedFile ? (
                <div>
                  <FaFilePdf className="text-5xl text-red-500 mx-auto mb-2" />
                  <p className="font-semibold">{selectedFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold mb-2">
                    {isDragActive ? 'أفلت الملف هنا' : 'اسحب وأفلت ملف PDF هنا'}
                  </p>
                  <p className="text-sm text-gray-600">أو انقر لاختيار ملف</p>
                  <p className="text-xs text-gray-500 mt-2">الحد الأقصى: 50MB</p>
                </div>
              )}
            </div>

            {/* Form */}
            {selectedFile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">عنوان الكتاب *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    placeholder="مثال: كتاب الرياضيات للصف الثالث"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">المؤلف *</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({...formData, author: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    placeholder="اسم المؤلف"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">الوصف</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    rows={3}
                    placeholder="وصف مختصر للكتاب"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">التصنيف</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="general">عام</option>
                    <option value="mathematics">رياضيات</option>
                    <option value="science">علوم</option>
                    <option value="arabic">لغة عربية</option>
                    <option value="english">لغة إنجليزية</option>
                    <option value="history">تاريخ</option>
                    <option value="geography">جغرافيا</option>
                    <option value="programming">برمجة</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="isPublic" className="text-sm">
                    متاح للجميع
                  </label>
                </div>

                <button
                  onClick={uploadPDF}
                  disabled={uploading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      جاري الرفع...
                    </>
                  ) : (
                    <>
                      <FaUpload />
                      رفع الكتاب
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </div>

          {/* Books List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">الكتب المرفوعة</h2>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              <AnimatePresence>
                {books.map((book) => (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="border rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start gap-4">
                      <FaFilePdf className="text-3xl text-red-500 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-bold">{book.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          المؤلف: {book.author}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          الحجم: {(book.file_size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>👁 {book.view_count} مشاهدة</span>
                          <span>⬇ {book.download_count} تحميل</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewPDF(book)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="عرض"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => downloadPDF(book)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="تحميل"
                        >
                          <FaDownload />
                        </button>
                        <button
                          onClick={() => deleteBook(book)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="حذف"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    {book.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {book.description}
                      </p>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {books.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FaBook className="text-4xl mx-auto mb-4 opacity-50" />
                  <p>لا توجد كتب مرفوعة بعد</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
