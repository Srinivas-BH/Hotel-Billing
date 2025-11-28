import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth';
import { query } from '@/lib/db';
import { getMenuItemById } from '@/lib/menu';
import { validateTableNumber, validateQuantity } from '@/lib/validation';
import { generateInvoice } from '@/lib/invoice-generator';
import { storeInvoice } from '@/lib/invoice-storage';
import { generatePresignedDownloadUrl, getInvoicesBucket } from '@/lib/s3';
import { handleError, ErrorCreators, withRetry } from '@/lib/error-handling';

// Validation schema for order items
const orderItemSchema = z.object({
  menuItemId: z.string().uuid('Invalid menu item ID'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
});

// Validation schema for invoice generation
const generateInvoiceSchema = z.object({
  tableNumber: z.number().int().positive('Table number must be a positive integer'),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  gstPercentage: z.number().min(0).max(100).optional().default(0),
  serviceChargePercentage: z.number().min(0).max(100).optional().default(0),
  discountAmount: z.number().min(0).optional().default(0),
});

/**
 * POST /api/billing/generate
 * Generate an invoice for a table order
 * Requirements: 4.1, 4.2, 4.4, 4.5, 5.1-5.5, 6.1-6.3, 7.1-7.5
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

    // Validate input with Zod
    const validationResult = generateInvoiceSchema.safeParse(body);
    if (!validationResult.success) {
      throw ErrorCreators.validationError(validationResult.error.errors);
    }

    const { tableNumber, items, gstPercentage, serviceChargePercentage, discountAmount } = validationResult.data;

    // Get hotel information with retry for transient failures
    let hotel;
    try {
      const hotelResult = await withRetry(
        () => query(
          `SELECT id, hotel_name, table_count FROM hotels WHERE id = $1`,
          [user.userId]
        ),
        3,
        1000,
        'get-hotel-info'
      );

      if (hotelResult.rows.length === 0) {
        throw ErrorCreators.notFound('Hotel');
      }

      hotel = hotelResult.rows[0];
    } catch (dbError) {
      // Development mode fallback
      if (process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL) {
        console.warn('Database not configured - using mock hotel data');
        hotel = {
          id: user.userId,
          hotel_name: 'Test Hotel',
          table_count: 20,
        };
      } else {
        throw dbError;
      }
    }

    // Validate table number against hotel's table count
    const tableValidation = validateTableNumber(tableNumber, hotel.table_count);
    if (!tableValidation.valid) {
      throw ErrorCreators.validationError(tableValidation.errors);
    }

    // Validate and fetch menu items
    const orderItems = [];
    for (const item of items) {
      // Validate quantity
      const quantityValidation = validateQuantity(item.quantity);
      if (!quantityValidation.valid) {
        throw ErrorCreators.validationError(quantityValidation.errors);
      }

      // Fetch menu item to get price and verify it belongs to this hotel
      const menuItem = await getMenuItemById(item.menuItemId, user.userId);
      if (!menuItem) {
        throw ErrorCreators.notFound(`Menu item ${item.menuItemId}`);
      }

      orderItems.push({
        dishName: menuItem.dishName,
        quantity: item.quantity,
        price: menuItem.price,
      });
    }

    // Generate invoice using AI/fallback
    const invoiceData = await generateInvoice({
      hotelName: hotel.hotel_name,
      tableNumber,
      items: orderItems,
      gstPercentage: gstPercentage || 0,
      serviceChargePercentage: serviceChargePercentage || 0,
      discountAmount: discountAmount || 0,
    });

    // Store invoice and PDF (or use mock in development)
    let invoice, pdfUrl;
    
    try {
      const { invoice: storedInvoice, pdfKey } = await storeInvoice({
        hotelId: user.userId,
        invoiceData,
      });

      // Generate presigned URL for PDF download (if S3 is configured and PDF was uploaded)
      if (pdfKey && process.env.S3_BUCKET_INVOICES) {
        try {
          const bucket = getInvoicesBucket();
          pdfUrl = await generatePresignedDownloadUrl(bucket, pdfKey);
        } catch (s3Error) {
          console.warn('Failed to generate presigned URL:', s3Error);
          pdfUrl = null;
        }
      } else {
        pdfUrl = null;
      }
      
      invoice = storedInvoice;
    } catch (storageError) {
      // Development mode fallback
      if (process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL) {
        console.warn('Database not configured - returning mock invoice');
        
        // Create mock invoice from invoice data
        invoice = {
          id: crypto.randomUUID(),
          hotelId: user.userId,
          invoiceNumber: invoiceData.invoiceNumber,
          tableNumber: invoiceData.tableNumber,
          subtotal: invoiceData.subtotal,
          gstPercentage: invoiceData.gst.percentage,
          gstAmount: invoiceData.gst.amount,
          serviceChargePercentage: invoiceData.serviceCharge.percentage,
          serviceChargeAmount: invoiceData.serviceCharge.amount,
          discountAmount: invoiceData.discount,
          grandTotal: invoiceData.grandTotal,
          invoiceJson: invoiceData,
          pdfKey: null,
          items: invoiceData.items.map((item, index) => ({
            id: crypto.randomUUID(),
            invoiceId: crypto.randomUUID(),
            menuItemId: null,
            dishName: item.dishName,
            price: item.price,
            quantity: item.quantity,
            total: item.total,
          })),
          createdAt: new Date(),
        };
        
        pdfUrl = null; // No PDF in development mode
      } else {
        throw storageError;
      }
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
        warning: !pdfUrl ? 'PDF generation requires database setup' : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(
      error instanceof Error ? error : new Error('Unknown error'),
      {
        requestId,
        userId: request.headers.get('authorization') ? 'authenticated' : undefined,
        endpoint: '/api/billing/generate',
        method: 'POST',
      }
    );
  }
}
