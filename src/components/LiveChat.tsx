'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaComments, FaTimes, FaPaperPlane, FaUser, FaRobot, FaCircle } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  sender: 'user' | 'support' | 'bot';
  text: string;
  timestamp: Date;
  isRead?: boolean;
}

export default function LiveChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'مرحباً! كيف يمكنني مساعدتك اليوم؟',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickReplies = [
    'كيف أسجل في دورة؟',
    'كيف أحصل على شهادة؟',
    'ما هي طرق الدفع؟',
    'أحتاج مساعدة في الدورة',
    'تحدث مع مدرس'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse = getBotResponse(text);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
    }, 1500);
  };

  const getBotResponse = (userText: string): string => {
    const lowerText = userText.toLowerCase();
    
    if (lowerText.includes('تسجيل') || lowerText.includes('اشتراك')) {
      return 'للتسجيل في دورة، اذهب إلى صفحة الدورة واضغط على "التسجيل الآن". ستحتاج إلى تسجيل الدخول أولاً.';
    } else if (lowerText.includes('شهادة')) {
      return 'ستحصل على شهادة إتمام تلقائياً عند إنهاء 80% من محتوى الدورة وحل جميع الاختبارات بنجاح.';
    } else if (lowerText.includes('دفع') || lowerText.includes('سعر')) {
      return 'نقبل الدفع عبر فودافون كاش، البطاقات الائتمانية، وفوري. جميع المعاملات آمنة ومحمية.';
    } else if (lowerText.includes('مساعدة') || lowerText.includes('مشكلة')) {
      return 'سأحولك إلى أحد ممثلي الدعم الفني. سيتواصلون معك خلال دقائق.';
    } else if (lowerText.includes('مدرس')) {
      return 'يمكنك التواصل مع المدرس مباشرة من خلال صفحة الدورة. أو اضغط على "محادثة المدرس" في لوحة التحكم.';
    } else {
      return 'شكراً لرسالتك! فريق الدعم سيرد عليك قريباً. هل هناك شيء آخر يمكنني مساعدتك به؟';
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleChat}
        className="fixed bottom-6 left-6 z-50 w-16 h-16 bg-gradient-to-br from-primary to-accent text-white rounded-full shadow-2xl flex items-center justify-center"
      >
        {isOpen ? <FaTimes className="text-2xl" /> : <FaComments className="text-2xl" />}
        
        {/* Unread Badge */}
        {unreadCount > 0 && !isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold"
          >
            {unreadCount}
          </motion.div>
        )}

        {/* Online Indicator */}
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -top-1 -left-1"
        >
          <FaCircle className="text-green-500 text-xs" />
        </motion.div>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-24 left-6 z-50 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-accent p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <FaRobot className="text-primary text-xl" />
                    </div>
                    <FaCircle className="absolute -bottom-0.5 -right-0.5 text-green-500 text-xs" />
                  </div>
                  <div>
                    <h3 className="font-bold">مساعد المنصة</h3>
                    <p className="text-xs opacity-90">متصل الآن</p>
                  </div>
                </div>
                <button onClick={toggleChat} className="hover:bg-white/20 rounded-full p-2 transition-colors">
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === 'user' 
                        ? 'bg-primary' 
                        : message.sender === 'bot' 
                        ? 'bg-gray-300 dark:bg-gray-700' 
                        : 'bg-green-500'
                    }`}>
                      {message.sender === 'user' ? (
                        <FaUser className="text-white text-xs" />
                      ) : message.sender === 'bot' ? (
                        <FaRobot className="text-gray-600 dark:text-gray-300 text-xs" />
                      ) : (
                        <FaUser className="text-white text-xs" />
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div>
                      <div className={`px-4 py-2 rounded-2xl ${
                        message.sender === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                      }`}>
                        {message.text}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
                        {message.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <FaRobot className="text-gray-600 dark:text-gray-300 text-xs" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-2xl flex gap-1">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                      className="w-2 h-2 bg-gray-400 rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                      className="w-2 h-2 bg-gray-400 rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                      className="w-2 h-2 bg-gray-400 rounded-full"
                    />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">أسئلة شائعة:</p>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((reply, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(reply)}
                      className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-primary hover:text-white rounded-full transition-colors"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputMessage)}
                  placeholder="اكتب رسالتك..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendMessage(inputMessage)}
                  className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
                >
                  <FaPaperPlane />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
