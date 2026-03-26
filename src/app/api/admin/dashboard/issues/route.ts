import { NextResponse } from 'next/server';
import { getIssues } from '../_store';

export async function GET() {
	const data = await getIssues();
	return NextResponse.json(data);
}