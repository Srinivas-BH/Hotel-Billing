/**
 * Property-based tests for invoice storage atomicity
 * Feature: hotel-billing-admin, Property 12: Invoice storage atomicity
 * Validates: Requirements 7.1, 7.3
 */

import * as fc from 'fast-check';
import { storeInvoice, retrieveInvoice } from '@/lib/invoice-storage';
import { InvoiceJSON } from '@/types';
import { query, getClient } from '@/lib/db';
import { getS3Client, getInvoicesBucket } from '@/lib/s3';
import { GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Test hotel ID for property tests
const TEST_HOTEL_ID = '00000000-0000-0000-0000-000000000001';

// Cleanup function to remove test data
async function cleanupTestData(invoiceNumber: string, pdfKey?: string) {
  try {
    // Delete from database
    await query('DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE invoice_number = $1)', [invoiceNumber]);
    await query('DELETE FROM invoices WHERE invoice_number = $1', [invoiceNumber]);

    // Delete from S3 if pdfKey exists
    if (pdfKey) {
      try {
        const s3Client = getS3Client();
        const bucket = getInvoicesBucket();
        await s3Client.send(new DeleteObjectCommand({
          Bucket: bucket,
          Key: pdfKey,
        }));
      } catch (s3Error) {
        // S3 deletion failure is not critical for cleanup
        console.warn('S3 cleanup warning:', s3Error);
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// Arbitraries for generating test data
// Generate realistic dish names (alphanumeric with spaces, properly trimmed)
const dishNameArb = fc
  .stringOf(
    fc.oneof(
      fc.char().filter(c => /[a-zA-Z0-9]/.test(c)),
      fc.constant(' ')
    ),
    { minLength: 3, maxLength: 50 }
  )
  .map(s => s.trim().replace(/\s+/g, ' ')) // Normalize spaces
  .filter(s => s.length >= 3 && /[a-zA-Z0-9]/.test(s)); // Ensure meaningful content

const invoiceItemArb = fc.record({
  dishName: dishNameArb,
  quantity: fc.integer({ min: 1, max: 20 }),
  price: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }).map(n => Math.round(n * 100) / 100),
}).map(item => ({
  ...item,
  total: Math.round(item.price * item.quantity * 100) / 100,
}));

// Generate realistic hotel names (alphanumeric with spaces, properly trimmed)
const hotelNameArb = fc
  .stringOf(
    fc.oneof(
      fc.char().filter(c => /[a-zA-Z0-9]/.test(c)),
      fc.constant(' ')
    ),
    { minLength: 5, maxLength: 50 }
  )
  .map(s => s.trim().replace(/\s+/g, ' ')) // Normalize spaces
  .filter(s => s.length >= 5 && /[a-zA-Z]/.test(s)); // Ensure meaningful content with letters

// Generate realistic invoice numbers (alphanumeric, no trailing spaces)
const invoiceNumberArb = fc
  .stringOf(fc.char().filter(c => /[A-Z0-9]/.test(c)), { minLength: 8, maxLength: 20 })
  .map(s => `TEST-${s}`);

const invoiceDataArb = fc.record({
  invoiceNumber: invoiceNumberArb,
  tableNumber: fc.integer({ min: 1, max: 50 }),
  hotelName: hotelNameArb,
  items: fc.array(invoiceItemArb, { minLength: 1, maxLength: 10 }),
  gstPercentage: fc.float({ min: Math.fround(0), max: Math.fround(30), noNaN: true }).map(n => Math.round(n * 100) / 100),
  serviceChargePercentage: fc.float({ min: Math.fround(0), max: Math.fround(20), noNaN: true }).map(n => Math.round(n * 100) / 100),
  discountAmount: fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }).map(n => Math.round(n * 100) / 100),
}).map(data => {
  const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
  const validDiscount = Math.min(data.discountAmount, subtotal);
  const discountedSubtotal = subtotal - validDiscount;
  const gstAmount = Math.round(discountedSubtotal * (data.gstPercentage / 100) * 100) / 100;
  const serviceChargeAmount = Math.round(discountedSubtotal * (data.serviceChargePercentage / 100) * 100) / 100;
  const grandTotal = Math.round((subtotal + gstAmount + serviceChargeAmount - validDiscount) * 100) / 100;

  return {
    invoiceNumber: data.invoiceNumber,
    tableNumber: data.tableNumber,
    hotelName: data.hotelName,
    date: new Date().toISOString(),
    items: data.items,
    subtotal: Math.round(subtotal * 100) / 100,
    gst: {
      percentage: data.gstPercentage,
      amount: gstAmount,
    },
    serviceCharge: {
      percentage: data.serviceChargePercentage,
      amount: serviceChargeAmount,
    },
    discount: validDiscount,
    grandTotal,
  } as InvoiceJSON;
});

describe('Invoice Storage Atomicity Property Tests', () => {
  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️  DATABASE_URL not set. Skipping invoice storage property tests.');
      return;
    }

    // Ensure test hotel exists
    try {
      await query(
        `INSERT INTO hotels (id, email, password_hash, hotel_name, table_count)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [TEST_HOTEL_ID, 'test@property.com', 'hash', 'Test Hotel', 10]
      );
    } catch (error) {
      console.error('Setup error:', error);
    }
  });

  /**
   * Feature: hotel-billing-admin, Property 12: Invoice storage atomicity
   * For any invoice, both database record and S3 PDF upload should succeed together,
   * or both should fail with retry capability
   * Validates: Requirements 7.1, 7.3
   */
  test('Property 12: Invoice storage atomicity - both DB and S3 succeed or both fail', async () => {
    if (!process.env.DATABASE_URL) {
      console.log('⏭️  Skipping test - DATABASE_URL not configured');
      return;
    }

    await fc.assert(
      fc.asyncProperty(invoiceDataArb, async (invoiceData) => {
        let pdfKey: string | undefined;

        try {
          // Store invoice
          const result = await storeInvoice({
            hotelId: TEST_HOTEL_ID,
            invoiceData,
            maxRetries: 1, // Reduce retries for faster tests
          });

          pdfKey = result.pdfKey;

          // Verify database storage
          const dbResult = await query(
            'SELECT * FROM invoices WHERE invoice_number = $1 AND hotel_id = $2',
            [invoiceData.invoiceNumber, TEST_HOTEL_ID]
          );

          expect(dbResult.rows.length).toBe(1);
          const dbInvoice = dbResult.rows[0];

          // Verify invoice data matches
          expect(dbInvoice.invoice_number).toBe(invoiceData.invoiceNumber);
          expect(dbInvoice.table_number).toBe(invoiceData.tableNumber);
          expect(parseFloat(dbInvoice.grand_total)).toBeCloseTo(invoiceData.grandTotal, 2);
          expect(dbInvoice.pdf_key).toBe(pdfKey);

          // Verify S3 storage
          const s3Client = getS3Client();
          const bucket = getInvoicesBucket();

          const getCommand = new GetObjectCommand({
            Bucket: bucket,
            Key: pdfKey,
          });

          const s3Response = await s3Client.send(getCommand);
          expect(s3Response.$metadata.httpStatusCode).toBe(200);

          // Verify invoice items
          const itemsResult = await query(
            'SELECT * FROM invoice_items WHERE invoice_id = $1',
            [dbInvoice.id]
          );

          expect(itemsResult.rows.length).toBe(invoiceData.items.length);

          return true;
        } catch (error) {
          // If storage fails, verify nothing was stored
          const dbResult = await query(
            'SELECT * FROM invoices WHERE invoice_number = $1',
            [invoiceData.invoiceNumber]
          );

          // Database should not have the invoice
          expect(dbResult.rows.length).toBe(0);

          return true;
        } finally {
          // Cleanup
          await cleanupTestData(invoiceData.invoiceNumber, pdfKey);
        }
      }),
      {
        numRuns: 10, // Reduced for performance (PDF generation is slow)
        timeout: 60000, // 60 seconds timeout per test
      }
    );
  }, 120000); // 2 minute timeout for entire test

  /**
   * Property 12 (Simplified): Successful storage means both DB and S3 have data
   */
  test('Property 12 (Simplified): Successful storage guarantees both DB and S3 contain data', async () => {
    if (!process.env.DATABASE_URL) {
      console.log('⏭️  Skipping test - DATABASE_URL not configured');
      return;
    }

    await fc.assert(
      fc.asyncProperty(invoiceDataArb, async (invoiceData) => {
        let pdfKey: string | undefined;

        try {
          // Store invoice
          const result = await storeInvoice({
            hotelId: TEST_HOTEL_ID,
            invoiceData,
            maxRetries: 1,
          });

          pdfKey = result.pdfKey;

          // If we reach here, storage succeeded
          // Verify both DB and S3 have the data

          // Check database
          const dbResult = await query(
            'SELECT pdf_key FROM invoices WHERE invoice_number = $1 AND hotel_id = $2',
            [invoiceData.invoiceNumber, TEST_HOTEL_ID]
          );

          const dbHasInvoice = dbResult.rows.length === 1;
          const dbPdfKey = dbResult.rows[0]?.pdf_key;

          // Check S3
          let s3HasPdf = false;
          try {
            const s3Client = getS3Client();
            const bucket = getInvoicesBucket();
            const getCommand = new GetObjectCommand({
              Bucket: bucket,
              Key: pdfKey,
            });
            await s3Client.send(getCommand);
            s3HasPdf = true;
          } catch (s3Error) {
            s3HasPdf = false;
          }

          // Both must be true for atomicity
          expect(dbHasInvoice).toBe(true);
          expect(s3HasPdf).toBe(true);
          expect(dbPdfKey).toBe(pdfKey);

          return true;
        } finally {
          // Cleanup
          await cleanupTestData(invoiceData.invoiceNumber, pdfKey);
        }
      }),
      {
        numRuns: 10,
        timeout: 60000,
      }
    );
  }, 120000);
});
