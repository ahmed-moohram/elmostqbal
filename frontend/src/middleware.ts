import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Security headers configuration
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'X-XSS-Protection': '1; mode=block',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// Rate limiting tracking (simple in-memory for now)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Helper function to get client IP
function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return xff ? xff.split(',')[0].trim() : realIp || 'unknown';
}

// Helper function for simple rate limiting
function checkRateLimit(ip: string, limit: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

// Main middleware function
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const url = request.nextUrl;
  const ip = getClientIp(request);

  // Apply security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add CORS headers for API routes
  if (url.pathname.startsWith('/api')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  // Rate limiting for API routes
  if (url.pathname.startsWith('/api')) {
    const allowed = checkRateLimit(ip);
    
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Too many requests. Please try again later.',
          message: 'لقد تجاوزت الحد المسموح به من الطلبات'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }
  }

  // Block suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//g,           // Path traversal
    /<script/gi,         // XSS attempts
    /javascript:/gi,     // JavaScript protocol
    /on\w+\s*=/gi,      // Event handlers
    /union.*select/gi,   // SQL injection
    /drop.*table/gi,     // SQL injection
    /insert.*into/gi,    // SQL injection
    /select.*from/gi,    // SQL injection
  ];

  const requestUrl = request.url;
  const requestBody = await request.text().catch(() => '');
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestUrl) || pattern.test(requestBody)) {
      // Log security event (would connect to database in production)
      console.error(`🚨 Security Alert: Suspicious pattern detected from IP ${ip}`);
      
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Forbidden - Suspicious activity detected',
          message: 'تم رصد نشاط مشبوه'
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }

  // Protected admin routes
  if (url.pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth-token');
    const userRole = request.cookies.get('user-role');

    if (!token || userRole?.value !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Protected teacher routes
  if (url.pathname.startsWith('/teacher')) {
    const token = request.cookies.get('auth-token');
    const userRole = request.cookies.get('user-role');

    if (!token || (userRole?.value !== 'teacher' && userRole?.value !== 'admin')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Add request ID for tracking
  response.headers.set('X-Request-ID', crypto.randomUUID());

  // Add timing header
  response.headers.set('X-Response-Time', Date.now().toString());

  return response;
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
