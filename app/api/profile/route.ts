import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import { generatePresignedDownloadUrl, getPhotosBucket } from '@/lib/s3';
import { validateProfileUpdate, sanitizeString } from '@/lib/validation';

/**
 * GET /api/profile
 * Retrieve the authenticated hotel manager's profile
 */
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

    // Fetch profile data from database using parameterized query
    const result = await query(
      `SELECT id, email, hotel_name, table_count, hotel_photo_key, created_at, updated_at
       FROM hotels
       WHERE id = $1`,
      [user.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const hotel = result.rows[0];

    // Generate presigned URL for photo if it exists
    let photoUrl = null;
    if (hotel.hotel_photo_key) {
      try {
        photoUrl = await generatePresignedDownloadUrl(
          getPhotosBucket(),
          hotel.hotel_photo_key
        );
      } catch (error) {
        console.error('Error generating photo URL:', error);
        // Continue without photo URL
      }
    }

    return NextResponse.json(
      {
        profile: {
          id: hotel.id,
          email: hotel.email,
          hotelName: hotel.hotel_name,
          tableCount: hotel.table_count,
          hotelPhotoKey: hotel.hotel_photo_key,
          photoUrl,
          createdAt: hotel.created_at,
          updatedAt: hotel.updated_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile
 * Update the authenticated hotel manager's profile
 */
export async function PUT(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { hotelName, tableCount, hotelPhotoKey } = body;

    // Validate inputs using validation utility
    const validation = validateProfileUpdate(hotelName, tableCount);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Additional validation for photo key
    if (hotelPhotoKey !== undefined && hotelPhotoKey !== null) {
      if (typeof hotelPhotoKey !== 'string') {
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            errors: [{ field: 'hotelPhotoKey', message: 'Hotel photo key must be a string' }]
          },
          { status: 400 }
        );
      }
    }

    // Build update query dynamically based on provided fields with parameterized queries
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (hotelName !== undefined) {
      updates.push('hotel_name = $' + paramIndex++);
      values.push(sanitizeString(hotelName));
    }

    if (tableCount !== undefined) {
      updates.push('table_count = $' + paramIndex++);
      values.push(tableCount);
    }

    if (hotelPhotoKey !== undefined) {
      updates.push('hotel_photo_key = $' + paramIndex++);
      values.push(hotelPhotoKey);
    }

    // Always update the updated_at timestamp
    updates.push('updated_at = NOW()');

    // Add user ID as the last parameter
    values.push(user.userId);

    if (updates.length === 1) {
      // Only updated_at would be updated, meaning no actual changes
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Execute update query with parameterized values to prevent SQL injection
    const updateQuery = 
      'UPDATE hotels SET ' + updates.join(', ') + 
      ' WHERE id = $' + paramIndex +
      ' RETURNING id, email, hotel_name, table_count, hotel_photo_key, created_at, updated_at';

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const hotel = result.rows[0];

    // Generate presigned URL for photo if it exists
    let photoUrl = null;
    if (hotel.hotel_photo_key) {
      try {
        photoUrl = await generatePresignedDownloadUrl(
          getPhotosBucket(),
          hotel.hotel_photo_key
        );
      } catch (error) {
        console.error('Error generating photo URL:', error);
        // Continue without photo URL
      }
    }

    return NextResponse.json(
      {
        profile: {
          id: hotel.id,
          email: hotel.email,
          hotelName: hotel.hotel_name,
          tableCount: hotel.table_count,
          hotelPhotoKey: hotel.hotel_photo_key,
          photoUrl,
          createdAt: hotel.created_at,
          updatedAt: hotel.updated_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
