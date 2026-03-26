import express from 'express';
import {
  createLiveSession,
  getCourseLiveSessions,
  getUpcomingLiveSessions,
  joinLiveSession,
  leaveLiveSession,
  updateSessionStatus,
  getLiveSession,
  cancelLiveSession
} from '../controllers/liveSessionController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Create live session (Teacher only)
router.post('/', createLiveSession);

// Get live sessions for a course
router.get('/course/:courseId', getCourseLiveSessions);

// Get upcoming live sessions
router.get('/upcoming', getUpcomingLiveSessions);

// Get specific live session
router.get('/:sessionId', getLiveSession);

// Join live session
router.post('/:sessionId/join', joinLiveSession);

// Leave live session
router.post('/:sessionId/leave', leaveLiveSession);

// Update session status (Teacher only)
router.patch('/:sessionId/status', updateSessionStatus);

// Cancel live session (Teacher only)
router.patch('/:sessionId/cancel', cancelLiveSession);

export default router; 