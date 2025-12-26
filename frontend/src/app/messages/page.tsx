'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    avatar?: string;
  };
  receiver: {
    _id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  messageType: 'text' | 'file' | 'image';
  fileUrl?: string;
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  _id: string;
  user: User;
  lastMessage: {
    content: string;
    createdAt: string;
    sender: string;
  };
  unreadCount: number;
}

interface CourseOption {
  id: string;
  title: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectUserId = searchParams?.get('user');
  const preselectCourseId = searchParams?.get('courseId') || '';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(preselectCourseId);
  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');

  useEffect(() => {
    fetchConversations();
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [selectedCourseId]);

  useEffect(() => {
    if (!preselectUserId) return;

    const existing = conversations.find((c) => String(c.user?._id) === String(preselectUserId)) || null;
    if (existing) {
      setSelectedConversation(existing);
      return;
    }

    const user = users.find((u) => String(u._id) === String(preselectUserId)) || null;
    if (!user) return;

    const newConversation: Conversation = {
      _id: `new-${Date.now()}`,
      user,
      lastMessage: {
        content: '',
        createdAt: new Date().toISOString(),
        sender: '',
      },
      unreadCount: 0,
    };

    setSelectedConversation(newConversation);
    setMessages([]);
  }, [preselectUserId, conversations, users]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.user._id);
    }
  }, [selectedConversation]);

  const toArray = (payload: any): any[] => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.conversations)) return payload.conversations;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.messages)) return payload.messages;
    return [];
  };

  const normalizeConversations = (payload: any): Conversation[] => {
    const list = toArray(payload);
    return list.map((item: any, idx: number) => {
      const rawUser = item?.user;
      const user: User = rawUser
        ? {
            _id: String(rawUser._id ?? rawUser.id ?? ''),
            name: rawUser.name || 'مستخدم',
            email: rawUser.email || '',
            avatar: rawUser.avatar || rawUser.avatar_url || rawUser.profile_picture,
            role: rawUser.role || 'student',
          }
        : {
            _id: String(item?._id ?? item?.id ?? `u-${idx}`),
            name: item?.name || 'مستخدم',
            email: item?.email || '',
            avatar: item?.avatar || item?.avatar_url || item?.profile_picture,
            role: item?.role || 'student',
          };

      const lastMessageRaw = item?.lastMessage;
      const lastMessage =
        lastMessageRaw && typeof lastMessageRaw === 'object'
          ? {
              content: String(lastMessageRaw.content ?? ''),
              createdAt: String(lastMessageRaw.createdAt ?? lastMessageRaw.created_at ?? new Date().toISOString()),
              sender: String(lastMessageRaw.sender ?? ''),
            }
          : {
              content: String(item?.lastMessage ?? ''),
              createdAt: String(item?.updatedAt ?? item?.updated_at ?? item?.createdAt ?? item?.created_at ?? new Date().toISOString()),
              sender: '',
            };

      return {
        _id: String(item?._id ?? item?.id ?? `c-${idx}`),
        user,
        lastMessage,
        unreadCount: Number(item?.unreadCount ?? item?.unread ?? 0) || 0,
      };
    });
  };

  const normalizeUsers = (payload: any): User[] => {
    const list = toArray(payload);
    return list
      .filter(Boolean)
      .map((u: any, idx: number) => ({
        _id: String(u?._id ?? u?.id ?? `u-${idx}`),
        name: u?.name || 'مستخدم',
        email: u?.email || '',
        avatar: u?.avatar || u?.avatar_url || u?.profile_picture,
        role: u?.role || 'student',
      }));
  };

  const normalizeMessages = (payload: any): Message[] => {
    const list = toArray(payload);
    return list
      .filter(Boolean)
      .map((m: any, idx: number) => {
        const senderRaw = m?.sender;
        const receiverRaw = m?.receiver;

        return {
          _id: String(m?._id ?? m?.id ?? `m-${idx}-${m?.createdAt ?? m?.created_at ?? Date.now()}`),
          sender:
            senderRaw && typeof senderRaw === 'object'
              ? {
                  _id: String(senderRaw?._id ?? senderRaw?.id ?? ''),
                  name: senderRaw?.name || '',
                  avatar: senderRaw?.avatar || senderRaw?.avatar_url || senderRaw?.profile_picture,
                }
              : {
                  _id: String(m?.sender ?? ''),
                  name: '',
                  avatar: undefined,
                },
          receiver:
            receiverRaw && typeof receiverRaw === 'object'
              ? {
                  _id: String(receiverRaw?._id ?? receiverRaw?.id ?? ''),
                  name: receiverRaw?.name || '',
                  avatar: receiverRaw?.avatar || receiverRaw?.avatar_url || receiverRaw?.profile_picture,
                }
              : {
                  _id: String(m?.receiver ?? ''),
                  name: '',
                  avatar: undefined,
                },
          content: String(m?.content ?? ''),
          messageType: (m?.messageType ?? m?.message_type ?? 'text') as 'text' | 'file' | 'image',
          fileUrl: m?.fileUrl ?? m?.file_url,
          isRead: Boolean(m?.isRead ?? m?.is_read ?? false),
          createdAt: String(m?.createdAt ?? m?.created_at ?? new Date().toISOString()),
        } as Message;
      });
  };

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/messages/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        setConversations([]);
        return;
      }

      const data = await response.json().catch(() => null);
      setConversations(normalizeConversations(data));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      if (!response.ok) {
        setCourses([]);
        return;
      }

      const data = await response.json().catch(() => null);
      const list: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.courses)
        ? data.courses
        : Array.isArray(data?.items)
        ? data.items
        : [];

      setCourses(
        list
          .filter(Boolean)
          .map((c: any) => ({
            id: String(c?.id ?? c?._id ?? ''),
            title: String(c?.title ?? c?.name ?? 'كورس'),
          }))
          .filter((c: CourseOption) => Boolean(c.id)),
      );
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const qs = selectedCourseId ? `?courseId=${encodeURIComponent(selectedCourseId)}` : '';
      const response = await fetch(`/api/users${qs}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        setUsers([]);
        return;
      }

      const data = await response.json().catch(() => null);
      setUsers(normalizeUsers(data));
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/messages/conversation/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        setMessages([]);
        return;
      }

      const data = await response.json().catch(() => null);
      setMessages(normalizeMessages(data));
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: selectedConversation.user._id,
          content: newMessage,
          messageType: 'text'
        })
      });

      if (response.ok) {
        const data = await response.json().catch(() => null);
        const sent = data?.data;
        if (sent) {
          const normalizedSent = normalizeMessages([sent])[0];
          setMessages((prev) => [...prev, normalizedSent || sent]);
        } else {
          await fetchMessages(selectedConversation.user._id);
        }
        setNewMessage('');
        fetchConversations(); // Refresh conversations to update last message
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const startNewConversation = async () => {
    if (!selectedUser) return;

    const user = users.find(u => u._id === selectedUser);
    if (!user) return;

    const newConversation: Conversation = {
      _id: `new-${Date.now()}`,
      user,
      lastMessage: {
        content: '',
        createdAt: new Date().toISOString(),
        sender: ''
      },
      unreadCount: 0
    };

    setSelectedConversation(newConversation);
    setMessages([]);
    setShowNewChat(false);
    setSelectedUser('');
  };

  const formatTime = (dateString: string) => {
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

  const currentUserId = localStorage.getItem('userId');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="flex h-[600px] flex-row-reverse">
            {/* Conversations Sidebar */}
            <div className="w-1/3 border-l border-gray-200 dark:border-gray-700 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">الرسائل</h2>
                  <button
                    onClick={() => setShowNewChat(true)}
                    className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                  >
                    ✉️
                  </button>
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (conversations || []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <div className="text-4xl mb-2">💬</div>
                    <p className="text-sm text-center">لا توجد محادثات بعد</p>
                    <button
                      onClick={() => setShowNewChat(true)}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      بدء محادثة جديدة
                    </button>
                  </div>
                ) : (
                  (conversations || []).map((conversation) => (
                    <div
                      key={conversation._id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-4 cursor-pointer border-b border-gray-100 dark:border-gray-700 transition-colors ${
                        selectedConversation?._id === conversation._id
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                            {conversation.user.avatar ? (
                              <img 
                                src={conversation.user.avatar} 
                                alt={conversation.user.name} 
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                                {conversation.user.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          {conversation.unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm text-gray-800 dark:text-white truncate">
                              {conversation.user.name}
                            </h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTime(conversation.lastMessage?.createdAt || new Date().toISOString())}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1">
                            {conversation.lastMessage?.content || 'لا توجد رسائل'}
                          </p>
                          <div className="flex items-center mt-1">
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {conversation.user.role === 'teacher' ? '👨‍🏫 مدرس' : '👨‍🎓 طالب'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        {selectedConversation.user.avatar ? (
                          <img 
                            src={selectedConversation.user.avatar} 
                            alt={selectedConversation.user.name} 
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                            {selectedConversation.user.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white">
                          {selectedConversation.user.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedConversation.user.role === 'teacher' ? 'مدرس' : 'طالب'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message, idx) => (
                      <div
                        key={`${message._id}-${idx}`}
                        className={`flex ${message.sender?._id === currentUserId ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            message.sender?._id === currentUserId
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'
                          }`}
                        >
                          {message.messageType === 'file' && message.fileUrl && (
                            <div className="mb-2">
                              <a
                                href={message.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                📎 ملف مرفق
                              </a>
                            </div>
                          )}
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender?._id === currentUserId ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder="اكتب رسالتك هنا..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                        disabled={sending}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={sending || !newMessage.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {sending ? 'إرسال...' : 'إرسال'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <p className="text-lg">اختر محادثة لبدء المراسلة</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">بدء محادثة جديدة</h3>
            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setSelectedUser('');
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-white mb-4"
            >
              <option value="">كل الكورسات</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-white mb-4"
            >
              <option value="">اختر المستخدم</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.role === 'teacher' ? 'مدرس' : 'طالب'})
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewChat(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={startNewConversation}
                disabled={!selectedUser}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                بدء المحادثة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}