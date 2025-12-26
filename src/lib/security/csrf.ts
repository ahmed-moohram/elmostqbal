import { cookies } from 'next/headers';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const CSRF_SECRET = process.env.CSRF_SECRET || 'change-this-in-production';

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const token = crypto.randomBytes(32).toString('hex');
  return token;
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(token: string, cookieToken: string): boolean {
  if (!token || !cookieToken) {
    return false;
  }
  return token === cookieToken;
}

/**
 * Get CSRF token from cookies
 */
export async function getCSRFToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('csrf-token')?.value || null;
}

/**
 * Set CSRF token in cookies
 */
export async function setCSRFToken(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

/**
 * CSRF middleware for API routes (Next.js compatible)
 */
export async function validateCSRF(request: NextRequest | Request): Promise<{ valid: boolean; error?: string }> {
  // Skip CSRF for GET requests
  if (request.method === 'GET' || request.method === 'HEAD') {
    return { valid: true };
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get('csrf-token')?.value;

  if (!cookieToken) {
    return { valid: false, error: 'CSRF token missing in cookies' };
  }

  // Try to get token from header first, then from body
  const headerToken = request.headers.get('x-csrf-token');
  
  if (headerToken) {
    if (verifyCSRFToken(headerToken, cookieToken)) {
      return { valid: true };
    }
    return { valid: false, error: 'Invalid CSRF token in header' };
  }

  // Try to get from body for POST requests
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const bodyToken = body._csrf || body.csrfToken;
      
      if (bodyToken && verifyCSRFToken(bodyToken, cookieToken)) {
        return { valid: true };
      }
    } catch (error) {
      // If body is not JSON, continue
    }
  }

  return { valid: false, error: 'CSRF token missing or invalid' };
}

