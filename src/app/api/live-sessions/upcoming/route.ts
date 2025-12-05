import { NextResponse } from 'next/server';
import { upcoming } from '../_store';

export async function GET() {
  return NextResponse.json({ sessions: upcoming() });
}