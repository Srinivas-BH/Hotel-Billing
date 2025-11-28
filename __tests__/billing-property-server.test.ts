/**
 * Property-Based Tests for Billing Calculations
 * Feature: hotel-billing-admin
 * Tests Properties 4, 5, 6, 7, 8, 9
 */

import * as fc from 'fast-check';
import {
  calculateSubtotal,
  calculateGST,
  calculateServiceCharge,
  applyDiscount,
  calculateGrandTotal,
  OrderItem,
} from '../lib/billing';

describe('Property-Based Tests: Billing Calculations', () => {
  /**
   * Property 5: Bill calculation accuracy
   * For any set of order items with prices and quantities,
   * the calculated subtotal should equal the sum of (price × quantity) for all items
   * Validates: Requirements 5.1
   */
  describe('Feature: hotel-billing-admin, Property 5: Bill calculation accuracy', () => {
    it('should calculate subtotal as sum of price × quantity for all items', async () => {
      await fc.assert(
        fc.property(
          fc.array(
            fc.record({
              price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
              quantity: fc.integer({ min: 1, max: 100 }),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (items: OrderItem[]) => {
            const subtotal = calculateSubtotal(items);
            const expectedSubtotal = items.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            );
            
            // Use toBeCloseTo for floating point comparison
            expect(subtotal).toBeCloseTo(expectedSubtotal, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 for empty order', () => {
      const subtotal = calculateSubtotal([]);
      expect(subtotal).toBe(0);
    });

    it('should handle single item correctly', async () => {
      await fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 10000, noNaN: true }),
          fc.integer({ min: 1, max: 100 }),
          (price, quantity) => {
            const subtotal = calculateSubtotal([{ price, quantity }]);
            expect(subtotal).toBeCloseTo(price * quantity, 2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: GST calculation correctness
   * For any order with GST enabled, the GST amount should equal
   * (subtotal - discount) × (GST percentage / 100), and the total should include this amount
   * Validates: Requirements 5.2
   */
  describe('Feature: hotel-billing-admin, Property 6: GST calculation correctness', () => {
    it('should calculate GST on discounted subtotal', async () => {
      await fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 10000, noNaN: true }),
          fc.double({ min: 0, max: 1000, noNaN: true }),
          fc.double({ min: 0, max: 30, noNaN: true }),
          (subtotal, discountAmount, gstPercentage) => {
            // Ensure discount doesn't exceed subtotal
            const validDiscount = Math.min(discountAmount, subtotal);
            
            const gstAmount = calculateGST(subtotal, validDiscount, gstPercentage);
            const expectedGST = (subtotal - validDiscount) * (gstPercentage / 100);
            
            expect(gstAmount).toBeCloseTo(expectedGST, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 GST when percentage is 0', async () => {
      await fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 10000, noNaN: true }),
          fc.double({ min: 0, max: 1000, noNaN: true }),
          (subtotal, discountAmount) => {
            const validDiscount = Math.min(discountAmount, subtotal);
            const gstAmount = calculateGST(subtotal, validDiscount, 0);
            expect(gstAmount).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply GST after discount is subtracted', async () => {
      await fc.assert(
        fc.property(
          fc.double({ min: 100, max: 10000, noNaN: true }),
          fc.double({ min: 10, max: 50, noNaN: true }),
          fc.double({ min: 5, max: 30, noNaN: true }),
          (subtotal, discountAmount, gstPercentage) => {
            const validDiscount = Math.min(discountAmount, subtotal);
            
            const gstWithDiscount = calculateGST(subtotal, validDiscount, gstPercentage);
            const gstWithoutDiscount = calculateGST(subtotal, 0, gstPercentage);
            
            // GST with discount should be less than GST without discount
            expect(gstWithDiscount).toBeLessThanOrEqual(gstWithoutDiscount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Service charge calculation correctness
   * For any order with service charge enabled, the service charge amount should equal
   * (subtotal - discount) × (service charge percentage / 100), and the total should include this amount
   * Validates: Requirements 5.3
   */
  describe('Feature: hotel-billing-admin, Property 7: Service charge calculation correctness', () => {
    it('should calculate service charge on discounted subtotal', async () => {
      await fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 10000, noNaN: true }),
          fc.double({ min: 0, max: 1000, noNaN: true }),
          fc.double({ min: 0, max: 20, noNaN: true }),
          (subtotal, discountAmount, serviceChargePercentage) => {
            // Ensure discount doesn't exceed subtotal
            const validDiscount = Math.min(discountAmount, subtotal);
            
            const serviceChargeAmount = calculateServiceCharge(
              subtotal,
              validDiscount,
              serviceChargePercentage
            );
            const expectedServiceCharge =
              (subtotal - validDiscount) * (serviceChargePercentage / 100);
            
            expect(serviceChargeAmount).toBeCloseTo(expectedServiceCharge, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 service charge when percentage is 0', async () => {
      await fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 10000, noNaN: true }),
          fc.double({ min: 0, max: 1000, noNaN: true }),
          (subtotal, discountAmount) => {
            const validDiscount = Math.min(discountAmount, subtotal);
            const serviceChargeAmount = calculateServiceCharge(subtotal, validDiscount, 0);
            expect(serviceChargeAmount).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply service charge after discount is subtracted', async () => {
      await fc.assert(
        fc.property(
          fc.double({ min: 100, max: 10000, noNaN: true }),
          fc.double({ min: 10, max: 50, noNaN: true }),
          fc.double({ min: 5, max: 20, noNaN: true }),
          (subtotal, discountAmount, serviceChargePercentage) => {
            const validDiscount = Math.min(discountAmount, subtotal);
            
            const serviceChargeWithDiscount = calculateServiceCharge(
              subtotal,
              validDiscount,
              serviceChargePercentage
            );
            const serviceChargeWithoutDiscount = calculateServiceCharge(
              subtotal,
              0,
              serviceChargePercentage
            );
            
            // Service charge with discount should be less than service charge without discount
            expect(serviceChargeWithDiscount).toBeLessThanOrEqual(
              serviceChargeWithoutDiscount
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Discount application order
   * For any order with a discount, the discount should be subtracted from the subtotal
   * before calculating GST and service charge
   * Validates: Requirements 5.4
   */
  describe('Feature: hotel-billing-admin, Property 8: Discount application order', () => {
    it('should subtract discount from subtotal before applying GST and service charge', async () => {
      await fc.assert(
        fc.property(
          fc.array(
            fc.record({
              price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
              quantity: fc.integer({ min: 1, max: 50 }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.double({ min: 0, max: 30, noNaN: true }),
          fc.double({ min: 0, max: 20, noNaN: true }),
          (items: OrderItem[], discountAmount, gstPercentage, serviceChargePercentage) => {
            const subtotal = calculateSubtotal(items);
            const validDiscount = Math.min(discountAmount, subtotal);
            
            // Calculate GST and service charge
            const gstAmount = calculateGST(subtotal, validDiscount, gstPercentage);
            const serviceChargeAmount = calculateServiceCharge(
              subtotal,
              validDiscount,
              serviceChargePercentage
            );
            
            // Verify that GST and service charge are calculated on discounted subtotal
            const discountedSubtotal = subtotal - validDiscount;
            const expectedGST = discountedSubtotal * (gstPercentage / 100);
            const expectedServiceCharge = discountedSubtotal * (serviceChargePercentage / 100);
            
            expect(gstAmount).toBeCloseTo(expectedGST, 2);
            expect(serviceChargeAmount).toBeCloseTo(expectedServiceCharge, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply discount correctly using applyDiscount function', async () => {
      await fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 10000, noNaN: true }),
          fc.double({ min: 0, max: 1000, noNaN: true }),
          (subtotal, discountAmount) => {
            const validDiscount = Math.min(discountAmount, subtotal);
            const discountedSubtotal = applyDiscount(subtotal, validDiscount);
            const expectedResult = subtotal - validDiscount;
            
            expect(discountedSubtotal).toBeCloseTo(expectedResult, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ensure discount affects final total correctly', async () => {
      await fc.assert(
        fc.property(
          fc.array(
            fc.record({
              price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
              quantity: fc.integer({ min: 1, max: 50 }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          fc.double({ min: 10, max: 100, noNaN: true }),
          fc.double({ min: 5, max: 30, noNaN: true }),
          fc.double({ min: 5, max: 20, noNaN: true }),
          (items: OrderItem[], discountAmount, gstPercentage, serviceChargePercentage) => {
            const subtotal = calculateSubtotal(items);
            const validDiscount = Math.min(discountAmount, subtotal);
            
            // Calculate with discount
            const resultWithDiscount = calculateGrandTotal(
              items,
              gstPercentage,
              serviceChargePercentage,
              validDiscount
            );
            
            // Calculate without discount
            const resultWithoutDiscount = calculateGrandTotal(
              items,
              gstPercentage,
              serviceChargePercentage,
              0
            );
            
            // Grand total with discount should be less than without discount
            expect(resultWithDiscount.grandTotal).toBeLessThan(
              resultWithoutDiscount.grandTotal
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 9: Grand total calculation completeness
   * For any invoice, the grand total should equal
   * subtotal + GST amount + service charge amount - discount amount
   * Validates: Requirements 5.5
   */
  describe('Feature: hotel-billing-admin, Property 9: Grand total calculation completeness', () => {
    it('should calculate grand total as subtotal + GST + service charge - discount', async () => {
      await fc.assert(
        fc.property(
          fc.array(
            fc.record({
              price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
              quantity: fc.integer({ min: 1, max: 100 }),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          fc.double({ min: 0, max: 30, noNaN: true }),
          fc.double({ min: 0, max: 20, noNaN: true }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          (items: OrderItem[], gstPct, servicePct, discount) => {
            const result = calculateGrandTotal(items, gstPct, servicePct, discount);
            
            // Manually calculate expected grand total
            const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const validDiscount = Math.min(discount, subtotal);
            const gstAmount = (subtotal - validDiscount) * (gstPct / 100);
            const serviceAmount = (subtotal - validDiscount) * (servicePct / 100);
            const expected = subtotal + gstAmount + serviceAmount - validDiscount;
            
            expect(result.grandTotal).toBeCloseTo(expected, 2);
            expect(result.subtotal).toBeCloseTo(subtotal, 2);
            expect(result.gstAmount).toBeCloseTo(gstAmount, 2);
            expect(result.serviceChargeAmount).toBeCloseTo(serviceAmount, 2);
            expect(result.discountAmount).toBeCloseTo(validDiscount, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return complete billing calculation with all components', async () => {
      await fc.assert(
        fc.property(
          fc.array(
            fc.record({
              price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
              quantity: fc.integer({ min: 1, max: 100 }),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          fc.double({ min: 0, max: 30, noNaN: true }),
          fc.double({ min: 0, max: 20, noNaN: true }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          (items: OrderItem[], gstPct, servicePct, discount) => {
            const result = calculateGrandTotal(items, gstPct, servicePct, discount);
            
            // Verify all fields are present and valid (with small tolerance for floating point)
            expect(result.subtotal).toBeGreaterThanOrEqual(-0.01);
            expect(result.gstAmount).toBeGreaterThanOrEqual(-0.01);
            expect(result.serviceChargeAmount).toBeGreaterThanOrEqual(-0.01);
            expect(result.discountAmount).toBeGreaterThanOrEqual(-0.01);
            expect(result.grandTotal).toBeGreaterThanOrEqual(-0.01);
            
            // Verify the relationship holds
            const calculatedTotal =
              result.subtotal +
              result.gstAmount +
              result.serviceChargeAmount -
              result.discountAmount;
            expect(result.grandTotal).toBeCloseTo(calculatedTotal, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge case with no GST, service charge, or discount', async () => {
      await fc.assert(
        fc.property(
          fc.array(
            fc.record({
              price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
              quantity: fc.integer({ min: 1, max: 100 }),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (items: OrderItem[]) => {
            const result = calculateGrandTotal(items, 0, 0, 0);
            const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
            
            // Grand total should equal subtotal when no charges or discounts
            expect(result.grandTotal).toBeCloseTo(subtotal, 2);
            expect(result.gstAmount).toBe(0);
            expect(result.serviceChargeAmount).toBe(0);
            expect(result.discountAmount).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge case with maximum values', async () => {
      await fc.assert(
        fc.property(
          fc.array(
            fc.record({
              price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
              quantity: fc.integer({ min: 1, max: 100 }),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (items: OrderItem[]) => {
            const result = calculateGrandTotal(items, 30, 20, 0);
            const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
            
            // Grand total should be subtotal + 50% (30% GST + 20% service charge)
            const expected = subtotal * 1.5;
            expect(result.grandTotal).toBeCloseTo(expected, 2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: Order quantities are positive integers
   * For any order submission, all item quantities should be validated
   * as positive integers before processing
   * Validates: Requirements 4.3
   */
  describe('Feature: hotel-billing-admin, Property 4: Order quantities are positive integers', () => {
    it('should accept all positive integer quantities', async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          (quantity) => {
            const { validateQuantity } = require('../lib/validation');
            const result = validateQuantity(quantity);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject non-positive quantities', async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: -100, max: 0 }),
          (quantity) => {
            const { validateQuantity } = require('../lib/validation');
            const result = validateQuantity(quantity);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some((e: any) => e.field === 'quantity')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject non-integer quantities', async () => {
      await fc.assert(
        fc.property(
          fc.double({ min: 0.1, max: 100.9, noInteger: true, noNaN: true }),
          (quantity) => {
            const { validateQuantity } = require('../lib/validation');
            const result = validateQuantity(quantity);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some((e: any) => e.field === 'quantity')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate quantities in order items before billing calculation', async () => {
      await fc.assert(
        fc.property(
          fc.array(
            fc.record({
              price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
              quantity: fc.integer({ min: 1, max: 100 }),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (items: OrderItem[]) => {
            const { validateQuantity } = require('../lib/validation');
            
            // All quantities in valid order items should pass validation
            items.forEach(item => {
              const result = validateQuantity(item.quantity);
              expect(result.valid).toBe(true);
            });
            
            // And billing calculation should work correctly
            const subtotal = calculateSubtotal(items);
            expect(subtotal).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
