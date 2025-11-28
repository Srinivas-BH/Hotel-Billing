import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';
import { sanitizeEmail } from '@/lib/validation';

// Validation schema for login with sanitization
const loginSchema = z.object({
  email: z.string().email('Invalid email format').transform(sanitizeEmail),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    try {
      // Find user by email
      const result = await query(
        `SELECT id, email, password_hash, hotel_name, table_count, hotel_photo_key, created_at
         FROM hotels
         WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      const hotel = result.rows[0];

      // Verify password
      const isValidPassword = await verifyPassword(password, hotel.password_hash);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
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
    } catch (dbError) {
      console.error('Database error during login:', dbError);
      
      // If database is not configured, provide helpful error message
      if (process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL) {
        return NextResponse.json(
          { 
            error: 'Login requires database setup. Please use "Create Account" instead to test the app.',
            hint: 'In development mode, use the signup page to create test accounts.'
          },
          { status: 503 }
        );
      }
      
      throw dbError;
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
