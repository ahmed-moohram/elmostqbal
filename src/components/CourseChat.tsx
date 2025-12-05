'use client';

import { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaSmile, FaPaperclip, FaVideo, FaPhone, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

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

  // محاكاة رسائل سابقة
  useEffect(() => {
    if (isOpen) {
      loadMessages();
      // محاكاة اتصال WebSocket
      simulateRealtimeConnection();
    }
  }, [isOpen, courseId]);

  const loadMessages = () => {
    // رسائل تجريبية
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
    // محاكاة مستخدمين متصلين
    setOnlineUsers(['teacher_1', 'student_1', userId]);
    
    // محاكاة رسالة جديدة بعد 5 ثواني
    setTimeout(() => {
      if (userRole === 'student') {
        const newMsg: Message = {
          id: Date.now().toString(),
          senderId: teacherId || 'teacher_1',
          senderName: teacherName || 'أ. محمد أحمد',
          senderAvatar: '/teacher-avatar.jpg',
          senderRole: 'teacher',
          content: 'كيف حالك؟ هل تحتاج مساعدة في أي درس؟',
          timestamp: new Date().toISOString(),
          isRead: false
        };
        setMessages(prev => [...prev, newMsg]);
        toast('📩 رسالة جديدة من المدرس', { icon: '💬' });
      }
    }, 5000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: userId,
      senderName: userName,
      senderAvatar: '/default-avatar.png',
      senderRole: userRole,
      content: newMessage,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // محاكاة رد تلقائي من المدرس
    if (userRole === 'student') {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const reply: Message = {
          id: (Date.now() + 1).toString(),
          senderId: teacherId || 'teacher_1',
          senderName: teacherName || 'أ. محمد أحمد',
          senderAvatar: '/teacher-avatar.jpg',
          senderRole: 'teacher',
          content: 'شكراً على رسالتك، سأرد عليك قريباً 👍',
          timestamp: new Date().toISOString(),
          isRead: false
        };
        setMessages(prev => [...prev, reply]);
      }, 2000);
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
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === userId ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`max-w-[70%] ${message.senderId === userId ? 'order-2' : 'order-1'}`}>
              <div className="flex items-start gap-2 mb-1">
                {message.senderId !== userId && (
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
                      message.senderId === userId
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
        ))}
        
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
            disabled={!newMessage.trim()}
            className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPaperPlane />
          </button>
        </div>
      </form>
    </div>
  );
}
