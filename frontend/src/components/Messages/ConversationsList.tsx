'use client';

import React, { useState, useEffect } from 'react';
import ChatBox from './ChatBox';

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

interface ConversationsListProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConversationsList: React.FC<ConversationsListProps> = ({ isOpen, onClose }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState<{
    userId: string;
    userName: string;
    userAvatar?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/messages/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data.data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
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

  const truncateText = (text: string, maxLength: number = 30) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      <div className="fixed right-4 bottom-20 w-80 h-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-50">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
          <h3 className="font-semibold">المحادثات</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-sm">لا توجد محادثات بعد</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation._id}
                onClick={() => setSelectedChat({
                  userId: conversation.user._id,
                  userName: conversation.user.name,
                  userAvatar: conversation.user.avatar
                })}
                className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    {conversation.user.avatar ? (
                      <img 
                        src={conversation.user.avatar} 
                        alt={conversation.user.name} 
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-gray-600">
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
                
                <div className="flex-1 ml-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-gray-800">
                      {conversation.user.name}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {formatTime(conversation.lastMessage.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {truncateText(conversation.lastMessage.content)}
                  </p>
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-gray-400">
                      {conversation.user.role === 'teacher' ? '👨‍🏫 مدرس' : '👨‍🎓 طالب'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Box */}
      {selectedChat && (
        <ChatBox
          userId={selectedChat.userId}
          userName={selectedChat.userName}
          userAvatar={selectedChat.userAvatar}
          onClose={() => setSelectedChat(null)}
        />
      )}
    </>
  );
};

export default ConversationsList; 