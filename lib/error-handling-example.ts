/**
 * Example of how to use the error handling utilities in API routes
 * This demonstrates the integration with the login route
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';
import { sanitizeEmail } from '@/lib/validation';
import { 
  withErrorHandling, 
  ErrorCreators, 
  handleError,
  withRetry 
} from '@/lib/error-handling';

// Validation schema for login with sanitization
const loginSchema = z.object({
  email: z.string().email('Invalid email format').transform(sanitizeEmail),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Example of login route using the new error handling utilities
 * This shows how to integrate structured error handling
 */
async function loginHandler(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  
  try {
    const body = await request.json();
    
    // Validate input - Zod errors are automatically handled by our error system
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      throw ErrorCreators.validationError(validationResult.error.errors);
    }

    const { email, password } = validationResult.data;

    // Database query with retry logic for transient failures
    const result = await withRetry(
      () => query(
        `SELECT id, email, password_hash, hotel_name, table_count, hotel_photo_key, created_at
         FROM hotels
         WHERE email = $1`,
        [email]
      ),
      3, // max retries
      1000, // delay in ms
      'login-user-lookup'
    );

    if (result.rows.length === 0) {
      throw ErrorCreators.unauthorized('Invalid email or password');
    }

    const hotel = result.rows[0];

    // Verify password
    const isValidPassword = await verifyPassword(password, hotel.password_hash);
    if (!isValidPassword) {
      throw ErrorCreators.unauthorized('Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken(hotel.id, hotel.email);

    // Return success response
    return NextResponse.json(
      {
        token,
        user: {
          id: hotel.id,
          email: hotel.email,
          hotelName: hotel.hotel_name,
          tableCount: hotel.table_count,
          hotelPhotoKey: hotel.hotel_photo_key,
          createdAt: hotel.created_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle and log error with context
    return handleError(
      error instanceof Error ? error : new Error('Unknown error'),
      {
        requestId,
        endpoint: '/api/auth/login',
        method: 'POST',
        additionalDetails: {
          userAgent: request.headers.get('user-agent'),
        },
      }
    );
  }
}

// Export the handler wrapped with error handling middleware
export const POST = withErrorHandling(loginHandler as any);