'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

interface Conversation {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    sender: string;
  };
  unreadCount: number;
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
  isRead: boolean;
  createdAt: string;
}

interface AdminTeacherChatProps {
  teacherId: string;
}

export default function AdminTeacherChat({ teacherId }: AdminTeacherChatProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConv, setLoadingConv] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; avatar?: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (teacherId) {
      fetchConversations();
    }
  }, [teacherId]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id);
      const interval = setInterval(() => fetchMessages(selectedUser.id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    setLoadingConv(true);
    try {
      const response = await fetch(
        `/api/messages/conversations?currentUserId=${encodeURIComponent(teacherId)}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setConversations(Array.isArray(data) ? data : (data?.data || []));
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoadingConv(false);
    }
  };

  const fetchMessages = async (studentId: string) => {
    try {
      const response = await fetch(
        `/api/messages/conversation/${studentId}?currentUserId=${encodeURIComponent(teacherId)}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(Array.isArray(data) ? data : (data?.data || []));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    setSending(true);
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          senderId: teacherId,
          receiverId: selectedUser.id,
          content: newMessage.trim(),
          messageType: 'text',
        }),
      });

      if (response.ok) {
        setNewMessage('');
        await fetchMessages(selectedUser.id);
        await fetchConversations();
      } else {
        toast.error('فشل إرسال الرسالة');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('خطأ في الاتصال');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex bg-white rounded-xl shadow-lg border h-[600px] overflow-hidden" dir="rtl">
      {/* Conversations List */}
      <div className="w-1/3 border-l bg-gray-50 flex flex-col">
        <div className="p-4 bg-purple-600 text-white font-bold">
          المحادثات الخاصة بالمدرس
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConv ? (
            <div className="p-4 text-center">جاري التحميل...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">لا توجد محادثات</div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv._id}
                onClick={() => setSelectedUser({ id: conv.user._id, name: conv.user.name, avatar: conv.user.avatar })}
                className={`flex items-center p-4 cursor-pointer border-b transition-colors ${
                  selectedUser?.id === conv.user._id ? 'bg-purple-100' : 'hover:bg-gray-100'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center overflow-hidden ml-3">
                  {conv.user.avatar ? (
                    <img src={conv.user.avatar} alt={conv.user.name} className="w-10 h-10 object-cover" />
                  ) : (
                    <span className="text-gray-600 font-bold">{conv.user.name?.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-semibold text-sm truncate">{conv.user.name}</h4>
                  <p className="text-xs text-gray-500 truncate">{conv.lastMessage?.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Box */}
      <div className="w-2/3 flex flex-col bg-white">
        {selectedUser ? (
          <>
            <div className="p-4 border-b bg-gray-50 font-bold flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                {selectedUser.avatar ? (
                  <img src={selectedUser.avatar} alt={selectedUser.name} className="w-8 h-8 object-cover" />
                ) : (
                  <span className="text-gray-600 font-bold">{selectedUser.name?.charAt(0)}</span>
                )}
              </div>
              {selectedUser.name}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-10">لا توجد رسائل سابقة. ابدأ المحادثة الآن!</div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender?._id === teacherId || (msg.sender as any)?.id === teacherId;
                  return (
                    <div key={msg._id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${isMe ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 text-right ${isMe ? 'text-purple-200' : 'text-gray-500'}`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t bg-white flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendMessage();
                }}
                placeholder="اكتب رسالة للرد كأنك المدرس..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-500"
                disabled={sending}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
              >
                {sending ? '...' : 'إرسال'}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            أختر محادثة لعرض الرسائل والرد عليها
          </div>
        )}
      </div>
    </div>
  );
}
