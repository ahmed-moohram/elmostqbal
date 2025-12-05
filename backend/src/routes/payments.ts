import express from 'express';
import { getPayments, getPaymentStats } from '../controllers/paymentController';
import { authMiddleware, adminAuth } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, adminAuth, getPayments);
router.get('/stats', authMiddleware, adminAuth, getPaymentStats);

export default router;
