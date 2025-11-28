/**
 * Unit Tests for CSV Export Utilities
 * Tests the CSV generation functionality
 * Requirements: 10.1, 10.3
 */

import * as fc from 'fast-check';
import { generateInvoiceCSV, generateCSVFilename } from '../lib/csv-export';
import { Invoice } from '../types';

describe('CSV Export Utilities', () => {
  describe('generateInvoiceCSV', () => {
    it('should generate CSV with correct headers', () => {
      const invoices: Invoice[] = [];
      const csv = generateInvoiceCSV(invoices);
      
      expect(csv).toContain('Invoice Date,Invoice ID,Table Number,Grand Total');
    });

    it('should generate CSV with invoice data', () => {
      const invoices: Invoice[] = [
        {
          id: 'inv-1',
          hotelId: 'hotel-1',
          invoiceNumber: 'INV-001',
          tableNumber: 5,
          subtotal: 100,
          gstPercentage: 18,
          gstAmount: 18,
          serviceChargePercentage: 10,
          serviceChargeAmount: 10,
          discountAmount: 0,
          grandTotal: 128.00,
          invoiceJson: {} as any,
          pdfKey: 'test.pdf',
          items: [],
          createdAt: new Date('2024-01-15T10:30:00Z'),
        },
      ];

      const csv = generateInvoiceCSV(invoices);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(2); // Header + 1 data row
      expect(lines[0]).toBe('Invoice Date,Invoice ID,Table Number,Grand Total');
      expect(lines[1]).toContain('2024-01-15');
      expect(lines[1]).toContain('INV-001');
      expect(lines[1]).toContain('5');
      expect(lines[1]).toContain('128.00');
    });

    it('should generate CSV with multiple invoices', () => {
      const invoices: Invoice[] = [
        {
          id: 'inv-1',
          hotelId: 'hotel-1',
          invoiceNumber: 'INV-001',
          tableNumber: 5,
          subtotal: 100,
          gstPercentage: 18,
          gstAmount: 18,
          serviceChargePercentage: 10,
          serviceChargeAmount: 10,
          discountAmount: 0,
          grandTotal: 128.00,
          invoiceJson: {} as any,
          pdfKey: 'test.pdf',
          items: [],
          createdAt: new Date('2024-01-15T10:30:00Z'),
        },
        {
          id: 'inv-2',
          hotelId: 'hotel-1',
          invoiceNumber: 'INV-002',
          tableNumber: 3,
          subtotal: 250,
          gstPercentage: 18,
          gstAmount: 45,
          serviceChargePercentage: 10,
          serviceChargeAmount: 25,
          discountAmount: 20,
          grandTotal: 300.00,
          invoiceJson: {} as any,
          pdfKey: 'test2.pdf',
          items: [],
          createdAt: new Date('2024-01-16T14:45:00Z'),
        },
      ];

      const csv = generateInvoiceCSV(invoices);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(3); // Header + 2 data rows
      expect(lines[1]).toContain('INV-001');
      expect(lines[2]).toContain('INV-002');
    });

    it('should format grand total with 2 decimal places', () => {
      const invoices: Invoice[] = [
        {
          id: 'inv-1',
          hotelId: 'hotel-1',
          invoiceNumber: 'INV-001',
          tableNumber: 1,
          subtotal: 100,
          gstPercentage: 0,
          gstAmount: 0,
          serviceChargePercentage: 0,
          serviceChargeAmount: 0,
          discountAmount: 0,
          grandTotal: 123.456, // Should be rounded to 123.46
          invoiceJson: {} as any,
          pdfKey: 'test.pdf',
          items: [],
          createdAt: new Date('2024-01-15T10:30:00Z'),
        },
      ];

      const csv = generateInvoiceCSV(invoices);
      
      expect(csv).toContain('123.46');
    });

    it('should escape invoice numbers with commas', () => {
      const invoices: Invoice[] = [
        {
          id: 'inv-1',
          hotelId: 'hotel-1',
          invoiceNumber: 'INV-001,SPECIAL',
          tableNumber: 1,
          subtotal: 100,
          gstPercentage: 0,
          gstAmount: 0,
          serviceChargePercentage: 0,
          serviceChargeAmount: 0,
          discountAmount: 0,
          grandTotal: 100.00,
          invoiceJson: {} as any,
          pdfKey: 'test.pdf',
          items: [],
          createdAt: new Date('2024-01-15T10:30:00Z'),
        },
      ];

      const csv = generateInvoiceCSV(invoices);
      
      expect(csv).toContain('"INV-001,SPECIAL"');
    });

    it('should handle empty invoice array', () => {
      const invoices: Invoice[] = [];
      const csv = generateInvoiceCSV(invoices);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(1); // Only header
      expect(lines[0]).toBe('Invoice Date,Invoice ID,Table Number,Grand Total');
    });
  });

  describe('generateCSVFilename', () => {
    it('should generate filename with date range', () => {
      const filename = generateCSVFilename('2024-01-01', '2024-01-31');
      
      expect(filename).toContain('invoices_2024-01-01_to_2024-01-31');
      expect(filename).toMatch(/\.csv$/);
    });

    it('should generate filename with start date only', () => {
      const filename = generateCSVFilename('2024-01-01');
      
      expect(filename).toContain('invoices_from_2024-01-01');
      expect(filename).toMatch(/\.csv$/);
    });

    it('should generate filename with end date only', () => {
      const filename = generateCSVFilename(undefined, '2024-01-31');
      
      expect(filename).toContain('invoices_until_2024-01-31');
      expect(filename).toMatch(/\.csv$/);
    });

    it('should generate filename without date range', () => {
      const filename = generateCSVFilename();
      
      expect(filename).toContain('invoices_export_');
      expect(filename).toMatch(/\.csv$/);
    });

    it('should include current date in filename', () => {
      const today = new Date().toISOString().split('T')[0];
      const filename = generateCSVFilename();
      
      expect(filename).toContain(today);
    });
  });
});

/**
 * Property-Based Test for CSV Export
 * Feature: hotel-billing-admin, Property 18: CSV export data completeness
 * Validates: Requirements 10.1
 */
describe('Property 18: CSV export data completeness', () => {
  /**
   * For any CSV export, each row should contain invoice date, invoice ID,
   * table number, and grand total for all invoices matching the filter
   */
  it('should include all required fields for every invoice in the CSV', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            hotelId: fc.uuid(),
            invoiceNumber: fc.string({ minLength: 1, maxLength: 50 }),
            tableNumber: fc.integer({ min: 1, max: 100 }),
            subtotal: fc.double({ min: 0, max: 100000, noNaN: true }),
            gstPercentage: fc.double({ min: 0, max: 30, noNaN: true }),
            gstAmount: fc.double({ min: 0, max: 30000, noNaN: true }),
            serviceChargePercentage: fc.double({ min: 0, max: 20, noNaN: true }),
            serviceChargeAmount: fc.double({ min: 0, max: 20000, noNaN: true }),
            discountAmount: fc.double({ min: 0, max: 10000, noNaN: true }),
            grandTotal: fc.double({ min: 0.01, max: 150000, noNaN: true }),
            pdfKey: fc.oneof(fc.constant(null), fc.string()),
            createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (invoices) => {
          // Create Invoice objects with required fields
          const fullInvoices: Invoice[] = invoices.map(inv => ({
            ...inv,
            invoiceJson: {
              invoiceNumber: inv.invoiceNumber,
              tableNumber: inv.tableNumber,
              hotelName: 'Test Hotel',
              date: inv.createdAt.toISOString(),
              items: [],
              subtotal: inv.subtotal,
              gst: { percentage: inv.gstPercentage, amount: inv.gstAmount },
              serviceCharge: { percentage: inv.serviceChargePercentage, amount: inv.serviceChargeAmount },
              discount: inv.discountAmount,
              grandTotal: inv.grandTotal,
            },
            items: [],
          }));

          // Generate CSV
          const csv = generateInvoiceCSV(fullInvoices);
          const lines = csv.split('\n');

          // Property 1: CSV should have header + one row per invoice
          const expectedLineCount = fullInvoices.length + 1; // header + data rows
          expect(lines.length).toBe(expectedLineCount);

          // Property 2: Header should contain all required fields
          const header = lines[0];
          expect(header).toContain('Invoice Date');
          expect(header).toContain('Invoice ID');
          expect(header).toContain('Table Number');
          expect(header).toContain('Grand Total');

          // Property 3: Each data row should contain all required fields for the corresponding invoice
          for (let i = 0; i < fullInvoices.length; i++) {
            const invoice = fullInvoices[i];
            const dataRow = lines[i + 1]; // +1 to skip header

            // Check that the row contains the invoice date (YYYY-MM-DD format)
            const expectedDatePrefix = invoice.createdAt.toISOString().substring(0, 10);
            expect(dataRow).toContain(expectedDatePrefix);

            // Check that the row contains the invoice number
            // The invoice number should appear in the CSV, either plain or escaped
            // We verify by parsing the CSV fields properly
            const fields: string[] = [];
            let currentField = '';
            let inQuotes = false;

            for (let j = 0; j < dataRow.length; j++) {
              const char = dataRow[j];
              
              if (char === '"') {
                if (inQuotes && dataRow[j + 1] === '"') {
                  // Escaped quote - add single quote to field
                  currentField += '"';
                  j++; // Skip next quote
                } else {
                  // Toggle quote mode
                  inQuotes = !inQuotes;
                }
              } else if (char === ',' && !inQuotes) {
                // Field separator
                fields.push(currentField);
                currentField = '';
              } else {
                currentField += char;
              }
            }
            // Add last field
            fields.push(currentField);

            // Verify we have 4 fields
            expect(fields.length).toBe(4);

            // Field 1 (index 1) should be the invoice number
            expect(fields[1]).toBe(invoice.invoiceNumber);

            // Check that the row contains the table number
            expect(fields[2]).toBe(invoice.tableNumber.toString());

            // Check that the row contains the grand total (formatted to 2 decimal places)
            const formattedTotal = invoice.grandTotal.toFixed(2);
            expect(fields[3]).toBe(formattedTotal);
          }

          // Property 4: For empty invoice arrays, CSV should only contain header
          if (fullInvoices.length === 0) {
            expect(lines.length).toBe(1);
            expect(lines[0]).toBe('Invoice Date,Invoice ID,Table Number,Grand Total');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: CSV rows should be parseable and maintain data integrity
   */
  it('should generate valid CSV format that preserves all data values', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            hotelId: fc.uuid(),
            invoiceNumber: fc.string({ minLength: 1, maxLength: 50 }),
            tableNumber: fc.integer({ min: 1, max: 100 }),
            subtotal: fc.double({ min: 0, max: 100000, noNaN: true }),
            gstPercentage: fc.double({ min: 0, max: 30, noNaN: true }),
            gstAmount: fc.double({ min: 0, max: 30000, noNaN: true }),
            serviceChargePercentage: fc.double({ min: 0, max: 20, noNaN: true }),
            serviceChargeAmount: fc.double({ min: 0, max: 20000, noNaN: true }),
            discountAmount: fc.double({ min: 0, max: 10000, noNaN: true }),
            grandTotal: fc.double({ min: 0.01, max: 150000, noNaN: true }),
            pdfKey: fc.oneof(fc.constant(null), fc.string()),
            createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (invoices) => {
          // Create Invoice objects
          const fullInvoices: Invoice[] = invoices.map(inv => ({
            ...inv,
            invoiceJson: {
              invoiceNumber: inv.invoiceNumber,
              tableNumber: inv.tableNumber,
              hotelName: 'Test Hotel',
              date: inv.createdAt.toISOString(),
              items: [],
              subtotal: inv.subtotal,
              gst: { percentage: inv.gstPercentage, amount: inv.gstAmount },
              serviceCharge: { percentage: inv.serviceChargePercentage, amount: inv.serviceChargeAmount },
              discount: inv.discountAmount,
              grandTotal: inv.grandTotal,
            },
            items: [],
          }));

          // Generate CSV
          const csv = generateInvoiceCSV(fullInvoices);
          const lines = csv.split('\n');

          // Skip header
          const dataLines = lines.slice(1);

          // Property: Number of data lines should equal number of invoices
          expect(dataLines.length).toBe(fullInvoices.length);

          // Property: Each line should have exactly 4 fields (accounting for escaped fields)
          for (let i = 0; i < dataLines.length; i++) {
            const line = dataLines[i];
            const invoice = fullInvoices[i];

            // Parse CSV line (simple parser for validation)
            const fields: string[] = [];
            let currentField = '';
            let inQuotes = false;

            for (let j = 0; j < line.length; j++) {
              const char = line[j];
              
              if (char === '"') {
                if (inQuotes && line[j + 1] === '"') {
                  // Escaped quote
                  currentField += '"';
                  j++; // Skip next quote
                } else {
                  // Toggle quote mode
                  inQuotes = !inQuotes;
                }
              } else if (char === ',' && !inQuotes) {
                // Field separator
                fields.push(currentField);
                currentField = '';
              } else {
                currentField += char;
              }
            }
            // Add last field
            fields.push(currentField);

            // Should have exactly 4 fields
            expect(fields.length).toBe(4);

            // Validate field values
            // Field 0: Date (should be in YYYY-MM-DD format)
            expect(fields[0]).toMatch(/^\d{4}-\d{2}-\d{2}/);

            // Field 1: Invoice Number
            expect(fields[1]).toBeTruthy();

            // Field 2: Table Number (should be a number)
            expect(parseInt(fields[2])).toBe(invoice.tableNumber);

            // Field 3: Grand Total (should be formatted to 2 decimal places)
            expect(parseFloat(fields[3])).toBeCloseTo(invoice.grandTotal, 2);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
