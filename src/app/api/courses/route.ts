import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase-client';
import { courseCreateSchema, validateFormData } from '@/lib/validation';
import { sanitizeHTML } from '@/lib/security/xss';

export async function GET() {
  const { data, error } = await supabase
    .from('courses')
    .select('*, instructor_user:users!courses_instructor_id_fkey(id, name, avatar_url, profile_picture)')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const items = (data || []).map((c: any) => ({
    id: c.id,
    title: c.title || '',
    description: c.description || '',
    instructor: c?.instructor_user?.name || null,
    instructor_name: c?.instructor_user?.name || null,
    instructor_image: c?.instructor_user?.avatar_url || c?.instructor_user?.profile_picture || null,
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
  try {
    const form = await request.formData();

    // Convert FormData to object for validation
    const formData: Record<string, any> = {};
    form.forEach((value, key) => {
      formData[key] = value;
    });

    // Validate using Zod schema (with FormData-specific handling)
    const rawTitle = String(form.get('title') || '').trim();
    const description = String(form.get('description') || '');
    const price = Number(form.get('price') || 0);
    const category = String(form.get('category') || '');
    const level = String(form.get('level') || 'مبتدئ') as 'مبتدئ' | 'متوسط' | 'متقدم';

    // Manual validation (since FormData needs special handling)
    if (!rawTitle || rawTitle.length < 3) {
      return NextResponse.json(
        { error: 'العنوان يجب أن يكون 3 أحرف على الأقل' },
        { status: 400 }
      );
    }

    if (!description || description.length < 10) {
      return NextResponse.json(
        { error: 'الوصف يجب أن يكون 10 أحرف على الأقل' },
        { status: 400 }
      );
    }

    if (price < 0) {
      return NextResponse.json(
        { error: 'السعر يجب أن يكون موجباً' },
        { status: 400 }
      );
    }

    if (!category || category.trim().length === 0) {
      return NextResponse.json(
        { error: 'يجب اختيار فئة' },
        { status: 400 }
      );
    }

    if (!['مبتدئ', 'متوسط', 'متقدم'].includes(level)) {
      return NextResponse.json(
        { error: 'يجب اختيار مستوى صحيح' },
        { status: 400 }
      );
    }

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

    const discountPrice = form.get('discountPrice');
    const discountPriceNum = discountPrice != null ? Number(discountPrice) : null;
    if (discountPriceNum !== null && discountPriceNum < 0) {
      return NextResponse.json(
        { error: 'سعر الخصم يجب أن يكون موجباً' },
        { status: 400 }
      );
    }

    // Sanitize user input to prevent XSS
    const sanitizedDescription = sanitizeHTML(description);
    const sanitizedShortDescription = sanitizeHTML(shortDescription);

    const payload: any = {
      title: rawTitle,
      slug,
      description: sanitizedDescription,
      short_description: sanitizedShortDescription,
      price,
      discount_price: discountPriceNum,
      is_published: String(form.get('isPublished') || 'false') === 'true',
      status: String(form.get('isPublished') || 'false') === 'true' ? 'published' : 'draft',
      is_active: String(form.get('isPublished') || 'false') === 'true',
      is_paid: String(form.get('isPaid') || 'true') === 'true',
      category,
      level,
    };

  const role = request.cookies.get('user-role')?.value || null;
  const cookieUserId = request.cookies.get('user-id')?.value || null;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!payload.instructor_id && cookieUserId && (role === 'admin' || role === 'teacher')) {
    if (uuidRegex.test(String(cookieUserId))) {
      payload.instructor_id = cookieUserId;
    }
  }

    const { data, error } = await supabase.from('courses').insert(payload).select('*').single();

    if (error) {
      console.error('Error creating course:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Unexpected error in POST /api/courses:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الكورس' },
      { status: 500 }
    );
  }
}