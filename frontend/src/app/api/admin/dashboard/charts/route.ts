import { NextRequest, NextResponse } from 'next/server';
import { getCharts } from '../_store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'month';
  const data = await getCharts(period);
  return NextResponse.json(data);
}