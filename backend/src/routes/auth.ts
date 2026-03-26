import express, { Request, Response } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// أنواع multer
interface MulterRequest extends Request {
  file: Express.Multer.File;
}

// إعداد تخزين الملفات
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/ids');
    
    // التأكد من وجود المجلد
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // استخدام معرف المستخدم + تاريخ الرفع + امتداد الملف الأصلي
    const userId = req.body.userId || 'unknown';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, `user-${userId}-${uniqueSuffix}${fileExt}`);
  }
});

// التحقق من نوع الملف
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // السماح فقط بملفات الصور و PDF
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير مدعوم، يرجى رفع صورة أو ملف PDF فقط'));
  }
};

// إعداد ميدلوير آبلود
const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 ميجابايت كحد أقصى
  }
});

// مسارات المصادقة
router.post('/register', register);
router.post('/login', (req, res, next) => {
  console.log('\n[AUTH ROUTE] Login request received!');
  console.log('[AUTH ROUTE] Body:', req.body);
  next();
}, login);
router.get('/me', authMiddleware, getMe);

// رفع صورة الهوية
router.post('/upload-id', upload.single('idCard'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'لم يتم العثور على الملف' });
    }
    
    const filePath = req.file.path.replace(/\\/g, '/'); // تنسيق المسار
    const userId = req.body.userId;
    
    if (!userId) {
      return res.status(400).json({ message: 'معرف المستخدم مطلوب' });
    }
    
    // يمكن هنا حفظ مسار الملف في قاعدة البيانات إذا لزم الأمر
    
    res.status(200).json({ 
      message: 'تم رفع الملف بنجاح',
      filePath: filePath.replace('../../uploads', '/uploads'),
      originalname: req.file.originalname
    });
  } catch (error) {
    console.error('خطأ في رفع الملف:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء رفع الملف' });
  }
});

export default router; 