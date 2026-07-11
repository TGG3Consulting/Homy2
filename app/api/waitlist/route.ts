import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

/**
 * POST /api/waitlist  { email }
 * Store a coming-soon waitlist email (idempotent by email).
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const v = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!/.+@.+\..+/.test(v)) {
      return NextResponse.json({ error: 'Invalid email', success: false }, { status: 400 });
    }
    await prisma.waitlistEntry.upsert({
      where: { email: v },
      update: {},
      create: { email: v },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/waitlist] Error:', error);
    return NextResponse.json({ error: 'Failed', success: false }, { status: 500 });
  }
}
