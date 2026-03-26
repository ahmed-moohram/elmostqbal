import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration for /api/admin/users/[id]. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ success: false, error: 'Missing user id' }, { status: 400 });
  }

  const errors: { source: string; message: string }[] = [];

  try {
    // Delete teacher profile (if exists)
    const { error: teacherError } = await supabaseAdmin
      .from('teachers')
      .delete()
      .eq('user_id', id);

    if (teacherError) {
      errors.push({ source: 'teachers', message: teacherError.message });
    }

    // Delete enrollments for this user (if exists)
    const { error: enrollmentsError } = await supabaseAdmin
      .from('enrollments')
      .delete()
      .eq('user_id', id);

    if (enrollmentsError) {
      errors.push({ source: 'enrollments', message: enrollmentsError.message });
    }

    // Delete from users table
    const { error: usersError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (usersError) {
      errors.push({ source: 'users', message: usersError.message });
    }

    // Delete auth user (if exists)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (authError && authError.message !== 'User not found') {
      errors.push({ source: 'auth', message: authError.message });
    }

    const success = errors.length === 0;

    return NextResponse.json(
      {
        success,
        errors: errors.length ? errors : undefined,
      },
      { status: success ? 200 : 207 }
    );
  } catch (e: any) {
    console.error('Unexpected error in DELETE /api/admin/users/[id]:', e);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
