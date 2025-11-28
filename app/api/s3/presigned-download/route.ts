import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { generatePresignedDownloadUrl, getPhotosBucket, getInvoicesBucket } from '@/lib/s3';
import { z } from 'zod';

// Validation schema for presigned download request
const PresignedDownloadSchema = z.object({
  fileKey: z.string().min(1).max(500),
});

/**
 * POST /api/s3/presigned-download
 * Generate a presigned URL for downloading a file from S3
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authHeader = request.headers.get('authorization');
    const user = authenticateRequest(authHeader);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = PresignedDownloadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { fileKey } = validation.data;

    // Determine bucket based on file key prefix
    let bucket: string;
    if (fileKey.startsWith('photos/')) {
      bucket = getPhotosBucket();
    } else if (fileKey.startsWith('invoices/')) {
      bucket = getInvoicesBucket();
    } else {
      return NextResponse.json(
        { error: 'Invalid file key format' },
        { status: 400 }
      );
    }

    // Verify that the file belongs to the authenticated user
    // File keys should be in format: folder/userId/...
    const keyParts = fileKey.split('/');
    if (keyParts.length < 2 || keyParts[1] !== user.userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to file' },
        { status: 403 }
      );
    }

    // Generate presigned download URL
    const downloadUrl = await generatePresignedDownloadUrl(bucket, fileKey);

    return NextResponse.json({
      downloadUrl,
      expiresIn: 900, // 15 minutes in seconds
    });
  } catch (error) {
    console.error('Error generating presigned download URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    );
  }
}
