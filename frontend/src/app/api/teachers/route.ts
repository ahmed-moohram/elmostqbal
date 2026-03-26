import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase-client';

export async function GET() {
  const { data, error } = await supabase.from('users').select('*').eq('role', 'teacher').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const items = (data || []).map((u: any) => ({
    id: u.id,
    name: u.name || '',
    email: u.email || '',
    bio: u.bio || '',
    avatar: u.profilePicture || '/default-instructor.jpg',
    courses: 0,
    students: 0,
    rating: u.rating ?? 0,
    specialization: u.specialization || '',
    joinDate: u.created_at,
  }));
  return NextResponse.json(items);
}