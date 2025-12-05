import crypto from 'crypto';

/**
 * CSRF Protection
 * حماية من هجمات Cross-Site Request Forgery
 */

class CSRFProtection {
  private tokens: Map<string, { token: string; expires: number }> = new Map();
  private readonly tokenLifetime: number = 3600000; // 1 ساعة

  /**
   * توليد CSRF Token جديد
   */
  generateToken(sessionId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + this.tokenLifetime;
    
    this.tokens.set(sessionId, { token, expires });
    
    // تنظيف التوكنات المنتهية
    this.cleanup();
    
    return token;
  }

  /**
   * التحقق من صحة التوكن
   */
  verifyToken(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId);
    
    if (!stored) {
      return false;
    }
    
    // التحقق من الانتهاء
    if (Date.now() > stored.expires) {
      this.tokens.delete(sessionId);
      return false;
    }
    
    // التحقق من التطابق
    return crypto.timingSafeEqual(
      Buffer.from(stored.token),
      Buffer.from(token)
    );
  }

  /**
   * حذف توكن بعد الاستخدام
   */
  invalidateToken(sessionId: string): void {
    this.tokens.delete(sessionId);
  }

  /**
   * تنظيف التوكنات المنتهية
   */
  private cleanup(): void {
    const now = Date.now();
    
    this.tokens.forEach((data, sessionId) => {
      if (now > data.expires) {
        this.tokens.delete(sessionId);
      }
    });
  }
}

export const csrfProtection = new CSRFProtection();

/**
 * React Hook للحصول على CSRF Token
 */
export function useCSRFToken(): {
  token: string | null;
  refreshToken: () => Promise<string>;
} {
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {
    fetchToken();
  }, []);
  
  const fetchToken = async () => {
    try {
      const response = await fetch('/api/csrf-token', {
        credentials: 'include'
      });
      const data = await response.json();
      setToken(data.token);
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    }
  };
  
  return {
    token,
    refreshToken: fetchToken
  };
}

/**
 * إضافة CSRF Token للـ Headers
 */
export function addCSRFHeader(headers: Headers, token: string): Headers {
  headers.set('X-CSRF-Token', token);
  return headers;
}

/**
 * Middleware للتحقق من CSRF في API Routes
 */
export async function csrfMiddleware(
  req: Request
): Promise<Response | null> {
  // تجاهل GET requests
  if (req.method === 'GET' || req.method === 'HEAD') {
    return null;
  }
  
  // الحصول على Session ID
  const cookies = req.headers.get('cookie');
  const sessionId = extractSessionId(cookies);
  
  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: 'No session found' }),
      { status: 401 }
    );
  }
  
  // الحصول على CSRF Token
  const token = req.headers.get('X-CSRF-Token') || 
                req.headers.get('csrf-token');
  
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'CSRF token missing' }),
      { status: 403 }
    );
  }
  
  // التحقق من التوكن
  if (!csrfProtection.verifyToken(sessionId, token)) {
    return new Response(
      JSON.stringify({ error: 'Invalid CSRF token' }),
      { status: 403 }
    );
  }
  
  return null;
}

// دالة مساعدة لاستخراج Session ID
function extractSessionId(cookies: string | null): string | null {
  if (!cookies) return null;
  
  const sessionCookie = cookies
    .split(';')
    .find(c => c.trim().startsWith('sessionId='));
  
  if (!sessionCookie) return null;
  
  return sessionCookie.split('=')[1];
}

// دالة import لـ useState و useEffect
import { useState, useEffect } from 'react';
