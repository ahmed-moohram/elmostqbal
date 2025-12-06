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

  const rawTitle = String(form.get('title') || '').trim();
  const description = String(form.get('description') || '');

  let baseSlug = String(form.get('slug') || rawTitle)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-ء-ي]+/g, '');

  if (!baseSlug) {
    baseSlug = `course-${Date.now()}`;
  }

  const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`;

  const shortDescriptionFromForm = form.get('shortDescription');
  const shortDescription =
    typeof shortDescriptionFromForm === 'string' && shortDescriptionFromForm.trim().length > 0
      ? shortDescriptionFromForm
      : description.slice(0, 200);

  const payload: any = {
    title: rawTitle,
    slug,
    description,
    short_description: shortDescription,
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