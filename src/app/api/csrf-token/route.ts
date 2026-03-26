import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken, setCSRFToken } from '@/lib/security/csrf';

/**
 * API Route to generate and return CSRF token
 * ===========================================
 * يجب استدعاء هذا الـ Route في كل صفحة تحتاج إرسال Forms
 */
export async function GET(request: NextRequest) {
  try {
    const token = generateCSRFToken();
    await setCSRFToken(token);

    return NextResponse.json({
      success: true,
      csrfToken: token,
    });
  } catch (error: any) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
