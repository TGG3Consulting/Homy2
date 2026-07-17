import { NextResponse } from 'next/server';

/**
 * DEPRECATED (3.2 consolidation): this was a second, redundant client-request
 * path. The canonical endpoint is POST /api/viewings, which handles the client
 * request (no clientEmail/clientId → status pending_agent), agent creation, and
 * GET listing — and now also captures the CRM lead that this route used to.
 * The schedule page posts to /api/viewings; this route has no remaining callers.
 * Kept as 410 to catch any straggler.
 */
export function POST() {
  return NextResponse.json(
    { error: 'Use POST /api/viewings to create a viewing.' },
    { status: 410 }
  );
}
