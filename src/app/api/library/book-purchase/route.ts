import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('❌ Missing Supabase configuration! Check your .env.local file');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// إنشاء طلب شراء كتاب جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookId, studentId, studentName, studentPhone, price } = body || {};

    if (!bookId || !studentName || !studentPhone || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // جلب بيانات الكتاب للحصول على اسم الكتاب والمدرس (إن وجد)
    const { data: bookRow, error: bookError } = await supabase
      .from('library_books')
      .select('id, title, teacher_id, teacher_phone')
      .eq('id', bookId)
      .maybeSingle();

    if (bookError) {
      console.error('Error loading book for purchase request:', bookError);
      return NextResponse.json({ error: bookError.message }, { status: 500 });
    }

    if (!bookRow) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const { data: requestRow, error: insertError } = await supabase
      .from('library_book_purchase_requests')
      .insert({
        book_id: bookRow.id,
        student_id: studentId || null,
        teacher_id: bookRow.teacher_id || null,
        student_name: studentName,
        student_phone: studentPhone,
        teacher_phone: bookRow.teacher_phone || null,
        price,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating library book purchase request:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // إنشاء إشعار للأدمن (اختياري) باستخدام admin_notifications إن وُجد
    try {
      await supabase.from('admin_notifications').insert({
        type: 'library_book_purchase',
        title: `طلب شراء كتاب جديد من ${studentName}`,
        message: `طلب شراء الكتاب: ${bookRow.title} - المبلغ: ${price} جنيه`,
        data: {
          library_book_request_id: requestRow.id,
          book_id: bookRow.id,
          book_title: bookRow.title,
          student_name: studentName,
          student_phone: studentPhone,
          amount: price,
        },
        priority: 'high',
      });
    } catch (notifError) {
      console.error('Error creating admin notification for book purchase:', notifError);
    }

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء طلب شراء الكتاب بنجاح',
      requestId: requestRow.id,
    });
  } catch (error) {
    console.error('Server error in /api/library/book-purchase:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// جلب طلبات شراء الكتب
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('library_book_purchase_requests')
      .select('*, book:library_books(title)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching library book purchase requests:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const enriched = (data || []).map((row: any) => ({
      ...row,
      book_title: row.book?.title ?? null,
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Server error in GET /api/library/book-purchase:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// تحديث حالة طلب شراء كتاب (قبول / رفض)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, status } = body || {};

    if (!requestId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: requestRow, error: fetchError } = await supabase
      .from('library_book_purchase_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError) {
      console.error('Error loading library book purchase request:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!requestRow) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from('library_book_purchase_requests')
      .update({ status })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating library book purchase request:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // عند القبول، تسجيل ملكية الكتاب للطالب في user_library_books
    if (status === 'approved' && requestRow.student_id && requestRow.book_id) {
      try {
        const { data: existing } = await supabase
          .from('user_library_books')
          .select('id')
          .eq('user_id', requestRow.student_id)
          .eq('book_id', requestRow.book_id)
          .maybeSingle();

        if (!existing) {
          await supabase.from('user_library_books').insert({
            user_id: requestRow.student_id,
            book_id: requestRow.book_id,
            purchase_request_id: requestId,
          });
        }

        // إشعار للطالب
        try {
          await supabase.from('notifications').insert({
            user_id: requestRow.student_id,
            title: 'تم قبول طلب شراء الكتاب',
            message: 'تم قبول طلب شراء كتابك ويمكنك الآن الوصول إليه في مكتبتك.',
            type: 'payment',
            link: '/library',
          });
        } catch (notifError) {
          console.error('Error creating notification for approved book purchase:', notifError);
        }
      } catch (ownError) {
        console.error('Error granting owned book to user:', ownError);
      }
    }

    return NextResponse.json({
      success: true,
      message:
        status === 'approved'
          ? 'تم قبول طلب شراء الكتاب'
          : status === 'rejected'
          ? 'تم رفض طلب شراء الكتاب'
          : 'تم تحديث حالة طلب شراء الكتاب',
    });
  } catch (error) {
    console.error('Server error in PATCH /api/library/book-purchase:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
