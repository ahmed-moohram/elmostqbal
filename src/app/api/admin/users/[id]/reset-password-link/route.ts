import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase configuration for /api/admin/users/[id]/reset-password-link. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
  );
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ success: false, error: 'Missing user id' }, { status: 400 });
  }

  try {
    const { data: userRow, error: userError } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', id)
      .maybeSingle();

    if (userError) {
      console.error('Error fetching user for reset-password-link:', userError);
      return NextResponse.json({ success: false, error: userError.message }, { status: 500 });
    }

    // أولاً: نحاول العثور على المستخدم في Supabase Auth باستخدام الـ id
    const { data: authData, error: authError } = await (supabaseAdmin as any).auth.admin.getUserById(id);

    if (authError) {
      console.error('Error fetching auth user by id for reset-password-link:', authError);
    }

    const authUser = authData?.user;

    // نحدد البريد الذي سنستخدمه لإنشاء رابط الاسترجاع
    const emailForRecovery = (authUser?.email as string | null | undefined) ?? (userRow?.email as string | null | undefined);

    if (!authUser && !emailForRecovery) {
      // لا يوجد مستخدم Auth ولا بريد من جدول users
      return NextResponse.json(
        {
          success: false,
          error: 'No Supabase Auth user or email found for this user',
        },
        { status: 404 },
      );
    }

    const redirectTo = `${request.nextUrl.origin}/reset-password`;

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: emailForRecovery!,
      options: {
        redirectTo,
      },
    } as any);

    if (error) {
      console.error('Error generating reset password link:', error);

      if (error.message === 'User with this email not found') {
        return NextResponse.json(
          {
            success: false,
            error: 'Supabase Auth user not found for this email',
          },
          { status: 404 },
        );
      }

      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, link: data?.action_link });
  } catch (e: any) {
    console.error('Unexpected error in reset-password-link API:', e);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
