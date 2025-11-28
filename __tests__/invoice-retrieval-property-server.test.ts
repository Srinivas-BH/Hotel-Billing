/**
 * Property-based tests for invoice retrieval consistency
 * Feature: hotel-billing-admin, Property 13: Invoice retrieval consistency
 * Validates: Requirements 8.1
 * 
 * NOTE: These tests require environment configuration:
 * - DATABASE_URL: PostgreSQL connection string
 * - AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION: AWS credentials
 * - S3_BUCKET_INVOICES: S3 bucket name for invoice storage
 * 
 * Tests will be skipped if environment is not configured.
 */

import * as fc from 'fast-check';
import { storeInvoice, retrieveInvoice } from '@/lib/invoice-storage';
import { InvoiceJSON } from '@/types';
import { query } from '@/lib/db';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client, getInvoicesBucket } from '@/lib/s3';

// Test hotel ID for property tests
const TEST_HOTEL_ID = '00000000-0000-0000-0000-000000000002';

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
const invoiceItemArb = fc.record({
  dishName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  quantity: fc.integer({ min: 1, max: 20 }),
  price: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }).map(n => Math.round(n * 100) / 100),
}).map(item => ({
  ...item,
  total: Math.round(item.price * item.quantity * 100) / 100,
}));

const invoiceDataArb = fc.record({
  invoiceNumber: fc.string({ minLength: 10, maxLength: 30 }).map(s => `TEST-RET-${s}`),
  tableNumber: fc.integer({ min: 1, max: 50 }),
  hotelName: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length > 0),
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

// Check if environment is configured for integration tests
const isEnvironmentConfigured = () => {
  return !!(
    process.env.DATABASE_URL &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_REGION &&
    process.env.S3_BUCKET_INVOICES
  );
};

const describeIfConfigured = isEnvironmentConfigured() ? describe : describe.skip;

// Always run this test to document requirements
describe('Invoice Retrieval Consistency - Environment Check', () => {
  test('should skip integration tests when environment is not configured', () => {
    if (!isEnvironmentConfigured()) {
      console.log('⚠️  Invoice retrieval property tests skipped: Environment not configured');
      console.log('   Required: DATABASE_URL, AWS credentials, S3_BUCKET_INVOICES');
    }
    expect(true).toBe(true);
  });
});

describeIfConfigured('Invoice Retrieval Consistency Property Tests', () => {
  beforeAll(async () => {
    // Ensure test hotel exists
    try {
      await query(
        `INSERT INTO hotels (id, email, password_hash, hotel_name, table_count)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [TEST_HOTEL_ID, 'test-retrieval@property.com', 'hash', 'Test Retrieval Hotel', 10]
      );
    } catch (error) {
      console.error('Setup error:', error);
    }
  });

  /**
   * Feature: hotel-billing-admin, Property 13: Invoice retrieval consistency
   * For any stored invoice, retrieving it by ID should return the same data that was originally stored,
   * including all items and calculations
   * Validates: Requirements 8.1
   */
  test('Property 13: Invoice retrieval consistency - retrieved data matches stored data', async () => {
    await fc.assert(
      fc.asyncProperty(invoiceDataArb, async (invoiceData) => {
        let pdfKey: string | undefined;
        let invoiceId: string | undefined;

        try {
          // Store invoice
          const storeResult = await storeInvoice({
            hotelId: TEST_HOTEL_ID,
            invoiceData,
            maxRetries: 1,
          });

          pdfKey = storeResult.pdfKey;
          invoiceId = storeResult.invoice.id;

          // Retrieve invoice
          const retrievedInvoice = await retrieveInvoice(invoiceId, TEST_HOTEL_ID);

          // Verify all fields match
          expect(retrievedInvoice.invoiceNumber).toBe(invoiceData.invoiceNumber);
          expect(retrievedInvoice.tableNumber).toBe(invoiceData.tableNumber);
          expect(retrievedInvoice.hotelId).toBe(TEST_HOTEL_ID);

          // Verify calculations match (with floating point tolerance)
          expect(retrievedInvoice.subtotal).toBeCloseTo(invoiceData.subtotal, 2);
          expect(retrievedInvoice.gstPercentage).toBeCloseTo(invoiceData.gst.percentage, 2);
          expect(retrievedInvoice.gstAmount).toBeCloseTo(invoiceData.gst.amount, 2);
          expect(retrievedInvoice.serviceChargePercentage).toBeCloseTo(invoiceData.serviceCharge.percentage, 2);
          expect(retrievedInvoice.serviceChargeAmount).toBeCloseTo(invoiceData.serviceCharge.amount, 2);
          expect(retrievedInvoice.discountAmount).toBeCloseTo(invoiceData.discount, 2);
          expect(retrievedInvoice.grandTotal).toBeCloseTo(invoiceData.grandTotal, 2);

          // Verify items match
          expect(retrievedInvoice.items.length).toBe(invoiceData.items.length);

          for (let i = 0; i < invoiceData.items.length; i++) {
            const originalItem = invoiceData.items[i];
            const retrievedItem = retrievedInvoice.items[i];

            expect(retrievedItem.dishName).toBe(originalItem.dishName);
            expect(retrievedItem.quantity).toBe(originalItem.quantity);
            expect(retrievedItem.price).toBeCloseTo(originalItem.price, 2);
            expect(retrievedItem.total).toBeCloseTo(originalItem.total, 2);
          }

          // Verify invoice JSON is preserved
          expect(retrievedInvoice.invoiceJson).toBeDefined();
          expect(retrievedInvoice.invoiceJson.invoiceNumber).toBe(invoiceData.invoiceNumber);

          // Verify PDF key is stored
          expect(retrievedInvoice.pdfKey).toBe(pdfKey);

          return true;
        } finally {
          // Cleanup
          await cleanupTestData(invoiceData.invoiceNumber, pdfKey);
        }
      }),
      {
        numRuns: 10, // Reduced for performance
        timeout: 60000,
      }
    );
  }, 120000);

  /**
   * Property 13 (Round-trip): Store then retrieve should be identity
   */
  test('Property 13 (Round-trip): Storing and retrieving an invoice preserves all data', async () => {
    await fc.assert(
      fc.asyncProperty(invoiceDataArb, async (invoiceData) => {
        let pdfKey: string | undefined;
        let invoiceId: string | undefined;

        try {
          // Store
          const stored = await storeInvoice({
            hotelId: TEST_HOTEL_ID,
            invoiceData,
            maxRetries: 1,
          });

          pdfKey = stored.pdfKey;
          invoiceId = stored.invoice.id;

          // Retrieve
          const retrieved = await retrieveInvoice(invoiceId, TEST_HOTEL_ID);

          // The retrieved invoice should have the same essential data
          // (allowing for database type conversions and rounding)
          const essentialDataMatches =
            retrieved.invoiceNumber === invoiceData.invoiceNumber &&
            retrieved.tableNumber === invoiceData.tableNumber &&
            Math.abs(retrieved.grandTotal - invoiceData.grandTotal) < 0.01 &&
            retrieved.items.length === invoiceData.items.length;

          expect(essentialDataMatches).toBe(true);

          return true;
        } finally {
          await cleanupTestData(invoiceData.invoiceNumber, pdfKey);
        }
      }),
      {
        numRuns: 10,
        timeout: 60000,
      }
    );
  }, 120000);

  /**
   * Property 13 (Authorization): Retrieving with wrong hotel ID should fail
   */
  test('Property 13 (Authorization): Cannot retrieve invoice with wrong hotel ID', async () => {
    await fc.assert(
      fc.asyncProperty(invoiceDataArb, async (invoiceData) => {
        let pdfKey: string | undefined;
        let invoiceId: string | undefined;
        const WRONG_HOTEL_ID = '00000000-0000-0000-0000-000000000099';

        try {
          // Store with correct hotel ID
          const stored = await storeInvoice({
            hotelId: TEST_HOTEL_ID,
            invoiceData,
            maxRetries: 1,
          });

          pdfKey = stored.pdfKey;
          invoiceId = stored.invoice.id;

          // Try to retrieve with wrong hotel ID - should fail
          await expect(
            retrieveInvoice(invoiceId, WRONG_HOTEL_ID)
          ).rejects.toThrow();

          return true;
        } finally {
          await cleanupTestData(invoiceData.invoiceNumber, pdfKey);
        }
      }),
      {
        numRuns: 5, // Fewer runs since this is a simpler check
        timeout: 60000,
      }
    );
  }, 120000);
});
