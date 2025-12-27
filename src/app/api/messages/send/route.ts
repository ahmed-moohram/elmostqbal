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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { receiverId, content, courseId, senderId } = body;

    if (!receiverId || !content || !senderId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: receiverId, content, senderId' },
        { status: 400 },
      );
    }

    // جلب معلومات المرسل لتحديد دوره
    const { data: senderData, error: senderError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', senderId)
      .maybeSingle();

    if (senderError || !senderData) {
      return NextResponse.json(
        { success: false, error: 'Sender not found' },
        { status: 404 },
      );
    }

    const senderRole = senderData.role === 'admin' || senderData.role === 'teacher' ? 'teacher' : 'student';

    // إدراج الرسالة
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        course_id: courseId || null,
        content: content.trim(),
        sender_role: senderRole,
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting message:', insertError);
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 },
      );
    }

    // جلب معلومات المرسل والمستقبل للرد
    const [senderInfo, receiverInfo] = await Promise.all([
      supabase
        .from('users')
        .select('id, name, email, avatar_url, profile_picture')
        .eq('id', senderId)
        .maybeSingle(),
      supabase
        .from('users')
        .select('id, name, email, avatar_url, profile_picture')
        .eq('id', receiverId)
        .maybeSingle(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        _id: message.id,
        id: message.id,
        sender: {
          _id: senderInfo.data?.id || senderId,
          id: senderInfo.data?.id || senderId,
          name: senderInfo.data?.name || 'مستخدم',
          avatar: senderInfo.data?.avatar_url || senderInfo.data?.profile_picture,
        },
        receiver: {
          _id: receiverInfo.data?.id || receiverId,
          id: receiverInfo.data?.id || receiverId,
          name: receiverInfo.data?.name || 'مستخدم',
          avatar: receiverInfo.data?.avatar_url || receiverInfo.data?.profile_picture,
        },
        content: message.content,
        messageType: 'text',
        isRead: message.is_read,
        createdAt: message.created_at,
        created_at: message.created_at,
      },
    });
  } catch (error: any) {
    console.error('API Error /api/messages/send:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send message' },
      { status: 500 },
    );
  }
}
