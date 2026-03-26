import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AchievementsService } from '@/services/achievements.service';
import { validateRequest, courseAccessCodeRedeemSchema } from '@/lib/validation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('❌ Missing Supabase configuration! Check your .env.local file');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const achievementsService = new AchievementsService(supabase);

export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, courseAccessCodeRedeemSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { code, courseId, studentId: bodyStudentId, studentPhone } = validation.data;
    const normalizedCode = (code || '').trim();

    const authCookie =
      request.cookies.get('auth-token')?.value || request.cookies.get('auth_token')?.value;
    const cookieUserId = request.cookies.get('user-id')?.value;

    if (!authCookie && !cookieUserId && !studentPhone && !bodyStudentId) {
      return NextResponse.json(
        { success: false, message: 'يجب تسجيل الدخول أولاً لاستخدام كود الكورس' },
        { status: 401 },
      );
    }

    let studentId: string | null = null;

    // أولاً: نحاول تحديد الطالب من رقم الهاتف المرسل في الطلب (الأكثر موثوقية)
    if (studentPhone) {
      const normalizedPhone = String(studentPhone).trim();
      if (normalizedPhone) {
        const { data: studentData, error: studentError } = await supabase
          .from('users')
          .select('id')
          .or(
            `phone.eq.${normalizedPhone},student_phone.eq.${normalizedPhone},parent_phone.eq.${normalizedPhone},mother_phone.eq.${normalizedPhone}`,
          )
          .maybeSingle();

        if (studentError) {
          console.error('Error resolving student by phone in course access code API:', studentError);
          return NextResponse.json(
            { success: false, message: 'حدث خطأ أثناء تحديد حساب الطالب' },
            { status: 500 },
          );
        }

        if (studentData?.id) {
          studentId = String(studentData.id);
        }
      }
    }

    // ثانياً: إذا لم نصل لمعرف طالب من رقم الهاتف، نحاول استخدام المعرّف الموجود في الكوكيز
    if (!studentId && cookieUserId) {
      const candidateId = String(cookieUserId);
      const { data: existingUser, error: existingUserError } = await supabase
        .from('users')
        .select('id')
        .eq('id', candidateId)
        .maybeSingle();

      if (existingUserError) {
        console.error('Error verifying cookie user in course access code API:', existingUserError);
        return NextResponse.json(
          { success: false, message: 'حدث خطأ أثناء تحديد حساب الطالب' },
          { status: 500 },
        );
      }

      if (existingUser?.id) {
        studentId = String(existingUser.id);
      }
    }

    // كحل أخير: نحاول استخدام studentId القادم من الـ body فقط إذا كان موجوداً في users
    if (!studentId && bodyStudentId) {
      const { data: bodyUser, error: bodyUserError } = await supabase
        .from('users')
        .select('id')
        .eq('id', bodyStudentId)
        .maybeSingle();

      if (bodyUserError) {
        console.error('Error verifying body studentId in course access code API:', bodyUserError);
        // لا نعيد الخطأ هنا، سنحاول البحث عن المستخدم برقم الهاتف
      }

      if (bodyUser?.id) {
        studentId = String(bodyUser.id);
      }
    }

    // إذا لم نجد studentId من أي مصدر، نعيد خطأ واضح
    if (!studentId) {
      // إذا كان هناك studentPhone لكن لم نجد المستخدم، نعطي رسالة محددة
      if (studentPhone) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'لا يمكن العثور على حساب طالب برقم الهاتف المحدد. يرجى التأكد من تسجيل الدخول بشكل صحيح أو إنشاء حساب جديد.' 
          },
          { status: 400 },
        );
      }
      
      // إذا كان هناك bodyStudentId أو cookieUserId لكن لم نجد المستخدم
      if (bodyStudentId || cookieUserId) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'حساب المستخدم غير موجود في قاعدة البيانات. يرجى تسجيل الخروج ثم تسجيل الدخول مرة أخرى، أو إنشاء حساب جديد.' 
          },
          { status: 400 },
        );
      }
      
      return NextResponse.json(
        { success: false, message: 'لا يمكن العثور على حساب الطالب المرتبط بهذا الكود. يرجى التأكد من تسجيل الدخول بشكل صحيح.' },
        { status: 400 },
      );
    }

    if (!normalizedCode) {
      return NextResponse.json(
        { success: false, message: 'من فضلك أدخل كود الاشتراك' },
        { status: 400 },
      );
    }

    // التحقق من وجود الكود في جدول course_access_codes
    const { data: accessCodeRow, error: accessCodeError } = await supabase
      .from('course_access_codes')
      .select('id, course_id, student_id, is_used, max_uses, current_uses, expires_at')
      .eq('course_id', courseId)
      .eq('code', normalizedCode)
      .maybeSingle();

    if (accessCodeError) {
      console.error('Error fetching course_access_codes:', accessCodeError);
      return NextResponse.json(
        { success: false, message: 'حدث خطأ أثناء التحقق من الكود' },
        { status: 500 },
      );
    }

    if (!accessCodeRow) {
      return NextResponse.json(
        { success: false, message: 'الكود غير صحيح' },
        { status: 400 },
      );
    }

    // التحقق من أن الكود لم يتم استخدامه بالكامل
    if (accessCodeRow.is_used && accessCodeRow.current_uses >= accessCodeRow.max_uses) {
      return NextResponse.json(
        { success: false, message: 'تم استخدام هذا الكود بالكامل' },
        { status: 400 },
      );
    }

    // التحقق من تاريخ انتهاء الصلاحية
    if (accessCodeRow.expires_at) {
      const expiresAt = new Date(accessCodeRow.expires_at);
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { success: false, message: 'انتهت صلاحية هذا الكود' },
          { status: 400 },
        );
      }
    }

    // إذا كان الكود مربوطًا بطالب معيّن، تأكد أن الطالب الحالي هو نفسه
    if (accessCodeRow.student_id && accessCodeRow.student_id !== studentId) {
      return NextResponse.json(
        { success: false, message: 'هذا الكود غير مخصص لهذا الطالب' },
        { status: 403 },
      );
    }

    // التحقق من وجود اشتراك سابق في course_enrollments
    const { data: existingEnrollment, error: existingEnrollmentError } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (existingEnrollmentError) {
      console.error('Error checking existing course_enrollments:', existingEnrollmentError);
      return NextResponse.json(
        { success: false, message: 'حدث خطأ أثناء تفعيل الاشتراك' },
        { status: 500 },
      );
    }

    if (!existingEnrollment) {
      // إنشاء اشتراك جديد في course_enrollments (نفس طريقة فودافون كاش)
      const { error: insertEnrollmentError } = await supabase
        .from('course_enrollments')
        .insert({
          student_id: studentId,
          course_id: courseId,
          is_active: true,
          access_type: 'full',
          // ملاحظة: payment_request_id يبقى null للاشتراكات بالكود
          // يمكن إضافة access_code_id في المستقبل إذا لزم الأمر
        });

      if (insertEnrollmentError) {
        console.error('Error inserting into course_enrollments:', insertEnrollmentError);
        // في حالة كسر قيد المفتاح الخارجي على student_id نوضح أن حساب الطالب غير موجود في users
        if (
          insertEnrollmentError.code === '23503' &&
          typeof insertEnrollmentError.message === 'string' &&
          insertEnrollmentError.message.includes('course_enrollments_student_id_fkey')
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                'لا يمكن العثور على حساب الطالب في قاعدة البيانات. تأكد أن الطالب مسجل في النظام بنفس رقم الهاتف أو قم بتسجيل حساب جديد للمستخدم.',
            },
            { status: 400 },
          );
        }

        return NextResponse.json(
          { success: false, message: 'حدث خطأ أثناء تفعيل الاشتراك' },
          { status: 500 },
        );
      }
    } else {
      const { error: updateEnrollmentError } = await supabase
        .from('course_enrollments')
        .update({
          is_active: true,
          access_type: 'full',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingEnrollment.id);

      if (updateEnrollmentError) {
        console.error('Error updating course_enrollments:', updateEnrollmentError);
        return NextResponse.json(
          { success: false, message: 'حدث خطأ أثناء تفعيل الاشتراك' },
          { status: 500 },
        );
      }
    }

    // مزامنة الاشتراك مع جدول enrollments المستخدم في لوحة الطالب والإنجازات
    // نستخدم Service Role Key لضمان إنشاء الاشتراك حتى مع RLS
    // نفس الطريقة المستخدمة في الموافقة على طلب الدفع بـ فودافون كاش
    try {
      const { data: existingLegacyEnrollment, error: checkError } = await supabase
        .from('enrollments')
        .select('id, progress, is_active')
        .eq('user_id', studentId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing enrollments:', checkError);
      }

      if (!existingLegacyEnrollment) {
        // إنشاء اشتراك جديد في enrollments (نفس طريقة فودافون كاش)
        const { data: newEnrollment, error: insertError } = await supabase
          .from('enrollments')
          .insert({
            user_id: studentId,
            course_id: courseId,
            progress: 0,
            is_active: true,
            enrolled_at: new Date().toISOString(),
            last_accessed: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('❌ Error inserting into enrollments:', insertError);
          // لا نعيد الخطأ هنا لأن الاشتراك في course_enrollments تم بنجاح
        } else {
          console.log('✅ تم إنشاء اشتراك في enrollments بالكود للطالب:', studentId, 'Enrollment ID:', newEnrollment?.id);
        }
      } else {
        // تحديث الاشتراك الموجود (نفس طريقة فودافون كاش)
        const { error: updateError } = await supabase
          .from('enrollments')
          .update({
            is_active: true,
            last_accessed: new Date().toISOString(),
          })
          .eq('id', existingLegacyEnrollment.id);

        if (updateError) {
          console.error('❌ Error updating enrollments:', updateError);
        } else {
          console.log('✅ تم تحديث اشتراك في enrollments بالكود للطالب:', studentId);
        }
      }
    } catch (legacyError) {
      console.error('❌ Error syncing enrollments for course access code:', legacyError);
      // لا نعيد الخطأ هنا لأن الاشتراك في course_enrollments تم بنجاح
    }

    // إنشاء إشعار للطالب (نفس طريقة فودافون كاش)
    try {
      const { data: courseData } = await supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .maybeSingle();

      await supabase
        .from('notifications')
        .insert({
          user_id: studentId,
          title: 'تم تفعيل الاشتراك',
          message: `تم تفعيل اشتراكك في كورس ${courseData?.title || 'الكورس'} باستخدام كود الوصول`,
          type: 'enrollment',
          link: `/courses/${courseId}`
        });
    } catch (notifError) {
      console.error('Error creating enrollment notification:', notifError);
      // لا نعيد الخطأ هنا لأن الاشتراك تم بنجاح
    }

    // تحديث حالة الكود بعد الاستخدام
    try {
      const newCurrentUses = (accessCodeRow.current_uses || 0) + 1;
      const isFullyUsed = newCurrentUses >= accessCodeRow.max_uses;
      
      // بناء بيانات التحديث
      const updateData: {
        current_uses: number;
        is_used: boolean;
        used_at?: string;
        used_by_student_id?: string;
      } = {
        current_uses: newCurrentUses,
        is_used: isFullyUsed,
      };

      // إذا تم استخدام الكود بالكامل، نضيف used_at
      if (isFullyUsed) {
        updateData.used_at = new Date().toISOString();
      }

      // إضافة used_by_student_id إذا كان موجوداً
      if (studentId) {
        const { data: userExists, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('id', studentId)
          .maybeSingle();
        
        if (!checkError && userExists?.id === studentId) {
          updateData.used_by_student_id = studentId;
        }
      }
      
      // تحديث الكود
      const { error: updateCodeError } = await supabase
        .from('course_access_codes')
        .update(updateData)
        .eq('id', accessCodeRow.id);

      if (updateCodeError) {
        console.error('Error updating course access code:', updateCodeError);
        // لا نعيد الخطأ هنا لأن الاشتراك تم بنجاح، فقط تحديث الكود فشل
      }
    } catch (codeUpdateException) {
      console.error('Unexpected error while updating course access code:', codeUpdateException);
      // لا نعيد الخطأ هنا لأن الاشتراك تم بنجاح، فقط تحديث الكود فشل
    }

    // تفعيل الإنجازات المتعلقة بالاشتراك في الكورس
    try {
      await achievementsService.checkAndGrantAchievements(studentId, courseId);
    } catch (achievementsError) {
      console.error('Error granting achievements after course access code redeem:', achievementsError);
    }

    // ملاحظة: لا ننشئ إشعارات للأدمن عند تفعيل كود الكورس
    // الإشعارات تظهر فقط عند إنشاء طلب دفع بفودافون كاش في /api/payment-request

    return NextResponse.json({
      success: true,
      message: 'تم تفعيل اشتراكك في الكورس بنجاح باستخدام الكود',
    });
  } catch (error) {
    console.error('Unexpected error in /api/course-access-code:', error);
    return NextResponse.json(
      { success: false, message: 'خطأ داخلي في الخادم' },
      { status: 500 },
    );
  }
}
