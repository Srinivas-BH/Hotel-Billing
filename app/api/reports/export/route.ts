import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth';
import { 
  filterInvoices, 
  calculateDailyRevenueRange, 
  calculateMonthlyRevenueRange 
} from '@/lib/reports';
import { generateReportHTML, generateReportFilename, ReportData } from '@/lib/pdf-report-template';
import { generateReportPDF } from '@/lib/pdf-generator';
import { query } from '@/lib/db';

// Validation schema for export request
const exportRequestSchema = z.object({
  format: z.enum(['pdf'], {
    errorMap: () => ({ message: 'Format must be "pdf"' })
  }),
  reportType: z.enum(['daily', 'monthly']).optional().default('daily'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  tableNumber: z.number().int().positive().optional(),
  invoiceId: z.string().optional(),
});

/**
 * POST /api/reports/export
 * Export revenue reports as CSV or PDF
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = exportRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { 
      format, 
      reportType = 'daily',
      startDate, 
      endDate, 
      tableNumber, 
      invoiceId 
    } = validationResult.data;

    // Validate date range if provided
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return NextResponse.json(
        { error: 'Start date must be before or equal to end date' },
        { status: 400 }
      );
    }

    // Get hotel information for the report
    const hotelResult = await query<{ hotel_name: string }>(
      'SELECT hotel_name FROM hotels WHERE id = $1',
      [user.userId]
    );

    if (hotelResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Hotel not found' },
        { status: 404 }
      );
    }

    const hotelName = hotelResult.rows[0].hotel_name;

    // Filter invoices based on criteria
    const { invoices } = await filterInvoices(user.userId, {
      startDate,
      endDate,
      tableNumber,
      invoiceId,
      page: 1,
      limit: 10000, // Get all matching invoices for export
    });

    // Generate PDF export - return directly without S3
    return await handlePDFExport(
      hotelName,
      reportType,
      invoices,
      user.userId,
      startDate,
      endDate
    );
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { 
        error: 'Export failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle PDF export generation - return directly without S3
 */
async function handlePDFExport(
  hotelName: string,
  reportType: 'daily' | 'monthly',
  invoices: any[],
  hotelId: string,
  startDate?: string,
  endDate?: string
): Promise<NextResponse> {
  try {
    // Calculate revenue reports based on type
    let dailyReports: any[] = [];
    let monthlyReports: any[] = [];
    
    if (startDate && endDate) {
      if (reportType === 'daily') {
        dailyReports = await calculateDailyRevenueRange(hotelId, startDate, endDate);
      } else {
        monthlyReports = await calculateMonthlyRevenueRange(hotelId, startDate, endDate);
      }
    }

    // Calculate totals
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalInvoices = invoices.length;

    // Prepare report data
    const reportData: ReportData = {
      hotelName,
      reportType,
      startDate,
      endDate,
      dailyReports,
      monthlyReports,
      invoices,
      totalRevenue,
      totalInvoices,
    };

    // Generate HTML
    const reportHTML = generateReportHTML(reportData);

    // Generate PDF
    const pdfBuffer = await generateReportPDF(reportHTML);

    // Generate filename
    const filename = generateReportFilename(reportType, startDate, endDate);

    // Return PDF directly as download
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error(`Failed to generate PDF export: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
