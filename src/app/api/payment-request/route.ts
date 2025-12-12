import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('❌ Missing Supabase configuration! Check your .env.local file');
}

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

    // إنشاء طلب الدفع
    const { data: paymentRequest, error } = await supabase
      .from('payment_requests')
      .insert({
        student_name: studentName,
        student_phone: studentPhone,
        student_email: studentEmail,
        // student_id يُترك فارغًا هنا لأن الجدول يشير إلى auth.users(id)
        // وسوف نعتمد على رقم الهاتف لربط الطلب بالطالب عند الموافقة
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

    let enrichedData: any = data;

    // عند طلب البيانات لطالب معيَّن، أضف حالة التفعيل الفعلية من جدول enrollments
    if (studentPhone && Array.isArray(enrichedData) && enrichedData.length > 0) {
      try {
        const { data: userRow } = await supabase
          .from('users')
          .select('id')
          .or(`phone.eq.${studentPhone},student_phone.eq.${studentPhone}`)
          .maybeSingle();

        if (userRow) {
          const courseIds = Array.from(
            new Set(
              enrichedData
                .map((r: any) => r.course_id)
                .filter((id: any) => !!id)
            )
          );

          if (courseIds.length > 0) {
            const { data: enrollmentsData } = await supabase
              .from('enrollments')
              .select('course_id, is_active')
              .eq('user_id', userRow.id)
              .in('course_id', courseIds as any);

            const enrollmentMap = new Map<string, boolean>();
            (enrollmentsData || []).forEach((e: any) => {
              enrollmentMap.set(String(e.course_id), e.is_active);
            });

            enrichedData = enrichedData.map((r: any) => ({
              ...r,
              // إذا لم توجد بيانات في enrollments نعتبره مُفَعَّلاً (للتوافق مع البيانات القديمة)
              is_active: enrollmentMap.has(String(r.course_id))
                ? enrollmentMap.get(String(r.course_id))
                : true,
            }));
          }
        }
      } catch (enrichError) {
        console.error('Error enriching payment requests with enrollment status:', enrichError);
      }
    }

    return NextResponse.json(enrichedData);

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
      // نحاول أولاً استخدام student_id المخزَّن مع الطلب إن وُجد
      let studentIdForEnrollment: string | null = paymentRequest.student_id;

      // في حالة عدم وجود student_id (طلبات قديمة)، نبحث بالهاتف
      if (!studentIdForEnrollment && paymentRequest.student_phone) {
        const { data: studentData } = await supabase
          .from('users')
          .select('id')
          .or(
            `phone.eq.${paymentRequest.student_phone},student_phone.eq.${paymentRequest.student_phone}`
          )
          .maybeSingle();

        if (studentData) {
          studentIdForEnrollment = studentData.id;
        }
      }

      if (studentIdForEnrollment) {
        // التحقق من وجود اشتراك سابق في نظام الدفع الجديد (course_enrollments)
        const { data: existingEnrollment } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('student_id', studentIdForEnrollment)
          .eq('course_id', paymentRequest.course_id)
          .single();

        if (!existingEnrollment) {
          // إنشاء اشتراك جديد في نظام الدفع
          await supabase
            .from('course_enrollments')
            .insert({
              student_id: studentIdForEnrollment,
              course_id: paymentRequest.course_id,
              payment_request_id: requestId,
              is_active: true,
              access_type: 'full'
            });
        } else {
          // تحديث الاشتراك الموجود في نظام الدفع
          await supabase
            .from('course_enrollments')
            .update({
              is_active: true,
              payment_request_id: requestId,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingEnrollment.id);
        }

        // مزامنة الاشتراك مع جدول enrollments الخاص بالإنجازات/لوحة التحكم
        try {
          const { data: existingLegacyEnrollment } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', studentIdForEnrollment)
            .eq('course_id', paymentRequest.course_id)
            .single();

          if (!existingLegacyEnrollment) {
            await supabase
              .from('enrollments')
              .insert({
                user_id: studentIdForEnrollment,
                course_id: paymentRequest.course_id,
                progress: 0,
                is_active: true,
                enrolled_at: new Date().toISOString()
              });
          } else {
            await supabase
              .from('enrollments')
              .update({
                is_active: true
              })
              .eq('id', existingLegacyEnrollment.id);
          }
        } catch (legacyError) {
          console.error('Error syncing enrollments for achievements:', legacyError);
        }

        // إنشاء إشعار للطالب في جدول notifications
        try {
          await supabase
            .from('notifications')
            .insert({
              user_id: studentIdForEnrollment,
              title: 'تم قبول طلب الاشتراك',
              message: `تم قبول طلب اشتراكك في كورس ${paymentRequest.course_name}`,
              type: 'payment',
              link: `/courses/${paymentRequest.course_id}`
            });
        } catch (notifError) {
          console.error('Error creating approval notification:', notifError);
        }
      }

      // يمكن مستقبلاً إضافة نظام إشعارات SMS أو Email هنا
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
