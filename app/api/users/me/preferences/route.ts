// app/api/users/me/preferences/route.ts
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import { prisma } from '@/lib/db/prisma';
import { SELF_ASSIGNABLE_USER_TYPES, isSelfAssignableUserType } from '@/lib/auth/userTypes';

async function handler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  const body = await req.json();
  const { language_preference, user_type, phone } = body;

  // Privileged types ('admin'/'consultant') are NOT self-assignable — they grant
  // access to the admin UI / support desk and must come from admin tooling only.
  if (user_type !== undefined && user_type !== null && !isSelfAssignableUserType(user_type)) {
    return NextResponse.json(
      { error: `Invalid user type. Must be one of: ${SELF_ASSIGNABLE_USER_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

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
