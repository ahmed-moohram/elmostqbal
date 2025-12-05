'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaUsers, FaClock, FaFire, FaChartLine, FaHeart } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';

interface Course {
  id: string;
  title: string;
  thumbnail: string;
  instructor: string;
  rating: number;
  studentsCount: number;
  duration: number;
  price: number;
  category: string;
  level: string;
}

interface CourseRecommendationsProps {
  userId?: string;
  currentCourseId?: string;
  category?: string;
}

export default function CourseRecommendations({ 
  userId, 
  currentCourseId,
  category 
}: CourseRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'personalized' | 'trending' | 'related'>('personalized');

  const tabs = [
    { id: 'personalized', label: 'مقترحات لك', icon: FaHeart },
    { id: 'trending', label: 'الأكثر رواجاً', icon: FaFire },
    { id: 'related', label: 'دورات مشابهة', icon: FaChartLine }
  ];

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        
        let endpoint = '/api/courses';
        if (activeTab === 'personalized' && userId) {
          endpoint = `/api/courses/recommended/${userId}`;
        } else if (activeTab === 'related' && category) {
          endpoint = `/api/courses?category=${category}`;
        } else if (activeTab === 'trending') {
          endpoint = '/api/courses?sort=popular';
        }
        
        const response = await fetch(`${API_URL}${endpoint}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (response.ok) {
          const data = await response.json();
          const coursesData = data.courses || data || [];
          console.log(`✅ تم جلب ${coursesData.length} دورة مقترحة`);
          setRecommendations(coursesData.slice(0, 6));
        } else {
          setRecommendations([]);
        }
      } catch (error) {
        console.error('❌ خطأ في جلب الدورات المقترحة:', error);
        setRecommendations([]);
      }
      
      setLoading(false);
    };

    fetchRecommendations();
  }, [activeTab, userId, currentCourseId, category]);

  const CourseCard = ({ course }: { course: Course }) => (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all"
    >
      <Link href={`/courses/${course.id}`}>
        <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-course.jpg';
            }}
          />
          <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded-lg text-xs font-bold">
            {course.level}
          </div>
          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1">
            <FaClock className="text-xs" />
            {course.duration} ساعة
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-bold text-lg mb-2 line-clamp-2 text-gray-900 dark:text-white">
            {course.title}
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {course.instructor}
          </p>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <FaStar className="text-yellow-500" />
              <span className="font-bold text-sm">{course.rating}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <FaUsers className="text-xs" />
              {course.studentsCount}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">
              {course.price} ج.م
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
            >
              عرض التفاصيل
            </motion.button>
          </div>
        </div>
      </Link>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-primary'
              }`}
            >
              <Icon className="text-lg" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-80 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeTab === 'personalized' && 'دورات مقترحة لك'}
              {activeTab === 'trending' && 'الدورات الأكثر رواجاً'}
              {activeTab === 'related' && 'دورات مشابهة'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {recommendations.length} دورة
            </p>
          </div>

          {/* Recommendations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CourseCard course={course} />
              </motion.div>
            ))}
          </div>

          {/* Why Recommended */}
          {activeTab === 'personalized' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 border border-primary/20"
            >
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <FaChartLine className="text-primary" />
                لماذا هذه الدورات؟
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
                    1
                  </div>
                  <p>بناءً على اهتماماتك السابقة والدورات التي أتممتها</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
                    2
                  </div>
                  <p>تطابق مستواك الحالي وتساعدك في التطور</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
                    3
                  </div>
                  <p>مقيمة عالياً من طلاب مشابهين لك</p>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
