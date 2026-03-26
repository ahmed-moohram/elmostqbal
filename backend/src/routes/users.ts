import express from 'express';
import {
  getUsers,
  getTeachers,
  getStudents,
  createTeacher,
  updateTeacher,
  deleteTeacher
} from '../controllers/userController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Get all users (except current user)
router.get('/', getUsers);

// Get all teachers
router.get('/teachers', getTeachers);

// Get all students
router.get('/students', getStudents);

// Teacher management (admin only)
router.post('/teachers', requireAdmin, createTeacher);
router.put('/teachers/:id', requireAdmin, updateTeacher);
router.delete('/teachers/:id', requireAdmin, deleteTeacher);

export default router;