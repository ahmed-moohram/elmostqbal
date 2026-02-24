import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    let currentUserId: string | null = null;

    // محاولة استخراج userId من query params (لو العميل بعته)
    const searchParams = request.nextUrl.searchParams;
    currentUserId = searchParams.get('currentUserId');

    // للأسف الـ route الأصلي ماكانش بياخد userId غير من التوكن بس إحنا هنعتمد على اللي العميل يبعته زي باقي الـ routes
    if (!currentUserId) {
      return NextResponse.json({ success: true, data: { unreadCount: 0 } });
    }

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', currentUserId)
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return NextResponse.json({ success: true, data: { unreadCount: 0 } });
    }

    return NextResponse.json({ success: true, data: { unreadCount: count || 0 } });
  } catch (error) {
    console.error('Error in unread-count:', error);
    return NextResponse.json({ success: true, data: { unreadCount: 0 } });
  }
}