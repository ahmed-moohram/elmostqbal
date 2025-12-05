import express from 'express';
import { getReports, getSalesReport } from '../controllers/reportsController';
import { authMiddleware, adminAuth } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, adminAuth, getReports);
router.get('/sales', authMiddleware, adminAuth, getSalesReport);

export default router;
