import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase configuration. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const { userId } = params;
    const authHeader = request.headers.get('authorization');
    
    // جلب معرف المستخدم الحالي من localStorage (سيتم تمريره من العميل)
    // أو من token إذا كان متوفراً
    let currentUserId: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // يمكن إضافة منطق لاستخراج userId من token هنا
      // حالياً سنستخدم userId من query params أو header
    }

    // محاولة جلب userId من query params
    const searchParams = request.nextUrl.searchParams;
    const currentUserIdParam = searchParams.get('currentUserId');
    
    if (currentUserIdParam) {
      currentUserId = currentUserIdParam;
    }

    if (!currentUserId) {
      return NextResponse.json(
        { success: false, error: 'Current user ID is required' },
        { status: 400 },
      );
    }

    // جلب جميع الرسائل بين المستخدم الحالي والمستخدم المحدد
    // نستخدم استعلامين منفصلين ثم ندمجهما
    const [sentResult, receivedResult] = await Promise.all([
      supabase
        .from('messages')
        .select('*')
        .eq('sender_id', currentUserId)
        .eq('receiver_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true }),
      supabase
        .from('messages')
        .select('*')
        .eq('sender_id', userId)
        .eq('receiver_id', currentUserId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true }),
    ]);

    const messagesError = sentResult.error || receivedResult.error;

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { success: false, error: messagesError.message },
        { status: 500 },
      );
    }

    const sentMessages = sentResult.data || [];
    const receivedMessages = receivedResult.data || [];
    const messages = [...sentMessages, ...receivedMessages];
    
    // ترتيب الرسائل حسب التاريخ
    messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // تحديث حالة القراءة للرسائل التي تم استلامها
    if (messages && messages.length > 0) {
      const unreadMessages = messages.filter(
        (m) => m.receiver_id === currentUserId && !m.is_read,
      );

      if (unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({
            is_read: true,
            read_at: new Date().toISOString(),
          })
          .in(
            'id',
            unreadMessages.map((m) => m.id),
          );
      }
    }

    // جلب معلومات المرسلين والمستقبلين
    const userIds = new Set<string>();
    messages?.forEach((m) => {
      userIds.add(m.sender_id);
      userIds.add(m.receiver_id);
    });

    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, avatar_url, profile_picture')
      .in('id', Array.from(userIds));

    const usersMap = new Map();
    usersData?.forEach((u) => {
      usersMap.set(u.id, u);
    });

    // تحويل الرسائل إلى التنسيق المطلوب
    const formattedMessages = (messages || []).map((m) => {
      const sender = usersMap.get(m.sender_id);
      const receiver = usersMap.get(m.receiver_id);

      return {
        _id: m.id,
        id: m.id,
        sender: {
          _id: m.sender_id,
          id: m.sender_id,
          name: sender?.name || 'مستخدم',
          avatar: sender?.avatar_url || sender?.profile_picture,
        },
        receiver: {
          _id: m.receiver_id,
          id: m.receiver_id,
          name: receiver?.name || 'مستخدم',
          avatar: receiver?.avatar_url || receiver?.profile_picture,
        },
        content: m.content,
        messageType: 'text',
        isRead: m.is_read,
        createdAt: m.created_at,
        created_at: m.created_at,
      };
    });

    return NextResponse.json(formattedMessages);
  } catch (error: any) {
    console.error('API Error /api/messages/conversation/[userId]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch messages' },
      { status: 500 },
    );
  }
}
