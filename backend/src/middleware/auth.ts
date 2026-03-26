import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

// User payload from JWT
interface UserPayload {
  id: string;
  userId?: string;
  email: string;
  role: string;
}

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      currentUser?: UserPayload;
      userId?: string;
      userRole?: string;
    }
  }
}

// Main authentication middleware - unified
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    let token: string | undefined;
    if (req.headers.authorization) {
      // ✅ استخراج Token بشكل صحيح
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // إزالة "Bearer " (7 حروف)
      } else {
        token = authHeader.split(' ')[1] || authHeader; // تعامل مع الصيغ المختلفة
      }
    }

    if (!token) {
      console.log('❌ لا يوجد Token في الطلب');
      return res.status(401).json({ message: 'غير مصرح لك بالدخول - الرجاء تسجيل الدخول' });
    }
    
    console.log('✅ Token موجود:', token.substring(0, 20) + '...');

    // Verify token
    console.log('🔐 JWT_SECRET:', process.env.JWT_SECRET ? '✅ موجود' : '❌ مفقود');
    console.log('🔐 JWT_KEY:', process.env.JWT_KEY ? '✅ موجود' : '❌ مفقود');
    
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || process.env.JWT_KEY || 'your-secret-key'
    ) as UserPayload;
    
    console.log('✅ Token decoded:', decoded);
    
    // Find user
    const userId = decoded.id || decoded.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('❌ المستخدم غير موجود:', userId);
      return res.status(401).json({ message: 'المستخدم غير موجود' });
    }
    
    console.log('✅ المستخدم:', user.email, 'Role:', user.role);
    
    // Add user info to request in multiple formats for compatibility
    req.user = user;
    req.currentUser = {
      id: user._id.toString(),
      email: user.email || '',
      role: user.role
    };
    req.userId = user._id.toString();
    req.userRole = user.role;
    
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(401).json({ message: 'جلسة منتهية، يرجى تسجيل الدخول مرة أخرى' });
  }
};

// Alias for compatibility
export const requireAuth = authMiddleware;
export const authenticateUser = authMiddleware;

// Admin authorization middleware
export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('🔍 Admin Check - User:', req.user?.email, 'Role:', req.user?.role);
    
    if (!req.user || req.user.role !== 'admin') {
      console.log('❌ ليس Admin - الدخول مرفوض');
      return res.status(403).json({ message: 'غير مصرح. للمشرفين فقط.' });
    }
    
    console.log('✅ Admin مصرح له');
    next();
  } catch (error) {
    console.error('❌ Admin Auth Error:', error);
    return res.status(500).json({ message: 'خطأ في التحقق من الصلاحيات' });
  }
};

// Alias for compatibility
export const isAdmin = adminAuth;
export const authorizeAdmin = adminAuth;
export const requireAdmin = adminAuth;

// Teacher authorization middleware
export const teacherAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== 'teacher' && req.user.role !== 'admin')) {
    return res.status(403).json({ message: 'غير مصرح لك بالوصول لهذه الصفحة' });
  }
  next();
};

// Alias for compatibility
export const authorizeTeacher = teacherAuth;

// Own data authorization middleware
export const authorizeOwn = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.params.userId || req.params.id;
  
  if (req.userId !== userId && req.userRole !== 'admin') {
    return res.status(403).json({ message: 'غير مصرح لك بالوصول لهذه البيانات' });
  }
  
  next();
};