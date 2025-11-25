import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase-client';

export async function GET() {
  const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const items = (data || []).map((c: any) => ({
    id: c.id,
    title: c.title || '',
    description: c.description || '',
    price: c.price ?? 0,
    discountPrice: c.discount_price ?? null,
    isPublished: c.is_published ?? false,
    isPaid: (c.is_paid ?? true),
    category: c.category || 'عام',
    level: c.level || 'مبتدئ',
    thumbnail: c.thumbnail || '/course-placeholder.png',
    enrolledStudents: c.students_count ?? 0,
    createdAt: c.created_at,
  }));
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const payload: any = {
    title: String(form.get('title') || ''),
    description: String(form.get('description') || ''),
    price: Number(form.get('price') || 0),
    discount_price: form.get('discountPrice') != null ? Number(form.get('discountPrice')) : null,
    is_published: String(form.get('isPublished') || 'false') === 'true',
    status: String(form.get('isPublished') || 'false') === 'true' ? 'published' : 'draft',
    is_active: String(form.get('isPublished') || 'false') === 'true',
    is_paid: String(form.get('isPaid') || 'true') === 'true',
    category: String(form.get('category') || ''),
    level: String(form.get('level') || 'مبتدئ'),
  };
  const { data, error } = await supabase.from('courses').insert(payload).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}