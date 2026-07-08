// app/api/users/me/avatar/route.ts
import { NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import prisma from '@/lib/db/prisma';

const AVATAR_DIR = path.join(process.cwd(), 'public', 'uploads', 'avatars');
const MAX_SIZE = 2 * 1024 * 1024; // 2MB for avatars
const VALID_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

async function handler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No avatar file provided' }, { status: 400 });
    }

    if (!VALID_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Avatar too large (max 2MB)' },
        { status: 400 }
      );
    }

    await mkdir(AVATAR_DIR, { recursive: true });

    // Get current avatar to delete later
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar_url: true },
    });

    // Save new avatar
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${userId}-${uuidv4()}.${ext}`;
    const filepath = path.join(AVATAR_DIR, filename);
    const avatarUrl = `/uploads/avatars/${filename}`;

    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    // Update user record
    await prisma.user.update({
      where: { id: userId },
      data: { avatar_url: avatarUrl },
    });

    // Delete old avatar if exists (non-blocking)
    if (currentUser?.avatar_url) {
      const oldPath = path.join(process.cwd(), 'public', currentUser.avatar_url);
      unlink(oldPath).catch(() => {}); // Ignore errors
    }

    return NextResponse.json({
      success: true,
      avatar_url: avatarUrl,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}

export const POST = withAuth(handler);
