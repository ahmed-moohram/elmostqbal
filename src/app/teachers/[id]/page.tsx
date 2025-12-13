'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FaChalkboardTeacher, FaStar, FaUsers, FaBookOpen } from 'react-icons/fa';
import supabase from '@/lib/supabase-client';

interface TeacherProfile {
  id: string; // user id
  teacherRowId?: string; // teachers table id
  name: string;
  avatar?: string | null;
  specialization?: string | null;
  bio?: string | null;
  rating: number;
  students: number;
  courses: number;
}

interface TeacherCourse {
  id: string;
  title: string;
  shortDescription?: string | null;
  thumbnail?: string | null;
  level?: string | null;
  price?: number | null;
  isPublished: boolean;
}

interface TeacherBook {
  id: string;
  title: string;
  author?: string | null;
  description?: string | null;
  category?: string | null;
  fileUrl: string;
  viewCount: number;
  downloadCount: number;
}

export default function PublicTeacherPage() {
  const params = useParams();
  const router = useRouter();
  const teacherUserId = (params as any)?.id as string | undefined;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [books, setBooks] = useState<TeacherBook[]>([]);

  useEffect(() => {
    const loadTeacher = async () => {
      if (!teacherUserId) {
        setError('لم يتم تحديد المدرس');
        setIsLoading(false);
        return;
      }

      try {
        // جلب بيانات المستخدم الرئيسية
        const { data: userRow, error: userError } = await supabase
          .from('users')
          .select('id, name, avatar_url, role')
          .eq('id', teacherUserId)
          .single();

        if (userError || !userRow) {
          console.error('❌ خطأ في جلب بيانات المستخدم المدرس:', userError);
          setError('المدرس غير موجود');
          setIsLoading(false);
          return;
        }

        if (userRow.role !== 'teacher') {
          setError('هذا المستخدم ليس مدرساً');
          setIsLoading(false);
          return;
        }

        // ملف المدرس من جدول teachers
        const { data: teacherRow, error: teacherError } = await supabase
          .from('teachers')
          .select('*')
          .eq('user_id', teacherUserId)
          .maybeSingle();

        if (teacherError) {
          console.error('❌ خطأ في جلب ملف المدرس:', teacherError);
        }

        const profile: TeacherProfile = {
          id: userRow.id,
          teacherRowId: teacherRow?.id,
          name: userRow.name || 'مدرس',
          avatar: userRow.avatar_url,
          specialization: teacherRow?.specialization || null,
          bio: teacherRow?.bio || null,
          rating: Number(teacherRow?.rating) || 0,
          students: teacherRow?.total_students ?? 0,
          courses: teacherRow?.total_courses ?? 0,
        };

        setTeacher(profile);

        // جلب كورسات المدرس المنشورة
        if (teacherRow?.id) {
          const { data: coursesRows, error: coursesError } = await supabase
            .from('courses')
            .select('*')
            .eq('instructor_id', teacherUserId)
            .eq('is_published', true)
            .order('created_at', { ascending: false });

          if (coursesError) {
            console.error('❌ خطأ في جلب كورسات المدرس:', coursesError);
          }

          const mapped: TeacherCourse[] = (coursesRows || []).map((c: any) => ({
            id: c.id,
            title: c.title,
            shortDescription: c.short_description || c.description || null,
            thumbnail: c.thumbnail,
            level: c.level,
            price: c.price,
            isPublished: !!c.is_published,
          }));

          setCourses(mapped);
        } else {
          setCourses([]);
        }

        // جلب كتب المدرس المنشورة في المكتبة
        const { data: booksRows, error: booksError } = await supabase
          .from('library_books')
          .select('*')
          .eq('uploaded_by', teacherUserId)
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        if (booksError) {
          console.error('❌ خطأ في جلب كتب المدرس:', booksError);
        }

        const mappedBooks: TeacherBook[] = (booksRows || []).map((b: any) => ({
          id: b.id,
          title: b.title,
          author: b.author,
          description: b.description,
          category: b.category,
          fileUrl: b.file_url || '',
          viewCount: Number(b.view_count) || 0,
          downloadCount: Number(b.download_count) || 0,
        }));

        setBooks(mappedBooks);
      } catch (err) {
        console.error('❌ خطأ غير متوقع في صفحة المدرس العامة:', err);
        setError('حدث خطأ غير متوقع');
      } finally {
        setIsLoading(false);
      }
    };

    loadTeacher();
  }, [teacherUserId]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-500">جارٍ تحميل بيانات المدرس...</p>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-red-500 font-semibold">{error || 'تعذر تحميل بيانات المدرس'}</p>
        <button
          onClick={() => router.back()}
          className="btn-modern px-6 py-2 rounded-full"
        >
          العودة للخلف
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container-custom py-16">
        {/* هيدر المدرس */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-6 sm:p-10 mb-12 flex flex-col md:flex-row items-center gap-8">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40">
            <Image
              src={teacher.avatar || '/placeholder-avatar.png'}
              alt={teacher.name}
              fill
              sizes="(min-width: 640px) 10rem, 8rem"
              priority
              className="object-cover rounded-full border-4 border-primary/30 shadow-2xl"
            />
          </div>
          <div className="flex-1 text-center md:text-right space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-2">
              <FaChalkboardTeacher />
              <span>مدرس على منصة المستقبل التعليمية</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              {teacher.name}
            </h1>
            {teacher.specialization && (
              <p className="text-lg text-slate-600 dark:text-slate-300">
                متخصص في {teacher.specialization}
              </p>
            )}
            {teacher.bio && (
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto md:mx-0">
                {teacher.bio}
              </p>
            )}

            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2 text-sm sm:text-base">
              <div className="flex items-center gap-2">
                <FaStar className="text-yellow-500" />
                <span className="font-semibold">{teacher.rating.toFixed(1)}</span>
                <span className="text-slate-500">تقييم</span>
              </div>
              <div className="flex items-center gap-2">
                <FaUsers className="text-primary" />
                <span className="font-semibold">{teacher.students}</span>
                <span className="text-slate-500">طالب</span>
              </div>
              <div className="flex items-center gap-2">
                <FaBookOpen className="text-emerald-500" />
                <span className="font-semibold">{teacher.courses}</span>
                <span className="text-slate-500">دورة</span>
              </div>
            </div>
          </div>
        </div>

        {/* كورسات المدرس */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              كورسات {teacher.name}
            </h2>
          </div>

          {courses.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              لا توجد دورات منشورة لهذا المدرس حالياً.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {courses.map((course, index) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="bg-white dark:bg-slate-900 rounded-2xl shadow-md hover:shadow-xl transition-shadow overflow-hidden flex flex-col h-full"
                >
                  <div className="relative h-44">
                    <Image
                      src={course.thumbnail || '/placeholder-course.png'}
                      alt={course.title}
                      fill
                      sizes="(min-width: 1024px) 22rem, (min-width: 768px) 18rem, 100vw"
                      priority={index === 0}
                      className="object-cover"
                    />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white line-clamp-2">
                      {course.title}
                    </h3>
                    {course.shortDescription && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 line-clamp-3">
                        {course.shortDescription}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                      {course.level && <span>{course.level}</span>}
                      {course.price != null && (
                        <span className="font-bold text-primary">{course.price} ج.م</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* كتب المدرس في المكتبة */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              كتب {teacher.name}
            </h2>
          </div>

          {books.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              لا توجد كتب منشورة لهذا المدرس حالياً.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl shadow-md hover:shadow-xl transition-shadow overflow-hidden flex flex-col h-full p-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FaBookOpen className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-2">
                        {book.title}
                      </h3>
                      {book.author && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          تأليف: {book.author}
                        </p>
                      )}
                    </div>
                  </div>

                  {book.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 line-clamp-3">
                      {book.description}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      تمت المشاهدة {book.viewCount} مرة
                    </span>
                    <span>
                      تم التحميل {book.downloadCount} مرة
                    </span>
                  </div>

                  {book.fileUrl && (
                    <a
                      href={book.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      عرض الكتاب
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
