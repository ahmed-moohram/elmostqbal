'use client';

import React, { useState } from 'react';
import { API_BASE_URL } from '@/lib/api';

interface QuestionFormProps {
  courseId: string;
  lessonId?: string;
  onSubmit: () => void;
  onCancel: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ 
  courseId, 
  lessonId, 
  onSubmit, 
  onCancel 
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId,
          lessonId,
          title: title.trim(),
          content: content.trim(),
          tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        })
      });

      if (response.ok) {
        onSubmit();
        setTitle('');
        setContent('');
        setTags('');
      } else {
        const error = await response.json();
        alert(error.message || 'حدث خطأ أثناء إضافة السؤال');
      }
    } catch (error) {
      console.error('Error creating question:', error);
      alert('حدث خطأ أثناء إضافة السؤال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
        إضافة سؤال جديد
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            عنوان السؤال *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="اكتب عنوان السؤال هنا..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            maxLength={200}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            تفاصيل السؤال *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="اكتب تفاصيل السؤال هنا..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            rows={4}
            maxLength={2000}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {content.length}/2000 حرف
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            الوسوم (اختياري)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="وسوم مفصولة بفواصل، مثال: برمجة، جافاسكريبت، React"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
          />
          <p className="text-xs text-gray-500 mt-1">
            استخدم فواصل لفصل الوسوم
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
            disabled={loading || !title.trim() || !content.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'جاري الإرسال...' : 'إضافة السؤال'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionForm;