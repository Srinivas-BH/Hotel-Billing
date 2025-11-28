/**
 * Property-Based Tests for Input Validation
 * Feature: hotel-billing-admin, Property 23: Input validation completeness
 * Validates: Requirements 13.4
 */

import * as fc from 'fast-check';
import {
  validateMenuItemInput,
  validateTableNumber,
  validateQuantity,
} from '../lib/validation';

describe('Property-Based Tests: Input Validation Completeness', () => {
  /**
   * Property 23: Input validation completeness
   * For any form submission, all inputs should be validated against their schema
   * before processing, and invalid inputs should be rejected with specific error messages
   */
  describe('Feature: hotel-billing-admin, Property 23: Input validation completeness', () => {
    describe('Menu Item Validation', () => {
      it('should accept all valid menu item inputs', async () => {
        await fc.assert(
          fc.property(
            fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length > 0),
            fc.double({ min: 0.01, max: 999999.99, noNaN: true }),
            (dishName, price) => {
              const result = validateMenuItemInput(dishName, price);
              expect(result.valid).toBe(true);
              expect(result.errors).toHaveLength(0);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject empty or whitespace-only dish names', async () => {
        await fc.assert(
          fc.property(
            fc.oneof(
              fc.constant(''),
              fc.constant('   '),
              fc.constant('\t'),
              fc.constant('\n'),
              fc.constant('  \t\n  ')
            ),
            fc.double({ min: 0.01, max: 999999.99, noNaN: true }),
            (dishName, price) => {
              const result = validateMenuItemInput(dishName, price);
              expect(result.valid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              expect(result.errors.some(e => e.field === 'dishName')).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject non-positive prices', async () => {
        await fc.assert(
          fc.property(
            fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length > 0),
            fc.oneof(
              fc.constant(0),
              fc.double({ min: -999999.99, max: -0.01, noNaN: true }),
              fc.constant(-0)
            ),
            (dishName, price) => {
              const result = validateMenuItemInput(dishName, price);
              expect(result.valid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              expect(result.errors.some(e => e.field === 'price')).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject invalid price types', async () => {
        await fc.assert(
          fc.property(
            fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length > 0),
            fc.oneof(
              fc.constant(NaN),
              fc.constant(Infinity),
              fc.constant(-Infinity)
            ),
            (dishName, price) => {
              const result = validateMenuItemInput(dishName, price);
              expect(result.valid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              expect(result.errors.some(e => e.field === 'price')).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject null or undefined inputs', async () => {
        await fc.assert(
          fc.property(
            fc.oneof(
              fc.constant(null),
              fc.constant(undefined)
            ),
            fc.oneof(
              fc.constant(null),
              fc.constant(undefined)
            ),
            (dishName, price) => {
              const result = validateMenuItemInput(dishName, price);
              expect(result.valid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should provide specific error messages for each validation failure', async () => {
        await fc.assert(
          fc.property(
            fc.oneof(
              fc.constant(''),
              fc.constant(null),
              fc.constant(undefined),
              fc.integer()
            ),
            fc.oneof(
              fc.constant(0),
              fc.constant(-1),
              fc.constant(NaN),
              fc.constant(Infinity),
              fc.constant('not a number')
            ),
            (dishName, price) => {
              const result = validateMenuItemInput(dishName, price);
              
              // Each error should have a field and message
              result.errors.forEach(error => {
                expect(error.field).toBeDefined();
                expect(typeof error.field).toBe('string');
                expect(error.message).toBeDefined();
                expect(typeof error.message).toBe('string');
                expect(error.message.length).toBeGreaterThan(0);
              });
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Table Number Validation', () => {
      it('should accept all valid table numbers within range', async () => {
        await fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 100 }),
            fc.integer({ min: 1, max: 100 }),
            (tableNumber, maxTableCount) => {
              // Only test when tableNumber is within valid range
              if (tableNumber <= maxTableCount) {
                const result = validateTableNumber(tableNumber, maxTableCount);
                expect(result.valid).toBe(true);
                expect(result.errors).toHaveLength(0);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject table numbers outside valid range', async () => {
        await fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 100 }),
            fc.integer({ min: 101, max: 1000 }),
            (maxTableCount, tableNumber) => {
              // tableNumber is always greater than maxTableCount
              const result = validateTableNumber(tableNumber, maxTableCount);
              expect(result.valid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              expect(result.errors.some(e => e.field === 'tableNumber')).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject non-integer table numbers', async () => {
        await fc.assert(
          fc.property(
            fc.double({ min: 0.1, max: 100.9, noInteger: true, noNaN: true }),
            fc.integer({ min: 1, max: 100 }),
            (tableNumber, maxTableCount) => {
              const result = validateTableNumber(tableNumber, maxTableCount);
              expect(result.valid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              expect(result.errors.some(e => e.field === 'tableNumber')).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject table numbers less than 1', async () => {
        await fc.assert(
          fc.property(
            fc.integer({ min: -100, max: 0 }),
            fc.integer({ min: 1, max: 100 }),
            (tableNumber, maxTableCount) => {
              const result = validateTableNumber(tableNumber, maxTableCount);
              expect(result.valid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              expect(result.errors.some(e => e.field === 'tableNumber')).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Quantity Validation', () => {
      it('should accept all positive integer quantities', async () => {
        await fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 1000 }),
            (quantity) => {
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
              const result = validateQuantity(quantity);
              expect(result.valid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              expect(result.errors.some(e => e.field === 'quantity')).toBe(true);
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
              const result = validateQuantity(quantity);
              expect(result.valid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              expect(result.errors.some(e => e.field === 'quantity')).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject null or undefined quantities', async () => {
        await fc.assert(
          fc.property(
            fc.oneof(
              fc.constant(null),
              fc.constant(undefined)
            ),
            (quantity) => {
              const result = validateQuantity(quantity);
              expect(result.valid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              expect(result.errors.some(e => e.field === 'quantity')).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Validation Error Messages', () => {
      it('should always provide user-friendly error messages', async () => {
        await fc.assert(
          fc.property(
            fc.anything(),
            fc.anything(),
            (dishName, price) => {
              const result = validateMenuItemInput(dishName, price);
              
              // All error messages should be non-technical and helpful
              result.errors.forEach(error => {
                // Message should not contain technical jargon
                expect(error.message).not.toMatch(/undefined|null|NaN/i);
                
                // Message should be descriptive
                expect(error.message.length).toBeGreaterThan(10);
                
                // Message should indicate what's wrong
                expect(error.message).toMatch(/required|must|should|invalid/i);
              });
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});
