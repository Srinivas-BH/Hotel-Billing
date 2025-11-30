import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { createMenuItem, getMenuItems } from '@/lib/menu';
import { validateMenuItemInput } from '@/lib/validation';
import { handleError, ErrorCreators, withRetry } from '@/lib/error-handling';

/**
 * GET /api/menu
 * Get all menu items for the authenticated hotel
 */
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    const authHeader = request.headers.get('authorization');
    
    // Authenticate the request
    const user = authenticateRequest(authHeader);
    if (!user) {
      throw ErrorCreators.unauthorized();
    }

    // Get all menu items for this hotel with retry
    const items = await withRetry(
      () => getMenuItems(user.userId),
      3,
      1000,
      'get-menu-items'
    );

    return NextResponse.json(
      { menuItems: items },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=10', // Cache for 10 seconds
        }
      }
    );
  } catch (error) {
    return handleError(
      error instanceof Error ? error : new Error('Unknown error'),
      {
        requestId,
        endpoint: '/api/menu',
        method: 'GET',
      }
    );
  }
}

/**
 * POST /api/menu
 * Create a new menu item for the authenticated hotel
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    const authHeader = request.headers.get('authorization');
    
    // Authenticate the request
    const user = authenticateRequest(authHeader);
    if (!user) {
      throw ErrorCreators.unauthorized();
    }

    // Parse request body
    const body = await request.json();
    const { dishName, price } = body;

    // Validate and sanitize inputs
    const validation = validateMenuItemInput(dishName, price);
    if (!validation.valid) {
      throw ErrorCreators.validationError(validation.errors);
    }

    // Create the menu item with sanitized values and retry on transient failures
    const item = await withRetry(
      () => createMenuItem(
        user.userId, 
        validation.sanitizedDishName!, 
        validation.sanitizedPrice!
      ),
      3,
      1000,
      'create-menu-item'
    );

    return NextResponse.json(
      { item },
      { status: 201 }
    );
  } catch (error) {
    return handleError(
      error instanceof Error ? error : new Error('Unknown error'),
      {
        requestId,
        endpoint: '/api/menu',
        method: 'POST',
      }
    );
  }
}
