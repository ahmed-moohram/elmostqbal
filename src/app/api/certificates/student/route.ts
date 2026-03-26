import { NextRequest, NextResponse } from 'next/server';
import { listStudentCertificates } from '../_store';

export async function GET(_req: NextRequest) {
  const list = listStudentCertificates();
  return NextResponse.json({ data: list });
}