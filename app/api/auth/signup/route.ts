import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';
import { sanitizeEmail, sanitizeString } from '@/lib/validation';

// Validation schema for signup with sanitization
const signupSchema = z.object({
  email: z.string().email('Invalid email format').transform(sanitizeEmail),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  hotelName: z.string().min(1, 'Hotel name is required').transform(sanitizeString),
  tableCount: z.number().int().positive('Table count must be a positive integer'),
  hotelPhotoKey: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Signup request body:', body);
    
    // Validate input
    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.errors);
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors,
          message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        },
        { status: 400 }
      );
    }

    const { email, password, hotelName, tableCount, hotelPhotoKey } = validationResult.data;

    try {
      // Check if email already exists
      const existingUser = await query(
        'SELECT id FROM hotels WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        );
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Insert hotel record
      const result = await query(
        `INSERT INTO hotels (email, password_hash, hotel_name, table_count, hotel_photo_key)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, hotel_name, table_count, hotel_photo_key, created_at`,
        [email, passwordHash, hotelName, tableCount, hotelPhotoKey || null]
      );

      const hotel = result.rows[0];

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
        { status: 201 }
      );
    } catch (dbError) {
      console.error('Database error during signup:', dbError);
      
      // If database is not configured, return a mock response for development
      if (process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL) {
        console.warn('Database not configured - using mock data for development');
        
        const mockId = `mock-${Date.now()}`;
        const token = generateToken(mockId, email);
        
        return NextResponse.json(
          {
            token,
            user: {
              id: mockId,
              email: email,
              hotelName: hotelName,
              tableCount: tableCount,
              hotelPhotoKey: hotelPhotoKey || null,
              createdAt: new Date().toISOString(),
            },
            warning: 'Database not configured - using mock data'
          },
          { status: 201 }
        );
      }
      
      throw dbError;
    }
  } catch (error) {
    console.error('Signup error:', error);
    
    // Return more detailed error in development
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = process.env.NODE_ENV === 'development' ? { details: errorMessage } : {};
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to create account. Please check server logs.',
        ...errorDetails
      },
      { status: 500 }
    );
  }
}
