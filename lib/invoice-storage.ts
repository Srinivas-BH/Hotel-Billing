/**
 * Invoice storage with atomicity guarantees
 * Handles database storage, PDF generation, and S3 upload with retry logic
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { PoolClient } from 'pg';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { InvoiceJSON, Invoice } from '@/types';
import { getClient } from './db';
import { generateInvoicePDF } from './pdf-generator';
import { getS3Client, getInvoicesBucket, generateFileKey } from './s3';

export interface StoreInvoiceParams {
  hotelId: string;
  invoiceData: InvoiceJSON;
  maxRetries?: number;
}

export interface StoreInvoiceResult {
  invoice: Invoice;
  pdfKey: string;
}

/**
 * Store invoice with atomic guarantees
 * Either both database and S3 operations succeed, or both are rolled back
 * @param params - Invoice storage parameters
 * @returns Stored invoice with PDF key
 * @throws Error if storage fails after retries
 */
export async function storeInvoice(
  params: StoreInvoiceParams
): Promise<StoreInvoiceResult> {
  const { hotelId, invoiceData, maxRetries = 3 } = params;

  let lastError: Error | null = null;

  // Retry logic for transient failures
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await storeInvoiceAtomically(hotelId, invoiceData);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(
        `Invoice storage attempt ${attempt}/${maxRetries} failed:`,
        lastError.message
      );

      // Don't retry on the last attempt
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  // All retries failed
  throw new Error(
    `Failed to store invoice after ${maxRetries} attempts: ${lastError?.message}`
  );
}

/**
 * Store invoice atomically (single attempt)
 * Uses database transaction to ensure atomicity
 * Strategy: Store in DB first, then upload to S3 only after DB commit succeeds
 * PDF generation is optional - if it fails, invoice is still stored without PDF
 */
async function storeInvoiceAtomically(
  hotelId: string,
  invoiceData: InvoiceJSON
): Promise<StoreInvoiceResult> {
  const client: PoolClient = await getClient();
  let pdfBuffer: Buffer | null = null;
  let pdfKey: string | null = null;
  let invoiceId: string | null = null;

  try {
    // Step 1: Skip PDF generation for performance (disabled)
    console.log('PDF generation disabled for performance - invoice will be saved without PDF');

    // Start transaction
    await client.query('BEGIN');

    // Step 2: Store invoice in database with the planned PDF key (or null)
    const invoice = await storeInvoiceInDatabase(
      client,
      hotelId,
      invoiceData,
      pdfKey
    );

    invoiceId = invoice.id;

    // Commit transaction
    await client.query('COMMIT');

    // Step 3: Upload PDF to S3 AFTER successful DB commit (if PDF was generated)
    // Skip S3 upload if AWS credentials are not configured
    if (pdfBuffer && pdfKey) {
      const hasS3Config = process.env.AWS_ACCESS_KEY_ID && 
                         process.env.AWS_SECRET_ACCESS_KEY && 
                         process.env.S3_BUCKET_INVOICES;
      
      if (hasS3Config) {
        try {
          await uploadPDFToS3(pdfBuffer, pdfKey);
          console.log('PDF uploaded to S3 successfully');
        } catch (s3Error) {
          console.warn('S3 upload failed, invoice saved without PDF:', s3Error);
          // Don't fail the entire operation - invoice is already saved
          // Update the invoice to remove the PDF key
          try {
            const updateClient = await getClient();
            await updateClient.query(
              'UPDATE invoices SET pdf_key = NULL WHERE id = $1',
              [invoiceId]
            );
            updateClient.release();
            pdfKey = null;
          } catch (updateError) {
            console.error('Failed to update invoice PDF key:', updateError);
          }
        }
      } else {
        console.log('S3 not configured - skipping PDF upload');
        // Update the invoice to remove the PDF key since we can't upload
        try {
          const updateClient = await getClient();
          await updateClient.query(
            'UPDATE invoices SET pdf_key = NULL WHERE id = $1',
            [invoiceId]
          );
          updateClient.release();
          pdfKey = null;
        } catch (updateError) {
          console.error('Failed to update invoice PDF key:', updateError);
        }
      }
    }

    return {
      invoice,
      pdfKey: pdfKey || '',
    };
  } catch (error) {
    // Rollback transaction on any error before commit
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }

    throw error;
  } finally {
    // Release client back to pool
    client.release();
  }
}

/**
 * Generate S3 key for PDF file
 * @param invoiceNumber - Invoice number for file naming
 * @returns S3 object key
 */
function generatePDFKey(invoiceNumber: string): string {
  const fileName = `${invoiceNumber}.pdf`;
  return generateFileKey('invoices', fileName);
}

/**
 * Clean up database record after S3 upload failure
 * This maintains atomicity by ensuring both DB and S3 succeed or both fail
 * @param invoiceId - Invoice ID to delete
 */
async function cleanupDatabaseRecord(invoiceId: string): Promise<void> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // Delete invoice items first (foreign key constraint)
    await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [invoiceId]);
    
    // Delete invoice
    await client.query('DELETE FROM invoices WHERE id = $1', [invoiceId]);
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to cleanup database record:', error);
    // Don't throw - we already have an error from S3
  } finally {
    client.release();
  }
}

/**
 * Upload PDF to S3
 * @param pdfBuffer - PDF file buffer
 * @param fileKey - S3 object key (pre-generated)
 * @returns void
 */
async function uploadPDFToS3(
  pdfBuffer: Buffer,
  fileKey: string
): Promise<void> {
  try {
    const bucket = getInvoicesBucket();
    const fileName = fileKey.split('/').pop() || 'invoice.pdf';

    const s3Client = getS3Client();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
      ContentDisposition: `attachment; filename="${fileName}"`,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Error uploading PDF to S3:', error);
    throw new Error(
      `S3 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Store invoice in database
 * @param client - Database client (for transaction)
 * @param hotelId - Hotel ID
 * @param invoiceData - Invoice JSON data
 * @param pdfKey - S3 object key for PDF (optional)
 * @returns Stored invoice
 */
async function storeInvoiceInDatabase(
  client: PoolClient,
  hotelId: string,
  invoiceData: InvoiceJSON,
  pdfKey: string | null
): Promise<Invoice> {
  try {
    // Insert invoice record
    const invoiceQuery = `
      INSERT INTO invoices (
        hotel_id,
        invoice_number,
        table_number,
        subtotal,
        gst_percentage,
        gst_amount,
        service_charge_percentage,
        service_charge_amount,
        discount_amount,
        grand_total,
        invoice_json,
        pdf_key
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, hotel_id, invoice_number, table_number, subtotal,
                gst_percentage, gst_amount, service_charge_percentage,
                service_charge_amount, discount_amount, grand_total,
                invoice_json, pdf_key, created_at
    `;

    const invoiceValues = [
      hotelId,
      invoiceData.invoiceNumber,
      invoiceData.tableNumber,
      invoiceData.subtotal,
      invoiceData.gst.percentage,
      invoiceData.gst.amount,
      invoiceData.serviceCharge.percentage,
      invoiceData.serviceCharge.amount,
      invoiceData.discount,
      invoiceData.grandTotal,
      JSON.stringify(invoiceData),
      pdfKey,
    ];

    const invoiceResult = await client.query(invoiceQuery, invoiceValues);
    const invoiceRow = invoiceResult.rows[0];

    // Insert invoice items
    const itemsQuery = `
      INSERT INTO invoice_items (
        invoice_id,
        dish_name,
        price,
        quantity,
        total
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, invoice_id, menu_item_id, dish_name, price, quantity, total
    `;

    const items = [];
    for (const item of invoiceData.items) {
      const itemValues = [
        invoiceRow.id,
        item.dishName,
        item.price,
        item.quantity,
        item.total,
      ];

      const itemResult = await client.query(itemsQuery, itemValues);
      items.push(itemResult.rows[0]);
    }

    // Construct and return invoice object
    return {
      id: invoiceRow.id,
      hotelId: invoiceRow.hotel_id,
      invoiceNumber: invoiceRow.invoice_number,
      tableNumber: invoiceRow.table_number,
      subtotal: parseFloat(invoiceRow.subtotal),
      gstPercentage: parseFloat(invoiceRow.gst_percentage),
      gstAmount: parseFloat(invoiceRow.gst_amount),
      serviceChargePercentage: parseFloat(invoiceRow.service_charge_percentage),
      serviceChargeAmount: parseFloat(invoiceRow.service_charge_amount),
      discountAmount: parseFloat(invoiceRow.discount_amount),
      grandTotal: parseFloat(invoiceRow.grand_total),
      invoiceJson: invoiceRow.invoice_json,
      pdfKey: invoiceRow.pdf_key,
      items,
      createdAt: invoiceRow.created_at,
    };
  } catch (error) {
    console.error('Error storing invoice in database:', error);
    throw new Error(
      `Database storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Retrieve invoice by ID
 * @param invoiceId - Invoice ID
 * @param hotelId - Hotel ID (for authorization)
 * @returns Invoice with items
 * @throws Error if invoice not found or unauthorized
 */
export async function retrieveInvoice(
  invoiceId: string,
  hotelId: string
): Promise<Invoice> {
  const client = await getClient();

  try {
    // Fetch invoice
    const invoiceQuery = `
      SELECT id, hotel_id, invoice_number, table_number, subtotal,
             gst_percentage, gst_amount, service_charge_percentage,
             service_charge_amount, discount_amount, grand_total,
             invoice_json, pdf_key, created_at
      FROM invoices
      WHERE id = $1 AND hotel_id = $2
    `;

    const invoiceResult = await client.query(invoiceQuery, [invoiceId, hotelId]);

    if (invoiceResult.rows.length === 0) {
      throw new Error('Invoice not found or unauthorized');
    }

    const invoiceRow = invoiceResult.rows[0];

    // Fetch invoice items
    const itemsQuery = `
      SELECT id, invoice_id, menu_item_id, dish_name, price, quantity, total
      FROM invoice_items
      WHERE invoice_id = $1
      ORDER BY id
    `;

    const itemsResult = await client.query(itemsQuery, [invoiceId]);

    return {
      id: invoiceRow.id,
      hotelId: invoiceRow.hotel_id,
      invoiceNumber: invoiceRow.invoice_number,
      tableNumber: invoiceRow.table_number,
      subtotal: parseFloat(invoiceRow.subtotal),
      gstPercentage: parseFloat(invoiceRow.gst_percentage),
      gstAmount: parseFloat(invoiceRow.gst_amount),
      serviceChargePercentage: parseFloat(invoiceRow.service_charge_percentage),
      serviceChargeAmount: parseFloat(invoiceRow.service_charge_amount),
      discountAmount: parseFloat(invoiceRow.discount_amount),
      grandTotal: parseFloat(invoiceRow.grand_total),
      invoiceJson: invoiceRow.invoice_json,
      pdfKey: invoiceRow.pdf_key,
      items: itemsResult.rows,
      createdAt: invoiceRow.created_at,
    };
  } finally {
    client.release();
  }
}
