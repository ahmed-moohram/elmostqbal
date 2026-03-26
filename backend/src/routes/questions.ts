import express from 'express';
import {
  createQuestion,
  getCourseQuestions,
  getQuestion,
  addAnswer,
  acceptAnswer,
  voteAnswer,
  searchQuestions,
  getUserQuestions
} from '../controllers/questionController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Question routes
router.post('/', createQuestion);
router.get('/course/:courseId', getCourseQuestions);
router.get('/search', searchQuestions);
router.get('/user', getUserQuestions);
router.get('/:questionId', getQuestion);

// Answer routes
router.post('/:questionId/answers', addAnswer);
router.post('/answers/:answerId/accept', acceptAnswer);
router.post('/answers/:answerId/vote', voteAnswer);

export default router; 