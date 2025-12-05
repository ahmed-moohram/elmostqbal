import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import compression from 'compression';
import cluster from 'cluster';
import os from 'os';
import authRoutes from './routes/auth';
import courseRoutes from './routes/courses';
import teacherRoutes from './routes/teacher.routes';
import studentRoutes from './routes/student.routes';
import booksRoutes from './routes/books';
import messageRoutes from './routes/messages';
import userRoutes from './routes/users';
import ratingRoutes from './routes/ratings';
import assignmentRoutes from './routes/assignments';
import certificateRoutes from './routes/certificates';
import questionRoutes from './routes/questions';
import liveSessionRoutes from './routes/liveSessions';
import adminRoutes from './routes/admin.routes';
import paymentRoutes from './routes/payments';
import orderRoutes from './routes/orders';
import couponRoutes from './routes/coupons';
import reportRoutes from './routes/reports';
import sectionRoutes from './routes/sections';
import deviceRoutes from './routes/devices';
import courseExtrasRoutes from './routes/courseExtras';
import teacherExtrasRoutes from './routes/teacherExtras';
import uploadRoutes from './routes/upload.routes';
import { createClient, RedisClientType } from 'redis';
import responseTime from 'response-time';
import { connectDB } from './db/init-db';
import path from 'path';

// Load environment variables
dotenv.config();

// تشغيل العديد من نسخ التطبيق باستخدام نظام Cluster للاستفادة من جميع المعالجات
const numCPUs = os.cpus().length;

// تعطيل Clustering في التطوير لتسهيل الـ debugging
const USE_CLUSTERING = process.env.USE_CLUSTERING === 'true';

if (USE_CLUSTERING && cluster.isPrimary) {
  console.log(`Master process ${process.pid} is running`);

  // Fork workers for each CPU
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    // Restart worker if it dies
    cluster.fork();
  });
} else {
  // This is a worker process OR single process mode
  if (!USE_CLUSTERING) {
    console.log(`🚀 Running in single process mode (PID: ${process.pid})`);
  } else {
    console.log(`Worker ${process.pid} started`);
  }

  // Redis client للكاش
  let redisClient: RedisClientType | null = null;
  let redisAvailable = false;
  
  // تعطيل Redis مؤقتاً - يمكن تفعيله لاحقاً
  (async () => {
    try {
      // تخطي Redis إذا لم يكن مفعل في البيئة
      if (process.env.ENABLE_REDIS === 'true') {
        redisClient = createClient({
          url: process.env.REDIS_URL || 'redis://localhost:6379',
          socket: {
            connectTimeout: 5000 // timeout بعد 5 ثواني
          }
        });
        
        await redisClient.connect();
        redisAvailable = true;
        console.log('✅ Connected to Redis');
      } else {
        console.log('⚠️  Redis disabled - caching will be disabled');
      }
    } catch (err) {
      console.error('❌ Redis connection error:', err);
      console.log('⚠️  Continuing without Redis - caching will be disabled');
      redisClient = null;
      // التطبيق يعمل حتى إذا فشل الاتصال بـRedis
    }
  })();

  // Create Express app
  const app = express();

  // قياس وقت الاستجابة
  app.use(responseTime());

  // Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('[BODY]', JSON.stringify(req.body));
    }
    next();
  });
  
  // Static files - Serve uploads folder
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  console.log('📁 Static files served from:', path.join(process.cwd(), 'uploads'));
  
  // CORS - دعم مرن لجميع ports أثناء التطوير
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    process.env.FRONTEND_URL
  ].filter(Boolean);
  
  app.use(cors({
    origin: (origin, callback) => {
      // السماح بالطلبات بدون origin (مثل Postman)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  // تفعيل الضغط لتقليل حجم البيانات المرسلة
  app.use(compression({
    level: 6, // مستوى ضغط عالي
    threshold: 0 // ضغط جميع الاستجابات بغض النظر عن حجمها
  }));
  
  // تحسينات الأمان
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
  
  if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
  }

  // Rate limiting - حماية من الهجمات
  // في وضع التطوير، نستخدم حد أعلى
  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // دقيقة واحدة
    max: process.env.NODE_ENV === 'production' ? 100 : 10000, // 10000 طلب في التطوير، 100 في الإنتاج
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'عدد كبير جداً من الطلبات، يرجى المحاولة مرة أخرى لاحقًا' },
    skip: (req) => {
      // تخطي rate limiting للـ health check
      return req.path === '/api/health-check';
    }
  });
  
  // تطبيق rate limiting فقط في الإنتاج أو على routes محددة
  if (process.env.NODE_ENV === 'production') {
    app.use(limiter);
  } else {
    console.log('⚠️ Rate limiting disabled in development mode');
  }

  // Middleware للكاش
  const cacheMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('🔍 Cache Middleware:', req.method, req.originalUrl);
      
      if (!redisClient || req.method !== 'GET') {
        console.log('⏭️ Skipping cache (no redis or not GET)');
        return next();
      }
      
      const key = `cache:${req.originalUrl}`;
      const cached = await redisClient.get(key);
      
      if (cached) {
        console.log(`✅ Cache hit for ${req.originalUrl}`);
        return res.json(JSON.parse(cached));
      }
      
      console.log(`❌ Cache miss for ${req.originalUrl}`);
      
      // استمر للـ next middleware إذا لم يكن موجود في الكاش
      if (!cached) {
        next();
        return;
      }
      
      // تخزين الاستجابة الأصلية لتعديلها
      const originalSend = res.json;
      res.json = function(data: any) {
        // تخزين في الكاش قبل الإرسال
        redisClient?.setEx(key, 300, JSON.stringify(data)).catch(() => {}); // كاش لمدة 5 دقائق
        return originalSend.call(this, data);
      };
      
      next();
    } catch (err) {
      console.error('❌ Cache middleware error:', err);
      next(); // استمر إذا حدث خطأ مع Redis
    }
  };

  // استخدام الكاش للمسارات العامة
  app.use('/api/courses', cacheMiddleware);
  app.use('/api/books', cacheMiddleware);

  // Add health check route
  app.use('/api/health-check', async (req: Request, res: Response) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      mongodb: dbStatus,
      redis: redisClient ? 'connected' : 'disabled',
      server: {
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
      }
    });
  });

  // Routes - ترتيب مهم: الـ specific routes قبل الـ dynamic routes
  app.use('/api/auth', authRoutes);
  app.use('/api/upload', uploadRoutes);
  
  // Course routes - courseExtrasRoutes يجب أن يكون قبل courseRoutes
  app.use('/api/courses', courseExtrasRoutes);
  app.use('/api/courses', courseRoutes);
  
  // Teacher routes
  app.use('/api/teachers', teacherExtrasRoutes);
  app.use('/api/teachers', teacherRoutes);
  
  // Other routes
  app.use('/api/students', studentRoutes);
  app.use('/api/books', booksRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/ratings', ratingRoutes);
  app.use('/api/assignments', assignmentRoutes);
  app.use('/api/certificates', certificateRoutes);
  app.use('/api/questions', questionRoutes);
  app.use('/api/live-sessions', liveSessionRoutes);
  
  // Admin routes
  app.use('/api/admin', adminRoutes);
  app.use('/api/admin/payments', paymentRoutes);
  app.use('/api/admin/orders', orderRoutes);
  app.use('/api/admin/reports', reportRoutes);
  app.use('/api/admin/devices', deviceRoutes);
  
  // Other routes
  app.use('/api/coupons', couponRoutes);
  app.use('/api/sections', sectionRoutes);

  // Connect to database and initialize with admin account
  connectDB()
    .then(() => {
      // تسريع الاستجابات الشائعة
      app.get('/', (req: Request, res: Response) => {
        res.set('Cache-Control', 'public, max-age=300');
        res.json({ message: 'Welcome to EduFutura API' });
      });

      // Health check endpoint
      app.get('/health', (req: Request, res: Response) => {
        res.status(200).json({ status: 'ok', time: new Date() });
      });

      // Error handling middleware
      app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        console.error(err.stack);
        res.status(500).json({
          message: 'Something went wrong!',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      });

      // Start server
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`API available at http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error('Failed to start server due to database connection error:', error);
      process.exit(1);
    });
} 