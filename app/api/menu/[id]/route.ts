import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { getMenuItemById, updateMenuItem, deleteMenuItem } from '@/lib/menu';
import { validateMenuItemInput } from '@/lib/validation';

/**
 * PUT /api/menu/:id
 * Update an existing menu item
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    
    // Authenticate the request
    const user = authenticateRequest(authHeader);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Parse request body
    const body = await request.json();
    const { dishName, price } = body;

    // Validate inputs
    const validation = validateMenuItemInput(dishName, price);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          errors: validation.errors 
        },
        { status: 400 }
      );
    }

    // Check if menu item exists and belongs to this hotel
    const existingItem = await getMenuItemById(id, user.userId);
    if (!existingItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      );
    }

    // Update the menu item
    const item = await updateMenuItem(id, user.userId, dishName.trim(), price);

    return NextResponse.json(
      { item },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update menu item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/menu/:id
 * Delete a menu item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    
    // Authenticate the request
    const user = authenticateRequest(authHeader);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Check if menu item exists and belongs to this hotel
    const existingItem = await getMenuItemById(id, user.userId);
    if (!existingItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      );
    }

    // Delete the menu item
    const deleted = await deleteMenuItem(id, user.userId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete menu item' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete menu item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
