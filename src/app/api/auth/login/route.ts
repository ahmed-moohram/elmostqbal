import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { compare } from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { userLoginSchema, validateRequest } from '@/lib/validation';

// Supabase Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('❌ Missing Supabase configuration! Check your .env.local file');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// مفتاح التشفير - يجب تخزينه في متغيرات البيئة في الإنتاج
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_replace_in_production';

// مدة صلاحية التوكن (7 أيام)
const TOKEN_EXPIRY = 60 * 60 * 24 * 7;

// واجهة API لتسجيل الدخول
export async function POST(request: NextRequest) {
  try {
    // Validate request body using Zod
    const validation = await validateRequest(request, userLoginSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { email, password } = validation.data;

    // البحث عن المستخدم في قاعدة البيانات
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    // التحقق من وجود المستخدم
    if (userError || !user) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await compare(password, user.password_hash);

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
        avatar: user.avatar_url,
        phone: user.phone || user.student_phone,
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
