import express from 'express';
import { getCoupons, createCoupon, validateCoupon } from '../controllers/couponController';
import { authMiddleware, adminAuth } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, adminAuth, getCoupons);
router.post('/', authMiddleware, adminAuth, createCoupon);
router.get('/validate/:code', authMiddleware, validateCoupon);

export default router;
