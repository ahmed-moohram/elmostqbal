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

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    // جلب معرف المستخدم الحالي
    let currentUserId: string | null = null;
    
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

    // جلب جميع الرسائل التي شارك فيها المستخدم الحالي
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (messagesError) {
      console.error('Error fetching conversations:', messagesError);
      return NextResponse.json(
        { success: false, error: messagesError.message },
        { status: 500 },
      );
    }

    // تجميع الرسائل حسب المستخدم الآخر
    const conversationsMap = new Map<string, any>();

    messages?.forEach((message) => {
      const otherUserId =
        message.sender_id === currentUserId
          ? message.receiver_id
          : message.sender_id;

      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          userId: otherUserId,
          lastMessage: message,
          unreadCount: 0,
        });
      } else {
        const conv = conversationsMap.get(otherUserId);
        if (
          new Date(message.created_at) >
          new Date(conv.lastMessage.created_at)
        ) {
          conv.lastMessage = message;
        }
      }

      // حساب الرسائل غير المقروءة
      if (
        message.receiver_id === currentUserId &&
        !message.is_read
      ) {
        const conv = conversationsMap.get(otherUserId);
        conv.unreadCount++;
      }
    });

    // جلب معلومات جميع المستخدمين في المحادثات
    const userIds = Array.from(conversationsMap.keys());
    
    if (userIds.length === 0) {
      return NextResponse.json([]);
    }

    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, avatar_url, profile_picture, role')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
    }

    const usersMap = new Map();
    usersData?.forEach((u) => {
      usersMap.set(u.id, u);
    });

    // تحويل المحادثات إلى التنسيق المطلوب
    const conversations = Array.from(conversationsMap.values()).map((conv) => {
      const user = usersMap.get(conv.userId);

      return {
        _id: `conv-${conv.userId}`,
        id: `conv-${conv.userId}`,
        user: {
          _id: conv.userId,
          id: conv.userId,
          name: user?.name || 'مستخدم',
          email: user?.email || '',
          avatar: user?.avatar_url || user?.profile_picture,
          role: user?.role || 'student',
        },
        lastMessage: {
          content: conv.lastMessage.content,
          createdAt: conv.lastMessage.created_at,
          created_at: conv.lastMessage.created_at,
          sender: conv.lastMessage.sender_id,
        },
        unreadCount: conv.unreadCount,
        unread: conv.unreadCount,
      };
    });

    // ترتيب المحادثات حسب آخر رسالة
    conversations.sort((a, b) => {
      const dateA = new Date(a.lastMessage.createdAt || a.lastMessage.created_at);
      const dateB = new Date(b.lastMessage.createdAt || b.lastMessage.created_at);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json(conversations);
  } catch (error: any) {
    console.error('API Error /api/messages/conversations:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch conversations' },
      { status: 500 },
    );
  }
}
