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
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filename = `${uuidv4()}.${ext}`;
      const filepath = path.join(UPLOAD_DIR, filename);

      const bytes = await file.arrayBuffer();
      await writeFile(filepath, Buffer.from(bytes));

      uploadedFiles.push({
        url: `/uploads/${filename}`,
        originalName: file.name,
        size: file.size,
        type: file.type,
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
