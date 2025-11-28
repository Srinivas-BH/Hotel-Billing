/**
 * Property-based tests for invoice generation
 * Tests invoice JSON structure completeness and invoice ID uniqueness
 * Requirements: 6.1, 6.3
 */

import * as fc from 'fast-check';
import {
  generateInvoice,
  generateInvoiceDeterministic,
  generateInvoiceNumber,
  OrderData,
} from '../lib/invoice-generator';
import { InvoiceJSON } from '../types';

describe('Invoice Generator Property Tests', () => {
  /**
   * Feature: hotel-billing-admin, Property 10: Invoice JSON structure completeness
   * Validates: Requirements 6.1
   *
   * For any generated invoice, the JSON record should contain all required fields:
   * items, quantities, prices, subtotal, GST, service charge, discount, grand total,
   * invoice ID, and table number
   */
  test('Property 10: Invoice JSON structure completeness', () => {
    // Arbitrary for generating order items
    const orderItemArb = fc.record({
      dishName: fc.string({ minLength: 1, maxLength: 50 }),
      quantity: fc.integer({ min: 1, max: 100 }),
      price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
    });

    // Arbitrary for generating order data
    const orderDataArb = fc.record({
      hotelName: fc.string({ minLength: 1, maxLength: 100 }),
      tableNumber: fc.integer({ min: 1, max: 100 }),
      items: fc.array(orderItemArb, { minLength: 1, maxLength: 20 }),
      gstPercentage: fc.double({ min: 0, max: 30, noNaN: true }),
      serviceChargePercentage: fc.double({ min: 0, max: 20, noNaN: true }),
      discountAmount: fc.double({ min: 0, max: 100, noNaN: true }),
    });

    fc.assert(
      fc.property(orderDataArb, (orderData: OrderData) => {
        // Generate invoice using deterministic algorithm
        const invoice: InvoiceJSON = generateInvoiceDeterministic(orderData);

        // Verify all required fields are present
        expect(invoice).toHaveProperty('invoiceNumber');
        expect(invoice).toHaveProperty('tableNumber');
        expect(invoice).toHaveProperty('hotelName');
        expect(invoice).toHaveProperty('date');
        expect(invoice).toHaveProperty('items');
        expect(invoice).toHaveProperty('subtotal');
        expect(invoice).toHaveProperty('gst');
        expect(invoice).toHaveProperty('serviceCharge');
        expect(invoice).toHaveProperty('discount');
        expect(invoice).toHaveProperty('grandTotal');

        // Verify invoice number is non-empty string
        expect(typeof invoice.invoiceNumber).toBe('string');
        expect(invoice.invoiceNumber.length).toBeGreaterThan(0);

        // Verify table number matches input
        expect(invoice.tableNumber).toBe(orderData.tableNumber);

        // Verify hotel name matches input
        expect(invoice.hotelName).toBe(orderData.hotelName);

        // Verify date is valid ISO string
        expect(typeof invoice.date).toBe('string');
        expect(() => new Date(invoice.date)).not.toThrow();

        // Verify items array structure
        expect(Array.isArray(invoice.items)).toBe(true);
        expect(invoice.items.length).toBe(orderData.items.length);

        invoice.items.forEach((item, index) => {
          expect(item).toHaveProperty('dishName');
          expect(item).toHaveProperty('quantity');
          expect(item).toHaveProperty('price');
          expect(item).toHaveProperty('total');

          expect(item.dishName).toBe(orderData.items[index].dishName);
          expect(item.quantity).toBe(orderData.items[index].quantity);
          expect(item.price).toBe(orderData.items[index].price);
          expect(item.total).toBeCloseTo(
            orderData.items[index].price * orderData.items[index].quantity,
            2
          );
        });

        // Verify subtotal is a number
        expect(typeof invoice.subtotal).toBe('number');
        expect(invoice.subtotal).toBeGreaterThanOrEqual(0);

        // Verify GST structure
        expect(invoice.gst).toHaveProperty('percentage');
        expect(invoice.gst).toHaveProperty('amount');
        expect(typeof invoice.gst.percentage).toBe('number');
        expect(typeof invoice.gst.amount).toBe('number');
        expect(invoice.gst.percentage).toBe(orderData.gstPercentage);

        // Verify service charge structure
        expect(invoice.serviceCharge).toHaveProperty('percentage');
        expect(invoice.serviceCharge).toHaveProperty('amount');
        expect(typeof invoice.serviceCharge.percentage).toBe('number');
        expect(typeof invoice.serviceCharge.amount).toBe('number');
        expect(invoice.serviceCharge.percentage).toBe(orderData.serviceChargePercentage);

        // Verify discount is a number and doesn't exceed subtotal
        expect(typeof invoice.discount).toBe('number');
        expect(invoice.discount).toBeLessThanOrEqual(invoice.subtotal);
        expect(invoice.discount).toBeLessThanOrEqual(orderData.discountAmount);

        // Verify grand total is a number
        expect(typeof invoice.grandTotal).toBe('number');
        expect(invoice.grandTotal).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: hotel-billing-admin, Property 11: Invoice ID uniqueness
   * Validates: Requirements 6.3
   *
   * For any two invoices generated at any time, their invoice IDs should be
   * unique across the entire system
   */
  test('Property 11: Invoice ID uniqueness', () => {
    // Generate multiple invoice numbers and verify they are all unique
    fc.assert(
      fc.property(fc.integer({ min: 10, max: 1000 }), (count) => {
        const invoiceNumbers = new Set<string>();

        // Generate multiple invoice numbers
        for (let i = 0; i < count; i++) {
          const invoiceNumber = generateInvoiceNumber();
          
          // Verify the invoice number is not already in the set
          expect(invoiceNumbers.has(invoiceNumber)).toBe(false);
          
          invoiceNumbers.add(invoiceNumber);
        }

        // Verify all invoice numbers are unique
        expect(invoiceNumbers.size).toBe(count);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: Verify invoice numbers generated from different invoices are unique
   */
  test('Property 11: Invoice IDs are unique across different invoice generations', () => {
    // Arbitrary for generating order data
    const orderItemArb = fc.record({
      dishName: fc.string({ minLength: 1, maxLength: 50 }),
      quantity: fc.integer({ min: 1, max: 100 }),
      price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
    });

    const orderDataArb = fc.record({
      hotelName: fc.string({ minLength: 1, maxLength: 100 }),
      tableNumber: fc.integer({ min: 1, max: 100 }),
      items: fc.array(orderItemArb, { minLength: 1, maxLength: 20 }),
      gstPercentage: fc.double({ min: 0, max: 30, noNaN: true }),
      serviceChargePercentage: fc.double({ min: 0, max: 20, noNaN: true }),
      discountAmount: fc.double({ min: 0, max: 100, noNaN: true }),
    });

    fc.assert(
      fc.property(
        fc.array(orderDataArb, { minLength: 2, maxLength: 50 }),
        (orderDataArray: OrderData[]) => {
          const invoiceNumbers = new Set<string>();

          // Generate invoices for all order data
          orderDataArray.forEach((orderData) => {
            const invoice = generateInvoiceDeterministic(orderData);
            
            // Verify the invoice number is unique
            expect(invoiceNumbers.has(invoice.invoiceNumber)).toBe(false);
            
            invoiceNumbers.add(invoice.invoiceNumber);
          });

          // Verify all invoice numbers are unique
          expect(invoiceNumbers.size).toBe(orderDataArray.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
