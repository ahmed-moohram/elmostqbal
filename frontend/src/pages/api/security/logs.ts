import { NextApiRequest, NextApiResponse } from 'next';
import { 
  logSecurityEvent, 
  getSecurityLogs 
} from '@/lib/database/security-db';

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
    if (req.method === 'GET') {
      // جلب السجلات
      const { userId, eventType, severity, limit } = req.query;
      
      const logs = await getSecurityLogs({
        userId: userId as string,
        eventType: eventType as string,
        severity: severity as string,
        limit: limit ? parseInt(limit as string) : undefined
      });

      return res.status(200).json({
        success: true,
        data: logs,
        count: logs.length
      });

    } else if (req.method === 'POST') {
      // إضافة سجل جديد
      const { eventType, severity, details, userId, blocked } = req.body;

      if (!eventType || !severity) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: eventType, severity'
        });
      }

      const log = await logSecurityEvent(
        eventType,
        severity,
        details,
        userId,
        blocked
      );

      return res.status(201).json({
        success: true,
        data: log,
        message: 'Security event logged successfully'
      });

    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('Security logs API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
