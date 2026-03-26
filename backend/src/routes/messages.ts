import express from 'express';
import {
  sendMessage,
  getConversation,
  getMyConversations,
  markAsRead,
  markConversationAsRead,
  getUnreadCount
} from '../controllers/messageController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Send a message
router.post('/send', sendMessage);

// Get conversation with specific user
router.get('/conversation/:userId', getConversation);

// Get all conversations for current user
router.get('/conversations', getMyConversations);

// Mark specific message as read
router.patch('/read/:messageId', markAsRead);

// Mark all messages in conversation as read
router.patch('/conversation/:userId/read', markConversationAsRead);

// Get unread messages count
router.get('/unread-count', getUnreadCount);

export default router; 