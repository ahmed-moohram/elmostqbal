import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { compare } from 'bcryptjs';

// مفتاح التشفير - يجب تخزينه في متغيرات البيئة في الإنتاج
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_replace_in_production';

// مدة صلاحية التوكن (7 أيام)
const TOKEN_EXPIRY = 60 * 60 * 24 * 7;

// قاعدة بيانات مؤقتة للمستخدمين - في الإنتاج سيتم استبدالها بقاعدة بيانات حقيقية
const USERS = [
  {
    id: '1',
    name: 'أحمد محمد',
    email: 'admin@mustaqbal.edu',
    password: '$2a$12$xVEzhL5JCWO2Qv1UwNXPqeUY0YvyRvqYorKMcXCLASLZ0/G3KGafi', // "admin123"
    role: 'admin',
    avatar: '/avatars/admin.png'
  },
  {
    id: '2',
    name: 'محمد علي',
    email: 'teacher@mustaqbal.edu',
    password: '$2a$12$I7QLhMUJN3n.FCpDf/O0aOKn6yMq17zW7X7mkFJF2nISL9bBiHZGK', // "teacher123"
    role: 'teacher',
    avatar: '/avatars/teacher.png'
  },
  {
    id: '3',
    name: 'سارة أحمد',
    email: 'student@mustaqbal.edu',
    password: '$2a$12$QGX5hEuWc0JWjgCqWsJdFerOZEpCNNFQh/VJ6Zj0mSCdbpyPH.kYu', // "student123"
    role: 'student',
    avatar: '/avatars/student.png'
  }
];

// واجهة API لتسجيل الدخول
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    // التحقق من وجود البريد الإلكتروني وكلمة المرور
    if (!email || !password) {
      return NextResponse.json(
        { error: 'يرجى توفير البريد الإلكتروني وكلمة المرور' },
        { status: 400 }
      );
    }
    
    // البحث عن المستخدم في قاعدة البيانات
    const user = USERS.find(user => user.email === email);
    
    // التحقق من وجود المستخدم
    if (!user) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }
    
    // التحقق من كلمة المرور
    const isPasswordValid = await compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }
    
    // إنشاء JWT token
    const token = jwt.sign(
      {
        sub: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
    
    // تعيين الكوكيز
    const cookieStore = cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: TOKEN_EXPIRY,
      path: '/'
    });
    
    // إرجاع البيانات دون كلمة المرور
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل الدخول' },
      { status: 500 }
    );
  }
}
