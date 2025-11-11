'use client';

import React, { useState, useEffect } from 'react';
import RatingStars from './RatingStars';
import RatingForm from './RatingForm';

interface Rating {
  _id: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  rating: number;
  review: string;
  createdAt: string;
}

interface RatingDisplayProps {
  targetType: 'course' | 'teacher';
  targetId: string;
  averageRating?: number;
  totalRatings?: number;
}

const RatingDisplay: React.FC<RatingDisplayProps> = ({ 
  targetType, 
  targetId, 
  averageRating = 0, 
  totalRatings = 0 
}) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ratingDistribution, setRatingDistribution] = useState<any[]>([]);

  useEffect(() => {
    fetchRatings();
  }, [targetType, targetId, currentPage]);

  const fetchRatings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/ratings/${targetType}/${targetId}?page=${currentPage}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRatings(data.data.ratings);
        setTotalPages(data.data.pagination.pages);
        setRatingDistribution(data.data.ratingDistribution);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = () => {
    setShowForm(false);
    fetchRatings();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRatingPercentage = (rating: number) => {
    const ratingData = ratingDistribution.find(r => r._id === rating);
    if (!ratingData || totalRatings === 0) return 0;
    return Math.round((ratingData.count / totalRatings) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            تقييمات {targetType === 'course' ? 'الدورة' : 'المدرس'}
          </h3>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            إضافة تقييم
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Average Rating */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              {averageRating.toFixed(1)}
            </div>
            <RatingStars rating={Math.round(averageRating)} readonly size="lg" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {totalRatings} تقييم
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                  {star} ⭐
                </span>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{ width: `${getRatingPercentage(star)}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 w-12">
                  {getRatingPercentage(star)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rating Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            <RatingForm
              targetType={targetType}
              targetId={targetId}
              onRatingSubmit={handleRatingSubmit}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Ratings List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
            جميع التقييمات
          </h4>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : ratings.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            لا توجد تقييمات بعد
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {ratings.map((rating) => (
              <div key={rating._id} className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    {rating.user.avatar ? (
                      <img 
                        src={rating.user.avatar} 
                        alt={rating.user.name} 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                        {rating.user.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-gray-800 dark:text-white">
                        {rating.user.name}
                      </h5>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(rating.createdAt)}
                      </span>
                    </div>
                    
                    <RatingStars rating={rating.rating} readonly size="sm" />
                    
                    <p className="text-gray-700 dark:text-gray-300 mt-2">
                      {rating.review}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                السابق
              </button>
              
              <span className="px-3 py-2 text-gray-700 dark:text-gray-300">
                {currentPage} من {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RatingDisplay; 