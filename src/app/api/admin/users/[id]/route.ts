import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// لا نستخدم throw هنا لتجنب كسر الـ module على Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ success: false, error: 'Missing user id' }, { status: 400 });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase service role key in environment variables');
    return NextResponse.json(
      { success: false, error: 'Server configuration error - missing SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const warnings: { source: string; message: string }[] = [];

  try {
    // 1. حذف بيانات المدرس المرتبطة أولاً (قبل حذف المستخدم لتجنب FK violations)

    // حذف الكورسات المرتبطة بالمدرس
    const { error: coursesError } = await supabaseAdmin
      .from('courses')
      .delete()
      .eq('instructor_id', id);
    if (coursesError) {
      console.warn('⚠️ خطأ في حذف كورسات المدرس:', coursesError.message);
      warnings.push({ source: 'courses', message: coursesError.message });
    }

    // حذف ملف المدرس من جدول teachers
    const { error: teacherError } = await supabaseAdmin
      .from('teachers')
      .delete()
      .eq('user_id', id);
    if (teacherError) {
      console.warn('⚠️ خطأ في حذف بيانات المدرس:', teacherError.message);
      warnings.push({ source: 'teachers', message: teacherError.message });
    }

    // حذف التسجيلات المرتبطة بالمستخدم
    const { error: enrollmentsError } = await supabaseAdmin
      .from('enrollments')
      .delete()
      .eq('user_id', id);
    if (enrollmentsError) {
      console.warn('⚠️ خطأ في حذف تسجيلات المستخدم:', enrollmentsError.message);
      warnings.push({ source: 'enrollments', message: enrollmentsError.message });
    }

    // حذف طلبات الدفع المرتبطة
    const { error: paymentsError } = await supabaseAdmin
      .from('payment_requests')
      .delete()
      .eq('user_id', id);
    if (paymentsError) {
      // ليست خطأ فادح - الجدول قد لا يوجد
      console.warn('⚠️ خطأ في حذف طلبات الدفع (غير فادح):', paymentsError.message);
    }

    // 2. حذف المستخدم من جدول users
    const { error: usersError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (usersError) {
      console.error('❌ فشل حذف المستخدم من جدول users:', usersError.message);
      return NextResponse.json(
        {
          success: false,
          error: `فشل حذف المستخدم: ${usersError.message}`,
          warnings,
        },
        { status: 500 }
      );
    }

    // 3. حذف من Supabase Auth (غير إلزامي - قد لا يكون المدرس في auth)
    try {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (authError && !authError.message.toLowerCase().includes('not found')) {
        console.warn('⚠️ تحذير في حذف مستخدم Auth:', authError.message);
        warnings.push({ source: 'auth', message: authError.message });
      }
    } catch (authEx: any) {
      // تجاهل أخطاء auth - المهم أن المستخدم حُذف من users
      console.warn('⚠️ استثناء في حذف Auth (غير فادح):', authEx?.message);
    }

    console.log(`✅ تم حذف المدرس ${id} بنجاح`);
    return NextResponse.json(
      {
        success: true,
        warnings: warnings.length ? warnings : undefined,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error('Unexpected error in DELETE /api/admin/users/[id]:', e);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: e?.message },
      { status: 500 }
    );
  }
}
