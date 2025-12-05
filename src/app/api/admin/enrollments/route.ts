import { NextRequest, NextResponse } from 'next/server';
import { listEnrollments } from './_store';

export async function GET(_req: NextRequest) {
  return NextResponse.json(listEnrollments());
}