import { NextResponse } from 'next/server';

/**
 * DEPRECATED (3.2): use DELETE /api/users/me/favorites { propertyId }.
 */
export function DELETE() {
  return NextResponse.json({ error: 'Use DELETE /api/users/me/favorites { propertyId }' }, { status: 410 });
}
