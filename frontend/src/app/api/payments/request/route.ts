import { NextRequest, NextResponse } from 'next/server';
import * as payment from '../../payment-request/route';

export async function GET(req: NextRequest) {
  return payment.GET(req as any);
}

export async function POST(req: NextRequest) {
  return payment.POST(req as any);
}

export async function PATCH(req: NextRequest) {
  return payment.PATCH(req as any);
}