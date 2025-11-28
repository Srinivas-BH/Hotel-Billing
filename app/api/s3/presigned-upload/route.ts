import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { generatePresignedUploadUrl, generateFileKey, getPhotosBucket, getInvoicesBucket } from '@/lib/s3';
import { z } from 'zod';

// Validation schema for presigned upload request
const PresignedUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string().regex(/^(image\/(jpeg|png|gif|webp)|application\/pdf)$/),
  folder: z.enum(['photos', 'invoices']),
});

// Allowed file types and their max sizes (in bytes)
const FILE_SIZE_LIMITS = {
  'image/jpeg': 5 * 1024 * 1024, // 5MB
  'image/png': 5 * 1024 * 1024,  // 5MB
  'image/gif': 5 * 1024 * 1024,  // 5MB
  'image/webp': 5 * 1024 * 1024, // 5MB
  'application/pdf': 10 * 1024 * 1024, // 10MB
};

/**
 * POST /api/s3/presigned-upload
 * Generate a presigned URL for uploading a file to S3
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request (optional for signup photo uploads)
    const authHeader = request.headers.get('authorization');
    const user = authenticateRequest(authHeader);

    // For signup, we allow unauthenticated uploads to the photos folder only
    const body = await request.json();
    const isSignupUpload = body.folder === 'photos' && !authHeader;
    
    if (!user && !isSignupUpload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body (already parsed above)
    const validation = PresignedUploadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { fileName, fileType, folder } = validation.data;

    // Validate file type
    if (!(fileType in FILE_SIZE_LIMITS)) {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      );
    }

    // Get the appropriate bucket
    const bucket = folder === 'photos' ? getPhotosBucket() : getInvoicesBucket();

    // Generate unique file key
    const userId = user?.userId || 'signup';
    const fileKey = generateFileKey(`${folder}/${userId}`, fileName);

    // Generate presigned upload URL
    const uploadUrl = await generatePresignedUploadUrl(bucket, fileKey, fileType);

    return NextResponse.json({
      uploadUrl,
      fileKey,
      expiresIn: 900, // 15 minutes in seconds
    });
  } catch (error) {
    console.error('Error generating presigned upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
