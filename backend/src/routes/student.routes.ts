import express, { Request, Response } from 'express';
const { body, param } = require('express-validator');
import { Student } from '../models/Student';
import mongoose from 'mongoose';
import { validateRequest } from '../middleware/validate-request';
import { requireAuth, isAdmin } from '../middleware/auth';

const router = express.Router();

// ✅ Progress routes يجب أن تكون قبل /:id لتجنب التعارض
// الحصول على تقدم الطالب في جميع الكورسات
router.get('/progress',
  requireAuth,
  async (req: Request, res: Response) => {
    console.log('📊 جلب Progress للطالب:', req.user?.email);
    try {
      const userId = req.user?.id || req.user?._id;
      
      // البحث عن الطالب بناءً على userId
      const student = await Student.findOne({ userId })
        .populate('courses.courseId', 'title')
        .lean();
      
      if (!student) {
        // إرجاع بيانات فارغة إذا لم يكن الطالب موجود
        return res.json({
          coursesProgress: {},
          quizResults: []
        });
      }

      // تحويل البيانات للصيغة المطلوبة من قبل Frontend
      const coursesProgress: any = {};
      
      if (student.courses && Array.isArray(student.courses)) {
        student.courses.forEach((course: any) => {
          coursesProgress[course.courseId._id.toString()] = {
            courseId: course.courseId._id.toString(),
            completedVideos: course.completedLessons || [],
            totalVideos: course.totalLessons || 0,
            progressPercentage: course.progress || 0,
            lastWatchedVideo: course.lastWatchedVideo,
            lastWatchedAt: course.lastAccessed,
            totalWatchTime: course.totalWatchTime || 0
          };
        });
      }
      
      res.json({
        coursesProgress,
        quizResults: (student as any).quizResults || []
      });
    } catch (error) {
      console.error('Error fetching student progress:', error);
      res.status(500).json({ message: 'حدث خطأ في جلب تقدم الطالب' });
    }
  }
);

// تحديث تقدم الطالب (إضافة فيديو مكتمل)
router.post('/progress',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id || req.user?._id;
      const { courseId, videoId, action } = req.body;

      if (!courseId || !videoId) {
        return res.status(400).json({ message: 'courseId و videoId مطلوبان' });
      }

      // البحث عن الطالب أو إنشاءه
      let student = await Student.findOne({ userId });
      
      if (!student) {
        // إنشاء سجل طالب جديد إذا لم يكن موجود
        student = new Student({
          userId,
          name: req.user?.name || 'طالب',
          email: req.user?.email || '',
          courses: []
        });
      }

      // البحث عن الكورس في قائمة كورسات الطالب
      const courseIndex = student.courses.findIndex(
        (course: any) => course.courseId.toString() === courseId
      );

      if (courseIndex === -1) {
        // إضافة الكورس إذا لم يكن موجود
        student.courses.push({
          courseId: new mongoose.Types.ObjectId(courseId),
          enrolledAt: new Date(),
          progress: 0,
          completedLessons: action === 'complete' ? [videoId] : [],
          lastAccessed: new Date(),
          lastWatchedVideo: videoId,
          totalWatchTime: 0
        } as any);
      } else {
        // تحديث الكورس الموجود
        const course = student.courses[courseIndex] as any;
        
        if (action === 'complete' && !course.completedLessons.includes(videoId)) {
          course.completedLessons.push(videoId);
        }
        
        course.lastWatchedVideo = videoId;
        course.lastAccessed = new Date();
        
        // حساب نسبة التقدم
        if (course.totalLessons > 0) {
          course.progress = Math.round((course.completedLessons.length / course.totalLessons) * 100);
        }
      }

      await student.save();
      
      res.json({ success: true, message: 'تم تحديث التقدم بنجاح' });
    } catch (error) {
      console.error('Error updating student progress:', error);
      res.status(500).json({ message: 'حدث خطأ في تحديث التقدم' });
    }
  }
);

// الحصول على جميع الطلاب
router.get('/', requireAuth, isAdmin, async (req: Request, res: Response) => {
  try {
    console.log('Fetching students - User:', req.user?.email, 'Role:', req.user?.role);
    
    const students = await Student.find()
      .select('name email phone createdAt')
      .limit(100)
      .lean();
    
    console.log(`Found ${students.length} students`);
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'حدث خطأ في جلب بيانات الطلاب', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// الحصول على طالب محدد
router.get('/:id',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      // التحقق من أن الطالب يطلب بياناته أو أن المستخدم مشرف
      if (req.user?.id !== req.params.id && req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'غير مصرح لك بالوصول' });
      }

      const student = await Student.findById(req.params.id)
        .populate('courses.courseId', 'title description price teacher');
      
      if (!student) {
        return res.status(404).json({ message: 'الطالب غير موجود' });
      }
      
      res.json(student);
    } catch (error) {
      res.status(500).json({ message: 'حدث خطأ في جلب بيانات الطالب' });
    }
  }
);

// إضافة طالب جديد
router.post('/',
  [
    body('name').trim().notEmpty().withMessage('الاسم مطلوب'),
    body('email').isEmail().withMessage('البريد الإلكتروني غير صالح'),
    body('phone').trim().notEmpty().withMessage('رقم الهاتف مطلوب'),
    body('parentPhone').trim().notEmpty().withMessage('رقم هاتف ولي الأمر مطلوب'),
    body('grade').trim().notEmpty().withMessage('الصف الدراسي مطلوب')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const student = new Student(req.body);
      await student.save();
      res.status(201).json(student);
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'البريد الإلكتروني أو رقم الهاتف مستخدم بالفعل' });
      }
      res.status(500).json({ message: 'حدث خطأ في إضافة الطالب' });
    }
  }
);

// تحديث بيانات طالب
router.put('/:id',
  requireAuth,
  [
    param('id').isMongoId().withMessage('معرف الطالب غير صالح'),
    body('name').optional().trim().notEmpty().withMessage('الاسم مطلوب'),
    body('email').optional().isEmail().withMessage('البريد الإلكتروني غير صالح'),
    body('phone').optional().trim().notEmpty().withMessage('رقم الهاتف مطلوب'),
    body('parentPhone').optional().trim().notEmpty().withMessage('رقم هاتف ولي الأمر مطلوب'),
    body('grade').optional().trim().notEmpty().withMessage('الصف الدراسي مطلوب')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      // التحقق من أن الطالب يحدث بياناته أو أن المستخدم مشرف
      if (req.user?.id !== req.params.id && req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'غير مصرح لك بالوصول' });
      }

      const student = await Student.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );
      
      if (!student) {
        return res.status(404).json({ message: 'الطالب غير موجود' });
      }
      
      res.json(student);
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'البريد الإلكتروني أو رقم الهاتف مستخدم بالفعل' });
      }
      res.status(500).json({ message: 'حدث خطأ في تحديث بيانات الطالب' });
    }
  }
);

// حذف طالب (للمشرف فقط)
router.delete('/:id',
  requireAuth,
  isAdmin,
  [
    param('id').isMongoId().withMessage('معرف الطالب غير صالح')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const student = await Student.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );
      
      if (!student) {
        return res.status(404).json({ message: 'الطالب غير موجود' });
      }
      
      res.json({ message: 'تم حذف الطالب بنجاح' });
    } catch (error) {
      res.status(500).json({ message: 'حدث خطأ في حذف الطالب' });
    }
  }
);

// تحديث تقدم الطالب في كورس
router.put('/:id/courses/:courseId/progress',
  requireAuth,
  [
    param('id').isMongoId().withMessage('معرف الطالب غير صالح'),
    param('courseId').isMongoId().withMessage('معرف الكورس غير صالح'),
    body('progress').isInt({ min: 0, max: 100 }).withMessage('التقدم يجب أن يكون بين 0 و 100'),
    body('completedLessons').optional().isArray().withMessage('الدروس المكتملة يجب أن تكون مصفوفة')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      // التحقق من أن الطالب يحدث تقدمه أو أن المستخدم مشرف
      if (req.user?.id !== req.params.id && req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'غير مصرح لك بالوصول' });
      }

      const student = await Student.findById(req.params.id);
      
      if (!student) {
        return res.status(404).json({ message: 'الطالب غير موجود' });
      }

      const courseIndex = student.courses.findIndex(
        (course: { courseId: mongoose.Types.ObjectId }) => course.courseId.toString() === req.params.courseId
      );

      if (courseIndex === -1) {
        return res.status(404).json({ message: 'الطالب غير مسجل في هذا الكورس' });
      }

      student.courses[courseIndex].progress = req.body.progress;
      if (req.body.completedLessons) {
        student.courses[courseIndex].completedLessons = req.body.completedLessons;
      }
      student.courses[courseIndex].lastAccessed = new Date();

      await student.save();
      
      res.json(student.courses[courseIndex]);
    } catch (error) {
      res.status(500).json({ message: 'حدث خطأ في تحديث تقدم الطالب' });
    }
  }
);

export default router; 