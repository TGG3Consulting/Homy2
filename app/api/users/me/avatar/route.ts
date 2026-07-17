// app/api/users/me/avatar/route.ts
import { NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import prisma from '@/lib/db/prisma';

const AVATAR_DIR = path.join(process.cwd(), 'public', 'uploads', 'avatars');
const UPLOADS_ROOT = path.join(process.cwd(), 'public', 'uploads');
const MAX_SIZE = 2 * 1024 * 1024; // 2MB for avatars
const VALID_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const EXT_BY_TYPE: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Verify real image type by magic bytes (client MIME/filename untrusted) — VULN-018 sibling. */
function sniffImageType(buf: Buffer): keyof typeof EXT_BY_TYPE | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

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

    // Save new avatar — verify real image + extension from sniffed type (VULN-018 sibling).
    const buffer = Buffer.from(await file.arrayBuffer());
    const sniffed = sniffImageType(buffer);
    if (!sniffed) {
      return NextResponse.json({ error: 'Avatar is not a valid JPEG/PNG/WebP image' }, { status: 400 });
    }
    const filename = `${userId}-${uuidv4()}.${EXT_BY_TYPE[sniffed]}`;
    const filepath = path.join(AVATAR_DIR, filename);
    const avatarUrl = `/uploads/avatars/${filename}`;

    await writeFile(filepath, buffer);

    // Update user record
    await prisma.user.update({
      where: { id: userId },
      data: { avatar_url: avatarUrl },
    });

    // Delete old avatar if exists (non-blocking). Confine deletion to the uploads
    // dir so a tampered avatar_url with "../" cannot delete arbitrary files (VULN-019).
    if (currentUser?.avatar_url) {
      const oldPath = path.resolve(process.cwd(), 'public', '.' + currentUser.avatar_url);
      if (oldPath.startsWith(UPLOADS_ROOT + path.sep)) {
        unlink(oldPath).catch(() => {}); // Ignore errors
      }
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
