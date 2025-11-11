import { NextApiRequest, NextApiResponse } from 'next';
import { trackPerformance } from '@/lib/database/security-db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    const {
      pagePath,
      loadTime,
      fcp,  // First Contentful Paint
      lcp,  // Largest Contentful Paint
      fid,  // First Input Delay
      cls,  // Cumulative Layout Shift
      userId
    } = req.body;

    if (!pagePath) {
      return res.status(400).json({
        success: false,
        error: 'Page path is required'
      });
    }

    // تسجيل الأداء
    const success = await trackPerformance({
      pagePath,
      loadTime,
      fcp,
      lcp,
      fid,
      cls,
      userId
    });

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to track performance'
      });
    }

    // تحليل الأداء
    const analysis = {
      status: 'good',
      issues: [] as string[],
      recommendations: [] as string[]
    };

    // تحليل LCP
    if (lcp && lcp > 2500) {
      analysis.status = lcp > 4000 ? 'poor' : 'needs-improvement';
      analysis.issues.push('Largest Contentful Paint is slow');
      analysis.recommendations.push('Optimize images and server response times');
    }

    // تحليل FCP
    if (fcp && fcp > 1800) {
      analysis.status = fcp > 3000 ? 'poor' : 'needs-improvement';
      analysis.issues.push('First Contentful Paint is slow');
      analysis.recommendations.push('Remove render-blocking resources');
    }

    // تحليل FID
    if (fid && fid > 100) {
      analysis.status = fid > 300 ? 'poor' : 'needs-improvement';
      analysis.issues.push('High input delay detected');
      analysis.recommendations.push('Optimize JavaScript execution');
    }

    // تحليل CLS
    if (cls && cls > 0.1) {
      analysis.status = cls > 0.25 ? 'poor' : 'needs-improvement';
      analysis.issues.push('Layout shift detected');
      analysis.recommendations.push('Add size attributes to images and videos');
    }

    return res.status(200).json({
      success: true,
      message: 'Performance tracked successfully',
      analysis,
      metrics: {
        pagePath,
        loadTime,
        fcp,
        lcp,
        fid,
        cls
      }
    });

  } catch (error) {
    console.error('Performance tracking error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
