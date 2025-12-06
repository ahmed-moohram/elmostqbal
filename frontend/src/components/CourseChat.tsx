'use client';

import { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaSmile, FaPaperclip, FaVideo, FaPhone, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '@/lib/api';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: 'teacher' | 'student';
  content: string;
  timestamp: string;
  isRead: boolean;
  attachments?: string[];
}

interface ChatProps {
  courseId: string;
  userId: string;
  userName: string;
  userRole: 'teacher' | 'student';
  teacherId?: string;
  teacherName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CourseChat({ 
  courseId, 
  userId, 
  userName, 
  userRole,
  teacherId,
  teacherName,
  isOpen,
  onClose 
}: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentUserId(parsed.id || userId);
      } else {
        setCurrentUserId(userId);
      }
    } catch {
      setCurrentUserId(userId);
    }
  }, [userId]);

  const fetchMessagesFromApi = async () => {
    if (!teacherId) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/messages/conversation/${teacherId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const apiMessages = data.data || [];
        const transformed: Message[] = apiMessages.map((m: any) => ({
          id: m._id,
          senderId: m.sender?._id || '',
          senderName: m.sender?.name || 'مستخدم',
          senderAvatar: m.sender?.avatar || '/default-avatar.png',
          senderRole: m.sender?._id === teacherId ? 'teacher' : 'student',
          content: m.content,
          timestamp: m.createdAt,
          isRead: m.isRead,
        }));
        setMessages(transformed);
      }
    } catch (error) {
      console.error('Error fetching course chat messages:', error);
      if (!messages.length) {
        loadMessages();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessagesFromApi();
      simulateRealtimeConnection();
    }
  }, [isOpen, courseId, teacherId]);

  const loadMessages = () => {
    const mockMessages: Message[] = [
      {
        id: '1',
        senderId: teacherId || 'teacher_1',
        senderName: teacherName || 'أ. محمد أحمد',
        senderAvatar: '/teacher-avatar.jpg',
        senderRole: 'teacher',
        content: 'أهلاً وسهلاً بكم في الكورس! 🎉',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        isRead: true
      },
      {
        id: '2',
        senderId: 'student_1',
        senderName: 'أحمد علي',
        senderAvatar: '/student1.jpg',
        senderRole: 'student',
        content: 'شكراً أستاذ، الكورس رائع جداً',
        timestamp: new Date(Date.now() - 3000000).toISOString(),
        isRead: true
      },
      {
        id: '3',
        senderId: teacherId || 'teacher_1',
        senderName: teacherName || 'أ. محمد أحمد',
        senderAvatar: '/teacher-avatar.jpg',
        senderRole: 'teacher',
        content: 'العفو، إذا كان لديكم أي أسئلة لا تترددوا في السؤال',
        timestamp: new Date(Date.now() - 2400000).toISOString(),
        isRead: true
      }
    ];
    setMessages(mockMessages);
  };

  const simulateRealtimeConnection = () => {
    const me = currentUserId || userId;
    const users: string[] = [];
    if (teacherId) users.push(teacherId);
    if (me) users.push(me);
    if (users.length) {
      setOnlineUsers(users);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!newMessage.trim() || !teacherId) return;

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('يجب تسجيل الدخول لإرسال الرسائل');
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: teacherId,
          content: newMessage,
          messageType: 'text',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const m = data.data;
        if (m) {
          const msg: Message = {
            id: m._id,
            senderId: m.sender?._id || (currentUserId || userId),
            senderName: m.sender?.name || userName,
            senderAvatar: m.sender?.avatar || '/default-avatar.png',
            senderRole: m.sender?._id === teacherId ? 'teacher' : 'student',
            content: m.content,
            timestamp: m.createdAt,
            isRead: m.isRead,
          };
          setMessages(prev => [...prev, msg]);
        }
        setNewMessage('');
      } else {
        toast.error('فشل في إرسال الرسالة');
      }
    } catch (error) {
      console.error('Error sending course chat message:', error);
      toast.error('حدث خطأ أثناء إرسال الرسالة');
    } finally {
      setSending(false);
    }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmoji(false);
  };

  const emojis = ['😊', '👍', '❤️', '🎉', '🤔', '👏', '🔥', '💪', '✨', '🙏'];

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 left-4 w-96 h-[600px] bg-white rounded-t-xl shadow-2xl flex flex-col z-50 border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={userRole === 'student' ? '/teacher-avatar.jpg' : '/students-group.jpg'}
                alt="Chat"
                className="w-10 h-10 rounded-full border-2 border-white"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/default-avatar.png';
                }}
              />
              <div className="absolute bottom-0 left-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h3 className="font-bold">
                {userRole === 'student' ? teacherName || 'المدرس' : 'طلاب الكورس'}
              </h3>
              <p className="text-xs opacity-90">
                {onlineUsers.length} متصل الآن
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-white/20 rounded-lg transition">
              <FaVideo />
            </button>
            <button className="p-2 hover:bg-white/20 rounded-lg transition">
              <FaPhone />
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {loading && !messages.length && (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            جاري تحميل الرسائل...
          </div>
        )}
        {messages.map((message) => {
          const me = currentUserId || userId;
          const isOwn = message.senderId === me;
          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                <div className="flex items-start gap-2 mb-1">
                  {!isOwn && (
                    <img
                      src={message.senderAvatar}
                      alt={message.senderName}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default-avatar.png';
                      }}
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-600">
                        {message.senderName}
                      </span>
                      {message.senderRole === 'teacher' && (
                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded">
                          مدرس
                        </span>
                      )}
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isOwn
                          ? 'bg-purple-600 text-white'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-2">
            <img
              src="/teacher-avatar.jpg"
              alt="Typing"
              className="w-8 h-8 rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/default-avatar.png';
              }}
            />
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t">
        {/* Emoji Picker */}
        {showEmoji && (
          <div className="absolute bottom-20 left-4 bg-white shadow-lg rounded-lg p-3 grid grid-cols-5 gap-2">
            {emojis.map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => addEmoji(emoji)}
                className="text-2xl hover:bg-gray-100 rounded p-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 transition"
          >
            <FaPaperclip />
          </button>
          
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            className="p-2 text-gray-500 hover:text-gray-700 transition"
          >
            <FaSmile />
          </button>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="اكتب رسالتك..."
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:border-purple-500"
          />

          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPaperPlane />
          </button>
        </div>
      </form>
    </div>
  );
}
