/**
 * Property-Based Tests for S3 Bucket Privacy
 * 
 * **Feature: hotel-billing-admin, Property 22: S3 bucket privacy**
 * **Validates: Requirements 13.2**
 */

import * as fc from 'fast-check';
import { generatePresignedUploadUrl, generatePresignedDownloadUrl, generateFileKey } from '../lib/s3';

describe('Property 22: S3 bucket privacy', () => {
  // Mock environment variables for testing
  const originalEnv = process.env;

  beforeAll(() => {
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
    process.env.S3_BUCKET_PHOTOS = 'test-photos-bucket';
    process.env.S3_BUCKET_INVOICES = 'test-invoices-bucket';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('For any S3 object, presigned URLs should be required for access (URLs contain authentication)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('test-photos-bucket'),
          fc.constant('test-invoices-bucket')
        ),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9._-]+$/.test(s)),
        fc.oneof(
          fc.constant('image/jpeg'),
          fc.constant('image/png'),
          fc.constant('application/pdf')
        ),
        async (bucket, fileName, contentType) => {
          const key = generateFileKey('test-folder', fileName);

          // Generate presigned URLs
          const uploadUrl = await generatePresignedUploadUrl(bucket, key, contentType);
          const downloadUrl = await generatePresignedDownloadUrl(bucket, key);

          // Verify presigned URLs contain authentication parameters
          expect(uploadUrl).toContain('X-Amz-Algorithm');
          expect(uploadUrl).toContain('X-Amz-Credential');
          expect(uploadUrl).toContain('X-Amz-Signature');
          expect(uploadUrl).toContain('X-Amz-Expires');

          expect(downloadUrl).toContain('X-Amz-Algorithm');
          expect(downloadUrl).toContain('X-Amz-Credential');
          expect(downloadUrl).toContain('X-Amz-Signature');
          expect(downloadUrl).toContain('X-Amz-Expires');

          // Verify URLs are HTTPS
          expect(uploadUrl).toMatch(/^https:/);
          expect(downloadUrl).toMatch(/^https:/);

          // Verify direct S3 URLs (without presigned params) would not work
          // by checking that the URL structure requires authentication
          const directUrl = `https://${bucket}.s3.amazonaws.com/${key}`;
          expect(uploadUrl).not.toBe(directUrl);
          expect(downloadUrl).not.toBe(directUrl);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('For any presigned URL, it should have a time-limited expiration (15 minutes)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('test-photos-bucket'),
          fc.constant('test-invoices-bucket')
        ),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9._-]+$/.test(s)),
        async (bucket, fileName) => {
          const key = generateFileKey('test-folder', fileName);

          // Generate presigned download URL
          const downloadUrl = await generatePresignedDownloadUrl(bucket, key);

          // Extract expiration from URL
          const urlParams = new URL(downloadUrl);
          const expiresParam = urlParams.searchParams.get('X-Amz-Expires');

          expect(expiresParam).toBeTruthy();
          const expiresSeconds = parseInt(expiresParam!, 10);

          // Verify expiration is 15 minutes (900 seconds)
          expect(expiresSeconds).toBe(15 * 60);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('For any file key generation, the key should be sanitized to prevent path traversal', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (folder, fileName) => {
          const key = generateFileKey(folder, fileName);

          // Verify no path traversal patterns
          expect(key).not.toContain('..');
          expect(key).not.toContain('//');

          // Verify key contains sanitized folder and filename components
          expect(key).toMatch(/^[a-zA-Z0-9/_.-]+$/);

          // Verify key structure contains timestamp and random components
          // Format: [folder/]timestamp-random-filename
          expect(key).toMatch(/\d+-[a-z0-9]+-/);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('For any bucket access, presigned URLs should use secure HTTPS protocol', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('test-photos-bucket'),
          fc.constant('test-invoices-bucket')
        ),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9._-]+$/.test(s)),
        fc.oneof(
          fc.constant('image/jpeg'),
          fc.constant('application/pdf')
        ),
        async (bucket, fileName, contentType) => {
          const key = generateFileKey('secure-folder', fileName);

          const uploadUrl = await generatePresignedUploadUrl(bucket, key, contentType);
          const downloadUrl = await generatePresignedDownloadUrl(bucket, key);

          // All URLs must use HTTPS
          expect(uploadUrl.startsWith('https://')).toBe(true);
          expect(downloadUrl.startsWith('https://')).toBe(true);

          // URLs should not use HTTP
          expect(uploadUrl.startsWith('http://')).toBe(false);
          expect(downloadUrl.startsWith('http://')).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
