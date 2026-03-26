import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

// التحقق هل الطالب يمتلك كتاباً معيناً:
// 1) من جدول user_library_books (الكتب المفعّلة)
// 2) كاحتياط: من جدول library_book_purchase_requests للحالات المعتمدة approved
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const bookId = searchParams.get('bookId');
    const userId = searchParams.get('userId');
    const studentPhone = searchParams.get('studentPhone');

    if (!bookId || !userId) {
      return NextResponse.json(
        { owned: false, error: 'Missing bookId or userId' },
        { status: 400 }
      );
    }

    // أولوية أولاً لجدول user_library_books
    const { data, error } = await supabase
      .from('user_library_books')
      .select('id')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .maybeSingle();

    if (error) {
      console.error('Error checking owned library book:', error);
      return NextResponse.json({ owned: false, error: error.message }, { status: 500 });
    }

    if (data) {
      return NextResponse.json({ owned: true, source: 'user_library_books' });
    }

    // كاحتياط: لو ما فيش صف في user_library_books، نتحقق من طلبات الشراء المعتمدة
    const orFilterParts = [`student_id.eq.${userId}`];
    if (studentPhone) {
      orFilterParts.push(`student_phone.eq.${studentPhone}`);
    }

    const { data: requestRow, error: requestError } = await supabase
      .from('library_book_purchase_requests')
      .select('id,status,student_id,student_phone')
      .eq('book_id', bookId)
      .or(orFilterParts.join(','))
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (requestError) {
      console.error('Error checking purchase requests for owned book:', requestError);
      return NextResponse.json({ owned: false, error: requestError.message }, { status: 500 });
    }

    const ownedFromRequest = !!(requestRow && requestRow.status === 'approved');

    return NextResponse.json({
      owned: ownedFromRequest,
      source: ownedFromRequest ? 'library_book_purchase_requests' : undefined,
    });
  } catch (error) {
    console.error('Server error in GET /api/library/owned:', error);
    return NextResponse.json({ owned: false, error: 'Internal server error' }, { status: 500 });
  }
}
