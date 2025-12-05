import express, { Request, Response } from 'express';
const { body, param } = require('express-validator');
import { Teacher } from '../models/Teacher';
import { validateRequest } from '../middleware/validate-request';
import { requireAuth, isAdmin } from '../middleware/auth';
import mongoose from 'mongoose';

const router = express.Router();

// الحصول على جميع المدرسين
router.get('/', async (req: Request, res: Response) => {
  try {
    const teachers = await Teacher.find()
      .select('name email phone specialization createdAt')
      .limit(100)
      .lean();
    res.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'حدث خطأ في جلب بيانات المدرسين' });
  }
});

// الحصول على مدرس محدد
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate('courses', 'title description price')
      .populate('ratings.studentId', 'name');
    
    if (!teacher) {
      return res.status(404).json({ message: 'المدرس غير موجود' });
    }
    
    res.json(teacher);
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ في جلب بيانات المدرس' });
  }
});

// إضافة مدرس جديد (للمشرف فقط)
router.post('/',
  requireAuth,
  isAdmin,
  [
    body('name').trim().notEmpty().withMessage('الاسم مطلوب'),
    body('email').isEmail().withMessage('البريد الإلكتروني غير صالح'),
    body('phone').trim().notEmpty().withMessage('رقم الهاتف مطلوب'),
    body('specialization').trim().notEmpty().withMessage('التخصص مطلوب'),
    body('qualifications').isArray().withMessage('المؤهلات يجب أن تكون مصفوفة'),
    body('experience').isNumeric().withMessage('الخبرة يجب أن تكون رقماً')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const teacher = new Teacher(req.body);
      await teacher.save();
      res.status(201).json(teacher);
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'البريد الإلكتروني أو رقم الهاتف مستخدم بالفعل' });
      }
      res.status(500).json({ message: 'حدث خطأ في إضافة المدرس' });
    }
  }
);

// تحديث بيانات مدرس (للمشرف فقط)
router.put('/:id',
  requireAuth,
  isAdmin,
  [
    param('id').isMongoId().withMessage('معرف المدرس غير صالح'),
    body('name').optional().trim().notEmpty().withMessage('الاسم مطلوب'),
    body('email').optional().isEmail().withMessage('البريد الإلكتروني غير صالح'),
    body('phone').optional().trim().notEmpty().withMessage('رقم الهاتف مطلوب'),
    body('specialization').optional().trim().notEmpty().withMessage('التخصص مطلوب'),
    body('qualifications').optional().isArray().withMessage('المؤهلات يجب أن تكون مصفوفة'),
    body('experience').optional().isNumeric().withMessage('الخبرة يجب أن تكون رقماً')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const teacher = await Teacher.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );
      
      if (!teacher) {
        return res.status(404).json({ message: 'المدرس غير موجود' });
      }
      
      res.json(teacher);
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'البريد الإلكتروني أو رقم الهاتف مستخدم بالفعل' });
      }
      res.status(500).json({ message: 'حدث خطأ في تحديث بيانات المدرس' });
    }
  }
);

// حذف مدرس (للمشرف فقط)
router.delete('/:id',
  requireAuth,
  isAdmin,
  [
    param('id').isMongoId().withMessage('معرف المدرس غير صالح')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const teacher = await Teacher.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );
      
      if (!teacher) {
        return res.status(404).json({ message: 'المدرس غير موجود' });
      }
      
      res.json({ message: 'تم حذف المدرس بنجاح' });
    } catch (error) {
      res.status(500).json({ message: 'حدث خطأ في حذف المدرس' });
    }
  }
);

// إضافة تقييم للمدرس
router.post('/:id/rate',
  requireAuth,
  [
    param('id').isMongoId().withMessage('معرف المدرس غير صالح'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('التقييم يجب أن يكون بين 1 و 5'),
    body('comment').optional().trim().notEmpty().withMessage('التعليق مطلوب')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const teacher = await Teacher.findById(req.params.id);
      
      if (!teacher) {
        return res.status(404).json({ message: 'المدرس غير موجود' });
      }
      
      const rating = {
        rating: req.body.rating,
        comment: req.body.comment,
        studentId: new mongoose.Types.ObjectId(req.currentUser!.id),
        date: new Date()
      };
      
      teacher.ratings.push(rating);
      await teacher.save();
      
      res.status(201).json(rating);
    } catch (error) {
      res.status(500).json({ message: 'حدث خطأ في إضافة التقييم' });
    }
  }
);

export default router; 