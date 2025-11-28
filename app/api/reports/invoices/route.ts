import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth';
import { filterInvoices } from '@/lib/reports';
import { generatePresignedDownloadUrl, getInvoicesBucket } from '@/lib/s3';

// Validation schema for invoice search query parameters
const invoiceSearchSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  tableNumber: z.coerce.number().int().positive('Table number must be a positive integer').optional(),
  invoiceId: z.string().optional(),
  page: z.coerce.number().int().positive('Page must be a positive integer').optional().default(1),
  limit: z.coerce.number().int().positive('Limit must be a positive integer').max(100, 'Limit cannot exceed 100').optional().default(50),
});

/**
 * GET /api/reports/invoices
 * Search and filter invoices with pagination
 * Requirements: 9.3, 9.4, 9.5, 8.4
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
    const queryParams = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      tableNumber: searchParams.get('tableNumber') || undefined,
      invoiceId: searchParams.get('invoiceId') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    };

    // Validate query parameters
    const validationResult = invoiceSearchSchema.safeParse(queryParams);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { startDate, endDate, tableNumber, invoiceId, page, limit } = validationResult.data;

    // Validate date range if both dates are provided
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return NextResponse.json(
        { error: 'Start date must be before or equal to end date' },
        { status: 400 }
      );
    }

    // Filter invoices
    const { invoices, total } = await filterInvoices(user.userId, {
      startDate,
      endDate,
      tableNumber,
      invoiceId,
      page,
      limit,
    });

    // Generate presigned URLs for PDFs
    const bucket = getInvoicesBucket();
    const invoicesWithUrls = await Promise.all(
      invoices.map(async (invoice) => {
        let pdfUrl = null;
        if (invoice.pdfKey) {
          try {
            pdfUrl = await generatePresignedDownloadUrl(bucket, invoice.pdfKey);
          } catch (error) {
            console.error(`Failed to generate presigned URL for invoice ${invoice.id}:`, error);
          }
        }

        return {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          tableNumber: invoice.tableNumber,
          subtotal: invoice.subtotal,
          gstPercentage: invoice.gstPercentage,
          gstAmount: invoice.gstAmount,
          serviceChargePercentage: invoice.serviceChargePercentage,
          serviceChargeAmount: invoice.serviceChargeAmount,
          discountAmount: invoice.discountAmount,
          grandTotal: invoice.grandTotal,
          createdAt: invoice.createdAt,
          pdfUrl,
        };
      })
    );

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json(
      {
        invoices: invoicesWithUrls,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Invoice search error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
