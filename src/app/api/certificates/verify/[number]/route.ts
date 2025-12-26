import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('❌ Missing Supabase configuration!');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Verify certificate by certificate number
 * Public endpoint - no authentication required
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { number: string } }
) {
  try {
    const certificateNumber = params.number;

    if (!certificateNumber) {
      return NextResponse.json(
        { error: 'Certificate number is required' },
        { status: 400 }
      );
    }

    // Fetch certificate from database
    const { data: certificate, error } = await supabase
      .from('certificates')
      .select(`
        *,
        student:users!certificates_student_id_fkey(
          id,
          name,
          email
        ),
        course:courses!certificates_course_id_fkey(
          id,
          title,
          description,
          duration_hours
        )
      `)
      .eq('certificate_number', certificateNumber)
      .eq('status', 'issued')
      .single();

    if (error || !certificate) {
      return NextResponse.json(
        {
          valid: false,
          message: 'الشهادة غير موجودة أو غير صالحة',
        },
        { status: 404 }
      );
    }

    // Return certificate details (public information)
    return NextResponse.json({
      valid: true,
      certificate: {
        certificateNumber: certificate.certificate_number,
        studentName: certificate.student?.name || 'غير محدد',
        courseName: certificate.course?.title || 'غير محدد',
        issueDate: certificate.issue_date,
        verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://platform.edu'}/verify/${certificateNumber}`,
      },
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    return NextResponse.json(
      {
        valid: false,
        error: 'خطأ في التحقق من الشهادة',
      },
      { status: 500 }
    );
  }
}
