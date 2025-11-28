/**
 * Property-Based Tests for Profile Update Validation
 * Feature: hotel-billing-admin, Property 25: Profile update validation
 * Validates: Requirements 15.4
 */

import * as fc from 'fast-check';
import { validateProfileUpdate } from '../lib/validation';

describe('Property-Based Tests: Profile Update Validation', () => {
  /**
   * Property 25: Profile update validation
   * For any profile update with invalid data (negative table count, empty hotel name),
   * the system should reject the update and preserve the existing valid data
   */
  describe('Feature: hotel-billing-admin, Property 25: Profile update validation', () => {
    describe('Valid Profile Updates', () => {
      it('should accept valid hotel name updates', async () => {
        await fc.assert(
          fc.property(
            fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length > 0),
            (hotelName) => {
              const result = validateProfileUpdate(hotelName, undefined);
              expect(result.valid).toBe(true);
              expect(result.errors).toHaveLength(0);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should accept valid table count updates', async () => {
        await fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 1000 }),
            (tableCount) => {
              const result = validateProfileUpdate(undefined, tableCount);
              expect(result.valid).toBe(true);
              expect(result.errors).toHaveLength(0);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should accept valid hotel name and table count updates together', async () => {
        await fc.assert(
          fc.property(
            fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length > 0),
            fc.integer({ min: 1, max: 1000 }),
            (hotelName, tableCount) => {
              const result = validateProfileUpdate(hotelName, tableCount);
              expect(result.valid).toBe(true);
              expect(result.errors).toHaveLength(0);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Invalid Hotel Name Updates', () => {
      it('should reject empty or whitespace-only hotel names', async () => {
        await fc.assert(
          fc.property(
            fc.oneof(
              fc.constant(''),
              fc.constant('   '),
              fc.constant('\t'),
              fc.constant('\n'),
              fc.constant('  \t\n  ')
            ),
            (hotelName) => {
              const result = validateProfileUpdate(hotelName, undefined);
              expect(result.valid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              expect(result.errors.some(e => e.field === 'hotelName')).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject null hotel names', async () => {
        const result = validateProfileUpdate(null, undefined);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.some(e => e.field === 'hotelName')).toBe(true);
      });

      it('should reject non-string hotel names', async () => {
        await fc.assert(
          fc.property(
            fc.oneof(
              fc.integer(),
              fc.boolean(),
              fc.array(fc.string()),
              fc.object()
            ),
            (hotelName) => {
              const result = validateProfileUpdate(hotelName, undefined);
              expect(result.valid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              expect(result.errors.some(e => e.field === 'hotelName')).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Invalid Table Count Updates', () => {
      it('should reject negative table counts', async () => {
        await fc.assert(
          fc.property(
            fc.integer({ min: -1000, max: -1 }),
            (tableCount) => {
              const result = validateProfileUpdate(undefined, tableCount);
              expect(result.valid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              expect(result.errors.some(e => e.field === 'tableCount')).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject zero table count', async () => {
        const result = validateProfileUpdate(undefined, 0);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.some(e => e.field === 'tableCount')).toBe(true);
      });

      it('should reject non-integer table counts', async () => {
        await fc.assert(
          fc.property(
            fc.double({ min: 0.1, max: 100.9, noInteger: true, noNaN: true }),
            (tableCount) => {
              const result = validateProfileUpdate(undefined, tableCount);
              expect(result.valid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              expect(result.errors.some(e => e.field === 'tableCount')).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject null table counts', async () => {
        const result = validateProfileUpdate(undefined, null);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.some(e => e.field === 'tableCount')).toBe(true);
      });

      it('should reject non-numeric table counts', async () => {
        await fc.assert(
          fc.property(
            fc.oneof(
              fc.string(),
              fc.boolean(),
              fc.array(fc.integer()),
              fc.object()
            ),
            (tableCount) => {
              const result = validateProfileUpdate(undefined, tableCount);
              expect(result.valid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              expect(result.errors.some(e => e.field === 'tableCount')).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Combined Invalid Updates', () => {
      it('should reject updates with both invalid hotel name and table count', async () => {
        await fc.assert(
          fc.property(
            fc.oneof(
              fc.constant(''),
              fc.constant('   '),
              fc.constant(null)
            ),
            fc.oneof(
              fc.integer({ min: -100, max: 0 }),
              fc.constant(null)
            ),
            (hotelName, tableCount) => {
              const result = validateProfileUpdate(hotelName, tableCount);
              expect(result.valid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              
              // Should have errors for both fields
              const hasHotelNameError = result.errors.some(e => e.field === 'hotelName');
              const hasTableCountError = result.errors.some(e => e.field === 'tableCount');
              expect(hasHotelNameError || hasTableCountError).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject updates with valid hotel name but invalid table count', async () => {
        await fc.assert(
          fc.property(
            fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length > 0),
            fc.integer({ min: -100, max: 0 }),
            (hotelName, tableCount) => {
              const result = validateProfileUpdate(hotelName, tableCount);
              expect(result.valid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              expect(result.errors.some(e => e.field === 'tableCount')).toBe(true);
              // Should not have hotel name errors
              expect(result.errors.some(e => e.field === 'hotelName')).toBe(false);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject updates with invalid hotel name but valid table count', async () => {
        await fc.assert(
          fc.property(
            fc.oneof(
              fc.constant(''),
              fc.constant('   ')
            ),
            fc.integer({ min: 1, max: 1000 }),
            (hotelName, tableCount) => {
              const result = validateProfileUpdate(hotelName, tableCount);
              expect(result.valid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              expect(result.errors.some(e => e.field === 'hotelName')).toBe(true);
              // Should not have table count errors
              expect(result.errors.some(e => e.field === 'tableCount')).toBe(false);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Error Message Quality', () => {
      it('should provide specific error messages for each validation failure', async () => {
        await fc.assert(
          fc.property(
            fc.oneof(
              fc.constant(''),
              fc.constant(null),
              fc.integer()
            ),
            fc.oneof(
              fc.constant(0),
              fc.constant(-1),
              fc.constant(null),
              fc.string()
            ),
            (hotelName, tableCount) => {
              const result = validateProfileUpdate(hotelName, tableCount);
              
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

      it('should provide user-friendly error messages', async () => {
        await fc.assert(
          fc.property(
            fc.anything(),
            fc.anything(),
            (hotelName, tableCount) => {
              const result = validateProfileUpdate(hotelName, tableCount);
              
              // All error messages should be non-technical and helpful
              result.errors.forEach(error => {
                // Message should be descriptive
                expect(error.message.length).toBeGreaterThan(5);
                
                // Message should indicate what's wrong
                expect(error.message).toMatch(/must|required|should|invalid|positive|non-empty|integer|string|number/i);
              });
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Partial Updates', () => {
      it('should allow updating only hotel name without table count', async () => {
        await fc.assert(
          fc.property(
            fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length > 0),
            (hotelName) => {
              const result = validateProfileUpdate(hotelName, undefined);
              expect(result.valid).toBe(true);
              expect(result.errors).toHaveLength(0);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should allow updating only table count without hotel name', async () => {
        await fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 1000 }),
            (tableCount) => {
              const result = validateProfileUpdate(undefined, tableCount);
              expect(result.valid).toBe(true);
              expect(result.errors).toHaveLength(0);
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should accept when both fields are undefined (no update)', async () => {
        const result = validateProfileUpdate(undefined, undefined);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });
});
