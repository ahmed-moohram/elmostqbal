import express from 'express';
import {
  createCourse,
  getCourses,
  getCourse,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  addReview,
  getEnrolledCourses,
} from '../controllers/courseController';
import { authMiddleware as auth, adminAuth } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getCourses);
router.get('/:id', getCourse);

// Protected routes
router.get('/enrolled/my-courses', auth, getEnrolledCourses);
router.post('/', auth, createCourse);
router.patch('/:id', auth, updateCourse);
router.delete('/:id', auth, deleteCourse);
router.post('/:id/enroll', auth, enrollInCourse);
router.post('/:id/reviews', auth, addReview);
export default router; 