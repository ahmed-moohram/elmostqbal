import express, { Request, Response } from 'express';
const { body } = require('express-validator');
import Course from '../models/Course';
import { validateRequest } from '../middleware/validate-request';
import { requireAuth, isAdmin } from '../middleware/auth';
import mongoose from 'mongoose';
import * as courseController from '../controllers/courseController';

const router = express.Router();

// الحصول على جميع الكورسات
router.get('/', courseController.getCourses);

// الحصول على كورس محدد
router.get('/:id', async (req: Request, res: Response) => {
  try {
    // استخدام آلية الكاش في المخدم
    const cacheKey = `course:${req.params.id}`;
    
    // استخدام lean لتقليل استهلاك الذاكرة وتحسين الأداء
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email phone role specialty')
      .lean()
      .maxTimeMS(2000);
    
    if (!course) {
      return res.status(404).json({ message: 'الكورس غير موجود' });
    }
    
    // Set cache control for browser caching
    res.set('Cache-Control', 'public, max-age=60'); // كاش لمدة دقيقة واحدة
    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ message: 'حدث خطأ في جلب بيانات الكورس' });
  }
});

// إضافة كورس جديد (للمشرف فقط)
router.post('/',
  requireAuth,
  isAdmin,
  courseController.createCourse
);

// تحديث بيانات كورس (للمشرف أو صاحب الدورة)
router.patch('/:id',
  requireAuth,
  (req, res, next) => {
    console.log('\n[PATCH ROUTE] Course update request');
    console.log('[PATCH ROUTE] User:', req.user?.email);
    console.log('[PATCH ROUTE] Role:', req.user?.role);
    console.log('[PATCH ROUTE] Course ID:', req.params.id);
    next();
  },
  courseController.updateCourse
);

// PUT route for backward compatibility
router.put('/:id',
  requireAuth,
  (req, res, next) => {
    console.log('\n[PUT ROUTE] Course update request');
    console.log('[PUT ROUTE] User:', req.user?.email);
    console.log('[PUT ROUTE] Role:', req.user?.role);
    console.log('[PUT ROUTE] Course ID:', req.params.id);
    next();
  },
  courseController.updateCourse
);

// حذف كورس (للمشرف أو صاحب الدورة)
router.delete('/:id',
  requireAuth,
  (req, res, next) => {
    console.log('\n[DELETE ROUTE] Course delete request');
    console.log('[DELETE ROUTE] User:', req.user?.email);
    console.log('[DELETE ROUTE] Role:', req.user?.role);
    console.log('[DELETE ROUTE] Course ID:', req.params.id);
    next();
  },
  courseController.deleteCourse
);

// إضافة تقييم للكورس
router.post('/:id/rate',
  requireAuth,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('التقييم يجب أن يكون بين 1 و 5'),
    body('comment').optional().trim().notEmpty().withMessage('التعليق مطلوب')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const course = await Course.findById(req.params.id);
      
      if (!course) {
        return res.status(404).json({ message: 'الكورس غير موجود' });
      }
      
      // إضافة التقييم حسب نموذج البيانات
      const ratingValue = req.body.rating;
      
      // تحديث متوسط التقييم الكلي للكورس فقط 
      // على فرض أن course.rating هو متوسط التقييمات، ويتم حفظه كرقم
      course.rating = ratingValue;
      await course.save();
      
      res.status(201).json({ 
        rating: ratingValue,
        comment: req.body.comment,
        studentId: req.currentUser!.id,
        date: new Date()
      });
    } catch (error) {
      res.status(500).json({ message: 'حدث خطأ في إضافة التقييم' });
    }
  }
);

// تسجيل طالب في كورس
router.post('/:id/enroll',
  requireAuth,
  [],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const course = await Course.findById(req.params.id);
      
      if (!course) {
        return res.status(404).json({ message: 'الكورس غير موجود' });
      }
      
      // التحقق من عدم تسجيل الطالب مسبقاً
      if (course.students.some(studentId => studentId.equals(req.currentUser!.id))) {
        return res.status(400).json({ message: 'أنت مسجل بالفعل في هذا الكورس' });
      }
      
      course.students.push(new mongoose.Types.ObjectId(req.currentUser!.id));
      await course.save();
      
      res.status(201).json({ message: 'تم تسجيلك في الكورس بنجاح' });
    } catch (error) {
      res.status(500).json({ message: 'حدث خطأ في تسجيل الكورس' });
    }
  }
);

export default router; 