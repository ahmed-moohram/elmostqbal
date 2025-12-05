'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import CourseCard from './CourseCard';
import { FaCrown, FaAngleLeft, FaAngleRight, FaFilter } from 'react-icons/fa';

interface FeaturedCoursesProps {
  title?: string;
  subtitle?: string;
  courses: any[];
  showFilters?: boolean;
}

const FeaturedCourses = ({
  title = 'الكورسات المميزة',
  subtitle = 'تصفح أفضل الكورسات على منصة ',
  courses,
  showFilters = true,
}: FeaturedCoursesProps) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3; // عدد العناصر في كل صفحة

  // فلترة الكورسات حسب الفئة النشطة
  const filteredCourses = activeCategory === 'all'
    ? courses
    : courses.filter(course => course.category === activeCategory);

  // تحديد عدد الصفحات
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  // الكورسات الظاهرة في الصفحة الحالية
  const visibleCourses = filteredCourses.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
  
  // قائمة الفئات الفريدة
  const uniqueCategories = Array.from(new Set(courses.map(course => course.category)));
  const categories = ['all', ...uniqueCategories];

  return (
    <section className="py-16 bg-gradient-to-b from-background to-gray-50/50 dark:from-background dark:to-gray-900/30">
      <div className="container-custom">
        {/* العنوان والعنوان الفرعي */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-primary/5 text-primary px-4 py-1.5 rounded-full mb-3"
          >
            <FaCrown className="text-secondary" />
            <span className="font-bold">كورسات متميزة</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="heading-2 mb-3 gradient-text inline-block"
          >
            {title}
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
          >
            {subtitle}
            <span
              className="inline-block font-extrabold tracking-normal text-transparent bg-gradient-to-r from-blue-400 via-primary to-indigo-500 bg-clip-text mx-1"
              style={{
                textShadow: `0 0 20px #3b82f6, 0 0 40px #6366f1, 0 0 60px #fff, 0 0 80px #6366f1, 0 0 100px #3b82f6`,
                WebkitTextStroke: '1.5px rgba(99,102,241,0.6)',
                textDecoration: 'none',
                borderBottom: 'none',
                animation: 'pulse 1.5s infinite',
                filter: 'drop-shadow(0 0 12px rgba(99,102,241,1))',
              }}
            >
              المستقبل
            </span>
            <span>التعليمية</span>
          </motion.p>
        </div>
        
        {/* فلاتر التصنيفات */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="flex items-center justify-center flex-wrap gap-3 mb-10"
          >
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <FaFilter />
              تصنيف:
            </span>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  setCurrentPage(0);
                }}
                className={`px-4 py-1.5 rounded-full text-sm transition-all duration-300 ${
                  activeCategory === category
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {category === 'all' ? 'الكل' : category}
              </button>
            ))}
          </motion.div>
        )}
        
        {/* عرض الكورسات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <CourseCard course={course} variant="premium" />
            </motion.div>
          ))}
        </div>
        
        {/* أزرار التنقل بين الصفحات */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                currentPage === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 hover:bg-primary hover:text-white'
              }`}
            >
              <FaAngleRight />
            </button>
            
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentPage === index
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {index + 1}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage === totalPages - 1}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                currentPage === totalPages - 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 hover:bg-primary hover:text-white'
              }`}
            >
              <FaAngleLeft />
            </button>
          </div>
        )}
        
        {/* زر عرض المزيد من الكورسات */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <a
            href="/courses"
            className="btn-modern inline-flex items-center gap-2"
          >
            عرض جميع الكورسات
            <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
              {courses.length}+
            </span>
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedCourses; 