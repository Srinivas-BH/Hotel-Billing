import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    // Verify the token
    const user = authenticateRequest(authHeader);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch current user data from database
    const result = await query(
      `SELECT id, email, hotel_name, table_count, hotel_photo_key, created_at, updated_at
       FROM hotels
       WHERE id = $1`,
      [user.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const hotel = result.rows[0];

    return NextResponse.json(
      {
        user: {
          id: hotel.id,
          email: hotel.email,
          hotelName: hotel.hotel_name,
          tableCount: hotel.table_count,
          hotelPhotoKey: hotel.hotel_photo_key,
          createdAt: hotel.created_at,
          updatedAt: hotel.updated_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
