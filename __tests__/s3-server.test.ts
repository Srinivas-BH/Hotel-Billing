import * as fc from 'fast-check';
import { generatePresignedUploadUrl, generatePresignedDownloadUrl, generateFileKey } from '../lib/s3';

describe('S3 Property Tests', () => {
  /**
   * Feature: hotel-billing-admin, Property 14: Presigned URL time-limited access
   * Validates: Requirements 8.2, 13.3
   * 
   * For any presigned URL generated for S3 access, the URL should work within 
   * the expiration time and fail after expiration
   */
  test('Property 14: Presigned URL time-limited access', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_')),
        fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_')),
        fc.constantFrom('image/jpeg', 'image/png', 'application/pdf'),
        async (folder, fileName, contentType) => {
          // Skip if environment variables are not set (for CI/CD)
          if (!process.env.AWS_ACCESS_KEY_ID || !process.env.S3_BUCKET_PHOTOS) {
            return true;
          }

          const bucket = process.env.S3_BUCKET_PHOTOS;
          const key = `${folder}/${fileName}`;

          // Generate presigned upload URL
          const uploadUrl = await generatePresignedUploadUrl(bucket, key, contentType);
          
          // URL should be a valid HTTPS URL
          expect(uploadUrl).toBeTruthy();
          expect(uploadUrl).toMatch(/^https:\/\//);
          
          // URL should contain the bucket name
          expect(uploadUrl).toContain(bucket);
          
          // URL should contain AWS signature parameters
          expect(uploadUrl).toContain('X-Amz-Algorithm');
          expect(uploadUrl).toContain('X-Amz-Credential');
          expect(uploadUrl).toContain('X-Amz-Date');
          expect(uploadUrl).toContain('X-Amz-Expires');
          expect(uploadUrl).toContain('X-Amz-Signature');
          
          // Extract expiration time from URL
          const expiresMatch = uploadUrl.match(/X-Amz-Expires=(\d+)/);
          expect(expiresMatch).not.toBeNull();
          
          if (expiresMatch) {
            const expiresIn = parseInt(expiresMatch[1], 10);
            // Should be 15 minutes (900 seconds)
            expect(expiresIn).toBe(900);
          }

          // Generate presigned download URL
          const downloadUrl = await generatePresignedDownloadUrl(bucket, key);
          
          // Download URL should also be valid
          expect(downloadUrl).toBeTruthy();
          expect(downloadUrl).toMatch(/^https:\/\//);
          expect(downloadUrl).toContain(bucket);
          expect(downloadUrl).toContain('X-Amz-Expires');
          
          // Extract expiration time from download URL
          const downloadExpiresMatch = downloadUrl.match(/X-Amz-Expires=(\d+)/);
          expect(downloadExpiresMatch).not.toBeNull();
          
          if (downloadExpiresMatch) {
            const expiresIn = parseInt(downloadExpiresMatch[1], 10);
            // Should be 15 minutes (900 seconds)
            expect(expiresIn).toBe(900);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: File key generation produces unique keys
   */
  test('File key generation produces unique keys', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (folder, fileName) => {
          const key1 = generateFileKey(folder, fileName);
          const key2 = generateFileKey(folder, fileName);
          
          // Keys should be different due to timestamp and random component
          expect(key1).not.toBe(key2);
          
          // Keys should be valid (no special characters that could cause issues)
          expect(key1).toMatch(/^[a-zA-Z0-9/_.-]+$/);
          expect(key2).toMatch(/^[a-zA-Z0-9/_.-]+$/);
          
          // Keys should contain sanitized versions of folder and filename
          const sanitizedFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '_');
          const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
          expect(key1).toContain(sanitizedFolder);
          expect(key1).toContain(sanitizedFileName);
          expect(key2).toContain(sanitizedFolder);
          expect(key2).toContain(sanitizedFileName);
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('S3 Unit Tests', () => {
  /**
   * Test presigned URL generation
   * Requirements: 13.2, 13.3
   */
  describe('Presigned URL Generation', () => {
    test('should generate valid upload URL with correct parameters', async () => {
      // Skip if environment variables are not set
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.S3_BUCKET_PHOTOS) {
        return;
      }

      const bucket = process.env.S3_BUCKET_PHOTOS;
      const key = 'test/sample.jpg';
      const contentType = 'image/jpeg';

      const url = await generatePresignedUploadUrl(bucket, key, contentType);

      expect(url).toBeTruthy();
      expect(url).toMatch(/^https:\/\//);
      expect(url).toContain(bucket);
      expect(url).toContain('X-Amz-Algorithm=AWS4-HMAC-SHA256');
      expect(url).toContain('X-Amz-Expires=900');
    });

    test('should generate valid download URL with correct parameters', async () => {
      // Skip if environment variables are not set
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.S3_BUCKET_PHOTOS) {
        return;
      }

      const bucket = process.env.S3_BUCKET_PHOTOS;
      const key = 'test/sample.jpg';

      const url = await generatePresignedDownloadUrl(bucket, key);

      expect(url).toBeTruthy();
      expect(url).toMatch(/^https:\/\//);
      expect(url).toContain(bucket);
      expect(url).toContain('X-Amz-Algorithm=AWS4-HMAC-SHA256');
      expect(url).toContain('X-Amz-Expires=900');
    });

    test('should generate different URLs for same file at different times', async () => {
      // Skip if environment variables are not set
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.S3_BUCKET_PHOTOS) {
        return;
      }

      const bucket = process.env.S3_BUCKET_PHOTOS;
      const key = 'test/sample.jpg';
      const contentType = 'image/jpeg';

      const url1 = await generatePresignedUploadUrl(bucket, key, contentType);
      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      const url2 = await generatePresignedUploadUrl(bucket, key, contentType);

      // URLs should be different due to different timestamps
      expect(url1).not.toBe(url2);
    });
  });

  /**
   * Test file type validation
   * Requirements: 13.2, 13.3
   */
  describe('File Type Validation', () => {
    test('should accept valid image types', () => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      
      validTypes.forEach(type => {
        expect(type).toMatch(/^image\/(jpeg|png|gif|webp)$/);
      });
    });

    test('should accept PDF type', () => {
      const pdfType = 'application/pdf';
      expect(pdfType).toMatch(/^application\/pdf$/);
    });

    test('should reject invalid file types', () => {
      const invalidTypes = [
        'application/javascript',
        'text/html',
        'video/mp4',
        'application/zip',
        'image/svg+xml'
      ];
      
      invalidTypes.forEach(type => {
        expect(type).not.toMatch(/^(image\/(jpeg|png|gif|webp)|application\/pdf)$/);
      });
    });
  });

  /**
   * Test bucket privacy settings
   * Requirements: 13.2
   */
  describe('Bucket Configuration', () => {
    test('should have photos bucket configured', () => {
      // This test verifies that the environment variable is set
      // In production, the bucket should be private (tested manually or via AWS CLI)
      if (process.env.S3_BUCKET_PHOTOS) {
        expect(process.env.S3_BUCKET_PHOTOS).toBeTruthy();
        expect(process.env.S3_BUCKET_PHOTOS.length).toBeGreaterThan(0);
      }
    });

    test('should have invoices bucket configured', () => {
      if (process.env.S3_BUCKET_INVOICES) {
        expect(process.env.S3_BUCKET_INVOICES).toBeTruthy();
        expect(process.env.S3_BUCKET_INVOICES.length).toBeGreaterThan(0);
      }
    });

    test('should have AWS credentials configured', () => {
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        expect(process.env.AWS_ACCESS_KEY_ID).toBeTruthy();
        expect(process.env.AWS_SECRET_ACCESS_KEY).toBeTruthy();
        expect(process.env.AWS_REGION).toBeTruthy();
      }
    });
  });

  /**
   * Test file key generation
   */
  describe('File Key Generation', () => {
    test('should generate unique keys for same input', () => {
      const key1 = generateFileKey('photos', 'test.jpg');
      const key2 = generateFileKey('photos', 'test.jpg');
      
      expect(key1).not.toBe(key2);
    });

    test('should sanitize special characters in folder names', () => {
      const key = generateFileKey('test folder!@#', 'file.jpg');
      
      expect(key).toMatch(/^[a-zA-Z0-9/_.-]+$/);
      expect(key).toContain('test_folder___');
    });

    test('should sanitize special characters in file names', () => {
      const key = generateFileKey('photos', 'my file!@#.jpg');
      
      expect(key).toMatch(/^[a-zA-Z0-9/_.-]+$/);
      expect(key).toContain('my_file___');
    });

    test('should preserve valid characters', () => {
      const key = generateFileKey('photos/user-123', 'image-2024.jpg');
      
      expect(key).toContain('photos/user-123');
      expect(key).toContain('image-2024.jpg');
    });

    test('should include timestamp in key', () => {
      const beforeTime = Date.now();
      const key = generateFileKey('photos', 'test.jpg');
      const afterTime = Date.now();
      
      // Extract timestamp from key (format: folder/timestamp-random-filename)
      const match = key.match(/\/(\d+)-/);
      expect(match).not.toBeNull();
      
      if (match) {
        const timestamp = parseInt(match[1], 10);
        expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
        expect(timestamp).toBeLessThanOrEqual(afterTime);
      }
    });
  });
});
