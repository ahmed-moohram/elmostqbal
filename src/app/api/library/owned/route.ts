import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('❌ Missing Supabase configuration for /api/library/owned');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// التحقق هل الطالب يمتلك كتاباً معيناً في user_library_books
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');
    const userId = searchParams.get('userId');

    if (!bookId || !userId) {
      return NextResponse.json(
        { owned: false, error: 'Missing bookId or userId' },
        { status: 400 }
      );
    }

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

    return NextResponse.json({ owned: !!data });
  } catch (error) {
    console.error('Server error in GET /api/library/owned:', error);
    return NextResponse.json({ owned: false, error: 'Internal server error' }, { status: 500 });
  }
}
