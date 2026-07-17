import { NextResponse } from 'next/server';

/**
 * DEPRECATED (3.2): favorites are served from the canonical /api/users/me/favorites.
 * This duplicate is kept as a 410 to catch any stragglers.
 */
const gone = () => NextResponse.json({ error: 'Use /api/users/me/favorites' }, { status: 410 });

export function GET() { return gone(); }
export function POST() { return gone(); }
