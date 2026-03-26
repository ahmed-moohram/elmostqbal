import express from 'express';
import { getTeacherDashboard } from '../controllers/courseExtrasController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Teacher dashboard
router.get('/dashboard', authMiddleware, getTeacherDashboard);

export default router;
