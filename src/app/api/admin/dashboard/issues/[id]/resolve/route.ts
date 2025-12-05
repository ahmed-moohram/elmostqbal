import { NextRequest, NextResponse } from 'next/server';
import { resolveIssue } from '../../../_store';

export async function PUT(_req: NextRequest, { params }: { params: { id: string } }) {
	const ok = await resolveIssue(String(params.id));
	if (!ok) return NextResponse.json({ error: 'not_found' }, { status: 404 });
	return NextResponse.json({ success: true });
}