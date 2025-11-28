import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth';
import { calculateMonthlyRevenueRange } from '@/lib/reports';

// Validation schema for monthly report query parameters
const monthlyReportSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
});

/**
 * GET /api/reports/monthly
 * Get monthly revenue reports for a date range
 * Requirements: 9.2, 9.4
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate query parameters
    const validationResult = monthlyReportSchema.safeParse({
      startDate,
      endDate,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { startDate: validStartDate, endDate: validEndDate } = validationResult.data;

    // Validate date range
    if (new Date(validStartDate) > new Date(validEndDate)) {
      return NextResponse.json(
        { error: 'Start date must be before or equal to end date' },
        { status: 400 }
      );
    }

    // Calculate monthly revenue
    const reports = await calculateMonthlyRevenueRange(
      user.userId,
      validStartDate,
      validEndDate
    );

    return NextResponse.json(
      { reports },
      { status: 200 }
    );
  } catch (error) {
    console.error('Monthly report error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
