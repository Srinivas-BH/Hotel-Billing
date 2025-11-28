import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { retrieveInvoice } from '@/lib/invoice-storage';
import { generatePresignedDownloadUrl, getInvoicesBucket } from '@/lib/s3';

/**
 * GET /api/billing/invoice/:id
 * Retrieve an invoice by ID with PDF download URL
 * Requirements: 8.1, 8.2, 8.4
 */
export async function GET(
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

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid invoice ID format' },
        { status: 400 }
      );
    }

    // Retrieve invoice from database with authorization check
    let invoice;
    try {
      invoice = await retrieveInvoice(id, user.userId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('not found') || errorMessage.includes('unauthorized')) {
        return NextResponse.json(
          { error: 'Invoice not found or unauthorized' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Generate presigned URL for PDF download
    let pdfUrl = null;
    if (invoice.pdfKey) {
      const bucket = getInvoicesBucket();
      pdfUrl = await generatePresignedDownloadUrl(bucket, invoice.pdfKey);
    }

    // Return invoice data and PDF URL
    return NextResponse.json(
      {
        invoice: {
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
          items: invoice.items,
          createdAt: invoice.createdAt,
        },
        pdfUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Retrieve invoice error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
