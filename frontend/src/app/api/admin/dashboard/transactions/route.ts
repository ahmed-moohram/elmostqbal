import { NextRequest, NextResponse } from 'next/server';
import { getTransactions } from '../_store';

export async function GET(_req: NextRequest) {
  return NextResponse.json(getTransactions());
}