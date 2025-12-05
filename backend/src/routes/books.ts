import express from 'express';
import {
  createBook,
  getBooks,
  getBook,
  updateBook,
  deleteBook,
  purchaseBook,
  addReview,
} from '../controllers/bookController';
import { authMiddleware as auth, adminAuth } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getBooks);
router.get('/:id', getBook);

// Protected routes
router.post('/', auth, adminAuth, createBook);
router.patch('/:id', auth, adminAuth, updateBook);
router.delete('/:id', auth, adminAuth, deleteBook);
router.post('/:id/purchase', auth, purchaseBook);
router.post('/:id/reviews', auth, addReview);

export default router;