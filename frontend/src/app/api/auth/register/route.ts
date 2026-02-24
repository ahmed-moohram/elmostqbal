import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { hash } from 'bcryptjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// التحقق من وجود المتغيرات
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('❌ Missing Supabase configuration! Check your .env.local file');
}

// إنشاء عميل Supabase مع Service Key للعمليات الإدارية
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// مفتاح التشفير - يجب تخزينه في متغيرات البيئة في الإنتاج
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_replace_in_production';

// مدة صلاحية التوكن (7 أيام)
const TOKEN_EXPIRY = 60 * 60 * 24 * 7;

// واجهة API للتسجيل
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      email, 
      password, 
      role = 'student',
      // بيانات إضافية للطلاب
      phone,
      studentPhone,
      parentPhone,
      motherPhone,
      schoolName,
      city,
      gradeLevel,
      guardianJob
    } = body;
    
    // التحقق من وجود البيانات المطلوبة
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'يرجى توفير الاسم والبريد الإلكتروني وكلمة المرور' },
        { status: 400 }
      );
    }
    
    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'يرجى توفير بريد إلكتروني صحيح' },
        { status: 400 }
      );
    }
    
    // التحقق من قوة كلمة المرور
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل' },
        { status: 400 }
      );
    }
    
    // التحقق من عدم وجود المستخدم بالفعل في Supabase
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 409 }
      );
    }
    
    // تشفير كلمة المرور
    const hashedPassword = await hash(password, 12);
    
    // إنشاء مستخدم جديد في Supabase
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        name,
        email,
        phone: phone || studentPhone,
        password_hash: hashedPassword,
        role: role as 'student' | 'teacher' | 'admin',
        avatar_url: `/avatars/${role}-default.png`,
        // بيانات إضافية للطلاب
        student_phone: studentPhone,
        parent_phone: parentPhone,
        mother_phone: motherPhone,
        school_name: schoolName,
        city: city,
        grade_level: gradeLevel,
        guardian_job: guardianJob,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('خطأ في إنشاء المستخدم:', insertError);
      return NextResponse.json(
        { error: 'حدث خطأ في إنشاء الحساب' },
        { status: 500 }
      );
    }
    
    // إنشاء JWT token
    const token = jwt.sign(
      {
        sub: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar
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
    const { password: _, ...userWithoutPassword } = newUser;
    
    return NextResponse.json({
      success: true,
      message: 'تم التسجيل بنجاح',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('خطأ في التسجيل:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التسجيل' },
      { status: 500 }
    );
  }
}
