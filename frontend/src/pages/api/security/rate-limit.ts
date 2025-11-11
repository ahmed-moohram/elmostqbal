import { NextApiRequest, NextApiResponse } from 'next';
import { checkRateLimit } from '@/lib/database/security-db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // الحصول على معرف المستخدم (IP أو user ID)
    const identifier = req.headers['x-forwarded-for'] as string || 
                      req.socket.remoteAddress || 
                      'unknown';
    
    // الحصول على المسار
    const endpoint = req.url || '/';
    
    // فحص معدل الطلبات
    const { allowed, remaining } = await checkRateLimit(
      identifier,
      endpoint,
      100, // الحد الأقصى للطلبات
      15   // نافذة الوقت بالدقائق
    );

    // إضافة headers للمعلومات
    res.setHeader('X-RateLimit-Limit', '100');
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', new Date(Date.now() + 15 * 60 * 1000).toISOString());

    if (!allowed) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: 'لقد تجاوزت الحد المسموح به من الطلبات. حاول مرة أخرى لاحقاً.',
        remaining: 0,
        resetAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      });
    }

    // إذا كان مسموح، أكمل الطلب
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        allowed: true,
        remaining,
        limit: 100,
        resetAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Request allowed',
      remaining
    });

  } catch (error) {
    console.error('Rate limit API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
