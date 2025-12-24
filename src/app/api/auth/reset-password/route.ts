import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import { hash } from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase configuration for /api/auth/reset-password. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
  );
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_replace_in_production';

type ResetTokenPayload = {
  sub: string;
  purpose?: string;
  ph?: string;
  iat?: number;
  exp?: number;
};

function passwordFingerprint(row: any): string {
  const material = String(row?.password_hash || '');
  return createHash('sha256').update(material).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const token = body?.token ? String(body.token) : '';
    const newPassword = body?.password ? String(body.password) : '';

    if (!token) {
      return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400 });
    }

    if (!newPassword) {
      return NextResponse.json({ success: false, error: 'Missing password' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 },
      );
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { success: false, error: 'Password must contain uppercase, lowercase, and a number' },
        { status: 400 },
      );
    }

    let payload: ResetTokenPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as ResetTokenPayload;
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 },
      );
    }

    if (!payload?.sub || payload.purpose !== 'password_reset') {
      return NextResponse.json({ success: false, error: 'Invalid token purpose' }, { status: 401 });
    }

    const userId = String(payload.sub);

    const { data: userRow, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, password_hash')
      .eq('id', userId)
      .maybeSingle();

    if (userError) {
      console.error('Error fetching user in reset-password API:', userError);
      return NextResponse.json({ success: false, error: userError.message }, { status: 500 });
    }

    if (!userRow?.id) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const currentFingerprint = passwordFingerprint(userRow);
    if (payload.ph && payload.ph !== currentFingerprint) {
      return NextResponse.json(
        { success: false, error: 'Token is no longer valid' },
        { status: 401 },
      );
    }

    const newPasswordHash = await hash(newPassword, 12);

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password_hash: newPasswordHash,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user password_hash in reset-password API:', updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Unexpected error in POST /api/auth/reset-password:', e);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
