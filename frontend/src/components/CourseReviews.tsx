"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaThumbsUp, FaFlag, FaEdit, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: Date;
  likes: number;
  isLiked?: boolean;
  isOwner?: boolean;
}

interface CourseReviewsProps {
  courseId: string;
  averageRating?: number;
  totalReviews?: number;
}

export default function CourseReviews({ 
  courseId, 
  averageRating = 4.5, 
  totalReviews = 0 
}: CourseReviewsProps) {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful'>('recent');
  const [userReview, setUserReview] = useState<Review | null>(null);

  useEffect(() => {
    loadReviews();
  }, [courseId, filterRating, sortBy]);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      // محاكاة جلب المراجعات من API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockReviews: Review[] = [
        {
          id: '1',
          userId: '1',
          userName: 'أحمد محمد',
          rating: 5,
          comment: 'كورس ممتاز جداً! شرح واضح ومبسط. استفدت كثيراً من المحتوى المقدم.',
          createdAt: new Date(Date.now() - 86400000),
          likes: 12,
          isLiked: false,
        },
        {
          id: '2',
          userId: '2',
          userName: 'فاطمة علي',
          rating: 4,
          comment: 'محتوى جيد وشامل، لكن أتمنى لو كان هناك المزيد من الأمثلة العملية.',
          createdAt: new Date(Date.now() - 172800000),
          likes: 8,
          isLiked: true,
        },
        {
          id: '3',
          userId: '3',
          userName: 'محمود حسن',
          rating: 5,
          comment: 'أفضل كورس أخذته في هذا المجال. المدرس محترف والشرح ممتاز.',
          createdAt: new Date(Date.now() - 259200000),
          likes: 15,
          isLiked: false,
        },
      ];

      // التحقق من مراجعة المستخدم
      const userReviewData = mockReviews.find(r => r.userId === user?.id);
      if (userReviewData) {
        setUserReview(userReviewData);
      }

      setReviews(mockReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('فشل تحميل المراجعات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    if (!comment.trim()) {
      toast.error('يرجى كتابة تعليق');
      return;
    }

    try {
      // محاكاة إرسال المراجعة
      await new Promise(resolve => setTimeout(resolve, 500));

      const newReview: Review = {
        id: Date.now().toString(),
        userId: user!.id,
        userName: user!.name,
        rating,
        comment,
        createdAt: new Date(),
        likes: 0,
        isLiked: false,
        isOwner: true,
      };

      setReviews([newReview, ...reviews]);
      setUserReview(newReview);
      setComment('');
      setRating(5);
      setShowReviewForm(false);
      toast.success('تم إضافة مراجعتك بنجاح');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('فشل إضافة المراجعة');
    }
  };

  const handleLikeReview = async (reviewId: string) => {
    if (!isAuthenticated) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    setReviews(reviews.map(review => {
      if (review.id === reviewId) {
        return {
          ...review,
          likes: review.isLiked ? review.likes - 1 : review.likes + 1,
          isLiked: !review.isLiked,
        };
      }
      return review;
    }));
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('هل أنت متأكد من حذف المراجعة؟')) return;

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setReviews(reviews.filter(r => r.id !== reviewId));
      setUserReview(null);
      toast.success('تم حذف المراجعة');
    } catch (error) {
      toast.error('فشل حذف المراجعة');
    }
  };

  const getRatingDistribution = () => {
    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach(review => {
      distribution[review.rating - 1]++;
    });
    return distribution.reverse();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      {/* ملخص التقييمات */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">التقييمات والمراجعات</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* التقييم الإجمالي */}
          <div className="text-center md:text-right">
            <div className="text-5xl font-bold mb-2">{averageRating.toFixed(1)}</div>
            <div className="flex items-center justify-center md:justify-start gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  className={`text-xl ${
                    star <= Math.round(averageRating)
                      ? 'text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              بناءً على {totalReviews} مراجعة
            </p>
          </div>

          {/* توزيع التقييمات */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star, index) => {
              const count = getRatingDistribution()[index];
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              
              return (
                <button
                  key={star}
                  onClick={() => setFilterRating(filterRating === star ? null : star)}
                  className={`w-full flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded transition-colors ${
                    filterRating === star ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  <span className="text-sm font-medium w-8">{star} ⭐</span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-8">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* الفلاتر والترتيب */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          {filterRating && (
            <button
              onClick={() => setFilterRating(null)}
              className="text-sm text-primary hover:text-primary-dark"
            >
              إزالة الفلتر ✕
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">ترتيب حسب:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'helpful')}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-700"
          >
            <option value="recent">الأحدث</option>
            <option value="helpful">الأكثر فائدة</option>
          </select>
        </div>
      </div>

      {/* زر إضافة مراجعة */}
      {isAuthenticated && !userReview && (
        <button
          onClick={() => setShowReviewForm(!showReviewForm)}
          className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors mb-6"
        >
          {showReviewForm ? 'إلغاء' : 'أضف مراجعتك'}
        </button>
      )}

      {/* نموذج إضافة مراجعة */}
      <AnimatePresence>
        {showReviewForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6"
          >
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">التقييم</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="text-3xl transition-transform hover:scale-110"
                  >
                    <FaStar
                      className={
                        star <= (hoverRating || rating)
                          ? 'text-yellow-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">التعليق</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="شارك تجربتك مع هذا الكورس..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              onClick={handleSubmitReview}
              disabled={!comment.trim()}
              className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              نشر المراجعة
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* قائمة المراجعات */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            لا توجد مراجعات بعد. كن أول من يضيف مراجعة!
          </div>
        ) : (
          reviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                    {review.userName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{review.userName}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FaStar
                            key={star}
                            className={`text-sm ${
                              star <= review.rating
                                ? 'text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  </div>
                </div>

                {review.isOwner && (
                  <div className="flex gap-2">
                    <button className="text-gray-400 hover:text-blue-500 transition-colors">
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <FaTrash />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-3 mr-13">
                {review.comment}
              </p>

              <div className="flex items-center gap-4 mr-13">
                <button
                  onClick={() => handleLikeReview(review.id)}
                  className={`flex items-center gap-1 text-sm transition-colors ${
                    review.isLiked
                      ? 'text-primary'
                      : 'text-gray-500 hover:text-primary'
                  }`}
                >
                  <FaThumbsUp />
                  <span>مفيد ({review.likes})</span>
                </button>
                
                <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors">
                  <FaFlag />
                  <span>إبلاغ</span>
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
