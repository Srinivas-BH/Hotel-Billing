import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { OrderService } from '@/lib/services/orderService';

// Initialize order service - handle database connection errors gracefully
function getOrderService(): OrderService | null {
  try {
    const pool = getPool();
    return new OrderService(pool);
  } catch (error: any) {
    console.error('Failed to initialize OrderService:', error.message);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    
    // userId in token is the hotel_id
    const hotel_id = decoded.userId;
    
    // Validate hotel_id exists
    if (!hotel_id) {
      return NextResponse.json(
        { error: 'Invalid token: hotel ID not found' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { table_number, items, notes } = body;

    // Validation
    if (!table_number || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: table_number and items are required' },
        { status: 400 }
      );
    }

    // Get order service instance
    const orderService = getOrderService();
    if (!orderService) {
      return NextResponse.json(
        { error: 'Database not configured. Please set DATABASE_URL environment variable and run migrations.' },
        { status: 503 }
      );
    }

    // Create order
    const order = await orderService.createOrder({
      hotel_id,
      table_number,
      items,
      notes
    });

    return NextResponse.json({
      order_id: order.order_id,
      status: order.status,
      version: order.version,
      created_at: order.created_at,
      message: 'Order created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Order creation error:', error);
    
    if (error.message.includes('already has an active order')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    // Provide more helpful error messages
    let errorMessage = 'Failed to create order';
    let statusCode = 500;

    if (error.message.includes('null value in column "hotel_id"')) {
      errorMessage = 'Authentication error: Hotel ID not found. Please log in again.';
      statusCode = 401;
    } else if (error.message.includes('does not exist')) {
      errorMessage = 'Database tables not found. Please run migrations: npm run migrate';
      statusCode = 503;
    } else if (error.message.includes('connection') || error.message.includes('timeout')) {
      errorMessage = 'Database connection failed. Please check your DATABASE_URL configuration.';
      statusCode = 503;
    } else {
      errorMessage = error.message || 'Failed to create order';
    }

    return NextResponse.json(
      { 
        error: errorMessage, 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: statusCode }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    
    // userId in token is the hotel_id
    const hotel_id = decoded.userId;

    // Get order service instance
    const orderService = getOrderService();
    if (!orderService) {
      return NextResponse.json({ orders: [] }, { status: 200 });
    }

    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');

    if (table) {
      // Get active order for specific table
      const order = await orderService.getActiveOrder(hotel_id, parseInt(table));
      
      if (!order) {
        return NextResponse.json({ order: null, message: 'No active order for this table' });
      }

      return NextResponse.json({ order });
    } else {
      // Get all open orders for hotel
      const orders = await orderService.getAllOrdersForHotel(hotel_id);
      return NextResponse.json({ orders });
    }

  } catch (error: any) {
    console.error('Order fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error.message },
      { status: 500 }
    );
  }
}
