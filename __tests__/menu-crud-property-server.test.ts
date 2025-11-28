/**
 * Property-Based Tests for Menu CRUD Operations
 * Feature: hotel-billing-admin, Property 3: Menu item CRUD maintains data integrity
 * Validates: Requirements 3.1, 3.2, 3.3
 */

import * as fc from 'fast-check';
import {
  createMenuItem,
  getMenuItems,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
} from '../lib/menu';
import { query, closePool } from '../lib/db';
import { runMigrations, dropAllTables } from '../lib/migrate';

// Helper function to create a test hotel
async function createTestHotel(
  email: string,
  passwordHash: string,
  hotelName: string,
  tableCount: number
): Promise<string> {
  const result = await query<{ id: string }>(
    `INSERT INTO hotels (email, password_hash, hotel_name, table_count)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [email, passwordHash, hotelName, tableCount]
  );
  return result.rows[0].id;
}

// Setup and teardown
beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL not set. Skipping property tests.');
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

describe('Property-Based Tests: Menu CRUD Data Integrity', () => {
  const skipTests = !process.env.DATABASE_URL;

  /**
   * Property 3: Menu item CRUD maintains data integrity
   * For any menu item, after creating, reading, updating, or deleting,
   * the database state should accurately reflect the operation with
   * correct associations to the hotel
   */
  describe('Feature: hotel-billing-admin, Property 3: Menu item CRUD maintains data integrity', () => {
    beforeEach(async () => {
      if (process.env.DATABASE_URL) {
        await query('DELETE FROM menu_items');
        await query('DELETE FROM hotels');
      }
    });

    it('should maintain data integrity for create operations', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          fc.double({ min: 0.01, max: 10000, noNaN: true }),
          async (dishName, price) => {
            // Create a test hotel
            const hotelId = await createTestHotel(
              `test-${Date.now()}-${Math.random()}@example.com`,
              'hashedpassword123',
              'Test Hotel',
              10
            );

            // Create menu item
            const created = await createMenuItem(hotelId, dishName.trim(), price);

            // Verify the created item has correct data
            expect(created.dishName).toBe(dishName.trim());
            expect(created.price).toBeCloseTo(price, 2);
            expect(created.hotelId).toBe(hotelId);
            expect(created.id).toBeDefined();

            // Verify we can retrieve it
            const retrieved = await getMenuItemById(created.id, hotelId);
            expect(retrieved).not.toBeNull();
            expect(retrieved?.dishName).toBe(dishName.trim());
            expect(retrieved?.price).toBeCloseTo(price, 2);
            expect(retrieved?.hotelId).toBe(hotelId);

            // Verify it appears in the list
            const items = await getMenuItems(hotelId);
            expect(items.some(item => item.id === created.id)).toBe(true);

            // Cleanup
            await query('DELETE FROM menu_items WHERE id = $1', [created.id]);
            await query('DELETE FROM hotels WHERE id = $1', [hotelId]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain data integrity for update operations', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          fc.double({ min: 0.01, max: 10000, noNaN: true }),
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          fc.double({ min: 0.01, max: 10000, noNaN: true }),
          async (initialName, initialPrice, updatedName, updatedPrice) => {
            // Create a test hotel
            const hotelId = await createTestHotel(
              `test-${Date.now()}-${Math.random()}@example.com`,
              'hashedpassword123',
              'Test Hotel',
              10
            );

            // Create initial menu item
            const created = await createMenuItem(hotelId, initialName.trim(), initialPrice);

            // Update the menu item
            const updated = await updateMenuItem(
              created.id,
              hotelId,
              updatedName.trim(),
              updatedPrice
            );

            // Verify update succeeded
            expect(updated).not.toBeNull();
            expect(updated?.id).toBe(created.id);
            expect(updated?.dishName).toBe(updatedName.trim());
            expect(updated?.price).toBeCloseTo(updatedPrice, 2);
            expect(updated?.hotelId).toBe(hotelId);

            // Verify the update persisted
            const retrieved = await getMenuItemById(created.id, hotelId);
            expect(retrieved?.dishName).toBe(updatedName.trim());
            expect(retrieved?.price).toBeCloseTo(updatedPrice, 2);

            // Cleanup
            await query('DELETE FROM menu_items WHERE id = $1', [created.id]);
            await query('DELETE FROM hotels WHERE id = $1', [hotelId]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain data integrity for delete operations', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          fc.double({ min: 0.01, max: 10000, noNaN: true }),
          async (dishName, price) => {
            // Create a test hotel
            const hotelId = await createTestHotel(
              `test-${Date.now()}-${Math.random()}@example.com`,
              'hashedpassword123',
              'Test Hotel',
              10
            );

            // Create menu item
            const created = await createMenuItem(hotelId, dishName.trim(), price);

            // Verify it exists
            const beforeDelete = await getMenuItemById(created.id, hotelId);
            expect(beforeDelete).not.toBeNull();

            // Delete the menu item
            const deleted = await deleteMenuItem(created.id, hotelId);
            expect(deleted).toBe(true);

            // Verify it no longer exists
            const afterDelete = await getMenuItemById(created.id, hotelId);
            expect(afterDelete).toBeNull();

            // Verify it's not in the list
            const items = await getMenuItems(hotelId);
            expect(items.some(item => item.id === created.id)).toBe(false);

            // Cleanup
            await query('DELETE FROM hotels WHERE id = $1', [hotelId]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain hotel isolation - items belong only to their hotel', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          fc.double({ min: 0.01, max: 10000, noNaN: true }),
          async (dishName, price) => {
            // Create two test hotels
            const hotel1Id = await createTestHotel(
              `hotel1-${Date.now()}-${Math.random()}@example.com`,
              'hashedpassword123',
              'Hotel 1',
              10
            );
            const hotel2Id = await createTestHotel(
              `hotel2-${Date.now()}-${Math.random()}@example.com`,
              'hashedpassword456',
              'Hotel 2',
              15
            );

            // Create menu item for hotel 1
            const item = await createMenuItem(hotel1Id, dishName.trim(), price);

            // Verify hotel 1 can access it
            const hotel1Item = await getMenuItemById(item.id, hotel1Id);
            expect(hotel1Item).not.toBeNull();

            // Verify hotel 2 cannot access it
            const hotel2Item = await getMenuItemById(item.id, hotel2Id);
            expect(hotel2Item).toBeNull();

            // Verify hotel 2 cannot update it
            const hotel2Update = await updateMenuItem(
              item.id,
              hotel2Id,
              'Hacked Name',
              999.99
            );
            expect(hotel2Update).toBeNull();

            // Verify the item is unchanged
            const stillOriginal = await getMenuItemById(item.id, hotel1Id);
            expect(stillOriginal?.dishName).toBe(dishName.trim());
            expect(stillOriginal?.price).toBeCloseTo(price, 2);

            // Verify hotel 2 cannot delete it
            const hotel2Delete = await deleteMenuItem(item.id, hotel2Id);
            expect(hotel2Delete).toBe(false);

            // Verify the item still exists
            const stillExists = await getMenuItemById(item.id, hotel1Id);
            expect(stillExists).not.toBeNull();

            // Cleanup
            await query('DELETE FROM menu_items WHERE id = $1', [item.id]);
            await query('DELETE FROM hotels WHERE id = $1', [hotel1Id]);
            await query('DELETE FROM hotels WHERE id = $1', [hotel2Id]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain referential integrity when hotel is deleted', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }

      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              dishName: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
              price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (menuItems) => {
            // Create a test hotel
            const hotelId = await createTestHotel(
              `test-${Date.now()}-${Math.random()}@example.com`,
              'hashedpassword123',
              'Test Hotel',
              10
            );

            // Create multiple menu items
            const createdItems = await Promise.all(
              menuItems.map(item =>
                createMenuItem(hotelId, item.dishName.trim(), item.price)
              )
            );

            // Verify all items exist
            const itemsBefore = await getMenuItems(hotelId);
            expect(itemsBefore.length).toBe(createdItems.length);

            // Delete the hotel (should cascade delete menu items)
            await query('DELETE FROM hotels WHERE id = $1', [hotelId]);

            // Verify all menu items are deleted (cascade)
            const itemsAfter = await query(
              'SELECT * FROM menu_items WHERE hotel_id = $1',
              [hotelId]
            );
            expect(itemsAfter.rows.length).toBe(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
