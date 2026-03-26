import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  createAssignment,
  getCourseAssignments,
  getAssignment,
  submitAssignment,
  getStudentSubmissions,
  getAssignmentSubmissions,
  gradeAssignment,
  updateAssignment,
  deleteAssignment
} from '../controllers/assignmentController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/assignments/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = /pdf|doc|docx|txt|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, TXT, JPG, JPEG, PNG files are allowed'));
    }
  }
});

// All routes require authentication
router.use(requireAuth);

// Assignment management (Teacher routes)
router.post('/', createAssignment);
router.put('/:assignmentId', updateAssignment);
router.delete('/:assignmentId', deleteAssignment);

// Get assignments for a course
router.get('/course/:courseId', getCourseAssignments);

// Get specific assignment
router.get('/:assignmentId', getAssignment);

// Submit assignment (Student route)
router.post('/submit', upload.single('file'), submitAssignment);

// Get student's submissions
router.get('/student/submissions', getStudentSubmissions);

// Get submissions for an assignment (Teacher route)
router.get('/:assignmentId/submissions', getAssignmentSubmissions);

// Grade assignment (Teacher route)
router.post('/:submissionId/grade', gradeAssignment);

export default router; 