import { NextResponse } from 'next/server';

/**
 * DEPRECATED (3.4). This endpoint only console.log'd the request and returned
 * a fake { success: true } without notifying anyone — a stub, not a feature.
 * It has no callers. Contacting a broker happens through the real flows:
 * a viewing request (POST /api/viewings) or the chat. Kept as 410 to catch
 * any straggler and avoid silently pretending a message was sent.
 */
export function POST() {
  return NextResponse.json(
    { error: 'Contact a broker via a viewing request (POST /api/viewings) or chat.' },
    { status: 410 }
  );
}
