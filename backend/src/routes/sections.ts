import express from 'express';
import { getSections, createSection, updateSection, deleteSection } from '../controllers/sectionController';
import { authMiddleware, adminAuth } from '../middleware/auth';

const router = express.Router();

router.get('/', getSections);
router.post('/', authMiddleware, adminAuth, createSection);
router.patch('/:id', authMiddleware, adminAuth, updateSection);
router.delete('/:id', authMiddleware, adminAuth, deleteSection);

export default router;
