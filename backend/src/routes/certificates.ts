import express from 'express';
import {
  issueCertificate,
  getStudentCertificates,
  getCertificate,
  verifyCertificate,
  getAllCertificates,
  revokeCertificate,
  downloadCertificate
} from '../controllers/certificateController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Public route for certificate verification
router.get('/verify/:certificateNumber', verifyCertificate);

// All other routes require authentication
router.use(requireAuth);

// Issue certificate (Teacher only)
router.post('/issue', issueCertificate);

// Get student's certificates
router.get('/student', getStudentCertificates);

// Get specific certificate
router.get('/:certificateId', getCertificate);

// Download certificate
router.get('/:certificateId/download', downloadCertificate);

// Get all certificates (Admin/Teacher only)
router.get('/', getAllCertificates);

// Revoke certificate (Admin only)
router.patch('/:certificateId/revoke', revokeCertificate);

export default router; 