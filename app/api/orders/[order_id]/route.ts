import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { OrderService } from '@/lib/services/orderService';

const orderService = new OrderService(getPool());

export async function PUT(
  request: NextRequest,
  { params }: { params: { order_id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    verifyToken(token);

    const body = await request.json();
    const { items, notes, version } = body;

    if (!items || !Array.isArray(items) || version === undefined) {
      return NextResponse.json(
        { error: 'Invalid request: items and version are required' },
        { status: 400 }
      );
    }

    const order = await orderService.updateOrder(params.order_id, {
      items,
      notes,
      version
    });

    return NextResponse.json({
      order_id: order.order_id,
      status: order.status,
      version: order.version,
      updated_at: order.updated_at,
      message: 'Order updated successfully'
    });

  } catch (error: any) {
    console.error('Order update error:', error);

    if (error.message.includes('modified by another user')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      { error: 'Failed to update order', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { order_id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    verifyToken(token);

    const body = await request.json();
    const { status, invoice_id, version } = body;

    if (status === 'BILLED' && invoice_id) {
      const order = await orderService.markBilled(params.order_id, invoice_id, version);
      
      return NextResponse.json({
        order_id: order.order_id,
        status: order.status,
        version: order.version,
        message: 'Order marked as billed'
      });
    }

    return NextResponse.json({ error: 'Invalid status update' }, { status: 400 });

  } catch (error: any) {
    console.error('Order status update error:', error);
    return NextResponse.json(
      { error: 'Failed to update order status', details: error.message },
      { status: 500 }
    );
  }
}
