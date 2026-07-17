import { NextResponse } from 'next/server';

/**
 * DEPRECATED (3.2): a viewing "reject" is the same as cancel — use
 * POST /api/viewings/[id]/cancel. No live callers.
 */
const gone = () => NextResponse.json({ error: 'Use /api/viewings/[id]/cancel' }, { status: 410 });
export function POST() { return gone(); }
export function DELETE() { return gone(); }
