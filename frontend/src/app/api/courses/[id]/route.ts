import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('❌ Missing Supabase configuration! Check your .env.local file');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase.from('courses').select('*').eq('id', params.id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const form = await request.formData();
  const updates: any = {
    title: form.get('title') != null ? String(form.get('title')) : undefined,
    description: form.get('description') != null ? String(form.get('description')) : undefined,
    price: form.get('price') != null ? Number(form.get('price')) : undefined,
    discount_price: form.get('discountPrice') != null ? Number(form.get('discountPrice')) : undefined,
    is_published: form.get('isPublished') != null ? String(form.get('isPublished')) === 'true' : undefined,
    status: form.get('isPublished') != null ? (String(form.get('isPublished')) === 'true' ? 'published' : 'draft') : undefined,
    is_active: form.get('isPublished') != null ? (String(form.get('isPublished')) === 'true') : undefined,
    is_paid: form.get('isPaid') != null ? String(form.get('isPaid')) === 'true' : undefined,
    is_featured: form.get('isFeatured') != null ? String(form.get('isFeatured')) === 'true' : undefined,
    category: form.get('category') != null ? String(form.get('category')) : undefined,
    level: form.get('level') != null ? String(form.get('level')) : undefined,
  };
  const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined));
  const { data, error } = await supabase.from('courses').update(cleanUpdates).eq('id', params.id).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const courseId = params.id;
  try {
    const { data: sections } = await supabase
      .from('sections')
      .select('id')
      .eq('course_id', courseId);

    const sectionIds = (sections || []).map((s: any) => s.id);
    if (sectionIds.length > 0) {
      await supabase
        .from('lessons')
        .delete()
        .in('section_id', sectionIds);
      await supabase
        .from('sections')
        .delete()
        .in('id', sectionIds);
    }

    await supabase
      .from('course_enrollments')
      .delete()
      .eq('course_id', courseId);

    const { error: courseError } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);
    if (courseError) {
      return NextResponse.json({ error: courseError.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Delete failed' }, { status: 500 });
  }
}