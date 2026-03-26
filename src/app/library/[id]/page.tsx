"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { FaArrowLeft, FaBook, FaDownload, FaEye, FaWhatsapp } from "react-icons/fa";
import supabase from "@/lib/supabase-client";

interface LibraryBook {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  cover_image?: string | null;
  file_url?: string | null;
  file_size?: number | null;
  download_count?: number | null;
  view_count?: number | null;
  price?: number | null;
  is_paid?: boolean | null;
}

interface PageProps {
  params: { id: string };
}

export default function LibraryBookDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const [book, setBook] = useState<LibraryBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const vodafoneNumber = "01070333143";
  const [hasAccess, setHasAccess] = useState(false);

  const bookId = params.id;

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("library_books")
          .select("*")
          .eq("id", bookId)
          .maybeSingle();

        if (error) {
          console.error("Error loading library book:", error);
          setError("حدث خطأ أثناء تحميل بيانات الكتاب");
          return;
        }

        if (!data) {
          setError("لم يتم العثور على هذا الكتاب");
          return;
        }

        const transformed: LibraryBook = {
          id: data.id,
          title: data.title,
          author: data.author,
          description: data.description || "",
          category: data.category || "عام",
          cover_image:
            data.cover_image ||
            data.thumbnail_url ||
            "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80",
          file_url: data.file_url,
          file_size: data.file_size,
          download_count: data.download_count,
          view_count: data.view_count,
          price:
            typeof data.price === "number"
              ? data.price
              : data.price
              ? Number(data.price)
              : null,
          is_paid:
            typeof data.is_paid === "boolean" ? data.is_paid : data.price && Number(data.price) > 0,
        };

        setBook(transformed);
      } catch (err) {
        console.error("Unexpected error loading library book:", err);
        setError("حدث خطأ غير متوقع أثناء تحميل بيانات الكتاب");
      } finally {
        setLoading(false);
      }
    };

    if (bookId) {
      fetchBook();
    }
  }, [bookId]);

  // التحقق هل الطالب يمتلك هذا الكتاب بعد تحميل بياناته
  useEffect(() => {
    const checkOwned = async () => {
      try {
        if (!book?.id) return;
        if (typeof window === "undefined") return;

        const userJson = localStorage.getItem("user");
        if (!userJson) {
          setHasAccess(false);
          return;
        }

        let user: any = {};
        try {
          user = JSON.parse(userJson);
        } catch (e) {
          console.error("Error parsing user data in owned check:", e);
          setHasAccess(false);
          return;
        }

        const userId = user?.id || (user as any)?._id;
        const phone = user?.studentPhone || user?.phone || '';
        if (!userId) {
          setHasAccess(false);
          return;
        }

        const params = new URLSearchParams();
        params.set('bookId', book.id);
        params.set('userId', userId);
        if (phone) {
          params.set('studentPhone', phone);
        }

        const res = await fetch(`/api/library/owned?${params.toString()}`);

        if (!res.ok) {
          setHasAccess(false);
          return;
        }

        const data = await res.json();
        setHasAccess(!!data.owned);
      } catch (err) {
        console.error("Error checking owned book in details page:", err);
        setHasAccess(false);
      }
    };

    checkOwned();
  }, [book?.id]);

  const handleBuyBook = async () => {
    try {
      if (!book) return;
      if (typeof window === "undefined") return;

      const userJson = localStorage.getItem("user");
      if (!userJson) {
        toast.error("يرجى تسجيل الدخول أولاً لشراء الكتب");
        window.location.href = `/login?redirect=/library/${book.id}`;
        return;
      }

      let user: any = {};
      try {
        user = JSON.parse(userJson);
      } catch (e) {
        console.error("Error parsing user data:", e);
      }

      const studentName = user?.name || "طالب";
      const studentPhone = user?.studentPhone || user?.phone || "";
      if (!studentPhone) {
        toast.error("لا يوجد رقم هاتف مسجل في حسابك");
      }

      const bookPrice = typeof book.price === "number" ? book.price : 0;

      const message = `
*طلب شراء كتاب*

📚 اسم الكتاب: ${book.title}
💰 السعر: ${bookPrice} جنيه
👤 اسم الطالب: ${studentName}
📱 رقم الهاتف: ${studentPhone}

سأرسل إيصال الدفع الآن لتأكيد شراء الكتاب ✅
`;

      const waUrl = `https://wa.me/2${vodafoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank");

      try {
        await fetch("/api/library/book-purchase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookId: book.id,
            studentId: user?.id || (user as any)?._id,
            studentName,
            studentPhone,
            price: bookPrice,
          }),
        });
      } catch (requestError) {
        console.error("Error creating book purchase request:", requestError);
      }

      toast.success("تم إرسال طلب شراء الكتاب، سيتم مراجعته من الأدمن قريباً");
    } catch (err) {
      console.error("Error in handleBuyBook (details page):", err);
      toast.error("حدث خطأ أثناء إنشاء طلب شراء الكتاب");
    }
  };

  const handleOpenBook = () => {
    if (!book?.file_url) {
      toast.error("لا يوجد ملف متاح لهذا الكتاب");
      return;
    }
    window.open(book.file_url, "_blank");
  };

  const handleDownloadBook = () => {
    if (!book?.file_url) {
      toast.error("لا يوجد ملف متاح لهذا الكتاب");
      return;
    }

    const link = document.createElement("a");
    link.href = book.file_url;
    link.download = book.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("جاري تحميل الكتاب...");
  };

  const isPaid = !!(book && typeof book.price === "number" && book.price > 0);
  const canOpen = !!(book && book.file_url && (!isPaid || hasAccess));

  return (
    <div className="min-h-screen py-16 px-4 md:px-8 bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push("/library")}
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary"
        >
          <FaArrowLeft />
          العودة إلى المكتبة
        </button>

        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-300">جاري تحميل بيانات الكتاب...</p>
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <p className="text-red-500 font-semibold mb-2">حدث خطأ</p>
            <p className="text-gray-600 dark:text-gray-300">{error}</p>
          </div>
        ) : !book ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">لم يتم العثور على هذا الكتاب</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 grid md:grid-cols-2 gap-8">
            <div className="relative h-72 md:h-80 rounded-lg overflow-hidden shadow-md">
              <Image
                src={book.cover_image || "/placeholder-book.png"}
                alt={book.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary mb-2">
                <FaBook />
                <span className="text-sm font-semibold">كتاب من مكتبة المستقبل</span>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold mb-2">{book.title}</h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">المؤلف: {book.author}</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">التصنيف: {book.category}</p>

              {isPaid && (
                <p className="text-lg font-semibold text-primary">
                  سعر الكتاب: {book.price} ج.م
                </p>
              )}

              {!isPaid && (
                <p className="text-sm text-emerald-600 font-semibold">هذا الكتاب مجاني</p>
              )}

              {book.description && (
                <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                  {book.description}
                </p>
              )}

              <div className="flex flex-wrap gap-4 mt-4">
                {canOpen && (
                  <>
                    <button
                      onClick={handleOpenBook}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition"
                    >
                      <FaEye />
                      عرض الكتاب
                    </button>
                    <button
                      onClick={handleDownloadBook}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition"
                    >
                      <FaDownload />
                      تحميل الكتاب
                    </button>
                  </>
                )}

                {isPaid && !hasAccess && (
                  <button
                    onClick={handleBuyBook}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition"
                  >
                    <FaWhatsapp />
                    شراء الكتاب عبر واتساب
                  </button>
                )}
              </div>

              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                <p>
                  عدد المشاهدات: {book.view_count ?? 0} | عدد التحميلات: {book.download_count ?? 0}
                </p>
                <p className="mt-1">
                  عند شراء الكتاب سيتم مراجعة الطلب من الأدمن، وعند القبول سيظهر الكتاب في مكتبتك
                  الخاصة.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-gray-400">
          <Link href="/library" className="hover:text-primary">
            العودة إلى جميع الكتب
          </Link>
        </div>
      </div>
    </div>
  );
}
