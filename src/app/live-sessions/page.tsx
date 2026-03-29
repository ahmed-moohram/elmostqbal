'use client';

import React, { useState, useEffect } from 'react';
import LiveSessionCard from '../../components/LiveSessions/LiveSessionCard';

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

export default function LiveSessionsPage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    fetchSessions();
    fetchUserInfo();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/live-sessions/upcoming', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // تأمين البيانات - API قد يرجع مصفوفة مباشرة أو { data: [] }
        const sessionsArray = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        setSessions(sessionsArray);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.data.role);
        setUserId(data.data._id);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const handleJoin = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/live-sessions/${sessionId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchSessions(); // Refresh sessions
      } else {
        const error = await response.json();
        alert(error.message || 'فشل في الانضمام للجلسة');
      }
    } catch (error) {
      console.error('Error joining session:', error);
      alert('حدث خطأ أثناء الانضمام للجلسة');
    }
  };

  const handleLeave = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/live-sessions/${sessionId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchSessions(); // Refresh sessions
      } else {
        const error = await response.json();
        alert(error.message || 'فشل في مغادرة الجلسة');
      }
    } catch (error) {
      console.error('Error leaving session:', error);
      alert('حدث خطأ أثناء مغادرة الجلسة');
    }
  };

  const handleCancel = async (sessionId: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذه الجلسة؟')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/live-sessions/${sessionId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchSessions(); // Refresh sessions
      } else {
        const error = await response.json();
        alert(error.message || 'فشل في إلغاء الجلسة');
      }
    } catch (error) {
      console.error('Error cancelling session:', error);
      alert('حدث خطأ أثناء إلغاء الجلسة');
    }
  };

  const isParticipant = (session: LiveSession) => {
    return session.participants.some(participant => participant._id === userId);
  };

  const isTeacher = (session: LiveSession) => {
    return session.teacherId._id === userId;
  };

  const upcomingSessions = sessions.filter(session => 
    session.status === 'scheduled' || session.status === 'live'
  );

  const completedSessions = sessions.filter(session => 
    session.status === 'completed'
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل الدروس المباشرة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
            الدروس المباشرة
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            انضم للدروس المباشرة وتفاعل مع المدرسين والطلاب
          </p>
        </div>

        {/* Upcoming Sessions */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
            الجلسات القادمة والمباشرة
          </h2>
          
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <div className="text-6xl mb-4">📹</div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                لا توجد جلسات قادمة
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                تحقق لاحقاً من الجلسات الجديدة
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingSessions.map((session) => (
                <LiveSessionCard
                  key={session._id}
                  session={session}
                  onJoin={handleJoin}
                  onLeave={handleLeave}
                  onCancel={handleCancel}
                  isTeacher={isTeacher(session)}
                  isParticipant={isParticipant(session)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Completed Sessions */}
        {completedSessions.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
              الجلسات المكتملة
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedSessions.map((session) => (
                <LiveSessionCard
                  key={session._id}
                  session={session}
                  isTeacher={isTeacher(session)}
                  isParticipant={isParticipant(session)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            إحصائيات الدروس المباشرة
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {upcomingSessions.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                جلسات قادمة
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {sessions.filter(s => s.status === 'live').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                جلسات مباشرة الآن
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">
                {completedSessions.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                جلسات مكتملة
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">
                {sessions.reduce((total, session) => total + session.participants.length, 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                إجمالي المشاركين
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 