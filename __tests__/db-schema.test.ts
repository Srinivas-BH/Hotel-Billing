/**
 * Property-Based Tests for Database Schema Integrity
 * Feature: hotel-billing-admin
 */

import * as fc from 'fast-check';
import { query, getClient, closePool } from '../lib/db';
import { runMigrations, dropAllTables } from '../lib/migrate';

// Test data generators
const emailArbitrary = fc.emailAddress();
const passwordHashArbitrary = fc.string({ minLength: 60, maxLength: 60 }); // bcrypt hash length
const hotelNameArbitrary = fc.string({ minLength: 1, maxLength: 255 });
const tableCountArbitrary = fc.integer({ min: 1, max: 100 });
const dishNameArbitrary = fc.string({ minLength: 1, maxLength: 255 });
const priceArbitrary = fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true });

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

// Helper function to create a menu item
async function createMenuItem(
  hotelId: string,
  dishName: string,
  price: number
): Promise<string> {
  const result = await query<{ id: string }>(
    `INSERT INTO menu_items (hotel_id, dish_name, price)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [hotelId, dishName, price]
  );
  return result.rows[0].id;
}

// Helper function to read a menu item
async function readMenuItem(menuItemId: string): Promise<any> {
  const result = await query(
    `SELECT * FROM menu_items WHERE id = $1`,
    [menuItemId]
  );
  return result.rows[0];
}

// Helper function to update a menu item
async function updateMenuItem(
  menuItemId: string,
  dishName: string,
  price: number
): Promise<void> {
  await query(
    `UPDATE menu_items SET dish_name = $1, price = $2 WHERE id = $3`,
    [dishName, price, menuItemId]
  );
}

// Helper function to delete a menu item
async function deleteMenuItem(menuItemId: string): Promise<void> {
  await query(`DELETE FROM menu_items WHERE id = $1`, [menuItemId]);
}

// Setup and teardown
beforeAll(async () => {
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL not set. Skipping database tests.');
    console.warn('   To run these tests, set up a Supabase database and configure DATABASE_URL in .env');
    console.warn('   See lib/README.md for setup instructions.');
    return;
  }

  // Ensure we have a clean database
  try {
    await dropAllTables();
    await runMigrations();
  } catch (error) {
    console.error('Setup failed:', error);
    throw error;
  }
});

afterAll(async () => {
  // Clean up
  if (process.env.DATABASE_URL) {
    await closePool();
  }
});

// Clean up between tests
afterEach(async () => {
  if (process.env.DATABASE_URL) {
    await query('DELETE FROM menu_items');
    await query('DELETE FROM hotels');
  }
});

describe('Database Schema Integrity Tests', () => {
  /**
   * Feature: hotel-billing-admin, Property 3: Menu item CRUD maintains data integrity
   * Validates: Requirements 3.1, 3.2, 3.3
   */
  describe('Property 3: Menu item CRUD maintains data integrity', () => {
    // Skip all tests if DATABASE_URL is not set
    const skipTests = !process.env.DATABASE_URL;

    it('should create and read menu items with correct data', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }
      await fc.assert(
        fc.asyncProperty(
          emailArbitrary,
          passwordHashArbitrary,
          hotelNameArbitrary,
          tableCountArbitrary,
          dishNameArbitrary,
          priceArbitrary,
          async (email, passwordHash, hotelName, tableCount, dishName, price) => {
            // Create a hotel first
            const hotelId = await createTestHotel(email, passwordHash, hotelName, tableCount);

            // Create a menu item
            const menuItemId = await createMenuItem(hotelId, dishName, price);

            // Read the menu item back
            const menuItem = await readMenuItem(menuItemId);

            // Verify data integrity
            expect(menuItem).toBeDefined();
            expect(menuItem.id).toBe(menuItemId);
            expect(menuItem.hotel_id).toBe(hotelId);
            expect(menuItem.dish_name).toBe(dishName);
            expect(parseFloat(menuItem.price)).toBeCloseTo(price, 2);
            expect(menuItem.created_at).toBeDefined();
            expect(menuItem.updated_at).toBeDefined();

            // Clean up
            await deleteMenuItem(menuItemId);
            await query('DELETE FROM hotels WHERE id = $1', [hotelId]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update menu items and maintain data integrity', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }
      await fc.assert(
        fc.asyncProperty(
          emailArbitrary,
          passwordHashArbitrary,
          hotelNameArbitrary,
          tableCountArbitrary,
          dishNameArbitrary,
          priceArbitrary,
          dishNameArbitrary,
          priceArbitrary,
          async (
            email,
            passwordHash,
            hotelName,
            tableCount,
            originalDishName,
            originalPrice,
            newDishName,
            newPrice
          ) => {
            // Create a hotel first
            const hotelId = await createTestHotel(email, passwordHash, hotelName, tableCount);

            // Create a menu item
            const menuItemId = await createMenuItem(hotelId, originalDishName, originalPrice);

            // Update the menu item
            await updateMenuItem(menuItemId, newDishName, newPrice);

            // Read the updated menu item
            const updatedMenuItem = await readMenuItem(menuItemId);

            // Verify data integrity after update
            expect(updatedMenuItem).toBeDefined();
            expect(updatedMenuItem.id).toBe(menuItemId);
            expect(updatedMenuItem.hotel_id).toBe(hotelId);
            expect(updatedMenuItem.dish_name).toBe(newDishName);
            expect(parseFloat(updatedMenuItem.price)).toBeCloseTo(newPrice, 2);
            expect(updatedMenuItem.updated_at).toBeDefined();

            // Verify updated_at changed
            const originalMenuItem = await query(
              'SELECT created_at FROM menu_items WHERE id = $1',
              [menuItemId]
            );
            expect(new Date(updatedMenuItem.updated_at).getTime()).toBeGreaterThanOrEqual(
              new Date(originalMenuItem.rows[0].created_at).getTime()
            );

            // Clean up
            await deleteMenuItem(menuItemId);
            await query('DELETE FROM hotels WHERE id = $1', [hotelId]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should delete menu items and remove them from database', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }
      await fc.assert(
        fc.asyncProperty(
          emailArbitrary,
          passwordHashArbitrary,
          hotelNameArbitrary,
          tableCountArbitrary,
          dishNameArbitrary,
          priceArbitrary,
          async (email, passwordHash, hotelName, tableCount, dishName, price) => {
            // Create a hotel first
            const hotelId = await createTestHotel(email, passwordHash, hotelName, tableCount);

            // Create a menu item
            const menuItemId = await createMenuItem(hotelId, dishName, price);

            // Verify it exists
            const beforeDelete = await readMenuItem(menuItemId);
            expect(beforeDelete).toBeDefined();

            // Delete the menu item
            await deleteMenuItem(menuItemId);

            // Verify it no longer exists
            const afterDelete = await readMenuItem(menuItemId);
            expect(afterDelete).toBeUndefined();

            // Clean up
            await query('DELETE FROM hotels WHERE id = $1', [hotelId]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain foreign key integrity with hotels', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }
      await fc.assert(
        fc.asyncProperty(
          emailArbitrary,
          passwordHashArbitrary,
          hotelNameArbitrary,
          tableCountArbitrary,
          dishNameArbitrary,
          priceArbitrary,
          async (email, passwordHash, hotelName, tableCount, dishName, price) => {
            // Create a hotel first
            const hotelId = await createTestHotel(email, passwordHash, hotelName, tableCount);

            // Create a menu item
            const menuItemId = await createMenuItem(hotelId, dishName, price);

            // Verify the menu item is associated with the correct hotel
            const menuItem = await readMenuItem(menuItemId);
            expect(menuItem.hotel_id).toBe(hotelId);

            // Delete the hotel (should cascade delete menu items)
            await query('DELETE FROM hotels WHERE id = $1', [hotelId]);

            // Verify menu item was cascade deleted
            const afterHotelDelete = await readMenuItem(menuItemId);
            expect(afterHotelDelete).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce price constraint (non-negative)', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }
      await fc.assert(
        fc.asyncProperty(
          emailArbitrary,
          passwordHashArbitrary,
          hotelNameArbitrary,
          tableCountArbitrary,
          dishNameArbitrary,
          fc.float({ min: Math.fround(-1000), max: Math.fround(-0.01), noNaN: true }),
          async (email, passwordHash, hotelName, tableCount, dishName, negativePrice) => {
            // Create a hotel first
            const hotelId = await createTestHotel(email, passwordHash, hotelName, tableCount);

            // Try to create a menu item with negative price
            await expect(
              createMenuItem(hotelId, dishName, negativePrice)
            ).rejects.toThrow();

            // Clean up
            await query('DELETE FROM hotels WHERE id = $1', [hotelId]);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
