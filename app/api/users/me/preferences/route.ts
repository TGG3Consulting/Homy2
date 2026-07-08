// app/api/users/me/preferences/route.ts
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { prisma } from '@/lib/db/prisma';

async function handler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  const body = await req.json();
  const { language_preference, user_type, phone } = body;

  const updateData: Record<string, string> = {};
  if (language_preference) updateData.language_preference = language_preference;
  if (user_type) updateData.user_type = user_type;
  if (phone) updateData.phone = phone;

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      user_type: true,
      language_preference: true,
      phone: true
    }
  });

  return NextResponse.json({
    success: true,
    user
  });
}

export const PUT = withAuth(handler);
