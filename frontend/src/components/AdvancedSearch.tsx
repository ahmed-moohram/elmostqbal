'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaFilter, FaTimes, FaStar, FaClock, FaUsers, FaChevronDown } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

interface AdvancedSearchProps {
  onClose?: () => void;
}

export default function AdvancedSearch({ onClose }: AdvancedSearchProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    level: '',
    price: '',
    duration: '',
    rating: '',
    language: 'ar'
  });
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    'الكل',
    'البرمجة',
    'التصميم',
    'الأعمال',
    'التسويق',
    'اللغات',
    'العلوم',
    'الرياضيات',
    'الفيزياء',
    'الكيمياء'
  ];

  const levels = ['الكل', 'مبتدئ', 'متوسط', 'متقدم', 'خبير'];
  const prices = ['الكل', 'مجاني', 'مدفوع', 'أقل من 100ج', '100-500ج', 'أكثر من 500ج'];
  const durations = ['الكل', 'أقل من ساعة', '1-3 ساعات', '3-6 ساعات', '6-12 ساعة', 'أكثر من 12 ساعة'];
  const ratings = ['الكل', '4.5+', '4.0+', '3.5+', '3.0+'];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (filters.category && filters.category !== 'الكل') params.append('category', filters.category);
    if (filters.level && filters.level !== 'الكل') params.append('level', filters.level);
    if (filters.price && filters.price !== 'الكل') params.append('price', filters.price);
    if (filters.duration && filters.duration !== 'الكل') params.append('duration', filters.duration);
    if (filters.rating && filters.rating !== 'الكل') params.append('rating', filters.rating);

    router.push(`/courses?${params.toString()}`);
    onClose?.();
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      level: '',
      price: '',
      duration: '',
      rating: '',
      language: 'ar'
    });
    setSearchQuery('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FaSearch className="text-primary" />
              البحث المتقدم
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <FaTimes className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن دورات، مدرسين، مواضيع..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          {/* Toggle Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="mt-4 flex items-center gap-2 text-primary hover:text-primary-dark transition-colors"
          >
            <FaFilter />
            {showFilters ? 'إخفاء الفلاتر' : 'إظهار الفلاتر'}
            <FaChevronDown className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-6 space-y-6"
            >
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الفئة
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilters({ ...filters, category: cat })}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        filters.category === cat
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-primary'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  المستوى
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {levels.map((level) => (
                    <button
                      key={level}
                      onClick={() => setFilters({ ...filters, level })}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        filters.level === level
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-primary'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  السعر
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {prices.map((price) => (
                    <button
                      key={price}
                      onClick={() => setFilters({ ...filters, price })}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        filters.price === price
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-primary'
                      }`}
                    >
                      {price}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <FaClock /> المدة
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {durations.map((duration) => (
                    <button
                      key={duration}
                      onClick={() => setFilters({ ...filters, duration })}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        filters.duration === duration
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-primary'
                      }`}
                    >
                      {duration}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <FaStar className="text-yellow-500" /> التقييم
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {ratings.map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setFilters({ ...filters, rating })}
                      className={`px-4 py-2 rounded-lg border transition-all flex items-center justify-center gap-1 ${
                        filters.rating === rating
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-primary'
                      }`}
                    >
                      {rating !== 'الكل' && <FaStar className="text-yellow-500" />}
                      {rating}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex gap-4">
          <button
            onClick={clearFilters}
            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            مسح الفلاتر
          </button>
          <button
            onClick={handleSearch}
            className="flex-1 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
          >
            <FaSearch />
            بحث
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
