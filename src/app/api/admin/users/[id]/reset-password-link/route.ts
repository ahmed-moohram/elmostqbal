import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase configuration for /api/admin/users/[id]/reset-password-link. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
  );
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_replace_in_production';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  const roleCookie = request.cookies.get('user-role')?.value;
  if (roleCookie !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  if (!id) {
    return NextResponse.json({ success: false, error: 'Missing user id' }, { status: 400 });
  }

  try {
    const { data: userRow, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, password_hash')
      .eq('id', id)
      .maybeSingle();

    if (userError) {
      console.error('Error fetching user for reset-password-link:', userError);
      return NextResponse.json({ success: false, error: userError.message }, { status: 500 });
    }

    if (!userRow?.id) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const passwordMaterial = String((userRow as any).password_hash || '');
    const passwordHashFingerprint = createHash('sha256').update(passwordMaterial).digest('hex');

    const token = jwt.sign(
      {
        sub: id,
        purpose: 'password_reset',
        ph: passwordHashFingerprint,
      },
      JWT_SECRET,
      { expiresIn: '30m' },
    );

    const link = `${request.nextUrl.origin}/reset-password/${encodeURIComponent(token)}`;
    return NextResponse.json({ success: true, link });
  } catch (e: any) {
    console.error('Unexpected error in reset-password-link API:', e);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
