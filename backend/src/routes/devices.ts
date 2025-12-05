import express from 'express';
import { getDevices, blockDevice, unblockDevice } from '../controllers/deviceController';
import { authMiddleware, adminAuth } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, adminAuth, getDevices);
router.patch('/:id/block', authMiddleware, adminAuth, blockDevice);
router.patch('/:id/unblock', authMiddleware, adminAuth, unblockDevice);

export default router;
