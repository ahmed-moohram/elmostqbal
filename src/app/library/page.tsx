'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FaSearch, 
  FaFilter, 
  FaBook, 
  FaStar, 
  FaEye, 
  FaDownload, 
  FaBookOpen, 
  FaGraduationCap, 
  FaBookReader,
  FaWhatsapp,
} from 'react-icons/fa';
import GlowingText from '../../components/GlowingText';
import { toast } from 'react-hot-toast';
import { useTheme } from 'next-themes';
import supabase from '@/lib/supabase-client';

// نموذج بيانات الكتب الرقمية
interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  category: string;
  rating: number;
  downloads: number;
  views: number;
  isPremium: boolean;
  isNewRelease: boolean;
  description: string;
  year: number;
  price?: number | null;
  isPaid?: boolean;
}

const categories = [
  { name: 'الكل', value: 'all' },
  { name: 'رياضيات', value: 'رياضيات' },
  { name: 'فيزياء', value: 'فيزياء' },
  { name: 'كيمياء', value: 'كيمياء' },
  { name: 'أحياء', value: 'أحياء' },
  { name: 'لغة عربية', value: 'لغة عربية' },
  { name: 'لغة إنجليزية', value: 'لغة إنجليزية' },
  { name: 'تاريخ', value: 'تاريخ' },
  { name: 'فلسفة', value: 'فلسفة' }
];

const LibraryPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  const [showNewOnly, setShowNewOnly] = useState(false);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const vodafoneNumber = '01070333143';
  
  // جلب البيانات من Supabase (الكتب الحقيقية المرفوعة)
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // استخدام Supabase لجلب الكتب العامة من جدول library_books
        const { data, error } = await supabase
          .from('library_books')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('خطأ في جلب بيانات الكتب:', error);
          setBooks([]);
          setFilteredBooks([]);
          setError('حدث خطأ أثناء تحميل الكتب. حاول مرة أخرى لاحقاً.');
          return;
        }

        const transformedBooks: Book[] = (data || []).map((book: any) => ({
          id: book.id,
          title: book.title,
          author: book.author,
          coverImage:
            book.cover_image ||
            book.thumbnail_url ||
            'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80',
          category: book.category || 'عام',
          rating: book.rating || 0,
          downloads: book.downloads || book.download_count || 0,
          views: book.views || book.view_count || 0,
          isPremium: book.is_premium || false,
          isNewRelease: book.is_new_release || false,
          description: book.description || '',
          year: book.year || new Date().getFullYear(),
          price: typeof book.price === 'number' ? book.price : book.price ? Number(book.price) : null,
          isPaid: typeof book.is_paid === 'boolean' ? book.is_paid : false,
        }));

        setBooks(transformedBooks);
        setFilteredBooks(transformedBooks);
      } catch (err) {
        console.error('خطأ في جلب بيانات الكتب:', err);
        setBooks([]);
        setFilteredBooks([]);
        setError('حدث خطأ أثناء تحميل الكتب. حاول مرة أخرى لاحقاً.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, []);
  
  // تصفية الكتب عند تغيير معايير البحث
  useEffect(() => {
    if (books.length === 0) return;
    
    let filtered = [...books];
    
    // تصفية حسب البحث
    if (searchQuery.trim() !== '') {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(book => 
        book.title.toLowerCase().includes(query) || 
        book.author.toLowerCase().includes(query) ||
        book.description.toLowerCase().includes(query)
      );
    }
    
    // تصفية حسب الفئة
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(book => book.category === selectedCategory);
    }
    
    // تصفية حسب المحتوى المميز
    if (showPremiumOnly) {
      filtered = filtered.filter(book => book.isPremium);
    }
    
    // تصفية حسب الإصدارات الجديدة
    if (showNewOnly) {
      filtered = filtered.filter(book => book.isNewRelease);
    }
    
    setFilteredBooks(filtered);
  }, [searchQuery, selectedCategory, showPremiumOnly, showNewOnly, books]);
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.4 } }
  };

  const handleBuyBook = async (book: Book) => {
    try {
      if (typeof window === 'undefined') return;

      const userJson = localStorage.getItem('user');
      if (!userJson) {
        toast.error('يرجى تسجيل الدخول أولاً لشراء الكتب');
        window.location.href = '/login?redirect=/library';
        return;
      }

      let user: any = {};
      try {
        user = JSON.parse(userJson);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }

      const studentName = user?.name || 'طالب';
      const studentPhone = user?.studentPhone || user?.phone || '';
      if (!studentPhone) {
        toast.error('لا يوجد رقم هاتف مسجل في حسابك');
      }

      const bookPrice = typeof book.price === 'number' ? book.price : 0;

      const message = `
*طلب شراء كتاب*

📚 اسم الكتاب: ${book.title}
💰 السعر: ${bookPrice} جنيه
👤 اسم الطالب: ${studentName}
📱 رقم الهاتف: ${studentPhone}

سأرسل إيصال الدفع الآن لتأكيد شراء الكتاب ✅
`;

      const waUrl = `https://wa.me/2${vodafoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');

      try {
        await fetch('/api/library/book-purchase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
        console.error('Error creating book purchase request:', requestError);
      }

      toast.success('تم إرسال طلب شراء الكتاب، سيتم مراجعته من الأدمن قريباً');
    } catch (err) {
      console.error('Error in handleBuyBook:', err);
      toast.error('حدث خطأ أثناء إنشاء طلب شراء الكتاب');
    }
  };
  
  return (
    <div className="min-h-screen py-20 px-4 md:px-8 bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* زخارف الخلفية - متناسقة مع باقي صفحات الموقع */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 dark:bg-primary/20 rounded-full filter blur-3xl opacity-50"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full filter blur-3xl opacity-40"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* قسم العنوان */}
        <section className="container mx-auto mb-12">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h1 className="text-4xl font-extrabold mb-4">
              مكتبة <span className="text-primary dark:text-primary-light bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-700 dark:from-primary-light dark:to-violet-400">المستقبل</span> الرقمية
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              استكشف مجموعة واسعة من الكتب والمراجع العلمية في مختلف المجالات، واقرأ أينما كنت وفي أي وقت.
            </p>
          </motion.div>
          
          {/* قسم البحث والفلترة */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-10">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="ابحث عن كتاب أو مؤلف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-3 pr-10 pl-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark focus:border-transparent dark:text-white"
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 py-3 px-5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-200 transition-colors md:w-auto w-full"
              >
                <FaFilter />
                <span>خيارات التصفية</span>
              </button>
            </div>
            
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${showFilters ? 'block' : 'hidden md:grid'}`}>
              <div className="flex flex-col">
                <label className="mb-3 font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-primary rounded-full"></span>
                  التصنيف
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <motion.button
                      key={category.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${selectedCategory === category.value ? 'bg-primary text-white font-medium shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                      onClick={() => {
                        setSelectedCategory(category.value);
                        if (category.value !== 'all') {
                          toast.success(`تم اختيار تصنيف: ${category.name}`);
                        }
                      }}
                    >
                      {category.name}
                    </motion.button>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col">
                <label className="mb-3 font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-primary rounded-full"></span>
                  خيارات إضافية
                </label>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={showPremiumOnly}
                        onChange={() => setShowPremiumOnly(!showPremiumOnly)}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded peer-checked:bg-primary peer-checked:border-primary transition-colors"></div>
                      <FaStar className="absolute text-white text-xs top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="group-hover:text-primary transition-colors">المحتوى المميز فقط</span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={showNewOnly}
                        onChange={() => setShowNewOnly(!showNewOnly)}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded peer-checked:bg-primary peer-checked:border-primary transition-colors"></div>
                      <FaBookOpen className="absolute text-white text-xs top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="group-hover:text-primary transition-colors">الإصدارات الجديدة فقط</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* قسم عرض الكتب */}
        <section className="container mx-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2.5"></div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-200">خطأ في تحميل البيانات</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : filteredBooks.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-16 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
            >
              <div className="text-gray-400 text-6xl mb-6">📚</div>
              <h3 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-200">لا توجد كتب مطابقة</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">لم نتمكن من العثور على أي كتب تطابق معايير البحث والتصفية المحددة</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setShowPremiumOnly(false);
                  setShowNewOnly(false);
                  toast.success('تم إعادة ضبط معايير البحث والتصفية');
                }}
                className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors shadow-md flex items-center justify-center gap-2 mx-auto"
              >
                <FaSearch />
                عرض جميع الكتب
              </button>
            </motion.div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">الكتب المتاحة <span className="text-primary">({filteredBooks.length})</span></h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredBooks.map((book) => (
                  <motion.div
                    key={book.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="show"
                    className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <Image
                        src={book.coverImage || '/placeholder-book.png'}
                        alt={book.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                      {book.isPremium && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          <FaStar /> مميز
                        </div>
                      )}
                      {book.isNewRelease && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          جديد
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-lg font-bold mb-1 line-clamp-1">{book.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{book.author}</p>
                      {typeof book.price === 'number' && book.price > 0 && (
                        <p className="text-sm font-semibold text-primary mb-2">
                          سعر الكتاب: {book.price} ج.م
                        </p>
                      )}
                      
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center">
                          <FaStar className="text-yellow-500 mr-1" />
                          <span className="text-sm">{book.rating.toFixed(1)}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 text-sm">
                          <div className="flex items-center">
                            <FaEye className="mr-1" />
                            <span>{book.views}</span>
                          </div>
                          <div className="flex items-center">
                            <FaDownload className="mr-1" />
                            <span>{book.downloads}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Link href={`/library/${book.id}`}>
                        <div className="w-full py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors text-center font-medium">
                          عرض الكتاب
                        </div>
                      </Link>

                      {typeof book.price === 'number' && book.price > 0 && (
                        <button
                          onClick={() => handleBuyBook(book)}
                          className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors text-center font-medium flex items-center justify-center gap-2"
                        >
                          <FaWhatsapp />
                          شراء الكتاب
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default LibraryPage;
