'use client';

import React from 'react';

interface LiveSession {
  _id: string;
  title: string;
  description: string;
  scheduledAt: string;
  duration: number;
  maxParticipants: number;
  platform: 'zoom' | 'google-meet' | 'teams' | 'custom';
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  participants: Array<{
    _id: string;
    name: string;
    avatar?: string;
  }>;
  teacherId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  courseId: {
    _id: string;
    title: string;
  };
  meetingUrl?: string;
  recordingUrl?: string;
}

interface LiveSessionCardProps {
  session: LiveSession;
  onJoin?: (sessionId: string) => void;
  onLeave?: (sessionId: string) => void;
  onCancel?: (sessionId: string) => void;
  isTeacher?: boolean;
  isParticipant?: boolean;
}

const LiveSessionCard: React.FC<LiveSessionCardProps> = ({ 
  session, 
  onJoin, 
  onLeave, 
  onCancel,
  isTeacher = false,
  isParticipant = false
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'live':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'مجدول';
      case 'live':
        return 'مباشر الآن';
      case 'completed':
        return 'مكتمل';
      case 'cancelled':
        return 'ملغي';
      default:
        return 'غير معروف';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'zoom':
        return '🔵';
      case 'google-meet':
        return '🟢';
      case 'teams':
        return '🔵';
      default:
        return '📹';
    }
  };

  const isUpcoming = new Date(session.scheduledAt) > new Date();
  const isLive = session.status === 'live';
  const canJoin = isUpcoming || isLive;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{session.title}</h3>
            <p className="text-sm opacity-90">{session.courseId.title}</p>
          </div>
          <div className="text-3xl">{getPlatformIcon(session.platform)}</div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {session.description}
        </p>

        {/* Details */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">التاريخ والوقت:</span>
            <span className="font-medium text-gray-800 dark:text-white">
              {formatDate(session.scheduledAt)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">المدة:</span>
            <span className="font-medium text-gray-800 dark:text-white">
              {session.duration} دقيقة
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">المدرس:</span>
            <span className="font-medium text-gray-800 dark:text-white">
              {session.teacherId.name}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">المشاركون:</span>
            <span className="font-medium text-gray-800 dark:text-white">
              {session.participants.length}/{session.maxParticipants}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">الحالة:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
              {getStatusText(session.status)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          {isTeacher && session.status === 'scheduled' && onCancel && (
            <button
              onClick={() => onCancel(session._id)}
              className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
            >
              إلغاء الجلسة
            </button>
          )}

          {!isTeacher && !isParticipant && canJoin && onJoin && (
            <button
              onClick={() => onJoin(session._id)}
              className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
            >
              الانضمام
            </button>
          )}

          {!isTeacher && isParticipant && onLeave && (
            <button
              onClick={() => onLeave(session._id)}
              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              مغادرة
            </button>
          )}

          {session.meetingUrl && (isParticipant || isTeacher) && (
            <a
              href={session.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium text-center"
            >
              {isLive ? 'انضم الآن' : 'رابط الاجتماع'}
            </a>
          )}

          {session.recordingUrl && session.status === 'completed' && (
            <a
              href={session.recordingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium text-center"
            >
              مشاهدة التسجيل
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveSessionCard; 