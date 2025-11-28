import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    // Verify the token is valid
    const user = authenticateRequest(authHeader);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Note: With JWT, we can't truly invalidate tokens server-side without a blacklist
    // In a production system, you might want to:
    // 1. Maintain a token blacklist in Redis
    // 2. Use shorter token expiration times
    // 3. Implement refresh tokens
    // For now, we just return success and rely on client-side token removal

    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
