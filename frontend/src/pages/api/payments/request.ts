import { NextApiRequest, NextApiResponse } from 'next';
import { 
  createPaymentRequest,
  getPaymentRequests,
  approvePaymentRequest,
  rejectPaymentRequest 
} from '@/lib/database/security-db';
import { checkRateLimit } from '@/lib/database/security-db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Rate limiting check
  const identifier = req.headers['x-forwarded-for'] as string || 
                    req.socket.remoteAddress || 
                    'unknown';
  
  const { allowed, remaining } = await checkRateLimit(
    identifier,
    '/api/payments/request',
    50, // حد أقل للمدفوعات
    60  // نافذة 60 دقيقة
  );

  if (!allowed) {
    return res.status(429).json({
      success: false,
      error: 'Too many payment requests. Please try again later.'
    });
  }

  res.setHeader('X-RateLimit-Remaining', remaining.toString());

  try {
    switch (req.method) {
      case 'GET': {
        // جلب طلبات الدفع
        const { status } = req.query;
        const requests = await getPaymentRequests(status as any);

        return res.status(200).json({
          success: true,
          data: requests,
          count: requests.length
        });
      }

      case 'POST': {
        // إنشاء طلب دفع جديد
        const {
          studentId,
          courseId,
          studentName,
          studentPhone,
          courseName,
          amount,
          vodafoneNumber,
          teacherId,
          whatsappMessage
        } = req.body;

        // التحقق من الحقول المطلوبة
        if (!studentName || !studentPhone || !courseName || !amount || !vodafoneNumber) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields'
          });
        }

        // التحقق من رقم الهاتف
        const phoneRegex = /^01[0-2,5]\d{8}$/;
        if (!phoneRegex.test(studentPhone) || !phoneRegex.test(vodafoneNumber)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid Egyptian phone number format'
          });
        }

        const request = await createPaymentRequest({
          studentId,
          courseId,
          studentName,
          studentPhone,
          courseName,
          amount,
          vodafoneNumber,
          teacherId,
          whatsappMessage
        });

        if (!request) {
          return res.status(500).json({
            success: false,
            error: 'Failed to create payment request'
          });
        }

        // إرسال رسالة WhatsApp
        const whatsappUrl = `https://wa.me/2${vodafoneNumber}?text=${encodeURIComponent(whatsappMessage || 
          `مرحباً، أنا ${studentName}
          رقمي: ${studentPhone}
          
          قمت بتحويل مبلغ ${amount} جنيه
          للاشتراك في: ${courseName}
          
          كود الكورس: ${courseId}
          التاريخ: ${new Date().toLocaleString('ar-EG')}
          
          برجاء تفعيل اشتراكي.`)
        }`;

        return res.status(201).json({
          success: true,
          data: request,
          whatsappUrl,
          message: 'Payment request created successfully'
        });
      }

      case 'PUT': {
        // الموافقة أو رفض طلب دفع
        const { requestId, action, adminId, notes } = req.body;

        if (!requestId || !action || !adminId) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields'
          });
        }

        let result;
        if (action === 'approve') {
          result = await approvePaymentRequest(requestId, adminId, notes);
        } else if (action === 'reject') {
          if (!notes) {
            return res.status(400).json({
              success: false,
              error: 'Rejection reason is required'
            });
          }
          result = await rejectPaymentRequest(requestId, adminId, notes);
        } else {
          return res.status(400).json({
            success: false,
            error: 'Invalid action. Use "approve" or "reject"'
          });
        }

        if (!result) {
          return res.status(500).json({
            success: false,
            error: `Failed to ${action} payment request`
          });
        }

        return res.status(200).json({
          success: true,
          data: result,
          message: `Payment request ${action}d successfully`
        });
      }

      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Payment API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
