import { NextResponse } from 'next/server';

/**
 * DEPRECATED (3.2): preferences are updated via PATCH /api/users/me. No live callers.
 */
const gone = () => NextResponse.json({ error: 'Use PATCH /api/users/me' }, { status: 410 });
export function GET() { return gone(); }
export function PUT() { return gone(); }
export function PATCH() { return gone(); }
