import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  app: {
    name: 'EduFutura API',
    version: '1.0.0',
    baseUrl: process.env.BASE_URL || 'http://localhost:5000',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    secretKey: process.env.SECRET_KEY || 'EduFutura-Secret-Key-12345',
    corsOrigins: process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',') 
      : ['http://localhost:3000', 'https://edufutura.com'],
  },
  server: {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/edufutura',
    options: {
      autoIndex: process.env.NODE_ENV !== 'production',
      maxPoolSize: 100,
      minPoolSize: 5,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      serverSelectionTimeoutMS: 30000,
    }
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'EduFutura-JWT-Secret-987654321',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'EduFutura-Refresh-Token-Secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_stripe_webhook_secret',
    currency: process.env.STRIPE_CURRENCY || 'egp',
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-email-password',
    from: process.env.EMAIL_FROM || 'EduFutura <noreply@edufutura.com>',
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    bucketName: process.env.AWS_BUCKET_NAME || 'edufutura-uploads',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: parseInt(process.env.REDIS_TTL || '300', 10), // 5 minutes cache by default
  },
  uploads: {
    storageType: process.env.UPLOAD_STORAGE_TYPE || 'local', // 'local' or 's3'
    idDocsPath: path.join(process.cwd(), 'uploads/ids'),
    profilesPath: path.join(process.cwd(), 'uploads/profiles'),
    coursesPath: path.join(process.cwd(), 'uploads/courses'),
    booksPath: path.join(process.cwd(), 'uploads/books'),
    maxSize: parseInt(process.env.MAX_UPLOAD_SIZE || '10485760', 10), // 10MB default
  },
  admin: {
    defaultUsername: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
    defaultPassword: process.env.DEFAULT_ADMIN_PASSWORD || 'مستر معتصم01062',
  }
}; 