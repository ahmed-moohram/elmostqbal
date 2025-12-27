'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FaStar, FaUsers, FaClock, FaPlay, FaTag, FaRegBookmark, FaBookmark } from 'react-icons/fa';

interface CourseCardProps {
  course: {
    id: string | number;
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
  };
  variant?: 'default' | 'premium' | 'minimal' | 'featured';
}

const CourseCard = ({ course, variant = 'default' }: CourseCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  // تحويل المدة الإجمالية إلى ساعات ودقائق
  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'غير محدد';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours > 0 ? hours + ' ساعة ' : ''}${mins > 0 ? mins + ' دقيقة' : ''}`;
  };

  // حساب نسبة الخصم
  const discountPercentage = course.discountPrice && course.price > 0 
    ? Math.round(((course.price - course.discountPrice) / course.price) * 100) 
    : 0;

  // ترجمة المستوى إلى العربية
  const levelMapping: Record<string, string> = {
    'beginner': 'مبتدئ',
    'intermediate': 'متوسط',
    'advanced': 'متقدم',
    'all-levels': 'جميع المستويات'
  };

  // تبديل حالة المفضلة
  const toggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsBookmarked(!isBookmarked);
  };

  // توفير صور بديلة حسب فئة الكورس
  const getFallbackImage = () => {
    const category = course.category?.toLowerCase() || '';
    const tags = course.tags || [];

    if (category.includes('أحياء') || tags.some(tag => tag.includes('أحياء'))) {
      return '/placeholder-course.jpg';
    } else if (category.includes('رياضيات')) {
      return '/placeholder-course.jpg';
    } else if (category.includes('فيزياء')) {
      return '/placeholder-course.jpg';
    } else if (category.includes('كيمياء')) {
      return '/placeholder-course.jpg';
    } else if (category.includes('الثانوي') || category.includes('ثانوي')) {
      return '/placeholder-course.jpg';
    } else if (category.includes('الإعدادية') || category.includes('إعدادي')) {
      return '/placeholder-course.jpg';
    } else if (category.includes('الإبتدائية')) {
      return '/placeholder-course.jpg';
    }
    return '/placeholder-course.jpg';
  };

  const handleImageError = () => {
    setImgError(true);
  };

  // استخدم الصورة البديلة إذا حدث خطأ في تحميل الصورة الأصلية
  const imageSource = imgError ? getFallbackImage() : course.thumbnail;

  const getMarketingStudentsCount = () => {
    const s = String(course.id ?? '');
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
    }
    return hash % 2 === 0 ? 500 : 600;
  };

  const displayRating = Number(course.rating) > 0 ? Number(course.rating) : 5;
  const displayRatingCount = Number(course.ratingCount) > 0 ? Number(course.ratingCount) : 5;
  const displayStudentsCount =
    Number(course.studentsCount) > 0 ? Number(course.studentsCount) : getMarketingStudentsCount();

  if (variant === 'minimal') {
    return (
      <Link href={`/courses/${course.id}`} className="group flex gap-4 bg-white dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
        <div className="relative w-20 h-20 flex-shrink-0">
          <Image 
            src={imageSource} 
            alt={course.title}
            fill
            className="object-cover"
            onError={handleImageError}
          />
        </div>
        <div className="py-2 pr-2 flex-1">
          <h3 className="font-medium text-sm group-hover:text-primary truncate transition-colors">{course.title}</h3>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <FaStar className="text-yellow-500" />
            <span>{displayRating.toFixed(1)}</span>
            <span>•</span>
            <span>{displayStudentsCount} طالب</span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'premium') {
    return (
      <motion.div 
        whileHover={{ y: -5 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700 transition-all"
      >
        <Link href={`/courses/${course.id}`} className="block relative">
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image 
              src={imageSource} 
              alt={course.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              onError={handleImageError}
            />
            
            {course.isBestseller && (
              <div className="absolute top-3 right-3 bg-yellow-500 text-white px-2 py-1 text-xs font-bold rounded">
                الأكثر مبيعاً
              </div>
            )}
            
            <button 
              onClick={toggleBookmark}
              className="absolute top-3 left-3 bg-gray-900/60 hover:bg-gray-900/80 p-2 rounded-full text-white transition-colors"
            >
              {isBookmarked ? <FaBookmark className="text-primary" /> : <FaRegBookmark />}
            </button>
          </div>
          
          <div className="p-5">
            <h3 className="text-lg font-bold mb-2 line-clamp-2">{course.title}</h3>
            
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <span>{course.category}</span>
              <span className="mx-2">•</span>
              <span>{course.level}</span>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                <FaStar className="text-yellow-500" />
                <span className="font-medium">{displayRating.toFixed(1)}</span>
                <span className="text-gray-500 text-sm">({displayRatingCount})</span>
              </div>
              
              <div className="flex items-center gap-1">
                <FaUsers className="text-primary" />
                <span className="text-sm">{displayStudentsCount} طالب</span>
              </div>
              
              {course.totalDuration && (
                <div className="flex items-center gap-1">
                  <FaClock className="text-accent" />
                  <span className="text-sm">{formatDuration(course.totalDuration)}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-end justify-between">
              <div>
                {course.discountPrice ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">{course.discountPrice} ج.م</span>
                    <span className="text-gray-400 line-through text-sm">{course.price} ج.م</span>
                    {discountPercentage > 0 && (
                      <span className="bg-secondary/20 text-secondary text-xs px-1.5 py-0.5 rounded">
                        خصم {discountPercentage}%
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-lg font-bold text-primary">{course.price > 0 ? `${course.price} ج.م` : 'مجاني'}</div>
                )}
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // التصميم الافتراضي
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <Link href={`/courses/${course.id}`} className="block">
        <div className="relative aspect-video overflow-hidden">
          <Image 
            src={imageSource} 
            alt={course.title}
            fill
            className="object-cover"
            onError={handleImageError}
          />
          
          {course.isBestseller && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 text-xs font-bold rounded">
              الأكثر مبيعاً
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-bold mb-1 hover:text-primary transition-colors">{course.title}</h3>
          <p className="text-sm text-gray-500 mb-2">{course.instructor.name}</p>
          
          <div className="flex items-center gap-1 mb-2">
            <span className="font-medium">{displayRating.toFixed(1)}</span>
            <div className="flex text-yellow-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar 
                  key={star} 
                  className={star <= Math.round(displayRating) ? 'text-yellow-500' : 'text-gray-300'} 
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">({displayRatingCount})</span>
          </div>
          
          <div className="flex justify-between items-center">
            {course.discountPrice ? (
              <div className="flex items-center gap-1">
                <span className="font-bold">{course.discountPrice} ج.م</span>
                <span className="text-gray-400 line-through text-sm">{course.price} ج.م</span>
              </div>
            ) : (
              <div className="font-bold">{course.price > 0 ? `${course.price} ج.م` : 'مجاني'}</div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CourseCard; 