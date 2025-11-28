import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3 client configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Presigned URL expiration time (15 minutes in seconds)
const PRESIGNED_URL_EXPIRATION = 15 * 60;

/**
 * Get the S3 client instance
 */
export function getS3Client(): S3Client {
  return s3Client;
}

/**
 * Generate a presigned URL for uploading a file to S3
 * @param bucket - S3 bucket name
 * @param key - Object key (file path) in S3
 * @param contentType - MIME type of the file
 * @returns Promise resolving to the presigned upload URL
 */
export async function generatePresignedUploadUrl(
  bucket: string,
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, command, {
    expiresIn: PRESIGNED_URL_EXPIRATION,
  });

  return url;
}

/**
 * Generate a presigned URL for downloading a file from S3
 * @param bucket - S3 bucket name
 * @param key - Object key (file path) in S3
 * @returns Promise resolving to the presigned download URL
 */
export async function generatePresignedDownloadUrl(
  bucket: string,
  key: string
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, {
    expiresIn: PRESIGNED_URL_EXPIRATION,
  });

  return url;
}

/**
 * Get the bucket name for hotel photos
 */
export function getPhotosBucket(): string {
  const bucket = process.env.S3_BUCKET_PHOTOS;
  if (!bucket) {
    throw new Error('S3_BUCKET_PHOTOS environment variable is not set');
  }
  return bucket;
}

/**
 * Get the bucket name for invoices
 */
export function getInvoicesBucket(): string {
  const bucket = process.env.S3_BUCKET_INVOICES;
  if (!bucket) {
    throw new Error('S3_BUCKET_INVOICES environment variable is not set');
  }
  return bucket;
}

/**
 * Generate a unique file key for S3 storage
 * @param folder - Folder path in the bucket
 * @param fileName - Original file name
 * @returns Unique file key with timestamp
 */
export function generateFileKey(folder: string, fileName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const sanitizedFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '_').replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  // Handle empty folder case
  if (!sanitizedFolder) {
    return `${timestamp}-${randomString}-${sanitizedFileName}`;
  }
  
  return `${sanitizedFolder}/${timestamp}-${randomString}-${sanitizedFileName}`;
}
