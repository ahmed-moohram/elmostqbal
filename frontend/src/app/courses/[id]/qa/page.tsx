'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import QuestionForm from '../../../../components/Questions/QuestionForm';
import QuestionCard from '../../../../components/Questions/QuestionCard';

interface Question {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  isResolved: boolean;
  tags: string[];
  views: number;
  createdAt: string;
  answerCount?: number;
}

export default function QAPage() {
  const params = useParams();
  const courseId = params?.id as string;
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchQuestions();
  }, [courseId, filter, currentPage]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/questions/course/${courseId}?filter=${filter}&page=${currentPage}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.data.questions);
        setTotalPages(data.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSubmit = () => {
    setShowForm(false);
    fetchQuestions();
  };

  const handleQuestionClick = (questionId: string) => {
    // Navigate to question detail page
    window.location.href = `/courses/${courseId}/qa/${questionId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              الأسئلة والأجوبة
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              اطرح أسئلتك واحصل على إجابات من المدرسين والطلاب
            </p>
          </div>
          
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            + سؤال جديد
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 dark:text-gray-300">تصفية:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              جميع الأسئلة
            </button>
            <button
              onClick={() => setFilter('unresolved')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filter === 'unresolved' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              غير محلولة
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filter === 'resolved' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              محلولة
            </button>
          </div>
        </div>

        {/* Question Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="max-w-2xl w-full">
              <QuestionForm
                courseId={courseId}
                onSubmit={handleQuestionSubmit}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        )}

        {/* Questions List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">❓</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              لا توجد أسئلة بعد
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              كن أول من يطرح سؤالاً في هذه الدورة
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              طرح سؤال جديد
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((question) => (
              <QuestionCard
                key={question._id}
                question={question}
                onClick={handleQuestionClick}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center space-x-2">
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
} 