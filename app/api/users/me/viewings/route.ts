import { NextResponse } from 'next/server';

/**
 * DEPRECATED (3.2): replaced by /api/viewings. Kept as 410 to catch stragglers.
 */
const gone = () => NextResponse.json({ error: 'Use /api/viewings' }, { status: 410 });
export function GET() { return gone(); }
export function POST() { return gone(); }
