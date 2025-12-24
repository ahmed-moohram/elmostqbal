import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase-client';

const getDisplayStudentsCount = (seed: string): number => {
  const s = String(seed || '');
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return 500 + (hash % 501);
};

export async function GET() {
  const { data, error } = await supabase.from('users').select('*').eq('role', 'teacher').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const items = (data || []).map((u: any) => ({
    id: u.id,
    name: u.name || '',
    email: u.email || '',
    bio: u.bio || '',
    avatar: u.avatar_url || u.profile_picture || u.avatar || u.image || '/default-instructor.jpg',
    courses: 0,
    students: getDisplayStudentsCount(u.id),
    rating: 5,
    specialization: u.specialization || '',
    joinDate: u.created_at,
  }));
  return NextResponse.json(items);
}