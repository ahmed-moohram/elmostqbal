import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_replace_in_production';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  // Fallback to checking cookies
  if (!token) {
    const cookieToken = request.cookies.get('auth_token')?.value || request.cookies.get('auth-token')?.value;
    token = cookieToken || null;
  }

  if (!token) {
    return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return NextResponse.json({
      user: {
        id: decoded.sub || decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
        avatar: decoded.avatar || decoded.avatar_url,
        phone: decoded.phone || decoded.studentPhone,
      }
    });
  } catch (error) {
    return NextResponse.json({ message: 'invalid token' }, { status: 401 });
  }
}