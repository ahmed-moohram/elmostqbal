import express from 'express';
import { getOrders, createOrder } from '../controllers/orderController';
import { authMiddleware, adminAuth } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, adminAuth, getOrders);
router.post('/', authMiddleware, createOrder);

export default router;
