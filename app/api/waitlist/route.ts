import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rateLimiter';
import { validateBody } from '@/lib/validations/validate';
import { waitlistSchema } from '@/lib/validations/schemas/chat';

/**
 * POST /api/waitlist  { email }
 * Store a coming-soon waitlist email (idempotent by email).
 */
export async function POST(req: NextRequest) {
  try {
    // Rate-limit public signups per IP to curb spam (VULN-016).
    const rl = checkRateLimit(`waitlist:${getClientIP(req)}`, RATE_LIMITS.contactAgent);
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many requests', success: false }, { status: 429 });
    }

    // Schema validation (VULN-022): strict { email } via shared emailSchema (lowercased).
    const validation = validateBody(waitlistSchema, await req.json());
    if (!validation.success) return validation.error;
    const v = validation.data.email;
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
