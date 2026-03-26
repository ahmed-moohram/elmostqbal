import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function normalizePhone(value: string | null | undefined): string {
  return String(value || '')
    .replace(/\s+/g, '')
    .replace(/^\+?2/, '')
    .trim();
}

async function getSupabasePhonesForCourse(courseId: string): Promise<Set<string>> {
  const phones = new Set<string>();
  if (!supabase) return phones;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(String(courseId))) return phones;

  const userIds = new Set<string>();

  try {
    const { data: ceRows } = await supabase
      .from('course_enrollments')
      .select('user_id,status')
      .eq('course_id', courseId)
      .limit(2000);

    (ceRows || []).forEach((row: any) => {
      const status = String(row?.status || '').toLowerCase();
      if (!status || status === 'active' || status === 'approved') {
        if (row?.user_id) userIds.add(String(row.user_id));
      }
    });
  } catch {
  }

  try {
    const { data: eRows } = await supabase
      .from('enrollments')
      .select('user_id,is_active')
      .eq('course_id', courseId)
      .limit(2000);

    (eRows || []).forEach((row: any) => {
      if (row?.user_id && row?.is_active !== false) {
        userIds.add(String(row.user_id));
      }
    });
  } catch {
  }

  const ids = Array.from(userIds);
  if (ids.length === 0) return phones;

  const chunkSize = 500;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    let usersData: any[] = [];

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id,phone,student_phone')
        .in('id', chunk)
        .limit(chunkSize);

      if (error && typeof error.message === 'string' && error.message.toLowerCase().includes('phone')) {
        const { data: fallbackData } = await supabase
          .from('users')
          .select('id,student_phone')
          .in('id', chunk)
          .limit(chunkSize);
        usersData = (fallbackData || []) as any[];
      } else {
        usersData = (data || []) as any[];
      }
    } catch {
      usersData = [];
    }

    usersData.forEach((u: any) => {
      const p1 = normalizePhone(u?.phone);
      const p2 = normalizePhone(u?.student_phone);
      if (p1) phones.add(p1);
      if (p2) phones.add(p2);
    });
  }

  return phones;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');
    const courseId = request.nextUrl.searchParams.get('courseId');
    const isMongoCourseId = !!courseId && /^[a-f\d]{24}$/i.test(String(courseId));

    if (!API_BASE_URL) {
      return NextResponse.json({ data: [] });
    }

    const forwardUrl = new URL(`${API_BASE_URL}/api/users`);
    request.nextUrl.searchParams.forEach((value, key) => {
      if (key === 'courseId' && !isMongoCourseId) return;
      forwardUrl.searchParams.set(key, value);
    });

    const res = await fetch(forwardUrl.toString(), {
      headers: token ? { Authorization: token } : undefined,
    });

    const payload = await res.json().catch(() => null);

    if (!courseId) {
      return NextResponse.json(payload, { status: res.status });
    }

    if (isMongoCourseId) {
      return NextResponse.json(payload, { status: res.status });
    }

    if (!supabase) {
      return NextResponse.json(payload, { status: res.status });
    }

    const phones = await getSupabasePhonesForCourse(String(courseId));
    if (phones.size === 0) {
      return NextResponse.json({ ...(payload || {}), data: [] }, { status: res.status });
    }

    const list: any[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
      ? payload.data
      : [];

    const filtered = list.filter((u: any) => {
      if (String(u?.role || '').toLowerCase() !== 'student') return false;
      const candidate =
        normalizePhone(u?.studentPhone) ||
        normalizePhone(u?.student_phone) ||
        normalizePhone(u?.phone);

      if (!candidate) return false;
      return phones.has(candidate);
    });

    const responsePayload = Array.isArray(payload)
      ? filtered
      : { ...(payload || {}), data: filtered };

    return NextResponse.json(responsePayload, { status: res.status });
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}
