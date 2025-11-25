import { NextResponse } from 'next/server';
import { getIssues } from '../_store';

export async function GET() {
  return NextResponse.json(getIssues());
}