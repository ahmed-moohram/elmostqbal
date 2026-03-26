'use client';

import React, { useState } from 'react';

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

interface QuestionCardProps {
  question: Question;
  onClick: (questionId: string) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onClick }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 48) {
      return 'أمس';
    } else {
      return date.toLocaleDateString('ar-SA', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700"
      onClick={() => onClick(question._id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
            {question.author.avatar ? (
              <img 
                src={question.author.avatar} 
                alt={question.author.name} 
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                {question.author.name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-white">
              {question.author.name}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {question.author.role === 'teacher' ? 'مدرس' : 'طالب'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {question.isResolved && (
            <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs rounded-full">
              ✓ محلول
            </span>
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(question.createdAt)}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
        {question.title}
      </h3>

      {/* Content */}
      <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
        {truncateText(question.content)}
      </p>

      {/* Tags */}
      {question.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {question.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <span>👁️</span>
            <span>{question.views}</span>
          </span>
          <span className="flex items-center space-x-1">
            <span>💬</span>
            <span>{question.answerCount || 0}</span>
          </span>
        </div>
        
        <button className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
          عرض التفاصيل →
        </button>
      </div>
    </div>
  );
};

export default QuestionCard; 