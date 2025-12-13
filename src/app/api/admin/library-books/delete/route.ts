import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('❌ Missing Supabase configuration for /api/admin/library-books/delete');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// حذف كتاب من المكتبة (للوحة الأدمن)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookId } = body || {};

    if (!bookId) {
      return NextResponse.json({ error: 'bookId is required' }, { status: 400 });
    }

    // جلب بيانات الكتاب للحصول على مسار الملف
    const { data: book, error: fetchError } = await supabase
      .from('library_books')
      .select('id, file_path, file_url')
      .eq('id', bookId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error loading library book for delete:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // محاولة حذف الملف من التخزين إن وُجد مسار
    try {
      const filePath: string | null = (book as any).file_path || null;
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('pdf-library')
          .remove([filePath]);

        if (storageError) {
          console.error('Error removing file from storage while deleting book:', storageError);
        }
      }
    } catch (storageErr) {
      console.error('Unexpected error when removing storage file for book:', storageErr);
    }

    // حذف الكتاب نفسه (سيتم حذف user_library_books المرتبطة بـ ON DELETE CASCADE)
    const { error: deleteError } = await supabase
      .from('library_books')
      .delete()
      .eq('id', bookId);

    if (deleteError) {
      console.error('Error deleting library book (admin):', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'تم حذف الكتاب بنجاح' });
  } catch (error) {
    console.error('Server error in /api/admin/library-books/delete:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
