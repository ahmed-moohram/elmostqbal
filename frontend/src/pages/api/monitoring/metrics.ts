import { NextApiRequest, NextApiResponse } from 'next';
import { 
  recordMetric, 
  getMetrics,
  trackPerformance,
  logAPIError
} from '@/lib/database/security-db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET': {
        // جلب المقاييس
        const { type, startDate, endDate } = req.query;
        
        let timeRange;
        if (startDate && endDate) {
          timeRange = {
            start: new Date(startDate as string),
            end: new Date(endDate as string)
          };
        }

        const metrics = await getMetrics(type as string, timeRange);

        // حساب المتوسطات
        const averages = metrics.reduce((acc, metric) => {
          if (!acc[metric.metric_type]) {
            acc[metric.metric_type] = { total: 0, count: 0, avg: 0 };
          }
          acc[metric.metric_type].total += metric.value;
          acc[metric.metric_type].count++;
          acc[metric.metric_type].avg = acc[metric.metric_type].total / acc[metric.metric_type].count;
          return acc;
        }, {} as Record<string, any>);

        return res.status(200).json({
          success: true,
          data: metrics,
          averages,
          count: metrics.length
        });
      }

      case 'POST': {
        // تسجيل مقياس جديد
        const { type, value, unit, metadata } = req.body;

        if (!type || value === undefined) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields: type, value'
          });
        }

        const success = await recordMetric(type, value, unit, metadata);

        if (!success) {
          return res.status(500).json({
            success: false,
            error: 'Failed to record metric'
          });
        }

        // تسجيل في console للمراقبة الفورية
        console.log(`📊 Metric recorded: ${type} = ${value}${unit ? ' ' + unit : ''}`);

        return res.status(201).json({
          success: true,
          message: 'Metric recorded successfully',
          metric: { type, value, unit, timestamp: new Date().toISOString() }
        });
      }

      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
    }
  } catch (error) {
    // تسجيل الخطأ
    await logAPIError({
      endpoint: '/api/monitoring/metrics',
      method: req.method || 'UNKNOWN',
      statusCode: 500,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      stackTrace: error instanceof Error ? error.stack : undefined
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
