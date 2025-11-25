'use client';

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api';
import RatingStars from './RatingStars';

interface RatingFormProps {
  targetType: 'course' | 'teacher';
  targetId: string;
  onRatingSubmit: () => void;
  onCancel: () => void;
}

const RatingForm: React.FC<RatingFormProps> = ({ 
  targetType, 
  targetId, 
  onRatingSubmit, 
  onCancel 
}) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingRating, setExistingRating] = useState<any>(null);

  useEffect(() => {
    fetchUserRating();
  }, [targetType, targetId]);

  const fetchUserRating = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/ratings/user/${targetType}/${targetId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setExistingRating(data.data);
          setRating(data.data.rating);
          setReview(data.data.review);
        }
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('يرجى اختيار تقييم');
      return;
    }

    if (!review.trim()) {
      alert('يرجى كتابة تقييمك');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = existingRating 
        ? `${API_BASE_URL}/api/ratings/${existingRating._id}`
        : `${API_BASE_URL}/api/ratings`;
      
      const method = existingRating ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetType,
          targetId,
          rating,
          review
        })
      });

      if (response.ok) {
        onRatingSubmit();
      } else {
        const error = await response.json();
        alert(error.message || 'حدث خطأ أثناء إرسال التقييم');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('حدث خطأ أثناء إرسال التقييم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
        {existingRating ? 'تعديل التقييم' : 'إضافة تقييم جديد'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            التقييم
          </label>
          <RatingStars 
            rating={rating} 
            onRatingChange={setRating}
            size="lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            التقييم النصي
          </label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="اكتب تقييمك هنا..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            rows={4}
            maxLength={1000}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {review.length}/1000 حرف
          </p>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={loading}
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={loading || rating === 0 || !review.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'جاري الإرسال...' : (existingRating ? 'تحديث التقييم' : 'إرسال التقييم')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RatingForm;