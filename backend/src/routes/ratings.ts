import express from 'express';
import {
  addRating,
  updateRating,
  getRatings,
  getUserRating,
  deleteRating
} from '../controllers/ratingController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Add a new rating
router.post('/', addRating);

// Update a rating
router.put('/:ratingId', updateRating);

// Get ratings for a specific target (course or teacher)
router.get('/:targetType/:targetId', getRatings);

// Get user's rating for a specific target
router.get('/user/:targetType/:targetId', getUserRating);

// Delete a rating
router.delete('/:ratingId', deleteRating);

export default router; 