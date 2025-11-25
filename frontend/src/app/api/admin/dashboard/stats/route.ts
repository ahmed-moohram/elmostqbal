import { NextResponse } from 'next/server';
import { getStats } from '../_store';

export async function GET() {
  return NextResponse.json(getStats());
}