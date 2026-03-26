import express from 'express';
import { 
  getCourseContent, 
  getCourseReviews, 
  getRecommendedCourses
} from '../controllers/courseExtrasController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Course extras routes - يجب أن تكون قبل :id routes
router.get('/recommended', getRecommendedCourses);
router.get('/:id/content', authMiddleware, getCourseContent);
router.get('/:id/reviews', getCourseReviews);

export default router;
