import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wnqifmvgvlmxgswhcwnc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWlmbXZndmxteGdzd2hjd25jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQzNjA1NSwiZXhwIjoyMDc4MDEyMDU1fQ.OlrWLS7bjUqVh7rarNxa3cX9XrV-n-O24aiMvCs5sCU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// POST - إنشاء طلب دفع جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      studentName,
      studentPhone,
      studentEmail,
      courseId,
      courseName,
      coursePrice,
      teacherName,
      teacherPhone,
      paymentPhone,
      transactionId
    } = body;

    // التحقق من البيانات المطلوبة
    if (!studentName || !studentPhone || !courseId || !courseName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // البحث عن معرف الطالب إن وجد
    const { data: studentData } = await supabase
      .from('users')
      .select('id')
      .eq('phone', studentPhone)
      .single();

    // إنشاء طلب الدفع
    const { data: paymentRequest, error } = await supabase
      .from('payment_requests')
      .insert({
        student_name: studentName,
        student_phone: studentPhone,
        student_email: studentEmail,
        student_id: studentData?.id || null,
        course_id: courseId,
        course_name: courseName,
        course_price: coursePrice,
        teacher_name: teacherName,
        teacher_phone: teacherPhone,
        payment_phone: paymentPhone || studentPhone,
        transaction_id: transactionId,
        amount_paid: coursePrice,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment request:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // إنشاء إشعار للأدمن
    await supabase
      .from('admin_notifications')
      .insert({
        type: 'payment_request',
        title: `طلب دفع جديد من ${studentName}`,
        message: `طلب اشتراك في كورس: ${courseName} - المبلغ: ${coursePrice} جنيه`,
        data: {
          payment_request_id: paymentRequest.id,
          student_name: studentName,
          student_phone: studentPhone,
          course_name: courseName,
          amount: coursePrice
        },
        priority: 'high'
      });

    return NextResponse.json({
      success: true,
      message: 'تم إرسال طلب الدفع بنجاح',
      requestId: paymentRequest.id
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - جلب طلبات الدفع
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const studentPhone = searchParams.get('studentPhone');
    const requestId = searchParams.get('id');

    let query = supabase
      .from('payment_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (requestId) {
      query = query.eq('id', requestId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (studentPhone) {
      query = query.eq('student_phone', studentPhone);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - تحديث حالة الطلب
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, status, adminNotes, rejectionReason } = body;

    if (!requestId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // جلب بيانات الطلب
    const { data: paymentRequest } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (!paymentRequest) {
      return NextResponse.json(
        { error: 'Payment request not found' },
        { status: 404 }
      );
    }

    // تحديث حالة الطلب
    const updateData: any = {
      status,
      admin_notes: adminNotes,
      updated_at: new Date().toISOString()
    };

    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString();
      // TODO: Add approved_by when we have auth context
    } else if (status === 'rejected') {
      updateData.rejection_reason = rejectionReason;
    }

    const { error: updateError } = await supabase
      .from('payment_requests')
      .update(updateData)
      .eq('id', requestId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // إذا تمت الموافقة، قم بتفعيل الاشتراك
    if (status === 'approved') {
      // البحث عن معرف الطالب
      const { data: studentData } = await supabase
        .from('users')
        .select('id')
        .eq('phone', paymentRequest.student_phone)
        .single();

      if (studentData) {
        // التحقق من وجود اشتراك سابق
        const { data: existingEnrollment } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('student_id', studentData.id)
          .eq('course_id', paymentRequest.course_id)
          .single();

        if (!existingEnrollment) {
          // إنشاء اشتراك جديد
          await supabase
            .from('course_enrollments')
            .insert({
              student_id: studentData.id,
              course_id: paymentRequest.course_id,
              payment_request_id: requestId,
              is_active: true,
              access_type: 'full'
            });
        } else {
          // تحديث الاشتراك الموجود
          await supabase
            .from('course_enrollments')
            .update({
              is_active: true,
              payment_request_id: requestId,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingEnrollment.id);
        }
      }

      // إنشاء إشعار للطالب (اختياري)
      // يمكن إضافة نظام إشعارات SMS أو Email هنا
    }

    return NextResponse.json({
      success: true,
      message: `تم ${status === 'approved' ? 'قبول' : status === 'rejected' ? 'رفض' : 'تحديث'} الطلب بنجاح`
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
