'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaFilter, FaTimes, FaChevronDown, FaChevronUp, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import CourseCard from '../../components/CourseCard';

// تعريف أنواع البيانات
interface Course {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  thumbnail: string;
  instructor: {
    name: string;
    image?: string;
  };
  rating: number;
  ratingCount: number;
  studentsCount: number;
  totalDuration?: number;
  price: number;
  discountPrice?: number;
  isFeatured?: boolean;
  isBestseller?: boolean;
  level: string;
  category: string;
  tags: string[];
}

interface FilterOptions {
  categories: string[];
  levels: string[];
  priceRanges: { min: number; max: number; label: string }[];
}

const CoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'price-low' | 'price-high'>('popular');
  
  // فلاتر
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<number[]>([0, 5000]);
  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({
    categories: true,
    levels: true,
    price: true,
  });
  
  // خيارات الفلاتر
  const filterOptions: FilterOptions = {
    categories: [
      'رياضيات', 
      'فيزياء', 
      'كيمياء', 
      'أحياء', 
      'لغة عربية', 
      'لغة إنجليزية', 
      'حاسب آلي',
      'المرحلة الإبتدائية',
      'المرحلة الإعدادية',
      'الصف الأول الثانوي',
      'الصف الثاني الثانوي',
      'الصف الثالث الثانوي'
    ],
    levels: ['مبتدئ', 'متوسط', 'متقدم', 'جميع المستويات'],
    priceRanges: [
      { min: 0, max: 0, label: 'مجاني' },
      { min: 1, max: 500, label: 'أقل من 500 ج.م' },
      { min: 500, max: 1000, label: '500 - 1000 ج.م' },
      { min: 1000, max: 2000, label: '1000 - 2000 ج.م' },
      { min: 2000, max: 5000, label: 'أكثر من 2000 ج.م' },
    ],
  };

  // الحصول على الدورات
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('🔄 جلب الكورسات من Supabase...');
        
        // استخدام خدمة Supabase الموحدة
        const { getCourses } = await import('@/services/supabase-service');
        const result = await getCourses(true); // جلب الكورسات المنشورة فقط
        
        if (result.success && result.data) {
          console.log(`✅ تم جلب ${result.data.length} كورس من قاعدة البيانات`);
          
          // البيانات جاهزة ومحولة بالفعل
          const transformedCourses = result.data.map((course: any) => {
            const rawThumb = course.thumbnail || course.image;
            const thumbnail = rawThumb && String(rawThumb).includes('default-course.jpg') 
              ? '/placeholder-course.jpg' 
              : (rawThumb || '/placeholder-course.jpg');
            return {
            id: course.id,
            title: course.title,
            description: course.description,
            shortDescription: course.short_description || course.description,
            instructor: {
              name: course.instructor_name || 'مدرب المنصة',
              image: course.instructor_image || '/default-instructor.jpg'
            },
            price: course.price || 0,
            discountPrice: course.discountPrice ?? course.discount_price,
            rating: course.rating || 0,
            studentsCount: course.studentsCount ?? course.students_count ?? 0,
            category: course.category || 'عام',
            level: course.level || 'مبتدئ',
            thumbnail,
            isFeatured: course.isFeatured ?? course.is_featured ?? false,
            // إضافة الحقول المطلوبة
            slug: course.slug || course.title?.toLowerCase().replace(/\s+/g, '-'),
            ratingCount: course.rating_count || 0,
            tags: course.tags || []
            };
          });
          
          const finalCourses = transformedCourses || [];
          
          setCourses(finalCourses);
          setFilteredCourses(finalCourses);
          setTotalPages(Math.max(1, Math.ceil(finalCourses.length / 9)));
          
          // استخراج الفئات والمستويات الفريدة من البيانات
          const uniqueCategories = Array.from(new Set(finalCourses.map(course => course.category)));
          const uniqueLevels = Array.from(new Set(finalCourses.map(course => course.level)));
          console.log('📚 الفئات:', uniqueCategories);
          console.log('📊 المستويات:', uniqueLevels);
        } else {
          // في حالة فشل الجلب من الخدمة، نفرغ القوائم بدون بيانات تجريبية
          setCourses([]);
          setFilteredCourses([]);
          setTotalPages(1);
        }
      } catch (error: any) {
        console.error('❌ خطأ في جلب الدورات:', error);
        console.error('تفاصيل الخطأ:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        setError('حدث خطأ أثناء تحميل الدورات. حاول مرة أخرى لاحقاً.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, []);
  
  // تأثير لتحديث الدورات المفلترة عند تغيير الفلاتر
  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedCategories, selectedLevels, selectedPriceRange, sortBy, courses]);
  
  // تطبيق الفلاتر
  const applyFilters = () => {
    let filtered = [...courses];
    
    // فلتر البحث
    if (searchQuery) {
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (course.shortDescription && course.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (course.instructor && course.instructor.name && course.instructor.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        course.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // فلتر الفئات
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(course => 
        selectedCategories.includes(course.category)
      );
    }
    
    // فلتر المستويات
    if (selectedLevels.length > 0) {
      filtered = filtered.filter(course => 
        selectedLevels.includes(course.level)
      );
    }
    
    // فلتر السعر
    filtered = filtered.filter(course => 
      course.price >= selectedPriceRange[0] && 
      course.price <= selectedPriceRange[1]
    );
    
    // الترتيب
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.studentsCount - a.studentsCount);
        break;
      case 'newest':
        // هنا يمكن ترتيب الدورات حسب تاريخ الإضافة إذا كان متوفرًا
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
    }
    
    setFilteredCourses(filtered);
    setTotalPages(Math.ceil(filtered.length / 9));
    setCurrentPage(1);
  };
  
  // تبديل حالة الفلتر
  const toggleFilter = (filter: string) => {
    setExpandedFilters({
      ...expandedFilters,
      [filter]: !expandedFilters[filter]
    });
  };
  
  // تحديث فلتر الفئات
  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(cat => cat !== category)
        : [...prev, category]
    );
  };
  
  // تحديث فلتر المستويات
  const handleLevelChange = (level: string) => {
    setSelectedLevels(prev => 
      prev.includes(level)
        ? prev.filter(lvl => lvl !== level)
        : [...prev, level]
    );
  };
  
  // تحديث فلتر السعر
  const handlePriceRangeChange = (range: { min: number; max: number }) => {
    setSelectedPriceRange([range.min, range.max]);
  };
  
  // إعادة تعيين الفلاتر
  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedLevels([]);
    setSelectedPriceRange([0, 5000]);
    setSearchQuery('');
    setSortBy('popular');
  };
  
  // الدورات المعروضة في الصفحة الحالية
  const coursesPerPage = 9;
  const currentCourses = filteredCourses.slice(
    (currentPage - 1) * coursesPerPage,
    currentPage * coursesPerPage
  );

  const isDefaultPriceRange = selectedPriceRange[0] === 0 && selectedPriceRange[1] === 5000;
  const activeFiltersCount =
    selectedCategories.length +
    selectedLevels.length +
    (isDefaultPriceRange ? 0 : 1);
  
  return (
    <div className="pt-28 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container-custom">
        {/* عنوان الصفحة */}
        <div className="mb-10">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-600 to-indigo-700 text-white">
            <div className="relative z-10 p-8 md:p-12">
              <div className="max-w-3xl">
                <h1 className="text-3xl md:text-5xl font-bold mb-3 leading-tight">استكشف الدورات التعليمية</h1>
                <p className="text-white/90 md:text-lg max-w-2xl">
                  اختر من بين مئات الدورات التعليمية المتميزة في مختلف المواد الدراسية بمناهج دولة مصر
                </p>

                {/* شريط البحث */}
                <div className="mt-6">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ابحث عن دورة..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/95 text-gray-900 placeholder-gray-500 rounded-2xl border border-white/20 px-5 py-4 pr-12 pl-12 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/60"
                    />
                    <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                        aria-label="مسح البحث"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/90">
                    <div className="px-3 py-1 rounded-full bg-white/10 border border-white/15">
                      {isLoading ? 'جاري تحميل الكورسات...' : `عدد الكورسات: ${filteredCourses.length}`}
                    </div>
                    {activeFiltersCount > 0 && (
                      <div className="px-3 py-1 rounded-full bg-white/10 border border-white/15">
                        فلاتر مفعّلة: {activeFiltersCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-28 -right-28 w-80 h-80 rounded-full bg-white/10 blur-2xl" />
          </div>
        </div>
        
        {/* محتوى الصفحة */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
          {/* الفلاتر - للشاشات الكبيرة */}
          <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 h-fit border border-gray-100 dark:border-gray-700 lg:sticky lg:top-28">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">الفلاتر</h2>
              <button
                onClick={resetFilters}
                className="text-sm text-primary hover:underline"
              >
                إعادة تعيين
              </button>
            </div>
            
            {/* فلتر الفئات */}
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <div
                className="flex justify-between items-center mb-4 cursor-pointer"
                onClick={() => toggleFilter('categories')}
              >
                <h3 className="font-bold">الفئة</h3>
                {expandedFilters.categories ? <FaChevronUp /> : <FaChevronDown />}
              </div>
              
              {expandedFilters.categories && (
                <div className="space-y-2">
                  {filterOptions.categories.map(category => (
                    <label key={category} className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleCategoryChange(category)}
                        className="ml-2 h-4 w-4 accent-primary"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">{category}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            
            {/* فلتر المستويات */}
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <div
                className="flex justify-between items-center mb-4 cursor-pointer"
                onClick={() => toggleFilter('levels')}
              >
                <h3 className="font-bold">المستوى</h3>
                {expandedFilters.levels ? <FaChevronUp /> : <FaChevronDown />}
              </div>
              
              {expandedFilters.levels && (
                <div className="space-y-2">
                  {filterOptions.levels.map(level => (
                    <label key={level} className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedLevels.includes(level)}
                        onChange={() => handleLevelChange(level)}
                        className="ml-2 h-4 w-4 accent-primary"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">{level}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            
            {/* فلتر السعر */}
            <div className="mb-6">
              <div
                className="flex justify-between items-center mb-4 cursor-pointer"
                onClick={() => toggleFilter('price')}
              >
                <h3 className="font-bold">السعر</h3>
                {expandedFilters.price ? <FaChevronUp /> : <FaChevronDown />}
              </div>
              
              {expandedFilters.price && (
                <div className="space-y-2">
                  {filterOptions.priceRanges.map((range, index) => (
                    <label key={index} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="priceRange"
                        checked={selectedPriceRange[0] === range.min && selectedPriceRange[1] === range.max}
                        onChange={() => handlePriceRangeChange(range)}
                        className="ml-2 h-4 w-4 accent-primary"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">{range.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* زر الفلاتر للشاشات الصغيرة */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm"
            >
              <FaFilter />
              <span>{showFilters ? 'إخفاء الفلاتر' : 'عرض الفلاتر'}</span>
              {activeFiltersCount > 0 && (
                <span className="mr-2 inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-primary text-white text-xs font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            
            {/* الفلاتر للشاشات الصغيرة */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mt-4 overflow-hidden border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">الفلاتر</h2>
                    <button
                      onClick={resetFilters}
                      className="text-sm text-primary hover:underline"
                    >
                      إعادة تعيين
                    </button>
                  </div>
                  
                  {/* فلتر الفئات */}
                  <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">
                    <div
                      className="flex justify-between items-center mb-4 cursor-pointer"
                      onClick={() => toggleFilter('categories')}
                    >
                      <h3 className="font-bold">الفئة</h3>
                      {expandedFilters.categories ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                    
                    {expandedFilters.categories && (
                      <div className="space-y-2">
                        {filterOptions.categories.map(category => (
                          <label key={category} className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(category)}
                              onChange={() => handleCategoryChange(category)}
                              className="ml-2"
                            />
                            <span>{category}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* فلتر المستويات */}
                  <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">
                    <div
                      className="flex justify-between items-center mb-4 cursor-pointer"
                      onClick={() => toggleFilter('levels')}
                    >
                      <h3 className="font-bold">المستوى</h3>
                      {expandedFilters.levels ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                    
                    {expandedFilters.levels && (
                      <div className="space-y-2">
                        {filterOptions.levels.map(level => (
                          <label key={level} className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedLevels.includes(level)}
                              onChange={() => handleLevelChange(level)}
                              className="ml-2"
                            />
                            <span>{level}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* فلتر السعر */}
                  <div className="mb-6">
                    <div
                      className="flex justify-between items-center mb-4 cursor-pointer"
                      onClick={() => toggleFilter('price')}
                    >
                      <h3 className="font-bold">السعر</h3>
                      {expandedFilters.price ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                    
                    {expandedFilters.price && (
                      <div className="space-y-2">
                        {filterOptions.priceRanges.map((range, index) => (
                          <label key={index} className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="priceRange"
                              checked={selectedPriceRange[0] === range.min && selectedPriceRange[1] === range.max}
                              onChange={() => handlePriceRangeChange(range)}
                              className="ml-2"
                            />
                            <span>{range.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* قائمة الدورات */}
          <div className="w-full">
            {/* أدوات الترتيب */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 mb-6 border border-gray-100 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {isLoading ? '...' : (
                    <>
                      تم العثور على <span className="font-bold text-gray-900 dark:text-white">{filteredCourses.length}</span> دورة
                      {totalPages > 1 && (
                        <span className="mr-2">(صفحة {currentPage} من {totalPages})</span>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">ترتيب حسب:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="popular">الأكثر شعبية</option>
                    <option value="newest">الأحدث</option>
                    <option value="price-low">السعر: من الأقل إلى الأعلى</option>
                    <option value="price-high">السعر: من الأعلى إلى الأقل</option>
                  </select>
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {selectedCategories.map((category) => (
                    <button
                      key={`cat-${category}`}
                      type="button"
                      onClick={() => handleCategoryChange(category)}
                      className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm hover:bg-primary/15 transition"
                    >
                      <span>{category}</span>
                      <FaTimes className="text-xs" />
                    </button>
                  ))}

                  {selectedLevels.map((level) => (
                    <button
                      key={`lvl-${level}`}
                      type="button"
                      onClick={() => handleLevelChange(level)}
                      className="inline-flex items-center gap-2 rounded-full bg-blue-600/10 text-blue-700 dark:text-blue-300 px-3 py-1 text-sm hover:bg-blue-600/15 transition"
                    >
                      <span>{level}</span>
                      <FaTimes className="text-xs" />
                    </button>
                  ))}

                  {!isDefaultPriceRange && (
                    <button
                      type="button"
                      onClick={() => setSelectedPriceRange([0, 5000])}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 px-3 py-1 text-sm hover:bg-emerald-600/15 transition"
                    >
                      <span>السعر</span>
                      <FaTimes className="text-xs" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1 text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  >
                    مسح الكل
                  </button>
                </div>
              )}
            </div>
            
            {/* عرض الدورات */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
              {isLoading ? (
                // حالة التحميل
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-4 animate-pulse border border-gray-200/60 dark:border-gray-600/60">
                      <div className="h-40 bg-gray-300/80 dark:bg-gray-600 rounded-xl mb-4"></div>
                      <div className="h-6 bg-gray-300/80 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-300/80 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-6 bg-gray-300/80 dark:bg-gray-700 rounded w-1/3"></div>
                        <div className="h-8 bg-gray-300/80 dark:bg-gray-700 rounded-xl w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                // حالة الخطأ
                <div className="text-center py-12">
                  <div className="text-red-500 text-5xl mb-4">⚠️</div>
                  <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="btn-primary"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              ) : filteredCourses.length === 0 ? (
                // لا توجد نتائج
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-10 text-center border border-gray-100 dark:border-gray-700">
                  <div className="text-6xl text-gray-300 dark:text-gray-600 mb-4">
                    <FaSearch className="mx-auto" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">لا توجد دورات مطابقة</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    لم نتمكن من العثور على دورات تطابق معايير البحث الخاصة بك
                  </p>
                  <button
                    onClick={resetFilters}
                    className="btn-primary"
                  >
                    إعادة تعيين الفلاتر
                  </button>
                </div>
              ) : (
                // عرض الدورات
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentCourses.map((course, index) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <CourseCard course={course} variant="premium" />
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* ترقيم الصفحات */}
                  {totalPages > 1 && (
                    <div className="mt-12 flex justify-center">
                      <nav className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:hover:bg-white dark:disabled:hover:bg-gray-800 transition"
                        >
                          <FaArrowRight />
                        </button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-xl transition ${
                              currentPage === page
                                ? 'bg-primary text-white'
                                : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:hover:bg-white dark:disabled:hover:bg-gray-800 transition"
                        >
                          <FaArrowLeft />
                        </button>
                      </nav>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;
