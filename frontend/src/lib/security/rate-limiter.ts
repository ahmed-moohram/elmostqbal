/**
 * Rate Limiter للحماية من الهجمات
 * يحد من عدد الطلبات لكل IP
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMinutes: number = 15) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMinutes * 60 * 1000;
    
    // تنظيف الذاكرة كل دقيقة
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * التحقق من الحد المسموح
   */
  checkLimit(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetTime: Date;
  } {
    const now = Date.now();
    const entry = this.limits.get(identifier);

    if (!entry || now > entry.resetTime) {
      // إنشاء entry جديد
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: new Date(now + this.windowMs)
      };
    }

    // التحقق من الحد
    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(entry.resetTime)
      };
    }

    // زيادة العداد
    entry.count++;
    
    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: new Date(entry.resetTime)
    };
  }

  /**
   * تنظيف الإدخالات المنتهية
   */
  private cleanup(): void {
    const now = Date.now();
    
    this.limits.forEach((entry, key) => {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    });
  }

  /**
   * إعادة تعيين حد معين
   */
  reset(identifier: string): void {
    this.limits.delete(identifier);
  }

  /**
   * الحصول على الإحصائيات
   */
  getStats(): {
    totalEntries: number;
    memoryUsage: string;
  } {
    return {
      totalEntries: this.limits.size,
      memoryUsage: `${(this.limits.size * 100 / 1024).toFixed(2)} KB`
    };
  }
}

// Rate Limiters لأنواع مختلفة من العمليات
export const apiLimiter = new RateLimiter(100, 15); // 100 طلب كل 15 دقيقة
export const authLimiter = new RateLimiter(5, 15); // 5 محاولات تسجيل دخول
export const uploadLimiter = new RateLimiter(10, 60); // 10 رفعات كل ساعة
export const paymentLimiter = new RateLimiter(3, 60); // 3 محاولات دفع كل ساعة

// Middleware للتحقق من Rate Limit
export async function checkRateLimit(
  req: Request,
  limiter: RateLimiter = apiLimiter
): Promise<Response | null> {
  // الحصول على IP
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown';
  
  const result = limiter.checkLimit(ip);
  
  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: 'لقد تجاوزت الحد المسموح من الطلبات. حاول مرة أخرى لاحقاً.',
        resetTime: result.resetTime
      }),
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(100),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset': result.resetTime.toISOString(),
          'Retry-After': String(Math.ceil((result.resetTime.getTime() - Date.now()) / 1000))
        }
      }
    );
  }
  
  return null;
}
