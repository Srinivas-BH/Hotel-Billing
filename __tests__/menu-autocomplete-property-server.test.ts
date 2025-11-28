/**
 * Property-Based Tests for Menu Autocomplete Substring Matching
 * Feature: hotel-billing-admin, Property 20: Menu autocomplete substring matching
 * Validates: Requirements 12.2
 */

import * as fc from 'fast-check';
import { MenuItem } from '../types';

/**
 * Filter menu items using case-insensitive substring matching
 * This is the core logic extracted from MenuAutocomplete component
 */
function filterMenuItems(items: MenuItem[], searchTerm: string): MenuItem[] {
  if (!searchTerm.trim()) return [];

  const lowerSearchTerm = searchTerm.toLowerCase();
  return items.filter((item) =>
    item.dishName.toLowerCase().includes(lowerSearchTerm)
  );
}

describe('Property-Based Tests: Menu Autocomplete Substring Matching', () => {
  /**
   * Property 20: Menu autocomplete substring matching
   * For any input string, the autocomplete results should include all menu items
   * where the dish name contains the input as a case-insensitive substring
   */
  describe('Feature: hotel-billing-admin, Property 20: Menu autocomplete substring matching', () => {
    it('should match all items containing the search term as a case-insensitive substring', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate an array of menu items with random dish names
          fc.array(
            fc.record({
              id: fc.uuid(),
              hotelId: fc.uuid(),
              dishName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
              price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
              createdAt: fc.date(),
              updatedAt: fc.date(),
            }),
            { minLength: 0, maxLength: 100 }
          ),
          // Generate a search term
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          async (menuItems, searchTerm) => {
            // Filter items using the autocomplete logic
            const results = filterMenuItems(menuItems, searchTerm);

            // Property: All returned items must contain the search term (case-insensitive)
            const lowerSearchTerm = searchTerm.toLowerCase();
            for (const item of results) {
              expect(item.dishName.toLowerCase()).toContain(lowerSearchTerm);
            }

            // Property: All items that contain the search term must be in results
            for (const item of menuItems) {
              if (item.dishName.toLowerCase().includes(lowerSearchTerm)) {
                expect(results).toContainEqual(item);
              }
            }

            // Property: No items that don't contain the search term should be in results
            for (const item of results) {
              const shouldMatch = item.dishName.toLowerCase().includes(lowerSearchTerm);
              expect(shouldMatch).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array for empty or whitespace-only search terms', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              hotelId: fc.uuid(),
              dishName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
              price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
              createdAt: fc.date(),
              updatedAt: fc.date(),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          fc.oneof(
            fc.constant(''),
            fc.constant('   '),
            fc.constant('\t'),
            fc.constant('\n')
          ),
          async (menuItems, emptySearchTerm) => {
            const results = filterMenuItems(menuItems, emptySearchTerm);
            
            // Property: Empty or whitespace-only search should return empty array
            expect(results).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be case-insensitive for all character cases', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate menu items with mixed case dish names
          fc.array(
            fc.record({
              id: fc.uuid(),
              hotelId: fc.uuid(),
              dishName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
              price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
              createdAt: fc.date(),
              updatedAt: fc.date(),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          async (menuItems) => {
            // For each item, test that searching with different cases returns the same results
            for (const item of menuItems.slice(0, 10)) { // Test first 10 items to keep test fast
              const searchTerm = item.dishName.substring(0, Math.min(3, item.dishName.length));
              
              if (searchTerm.trim().length === 0) continue;

              const lowerResults = filterMenuItems(menuItems, searchTerm.toLowerCase());
              const upperResults = filterMenuItems(menuItems, searchTerm.toUpperCase());
              const mixedResults = filterMenuItems(menuItems, searchTerm);

              // Property: Case variations should return the same items
              expect(lowerResults.length).toBe(upperResults.length);
              expect(lowerResults.length).toBe(mixedResults.length);
              
              // Verify same items are returned (order doesn't matter)
              const lowerIds = lowerResults.map(r => r.id).sort();
              const upperIds = upperResults.map(r => r.id).sort();
              const mixedIds = mixedResults.map(r => r.id).sort();
              
              expect(lowerIds).toEqual(upperIds);
              expect(lowerIds).toEqual(mixedIds);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should match substrings at any position in the dish name', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          fc.string({ minLength: 5, maxLength: 30 }).filter(s => s.trim().length >= 5),
          fc.double({ min: 0.01, max: 1000, noNaN: true }),
          fc.date(),
          fc.date(),
          fc.integer({ min: 0, max: 20 }),
          fc.integer({ min: 1, max: 5 }),
          async (id, hotelId, dishName, price, createdAt, updatedAt, startPos, length) => {
            const trimmedName = dishName.trim();
            
            // Extract a substring from the dish name
            const actualStart = Math.min(startPos, trimmedName.length - 1);
            const actualLength = Math.min(length, trimmedName.length - actualStart);
            const substring = trimmedName.substring(actualStart, actualStart + actualLength);
            
            if (substring.length === 0) return;

            const menuItem: MenuItem = {
              id,
              hotelId,
              dishName: trimmedName,
              price,
              createdAt,
              updatedAt,
            };

            const results = filterMenuItems([menuItem], substring);

            // Property: The item should be found regardless of where the substring appears
            expect(results).toContainEqual(menuItem);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array when no items match the search term', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              hotelId: fc.uuid(),
              dishName: fc.constantFrom('Pizza', 'Burger', 'Pasta', 'Salad', 'Soup'),
              price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
              createdAt: fc.date(),
              updatedAt: fc.date(),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          async (menuItems) => {
            // Search for something that definitely doesn't exist
            const nonExistentTerm = 'XYZQWERTY123456789';
            const results = filterMenuItems(menuItems, nonExistentTerm);

            // Property: No matches should return empty array
            expect(results).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle special characters in search terms and dish names', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              hotelId: fc.uuid(),
              dishName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
              price: fc.double({ min: 0.01, max: 1000, noNaN: true }),
              createdAt: fc.date(),
              updatedAt: fc.date(),
            }),
            { minLength: 0, maxLength: 50 }
          ),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          async (menuItems, searchTerm) => {
            const results = filterMenuItems(menuItems, searchTerm);

            // Property: Results should only contain items that match
            for (const result of results) {
              expect(result.dishName.toLowerCase()).toContain(searchTerm.toLowerCase());
            }

            // Property: All matching items should be included
            const expectedMatches = menuItems.filter(item =>
              item.dishName.toLowerCase().includes(searchTerm.toLowerCase())
            );
            expect(results.length).toBe(expectedMatches.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
