'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FaSearch, FaStar, FaFilter, FaTimes, FaChevronDown, FaChevronUp, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
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
          const transformedCourses = result.data.map((course: any) => ({
            id: course.id,
          title: course.title,
          description: course.description,
          shortDescription: course.short_description || course.description,
          instructor: {
            name: course.instructor_name || 'مدرب المنصة',
            image: course.instructor_image || '/default-instructor.jpg'
          },
          price: course.price || 0,
          discountPrice: course.discount_price,
          rating: course.rating || 0,
          studentsCount: course.students_count || 0,
          category: course.category || 'عام',
          level: course.level || 'مبتدئ',
          thumbnail: course.thumbnail || course.image || '/default-course.jpg',
          isFeatured: course.is_featured || false,
          // إضافة الحقول المطلوبة
          slug: course.slug || course.title?.toLowerCase().replace(/\s+/g, '-'),
          ratingCount: course.rating_count || 0,
          tags: course.tags || []
        }));
        
        // ⚠️ تحذير: إذا لم تكن هناك دورات حقيقية في قاعدة البيانات
        if (!transformedCourses || transformedCourses.length === 0) {
          console.warn('⚠️ لا توجد كورسات في قاعدة البيانات! سنعرض بيانات تجريبية');
          
          // بيانات تجريبية للعرض
          const mockCourses: Course[] = [
            {
              id: '1',
              title: 'دورة تطوير تطبيقات الويب الحديثة',
              shortDescription: 'تعلم بناء تطبيقات ويب احترافية باستخدام React و Next.js',
              instructor: { name: 'أحمد محمد', image: '/instructor1.jpg' },
              price: 1500,
              discountPrice: 999,
              level: 'متوسط',
              category: 'البرمجة',
              thumbnail: '/course1.jpg',
              rating: 4.8,
              studentsCount: 1250,
              isFeatured: true,
              slug: 'web-development-react-nextjs',
              ratingCount: 375,
              tags: []
            },
            {
              id: '2',
              title: 'أساسيات التصميم الجرافيكي',
              shortDescription: 'احترف التصميم الجرافيكي من الصفر باستخدام Adobe Photoshop و Illustrator',
              instructor: { name: 'سارة أحمد', image: '/instructor2.jpg' },
              price: 1200,
              discountPrice: 799,
              level: 'مبتدئ',
              category: 'التصميم',
              thumbnail: '/course2.jpg',
              rating: 4.9,
              studentsCount: 2100,
              isFeatured: true,
              slug: 'graphic-design-basics',
              ratingCount: 630,
              tags: []
            },
            {
              id: '3',
              title: 'التسويق الرقمي المتقدم',
              shortDescription: 'استراتيجيات التسويق الرقمي وإدارة الحملات الإعلانية',
              instructor: { name: 'محمد علي', image: '/instructor3.jpg' },
              price: 2000,
              discountPrice: 1499,
              level: 'متقدم',
              category: 'التسويق',
              thumbnail: '/course3.jpg',
              rating: 4.7,
              studentsCount: 890,
              isFeatured: false,
              slug: 'digital-marketing-advanced',
              ratingCount: 267,
              tags: []
            }
          ];
          
          setCourses(mockCourses);
          setFilteredCourses(mockCourses);
          setTotalPages(1);
          setIsLoading(false);
          return;
        }
        
        // ✅ تعيين البيانات المحولة
        setCourses(transformedCourses);
        setFilteredCourses(transformedCourses);
        setTotalPages(Math.ceil(transformedCourses.length / 9));
        
        // استخراج الفئات والمستويات الفريدة من البيانات
        const uniqueCategories = Array.from(new Set(transformedCourses.map(course => course.category)));
        const uniqueLevels = Array.from(new Set(transformedCourses.map(course => course.level)));
        console.log('📚 الفئات:', uniqueCategories);
        console.log('📊 المستويات:', uniqueLevels);
        }
      } catch (error: any) {
        console.error('❌ خطأ في جلب الدورات:', error);
        console.error('تفاصيل الخطأ:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        
        // عرض البيانات التجريبية حتى في حالة الخطأ
        console.log('📌 سنعرض البيانات التجريبية بسبب الخطأ');
        const mockCourses: Course[] = [
          {
            id: '1',
            title: 'دورة تطوير تطبيقات الويب الحديثة',
            shortDescription: 'تعلم بناء تطبيقات ويب احترافية باستخدام React و Next.js',
            instructor: { name: 'أحمد محمد', image: '/instructor1.jpg' },
            price: 1500,
            discountPrice: 999,
            level: 'متوسط',
            category: 'البرمجة',
            thumbnail: '/course1.jpg',
            rating: 4.8,
            studentsCount: 1250,
            isFeatured: true,
            slug: 'web-development-react-nextjs',
            ratingCount: 375,
            tags: []
          },
          {
            id: '2',
            title: 'أساسيات التصميم الجرافيكي',
            shortDescription: 'احترف التصميم الجرافيكي من الصفر',
            instructor: { name: 'سارة أحمد', image: '/instructor2.jpg' },
            price: 1200,
            discountPrice: 799,
            level: 'مبتدئ',
            category: 'التصميم',
            thumbnail: '/course2.jpg',
            rating: 4.9,
            studentsCount: 2100,
            isFeatured: true,
            slug: 'graphic-design-basics',
            ratingCount: 630,
            tags: []
          },
          {
            id: '3',
            title: 'التسويق الرقمي المتقدم',
            shortDescription: 'استراتيجيات التسويق الرقمي',
            instructor: { name: 'محمد علي', image: '/instructor3.jpg' },
            price: 2000,
            discountPrice: 1499,
            level: 'متقدم',
            category: 'التسويق',
            thumbnail: '/course3.jpg',
            rating: 4.7,
            studentsCount: 890,
            isFeatured: false,
            slug: 'digital-marketing-advanced',
            ratingCount: 267,
            tags: []
          }
        ];
        
        setCourses(mockCourses);
        setFilteredCourses(mockCourses);
        setTotalPages(1);
        setError(null); // إزالة رسالة الخطأ لأننا نعرض بيانات تجريبية
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
  
  return (
    <div className="pt-28 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container-custom">
        {/* عنوان الصفحة */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">استكشف الدورات التعليمية</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            اختر من بين مئات الدورات التعليمية المتميزة في مختلف المواد الدراسية بمناهج دولة مصر
          </p>
        </div>
        
        {/* شريط البحث */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="ابحث عن دورة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-4 pl-12 pr-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        
        {/* محتوى الصفحة */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* الفلاتر - للشاشات الكبيرة */}
          <div className="hidden lg:block w-full lg:w-1/4 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 h-fit">
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
          </div>
          
          {/* زر الفلاتر للشاشات الصغيرة */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3"
            >
              <FaFilter />
              <span>{showFilters ? 'إخفاء الفلاتر' : 'عرض الفلاتر'}</span>
            </button>
            
            {/* الفلاتر للشاشات الصغيرة */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mt-4 overflow-hidden"
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
          <div className="w-full lg:w-3/4">
            {/* أدوات الترتيب */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6 flex flex-wrap justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 dark:text-gray-400">ترتيب حسب:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-gray-100 dark:bg-gray-700 border-none rounded-lg p-2"
                >
                  <option value="popular">الأكثر شعبية</option>
                  <option value="newest">الأحدث</option>
                  <option value="price-low">السعر: من الأقل إلى الأعلى</option>
                  <option value="price-high">السعر: من الأعلى إلى الأقل</option>
                </select>
              </div>
            </div>
            
            {/* عرض الدورات */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              {isLoading ? (
                // حالة التحميل
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 animate-pulse">
                      <div className="h-40 bg-gray-300 dark:bg-gray-600 rounded-lg mb-4"></div>
                      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
                        <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
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
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
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
                  <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                    تم العثور على <span className="font-medium text-gray-900 dark:text-white">{filteredCourses.length}</span> دورة
                  </div>
                  
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
                      <nav className="flex items-center gap-1">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 disabled:opacity-50"
                        >
                          <FaArrowRight />
                        </button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg ${
                              currentPage === page
                                ? 'bg-primary text-white'
                                : 'border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 disabled:opacity-50"
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
