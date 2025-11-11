import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

interface AuthRequest extends Request {
  user?: IUser;
}

const generateToken = (userId: string) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

export const register = async (req: Request, res: Response) => {
  try {
    console.log('Received registration request:', req.body);
    const { name, fatherName, studentPhone, parentPhone, password } = req.body;

    if (!name || !fatherName || !studentPhone || !parentPhone || !password) {
      console.log('Missing required fields:', { name, fatherName, studentPhone, parentPhone, password: !!password });
      return res.status(400).json({ 
        message: 'جميع الحقول مطلوبة',
        missingFields: {
          name: !name,
          fatherName: !fatherName,
          studentPhone: !studentPhone,
          parentPhone: !parentPhone,
          password: !password
        }
      });
    }

    const phoneRegex = /^0\d{10}$/;
    if (!phoneRegex.test(studentPhone) || !phoneRegex.test(parentPhone)) {
      return res.status(400).json({ 
        message: 'رقم الهاتف يجب أن يبدأ بـ 0 ويكون 11 رقمًا',
        invalidPhones: {
          studentPhone: !phoneRegex.test(studentPhone),
          parentPhone: !phoneRegex.test(parentPhone)
        }
      });
    }

    if (studentPhone === parentPhone) {
      return res.status(400).json({ 
        message: 'رقم ولي الأمر يجب أن يكون مختلفًا عن رقم الطالب',
        studentPhone,
        parentPhone
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        passwordLength: password.length
      });
    }

    const existingUser = await User.findOne({ studentPhone });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'رقم الهاتف مسجل بالفعل',
        studentPhone
      });
    }

    const user = new User({
      name,
      fatherName,
      studentPhone,
      parentPhone,
      password
    });

    await user.save();

    const token = generateToken(user._id.toString());

    res.status(201).json({
      message: 'تم التسجيل بنجاح',
      token,
      user: {
        id: user._id,
        name: user.name,
        studentPhone: user.studentPhone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'حدث خطأ في التسجيل',
      error: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    console.log('\n[LOGIN] START');
    console.log('[REQUEST BODY]', req.body);
    
    const { studentPhone, password } = req.body;
    if (!studentPhone || !password) {
      console.log('[ERROR] Missing fields');
      return res.status(400).json({ 
        message: 'رقم الهاتف وكلمة المرور مطلوبان',
        missingFields: {
          studentPhone: !studentPhone,
          password: !password
        }
      });
    }

    console.log('[PHONE]', studentPhone);
    console.log('[PASSWORD LENGTH]', password.length);
    
    // Validate phone format (must start with 0 and be 11 digits) - allow "admin" as special case
    const phoneRegex = /^0\d{10}$/;
    if (studentPhone !== 'admin' && !phoneRegex.test(studentPhone)) {
      console.log('[ERROR] Invalid phone format');
      return res.status(400).json({ 
        message: 'رقم الهاتف يجب أن يبدأ بـ 0 ويكون 11 رقمًا',
        studentPhone
      });
    }
    
    console.log('[SEARCHING] User with phone:', studentPhone);
    const user = await User.findOne({ studentPhone });
    console.log('[FOUND]', user ? `Yes - ${user.email} (${user.role})` : 'No');
    
    if (!user) {
      // البحث في قاعدة البيانات مباشرة للتأكد
      const allUsers = await User.find({}).limit(5);
      console.log('[DB CHECK] Total users:', allUsers.length);
      console.log('[DB CHECK] Available phones:', allUsers.map(u => u.studentPhone));
      
      return res.status(401).json({ 
        message: 'رقم الهاتف أو كلمة المرور غير صحيحة',
        error: 'user_not_found'
      });
    }

    console.log('[COMPARING] Password...');
    const isMatch = await user.comparePassword(password);
    console.log('[PASSWORD MATCH]', isMatch ? 'YES' : 'NO');
    
    if (!isMatch) {
      return res.status(401).json({ 
        message: 'رقم الهاتف أو كلمة المرور غير صحيحة',
        error: 'invalid_password'
      });
    }

    console.log('[GENERATING] Token...');
    const token = generateToken(user._id.toString());
    console.log('[SUCCESS] Login complete');
    console.log('[LOGIN] END\n');

    res.json({
      message: 'تم تسجيل الدخول بنجاح',
      token,
      user: {
        id: user._id,
        name: user.name,
        studentPhone: user.studentPhone,
        role: user.role,
        email: user.email
      }
    });
  } catch (error) {
    console.error('[ERROR] Login error:', error);
    res.status(500).json({ 
      message: 'حدث خطأ في تسجيل الدخول',
      error: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'غير مصرح',
        error: 'no_user'
      });
    }

    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        message: 'المستخدم غير موجود',
        error: 'user_not_found'
      });
    }
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      message: 'حدث خطأ في جلب بيانات المستخدم',
      error: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
}; 