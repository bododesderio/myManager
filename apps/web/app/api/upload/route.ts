import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') ?? '';

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type must be multipart/form-data' },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 },
      );
    }

    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 413 },
      );
    }

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/quicktime', 'video/webm',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not supported' },
        { status: 400 },
      );
    }

    const fileId = crypto.randomUUID();
    const ext = file.name.split('.').pop() || 'bin';
    const filename = `${fileId}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const storageDriver = process.env.STORAGE_DRIVER || 'local';

    if (storageDriver === 'r2' && process.env.CLOUDFLARE_R2_ACCESS_KEY) {
      // Upload to Cloudflare R2
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
      const s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY!,
          secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY!,
        },
      });

      await s3.send(new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET,
        Key: `uploads/${filename}`,
        Body: buffer,
        ContentType: file.type,
      }));

      const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || `https://${process.env.CLOUDFLARE_R2_BUCKET}.r2.dev`;

      return NextResponse.json({
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        url: `${publicUrl}/uploads/${filename}`,
      });
    }

    // Local storage fallback
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    return NextResponse.json({
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      url: `/uploads/${filename}`,
    });
  } catch (err) {
    console.error('Upload failed:', err);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 },
    );
  }
}
