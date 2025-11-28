/**
 * Property-Based Tests for Reports and Revenue Calculations
 * Feature: hotel-billing-admin
 * Tests Properties 15, 16, 17, 18
 */

import * as fc from 'fast-check';
import { query, getClient, closePool } from '../lib/db';
import {
  calculateDailyRevenue,
  calculateDailyRevenueRange,
  calculateMonthlyRevenue,
  calculateMonthlyRevenueRange,
  filterInvoices,
} from '../lib/reports';
import { runMigrations, dropAllTables } from '../lib/migrate';

// Test database setup
beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL not set. Skipping reports property tests.');
    return;
  }

  try {
    await dropAllTables();
    await runMigrations();
  } catch (error) {
    console.error('Setup failed:', error);
    throw error;
  }
});

afterAll(async () => {
  if (process.env.DATABASE_URL) {
    await closePool();
  }
});

describe('Property-Based Tests: Reports and Revenue Calculations', () => {
  const skipTests = !process.env.DATABASE_URL;

  /**
   * Property 15: Daily revenue calculation accuracy
   * For any date range, the daily revenue should equal the sum of all invoice
   * grand totals for invoices created on that day
   * Validates: Requirements 9.1
   */
  describe('Feature: hotel-billing-admin, Property 15: Daily revenue calculation accuracy', () => {
    it('should calculate daily revenue as sum of all invoice grand totals for that day', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              grandTotal: fc.double({ min: 1, max: 10000, noNaN: true }),
              date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          async (invoices) => {
            const client = await getClient();
            try {
              await client.query('BEGIN');

              // Create test hotel
              const hotelResult = await client.query(
                `INSERT INTO hotels (email, password_hash, hotel_name, table_count)
                VALUES ($1, $2, $3, $4) RETURNING id`,
                [`test-${Date.now()}@example.com`, 'hash', 'Test Hotel', 10]
              );
              const hotelId = hotelResult.rows[0].id;

              // Group invoices by date
              const invoicesByDate = new Map<string, number>();
              
              // Insert invoices
              for (const invoice of invoices) {
                const dateStr = invoice.date.toISOString().split('T')[0];
                
                await client.query(
                  `INSERT INTO invoices (
                    hotel_id, invoice_number, table_number, subtotal,
                    gst_percentage, gst_amount, service_charge_percentage,
                    service_charge_amount, discount_amount, grand_total,
                    invoice_json, created_at
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                  [
                    hotelId,
                    `INV-${Date.now()}-${Math.random()}`,
                    1,
                    invoice.grandTotal,
                    0,
                    0,
                    0,
                    0,
                    0,
                    invoice.grandTotal,
                    JSON.stringify({}),
                    invoice.date,
                  ]
                );

                // Track expected revenue by date
                const currentTotal = invoicesByDate.get(dateStr) || 0;
                invoicesByDate.set(dateStr, currentTotal + invoice.grandTotal);
              }

              // Verify daily revenue for each date
              for (const [dateStr, expectedRevenue] of invoicesByDate.entries()) {
                const report = await calculateDailyRevenue(hotelId, dateStr);
                
                expect(report.date).toBe(dateStr);
                expect(report.totalRevenue).toBeCloseTo(expectedRevenue, 2);
                
                // Count invoices for this date
                const expectedCount = invoices.filter(
                  inv => inv.date.toISOString().split('T')[0] === dateStr
                ).length;
                expect(report.invoiceCount).toBe(expectedCount);
              }

              await client.query('ROLLBACK');
            } catch (error) {
              await client.query('ROLLBACK');
              throw error;
            } finally {
              client.release();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return zero revenue for dates with no invoices', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }

      await fc.assert(
        fc.asyncProperty(
          fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
          async (date) => {
            const client = await getClient();
            try {
              await client.query('BEGIN');

              // Create test hotel
              const hotelResult = await client.query(
                `INSERT INTO hotels (email, password_hash, hotel_name, table_count)
                VALUES ($1, $2, $3, $4) RETURNING id`,
                [`test-${Date.now()}@example.com`, 'hash', 'Test Hotel', 10]
              );
              const hotelId = hotelResult.rows[0].id;

              const dateStr = date.toISOString().split('T')[0];
              const report = await calculateDailyRevenue(hotelId, dateStr);
              
              expect(report.date).toBe(dateStr);
              expect(report.totalRevenue).toBe(0);
              expect(report.invoiceCount).toBe(0);

              await client.query('ROLLBACK');
            } catch (error) {
              await client.query('ROLLBACK');
              throw error;
            } finally {
              client.release();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate daily revenue range correctly', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }

      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              grandTotal: fc.double({ min: 1, max: 10000, noNaN: true }),
              date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-01-31') }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          async (invoices) => {
            const client = await getClient();
            try {
              await client.query('BEGIN');

              // Create test hotel
              const hotelResult = await client.query(
                `INSERT INTO hotels (email, password_hash, hotel_name, table_count)
                VALUES ($1, $2, $3, $4) RETURNING id`,
                [`test-${Date.now()}@example.com`, 'hash', 'Test Hotel', 10]
              );
              const hotelId = hotelResult.rows[0].id;

              // Insert invoices
              for (const invoice of invoices) {
                await client.query(
                  `INSERT INTO invoices (
                    hotel_id, invoice_number, table_number, subtotal,
                    gst_percentage, gst_amount, service_charge_percentage,
                    service_charge_amount, discount_amount, grand_total,
                    invoice_json, created_at
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                  [
                    hotelId,
                    `INV-${Date.now()}-${Math.random()}`,
                    1,
                    invoice.grandTotal,
                    0,
                    0,
                    0,
                    0,
                    0,
                    invoice.grandTotal,
                    JSON.stringify({}),
                    invoice.date,
                  ]
                );
              }

              // Get daily revenue range
              const reports = await calculateDailyRevenueRange(
                hotelId,
                '2024-01-01',
                '2024-01-31'
              );

              // Sum all revenues from reports
              const totalFromReports = reports.reduce(
                (sum, report) => sum + report.totalRevenue,
                0
              );

              // Sum all invoice grand totals
              const expectedTotal = invoices.reduce(
                (sum, inv) => sum + inv.grandTotal,
                0
              );

              expect(totalFromReports).toBeCloseTo(expectedTotal, 2);

              await client.query('ROLLBACK');
            } catch (error) {
              await client.query('ROLLBACK');
              throw error;
            } finally {
              client.release();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 16: Monthly revenue calculation accuracy
   * For any month and year, the monthly revenue should equal the sum of all invoice
   * grand totals for invoices created in that month
   * Validates: Requirements 9.2
   */
  describe('Feature: hotel-billing-admin, Property 16: Monthly revenue calculation accuracy', () => {
    it('should calculate monthly revenue as sum of all invoice grand totals for that month', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2024, max: 2025 }),
          fc.integer({ min: 1, max: 12 }),
          fc.array(
            fc.record({
              grandTotal: fc.double({ min: 1, max: 10000, noNaN: true }),
              day: fc.integer({ min: 1, max: 28 }), // Use 28 to avoid month-end issues
            }),
            { minLength: 1, maxLength: 20 }
          ),
          async (year, month, invoices) => {
            const client = await getClient();
            try {
              await client.query('BEGIN');

              // Create test hotel
              const hotelResult = await client.query(
                `INSERT INTO hotels (email, password_hash, hotel_name, table_count)
                VALUES ($1, $2, $3, $4) RETURNING id`,
                [`test-${Date.now()}@example.com`, 'hash', 'Test Hotel', 10]
              );
              const hotelId = hotelResult.rows[0].id;

              let expectedRevenue = 0;

              // Insert invoices
              for (const invoice of invoices) {
                const date = new Date(year, month - 1, invoice.day);
                
                await client.query(
                  `INSERT INTO invoices (
                    hotel_id, invoice_number, table_number, subtotal,
                    gst_percentage, gst_amount, service_charge_percentage,
                    service_charge_amount, discount_amount, grand_total,
                    invoice_json, created_at
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                  [
                    hotelId,
                    `INV-${Date.now()}-${Math.random()}`,
                    1,
                    invoice.grandTotal,
                    0,
                    0,
                    0,
                    0,
                    0,
                    invoice.grandTotal,
                    JSON.stringify({}),
                    date,
                  ]
                );

                expectedRevenue += invoice.grandTotal;
              }

              // Calculate monthly revenue
              const report = await calculateMonthlyRevenue(hotelId, year, month);
              
              expect(report.year).toBe(year);
              expect(report.month).toBe(`${year}-${String(month).padStart(2, '0')}`);
              expect(report.totalRevenue).toBeCloseTo(expectedRevenue, 2);
              expect(report.invoiceCount).toBe(invoices.length);

              await client.query('ROLLBACK');
            } catch (error) {
              await client.query('ROLLBACK');
              throw error;
            } finally {
              client.release();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return zero revenue for months with no invoices', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2024, max: 2025 }),
          fc.integer({ min: 1, max: 12 }),
          async (year, month) => {
            const client = await getClient();
            try {
              await client.query('BEGIN');

              // Create test hotel
              const hotelResult = await client.query(
                `INSERT INTO hotels (email, password_hash, hotel_name, table_count)
                VALUES ($1, $2, $3, $4) RETURNING id`,
                [`test-${Date.now()}@example.com`, 'hash', 'Test Hotel', 10]
              );
              const hotelId = hotelResult.rows[0].id;

              const report = await calculateMonthlyRevenue(hotelId, year, month);
              
              expect(report.year).toBe(year);
              expect(report.month).toBe(`${year}-${String(month).padStart(2, '0')}`);
              expect(report.totalRevenue).toBe(0);
              expect(report.invoiceCount).toBe(0);

              await client.query('ROLLBACK');
            } catch (error) {
              await client.query('ROLLBACK');
              throw error;
            } finally {
              client.release();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate monthly revenue range correctly', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }

      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              grandTotal: fc.double({ min: 1, max: 10000, noNaN: true }),
              date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-30') }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          async (invoices) => {
            const client = await getClient();
            try {
              await client.query('BEGIN');

              // Create test hotel
              const hotelResult = await client.query(
                `INSERT INTO hotels (email, password_hash, hotel_name, table_count)
                VALUES ($1, $2, $3, $4) RETURNING id`,
                [`test-${Date.now()}@example.com`, 'hash', 'Test Hotel', 10]
              );
              const hotelId = hotelResult.rows[0].id;

              // Insert invoices
              for (const invoice of invoices) {
                await client.query(
                  `INSERT INTO invoices (
                    hotel_id, invoice_number, table_number, subtotal,
                    gst_percentage, gst_amount, service_charge_percentage,
                    service_charge_amount, discount_amount, grand_total,
                    invoice_json, created_at
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                  [
                    hotelId,
                    `INV-${Date.now()}-${Math.random()}`,
                    1,
                    invoice.grandTotal,
                    0,
                    0,
                    0,
                    0,
                    0,
                    invoice.grandTotal,
                    JSON.stringify({}),
                    invoice.date,
                  ]
                );
              }

              // Get monthly revenue range
              const reports = await calculateMonthlyRevenueRange(
                hotelId,
                '2024-01-01',
                '2024-06-30'
              );

              // Sum all revenues from reports
              const totalFromReports = reports.reduce(
                (sum, report) => sum + report.totalRevenue,
                0
              );

              // Sum all invoice grand totals
              const expectedTotal = invoices.reduce(
                (sum, inv) => sum + inv.grandTotal,
                0
              );

              expect(totalFromReports).toBeCloseTo(expectedTotal, 2);

              await client.query('ROLLBACK');
            } catch (error) {
              await client.query('ROLLBACK');
              throw error;
            } finally {
              client.release();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 17: Date range filtering correctness
   * For any date range filter applied to invoices, all returned invoices should have
   * creation dates within the specified range (inclusive)
   * Validates: Requirements 9.4
   */
  describe('Feature: hotel-billing-admin, Property 17: Date range filtering correctness', () => {
    it('should return only invoices within the specified date range', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }

      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              grandTotal: fc.double({ min: 1, max: 10000, noNaN: true }),
              date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            }),
            { minLength: 5, maxLength: 30 }
          ),
          fc.date({ min: new Date('2024-03-01'), max: new Date('2024-06-30') }),
          fc.date({ min: new Date('2024-07-01'), max: new Date('2024-09-30') }),
          async (invoices, startDate, endDate) => {
            // Ensure startDate <= endDate
            if (startDate > endDate) {
              [startDate, endDate] = [endDate, startDate];
            }

            const client = await getClient();
            try {
              await client.query('BEGIN');

              // Create test hotel
              const hotelResult = await client.query(
                `INSERT INTO hotels (email, password_hash, hotel_name, table_count)
                VALUES ($1, $2, $3, $4) RETURNING id`,
                [`test-${Date.now()}@example.com`, 'hash', 'Test Hotel', 10]
              );
              const hotelId = hotelResult.rows[0].id;

              // Insert invoices
              for (const invoice of invoices) {
                await client.query(
                  `INSERT INTO invoices (
                    hotel_id, invoice_number, table_number, subtotal,
                    gst_percentage, gst_amount, service_charge_percentage,
                    service_charge_amount, discount_amount, grand_total,
                    invoice_json, created_at
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                  [
                    hotelId,
                    `INV-${Date.now()}-${Math.random()}`,
                    1,
                    invoice.grandTotal,
                    0,
                    0,
                    0,
                    0,
                    0,
                    invoice.grandTotal,
                    JSON.stringify({}),
                    invoice.date,
                  ]
                );
              }

              const startDateStr = startDate.toISOString().split('T')[0];
              const endDateStr = endDate.toISOString().split('T')[0];

              // Filter invoices
              const result = await filterInvoices(hotelId, {
                startDate: startDateStr,
                endDate: endDateStr,
              });

              // Verify all returned invoices are within date range
              result.invoices.forEach((invoice) => {
                const invoiceDate = new Date(invoice.createdAt);
                const invoiceDateStr = invoiceDate.toISOString().split('T')[0];
                
                expect(invoiceDateStr >= startDateStr).toBe(true);
                expect(invoiceDateStr <= endDateStr).toBe(true);
              });

              // Count expected invoices in range
              const expectedCount = invoices.filter((inv) => {
                const invDateStr = inv.date.toISOString().split('T')[0];
                return invDateStr >= startDateStr && invDateStr <= endDateStr;
              }).length;

              expect(result.total).toBe(expectedCount);

              await client.query('ROLLBACK');
            } catch (error) {
              await client.query('ROLLBACK');
              throw error;
            } finally {
              client.release();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter by table number correctly', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }

      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              grandTotal: fc.double({ min: 1, max: 10000, noNaN: true }),
              tableNumber: fc.integer({ min: 1, max: 20 }),
            }),
            { minLength: 5, maxLength: 30 }
          ),
          fc.integer({ min: 1, max: 20 }),
          async (invoices, filterTableNumber) => {
            const client = await getClient();
            try {
              await client.query('BEGIN');

              // Create test hotel
              const hotelResult = await client.query(
                `INSERT INTO hotels (email, password_hash, hotel_name, table_count)
                VALUES ($1, $2, $3, $4) RETURNING id`,
                [`test-${Date.now()}@example.com`, 'hash', 'Test Hotel', 20]
              );
              const hotelId = hotelResult.rows[0].id;

              // Insert invoices
              for (const invoice of invoices) {
                await client.query(
                  `INSERT INTO invoices (
                    hotel_id, invoice_number, table_number, subtotal,
                    gst_percentage, gst_amount, service_charge_percentage,
                    service_charge_amount, discount_amount, grand_total,
                    invoice_json, created_at
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
                  [
                    hotelId,
                    `INV-${Date.now()}-${Math.random()}`,
                    invoice.tableNumber,
                    invoice.grandTotal,
                    0,
                    0,
                    0,
                    0,
                    0,
                    invoice.grandTotal,
                    JSON.stringify({}),
                  ]
                );
              }

              // Filter invoices by table number
              const result = await filterInvoices(hotelId, {
                tableNumber: filterTableNumber,
              });

              // Verify all returned invoices match the table number
              result.invoices.forEach((invoice) => {
                expect(invoice.tableNumber).toBe(filterTableNumber);
              });

              // Count expected invoices for this table
              const expectedCount = invoices.filter(
                (inv) => inv.tableNumber === filterTableNumber
              ).length;

              expect(result.total).toBe(expectedCount);

              await client.query('ROLLBACK');
            } catch (error) {
              await client.query('ROLLBACK');
              throw error;
            } finally {
              client.release();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
