import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Create uploads directories if they don't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
const coursesDir = path.join(uploadsDir, 'courses');
const thumbnailsDir = path.join(coursesDir, 'thumbnails');
const videosDir = path.join(coursesDir, 'videos');

[uploadsDir, coursesDir, thumbnailsDir, videosDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for different file types
const createStorage = (destination: string) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
  });
};

// File filters
const imageFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('فقط ملفات الصور مسموح بها (JPEG, PNG, GIF, WebP)'));
  }
};

const videoFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('فقط ملفات الفيديو مسموح بها (MP4, MPEG, MOV, AVI)'));
  }
};

// Multer configurations
const uploadThumbnail = multer({
  storage: createStorage(thumbnailsDir),
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

const uploadVideo = multer({
  storage: createStorage(videosDir),
  fileFilter: videoFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB
  }
});

// Upload thumbnail
router.post('/thumbnail', requireAuth, uploadThumbnail.single('thumbnail'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'لم يتم رفع أي ملف' });
    }

    const fileUrl = `/uploads/courses/thumbnails/${req.file.filename}`;
    
    console.log('[UPLOAD] Thumbnail uploaded:', fileUrl);
    
    res.status(200).json({
      message: 'تم رفع الصورة بنجاح',
      url: fileUrl,
      filename: req.file.filename
    });
  } catch (error: any) {
    console.error('[UPLOAD ERROR]', error);
    res.status(500).json({ message: 'خطأ في رفع الصورة', error: error.message });
  }
});

// Upload video
router.post('/video', requireAuth, uploadVideo.single('video'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'لم يتم رفع أي ملف' });
    }

    const fileUrl = `/uploads/courses/videos/${req.file.filename}`;
    
    console.log('[UPLOAD] Video uploaded:', fileUrl);
    
    res.status(200).json({
      message: 'تم رفع الفيديو بنجاح',
      url: fileUrl,
      filename: req.file.filename
    });
  } catch (error: any) {
    console.error('[UPLOAD ERROR]', error);
    res.status(500).json({ message: 'خطأ في رفع الفيديو', error: error.message });
  }
});

// Delete file
router.delete('/file', requireAuth, async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ message: 'URL مطلوب' });
    }

    // Extract filename from URL
    const filename = path.basename(url);
    const fileDir = url.includes('thumbnails') ? thumbnailsDir : videosDir;
    const filePath = path.join(fileDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('[DELETE] File deleted:', filePath);
      res.status(200).json({ message: 'تم حذف الملف بنجاح' });
    } else {
      res.status(404).json({ message: 'الملف غير موجود' });
    }
  } catch (error: any) {
    console.error('[DELETE ERROR]', error);
    res.status(500).json({ message: 'خطأ في حذف الملف', error: error.message });
  }
});

export default router;
