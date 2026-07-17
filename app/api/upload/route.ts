// app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 10;
const VALID_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Extension is derived from the SNIFFED type, never the client filename (VULN-018).
const EXT_BY_TYPE: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Verify real image type by magic bytes (client MIME + filename are untrusted). */
function sniffImageType(buf: Buffer): keyof typeof EXT_BY_TYPE | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

interface UploadedFile {
  url: string;
  originalName: string;
  size: number;
  type: string;
}

async function handler(req: AuthenticatedRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    // Validation: No files
    if (!files.length) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validation: Too many files
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Too many files (max ${MAX_FILES})` },
        { status: 400 }
      );
    }

    // Validate each file before processing
    for (const file of files) {
      if (!VALID_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" too large (max 5MB)` },
          { status: 400 }
        );
      }
    }

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    const uploadedFiles: UploadedFile[] = [];

    // Process each file
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());

      // Content sniff: reject anything that isn't a real allowed image, and
      // derive the extension from the sniffed type — the client filename/MIME
      // are never trusted for the saved name (VULN-018).
      const sniffed = sniffImageType(buffer);
      if (!sniffed) {
        return NextResponse.json(
          { error: `File "${file.name}" is not a valid JPEG/PNG/WebP image` },
          { status: 400 }
        );
      }

      const filename = `${uuidv4()}.${EXT_BY_TYPE[sniffed]}`;
      const filepath = path.join(UPLOAD_DIR, filename);
      await writeFile(filepath, buffer);

      uploadedFiles.push({
        url: `/uploads/${filename}`,
        originalName: file.name,
        size: file.size,
        type: sniffed,
      });
    }

    return NextResponse.json({
      success: true,
      urls: uploadedFiles.map((f) => f.url),
      files: uploadedFiles,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
