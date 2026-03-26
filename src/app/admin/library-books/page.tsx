"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { FaBook, FaFilePdf, FaUpload, FaEye, FaDownload, FaTrash, FaDollarSign, FaEdit } from "react-icons/fa";
import { toast } from "react-hot-toast";
import AdminLayout from "@/components/AdminLayout";
import supabase from "@/lib/supabase-client";

interface AdminLibraryBook {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  file_url: string;
  file_size: number;
  download_count: number;
  view_count: number;
  is_public: boolean;
  created_at: string;
  cover_image?: string | null;
  price?: number | null;
  is_paid?: boolean | null;
}

export default function AdminLibraryBooksPage() {
  const [books, setBooks] = useState<AdminLibraryBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    category: "general",
    is_public: true,
    price: "",
    is_paid: false,
  });
  const [sourceType, setSourceType] = useState<"upload" | "external">("upload");
  const [externalUrl, setExternalUrl] = useState("");
  const [editingBookId, setEditingBookId] = useState<string | null>(null);

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("library_books")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching library books for admin:", error);
        toast.error("فشل تحميل الكتب");
        setBooks([]);
        return;
      }

      setBooks((data || []) as any);
    } catch (err) {
      console.error("Unexpected error fetching admin library books:", err);
      toast.error("حدث خطأ أثناء تحميل الكتب");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];

    if (file && allowedTypes.includes(file.type)) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("حجم الملف كبير جداً (الحد الأقصى 50MB)");
        return;
      }

      setSelectedFile(file);
      const fileName = file.name.replace(/\.(pdf|pptx)$/i, "");
      setFormData((prev) => ({
        ...prev,
        title: fileName,
      }));

      toast.success("تم اختيار الملف بنجاح");
    } else {
      toast.error("يجب اختيار ملف PDF أو PPTX فقط");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!formData.title || !formData.author) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    const numericPrice = formData.price ? Number(formData.price) : null;
    if (formData.is_paid && (!numericPrice || numericPrice <= 0)) {
      toast.error("أدخل سعرًا صالحًا للكتاب المدفوع");
      return;
    }

    if (sourceType === "upload" && !selectedFile) {
      toast.error("يرجى اختيار ملف للكتاب");
      return;
    }

    if (sourceType === "external" && !externalUrl.trim()) {
      toast.error("يرجى إدخال رابط الكتاب (جوجل درايف أو رابط مباشر)");
      return;
    }

    setUploading(true);

    try {
      let user: any = null;
      try {
        const userJson = localStorage.getItem('user');
        if (userJson) {
          user = JSON.parse(userJson);
        }
      } catch (e) { }

      if (!user) {
        toast.error("يجب تسجيل الدخول أولاً");
        return;
      }

      let fileUrl = "";
      let fileSize = 0;
      let filePath: string | null = null;

      if (sourceType === "upload") {
        if (!selectedFile) {
          toast.error("يرجى اختيار ملف للكتاب");
          return;
        }

        const fileName = `${Date.now()}-${selectedFile.name}`;
        filePath = `library/${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("pdf-library")
          .upload(filePath, selectedFile, {
            contentType: selectedFile.type || "application/octet-stream",
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error("فشل رفع الملف");
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("pdf-library").getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileSize = selectedFile.size;
      } else {
        fileUrl = externalUrl.trim();
        fileSize = 0;
      }

      let coverPublicUrl: string | null = null;
      let coverFilePath: string | null = null;

      if (selectedCoverFile) {
        try {
          const coverFileName = `${Date.now()}-cover-${selectedCoverFile.name}`;
          coverFilePath = `library/${user.id}/covers/${coverFileName}`;

          const { error: coverUploadError } = await supabase.storage
            .from("pdf-library")
            .upload(coverFilePath, selectedCoverFile, {
              contentType: selectedCoverFile.type || "image/jpeg",
              upsert: false,
            });

          if (coverUploadError) {
            console.error("Cover upload error:", coverUploadError);
            toast.error("فشل رفع صورة الغلاف، سيتم استخدام صورة افتراضية");
          } else {
            const { data: coverData } = supabase.storage
              .from("pdf-library")
              .getPublicUrl(coverFilePath);
            coverPublicUrl = coverData.publicUrl;
          }
        } catch (coverErr) {
          console.error("Unexpected error uploading cover image:", coverErr);
        }
      }

      const bookData: any = {
        title: formData.title,
        author: formData.author,
        description: formData.description,
        category: formData.category,
        is_public: formData.is_public,
        price: numericPrice,
        is_paid: numericPrice != null && numericPrice > 0 ? true : formData.is_paid,
      };

      if (!editingBookId) {
        Object.assign(bookData, {
          uploaded_by: user.id || null, // Allow fallback if custom auth is missing id
          download_count: 0,
          view_count: 0,
        });
      }

      if (fileUrl) {
        bookData.file_url = fileUrl;
        bookData.file_size = fileSize;
        bookData.file_path = filePath;
      }

      if (coverPublicUrl) {
        bookData.cover_image = coverPublicUrl;
      }

      // Metadata Update
      bookData.metadata = {
        original_name:
          sourceType === "upload" && selectedFile ? selectedFile.name : null,
        upload_date: new Date().toISOString(),
        created_by: "admin",
        source: sourceType,
        external_url: sourceType === "external" ? externalUrl.trim() : undefined,
      };

      let dbError;
      if (editingBookId) {
        const { error } = await supabase
          .from("library_books")
          .update(bookData)
          .eq("id", editingBookId);
        dbError = error;
      } else {
        const { error } = await supabase
          .from("library_books")
          .insert(bookData);
        dbError = error;
      }

      if (dbError) {
        console.error("Database error:", dbError);
        if (filePath) {
          await supabase.storage.from("pdf-library").remove([filePath]);
        }
        if (coverFilePath) {
          try {
            await supabase.storage.from("pdf-library").remove([coverFilePath]);
          } catch (removeCoverErr) {
            console.error("Error removing cover image after DB error:", removeCoverErr);
          }
        }
        toast.error("فشل حفظ معلومات الكتاب");
        return;
      }

      toast.success(editingBookId ? "تم تعديل الكتاب بنجاح!" : "تم رفع الكتاب بنجاح!");

      setSelectedFile(null);
      setSelectedCoverFile(null);
      setSourceType("upload");
      setExternalUrl("");
      setEditingBookId(null);
      setFormData({
        title: "",
        author: "",
        description: "",
        category: "general",
        is_public: true,
        price: "",
        is_paid: false,
      });

      await fetchBooks();
    } catch (err) {
      console.error("Error uploading admin book:", err);
      toast.error("حدث خطأ في رفع الكتاب");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (book: AdminLibraryBook) => {
    setEditingBookId(book.id);
    setFormData({
      title: book.title || "",
      author: book.author || "",
      description: book.description || "",
      category: book.category || "general",
      is_public: book.is_public ?? true,
      price: book.price ? String(book.price) : "",
      is_paid: book.is_paid || false,
    });

    if (book.file_url && !book.file_url.includes("supabase.co")) {
      setSourceType("external");
      setExternalUrl(book.file_url);
    } else {
      setSourceType("upload");
      setExternalUrl("");
    }
    setSelectedFile(null);
    setSelectedCoverFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingBookId(null);
    setFormData({
      title: "",
      author: "",
      description: "",
      category: "general",
      is_public: true,
      price: "",
      is_paid: false,
    });
    setSourceType("upload");
    setExternalUrl("");
    setSelectedFile(null);
    setSelectedCoverFile(null);
  };

  const handleDelete = async (book: AdminLibraryBook) => {
    if (!confirm("هل أنت متأكد من حذف هذا الكتاب؟")) return;

    try {
      const response = await fetch("/api/admin/library-books/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookId: book.id }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error("Error deleting book via API:", result.error || result);
        toast.error(result.error || "فشل حذف الكتاب");
        return;
      }

      toast.success(result.message || "تم حذف الكتاب بنجاح");
      await fetchBooks();
    } catch (err) {
      console.error("Error deleting admin book:", err);
      toast.error("حدث خطأ في حذف الكتاب");
    }
  };

  const handleView = async (book: AdminLibraryBook) => {
    try {
      await supabase
        .from("library_books")
        .update({ view_count: book.view_count + 1 })
        .eq("id", book.id);
    } catch (err) {
      console.error("Error updating view count for admin book:", err);
    }

    window.open(book.file_url, "_blank");
  };

  const handleDownload = async (book: AdminLibraryBook) => {
    try {
      await supabase
        .from("library_books")
        .update({ download_count: book.download_count + 1 })
        .eq("id", book.id);
    } catch (err) {
      console.error("Error updating download count for admin book:", err);
    }

    if (book.file_url.includes("supabase.co")) {
      const link = document.createElement("a");
      link.href = book.file_url;
      link.download = book.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("جاري تحميل الكتاب...");
    } else {
      window.open(book.file_url, "_blank");
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FaBook className="text-primary" />
            إدارة مكتبة الكتب
          </h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* قسم رفع كتاب */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">{editingBookId ? "تعديل بيانات الكتاب" : "رفع كتاب جديد"}</h2>

            {/* اختيار مصدر الكتاب */}
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => setSourceType("upload")}
                className={`px-3 py-1.5 text-sm rounded-full border transition ${sourceType === "upload"
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
              >
                ملف مرفوع (PDF / PPTX)
              </button>
              <button
                type="button"
                onClick={() => setSourceType("external")}
                className={`px-3 py-1.5 text-sm rounded-full border transition ${sourceType === "external"
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
              >
                رابط خارجي (جوجل درايف)
              </button>
            </div>

            {sourceType === "upload" && (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-gray-300 hover:border-primary"
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
                      {isDragActive
                        ? "أفلت الملف هنا"
                        : "اسحب وأفلت ملف كتاب (PDF أو PPTX) هنا"}
                    </p>
                    <p className="text-sm text-gray-600">أو انقر لاختيار ملف</p>
                    <p className="text-xs text-gray-500 mt-2">الحد الأقصى: 50MB</p>
                  </div>
                )}
              </div>
            )}

            {(sourceType === "external" || selectedFile) && (
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
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="مثال: كتاب الرياضيات للصف الثالث"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">المؤلف *</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="اسم المؤلف"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">الوصف</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    rows={3}
                    placeholder="وصف مختصر للكتاب"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">التصنيف</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  >
                    <option value="general">عام</option>
                    <option value="arabic">لغة عربية</option>
                    <option value="english">لغة إنجليزية</option>
                    <option value="french">لغة فرنسية</option>
                    <option value="german">لغة ألمانية</option>
                    <option value="italian">لغة إيطالية</option>
                    <option value="spanish">لغة إسبانية</option>
                    <option value="mathematics">رياضيات</option>
                    <option value="physics">فيزياء</option>
                    <option value="chemistry">كيمياء</option>
                    <option value="biology">أحياء</option>
                    <option value="science">علوم</option>
                    <option value="history">تاريخ</option>
                    <option value="geography">جغرافيا</option>
                    <option value="religion">تربية دينية</option>
                    <option value="social">دراسات اجتماعية</option>
                    <option value="computer">حاسب آلي</option>
                    <option value="programming">برمجة</option>
                    <option value="other">مواد أخرى</option>
                  </select>
                </div>

                {sourceType === "external" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      رابط الكتاب (جوجل درايف أو رابط مباشر) *
                    </label>
                    <input
                      type="url"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="https://drive.google.com/..."
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">صورة الغلاف (اختياري)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setSelectedCoverFile(file);
                    }}
                    className="w-full text-sm text-gray-600"
                  />
                  {selectedCoverFile && (
                    <p className="mt-1 text-xs text-gray-500">
                      سيتم استخدام الصورة: {selectedCoverFile.name} كغلاف للكتاب
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                      <FaDollarSign />
                      سعر الكتاب (ج.م)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="0 (مجاني)"
                    />
                  </div>

                  <div className="flex items-center mt-6">
                    <input
                      type="checkbox"
                      id="isPaidBookAdmin"
                      checked={formData.is_paid}
                      onChange={(e) => setFormData({ ...formData, is_paid: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="isPaidBookAdmin" className="text-sm">
                      كتاب مدفوع
                    </label>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublicAdminBook"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="isPublicAdminBook" className="text-sm">
                    متاح للجميع في صفحة المكتبة
                  </label>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex-1 bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <FaUpload />
                        {editingBookId ? "حفظ التعديلات" : "رفع الكتاب"}
                      </>
                    )}
                  </button>

                  {editingBookId && (
                    <button
                      onClick={cancelEdit}
                      disabled={uploading}
                      className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
                    >
                      إلغاء
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* قائمة الكتب */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">جميع كتب المكتبة</h2>

            {loading ? (
              <p className="text-center text-gray-500 py-8">جاري تحميل الكتب...</p>
            ) : books.length === 0 ? (
              <p className="text-center text-gray-500 py-8">لا توجد كتب حالياً</p>
            ) : (
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
                          <h3 className="font-bold mb-1">{book.title}</h3>
                          <p className="text-sm text-gray-600 mb-1">المؤلف: {book.author}</p>
                          {typeof book.price === "number" && book.price > 0 && (
                            <p className="text-sm text-emerald-600 font-semibold mb-1">
                              سعر الكتاب: {book.price} ج.م
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            الحجم: {(book.file_size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>👁 {book.view_count} مشاهدة</span>
                            <span>⬇ {book.download_count} تحميل</span>
                            <span>
                              الحالة: {book.is_public ? "عام" : "خاص"}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(book)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="عرض"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => handleEdit(book)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                            title="تعديل"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDownload(book)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="تحميل"
                          >
                            <FaDownload />
                          </button>
                          <button
                            onClick={() => handleDelete(book)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="حذف"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
