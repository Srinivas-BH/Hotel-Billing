import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get hotel details
    const hotelResult = await query(
      'SELECT id, hotel_name, email, table_count FROM hotels WHERE id = $1',
      [decoded.userId]
    );

    if (hotelResult.rows.length === 0) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    const hotel = hotelResult.rows[0];

    // Get order count for this hotel
    const orderResult = await query(
      'SELECT COUNT(*) as count FROM orders WHERE hotel_id = $1 AND status = \'OPEN\'',
      [decoded.userId]
    );

    return NextResponse.json({
      currentUser: {
        id: hotel.id,
        hotelName: hotel.hotel_name,
        email: hotel.email,
        tableCount: hotel.table_count,
      },
      tokenInfo: {
        userId: decoded.userId,
        email: decoded.email,
      },
      openOrders: parseInt(orderResult.rows[0].count),
      message: 'You are currently logged in as this hotel',
    });

  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: 'Failed to get current user info', details: error.message },
      { status: 500 }
    );
  }
}
