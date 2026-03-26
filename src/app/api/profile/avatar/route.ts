import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration for /api/profile/avatar');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function tryUpdateUserAvatar(userId: string, url: string) {
  const attempts: Array<Record<string, string>> = [
    { avatar_url: url },
    { profile_picture: url },
    { avatar: url },
    { image: url },
  ];

  let lastError: any = null;
  for (const patch of attempts) {
    const { error } = await supabaseAdmin.from('users').update(patch).eq('id', userId);
    if (!error) return { success: true };
    lastError = error;
  }

  return { success: false, error: lastError };
}

async function tryUpdateTeacherAvatar(userId: string, url: string) {
  const attempts: Array<Record<string, string>> = [
    { avatar_url: url },
    { avatar: url },
  ];

  for (const patch of attempts) {
    const { error } = await supabaseAdmin.from('teachers').update(patch).eq('user_id', userId);
    if (!error) return { success: true };
  }

  return { success: false };
}

export async function POST(request: NextRequest) {
  try {
    const roleCookie = request.cookies.get('user-role')?.value;
    const authCookie = request.cookies.get('auth-token')?.value || request.cookies.get('auth_token')?.value;
    const cookieUserId = request.cookies.get('user-id')?.value;

    if (!authCookie || !roleCookie) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null as any);
    const url = String(body?.url || '');
    const requestedUserId = body?.userId ? String(body.userId) : null;

    if (!url) {
      return NextResponse.json({ success: false, error: 'Missing url' }, { status: 400 });
    }

    const targetUserId = roleCookie === 'admin' ? (requestedUserId || cookieUserId) : cookieUserId;

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Missing user id (cookie user-id)' },
        { status: 400 },
      );
    }

    if (roleCookie !== 'admin' && requestedUserId && requestedUserId !== cookieUserId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const userUpdate = await tryUpdateUserAvatar(targetUserId, url);
    if (!userUpdate.success) {
      return NextResponse.json(
        { success: false, error: userUpdate.error?.message || 'Failed to update user avatar' },
        { status: 500 },
      );
    }

    await tryUpdateTeacherAvatar(targetUserId, url);

    return NextResponse.json({ success: true, url });
  } catch (e: any) {
    console.error('Error in /api/profile/avatar:', e);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
