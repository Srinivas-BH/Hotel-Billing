/**
 * Unit tests for Menu Data Access Layer
 * Tests the menu CRUD operations
 */

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
    console.warn('⚠️  DATABASE_URL not set. Skipping menu tests.');
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

afterEach(async () => {
  if (process.env.DATABASE_URL) {
    await query('DELETE FROM menu_items');
    await query('DELETE FROM hotels');
  }
});

describe('Menu Data Access Layer', () => {
  const skipTests = !process.env.DATABASE_URL;

  describe('createMenuItem', () => {
    it('should create a menu item with correct data', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }

      const hotelId = await createTestHotel(
        'test@example.com',
        'hashedpassword123',
        'Test Hotel',
        10
      );

      const menuItem = await createMenuItem(hotelId, 'Pasta Carbonara', 12.99);

      expect(menuItem).toBeDefined();
      expect(menuItem.id).toBeDefined();
      expect(menuItem.hotelId).toBe(hotelId);
      expect(menuItem.dishName).toBe('Pasta Carbonara');
      expect(menuItem.price).toBe(12.99);
      expect(menuItem.createdAt).toBeInstanceOf(Date);
      expect(menuItem.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('getMenuItems', () => {
    it('should return all menu items for a hotel', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }

      const hotelId = await createTestHotel(
        'test@example.com',
        'hashedpassword123',
        'Test Hotel',
        10
      );

      await createMenuItem(hotelId, 'Pizza', 10.99);
      await createMenuItem(hotelId, 'Burger', 8.99);
      await createMenuItem(hotelId, 'Salad', 6.99);

      const menuItems = await getMenuItems(hotelId);

      expect(menuItems).toHaveLength(3);
      expect(menuItems[0].dishName).toBe('Burger'); // Sorted alphabetically
      expect(menuItems[1].dishName).toBe('Pizza');
      expect(menuItems[2].dishName).toBe('Salad');
    });

    it('should return empty array for hotel with no menu items', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }

      const hotelId = await createTestHotel(
        'test@example.com',
        'hashedpassword123',
        'Test Hotel',
        10
      );

      const menuItems = await getMenuItems(hotelId);

      expect(menuItems).toEqual([]);
    });

    it('should only return menu items for the specified hotel', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }

      const hotel1Id = await createTestHotel(
        'hotel1@example.com',
        'hashedpassword123',
        'Hotel 1',
        10
      );
      const hotel2Id = await createTestHotel(
        'hotel2@example.com',
        'hashedpassword456',
        'Hotel 2',
        15
      );

      await createMenuItem(hotel1Id, 'Pizza', 10.99);
      await createMenuItem(hotel2Id, 'Burger', 8.99);

      const hotel1Items = await getMenuItems(hotel1Id);
      const hotel2Items = await getMenuItems(hotel2Id);

      expect(hotel1Items).toHaveLength(1);
      expect(hotel1Items[0].dishName).toBe('Pizza');
      expect(hotel2Items).toHaveLength(1);
      expect(hotel2Items[0].dishName).toBe('Burger');
    });
  });

  describe('getMenuItemById', () => {
    it('should return a menu item by ID', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }

      const hotelId = await createTestHotel(
        'test@example.com',
        'hashedpassword123',
        'Test Hotel',
        10
      );

      const created = await createMenuItem(hotelId, 'Pasta', 12.99);
      const retrieved = await getMenuItemById(created.id, hotelId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.dishName).toBe('Pasta');
      expect(retrieved?.price).toBe(12.99);
    });

    it('should return null for non-existent menu item', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }

      const hotelId = await createTestHotel(
        'test@example.com',
        'hashedpassword123',
        'Test Hotel',
        10
      );

      const retrieved = await getMenuItemById('00000000-0000-0000-0000-000000000000', hotelId);

      expect(retrieved).toBeNull();
    });

    it('should return null when hotel ID does not match', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }

      const hotel1Id = await createTestHotel(
        'hotel1@example.com',
        'hashedpassword123',
        'Hotel 1',
        10
      );
      const hotel2Id = await createTestHotel(
        'hotel2@example.com',
        'hashedpassword456',
        'Hotel 2',
        15
      );

      const menuItem = await createMenuItem(hotel1Id, 'Pizza', 10.99);
      const retrieved = await getMenuItemById(menuItem.id, hotel2Id);

      expect(retrieved).toBeNull();
    });
  });

  describe('updateMenuItem', () => {
    it('should update a menu item', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }

      const hotelId = await createTestHotel(
        'test@example.com',
        'hashedpassword123',
        'Test Hotel',
        10
      );

      const created = await createMenuItem(hotelId, 'Old Name', 10.99);
      const updated = await updateMenuItem(created.id, hotelId, 'New Name', 15.99);

      expect(updated).toBeDefined();
      expect(updated?.id).toBe(created.id);
      expect(updated?.dishName).toBe('New Name');
      expect(updated?.price).toBe(15.99);
      expect(updated?.hotelId).toBe(hotelId);
    });

    it('should return null for non-existent menu item', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }

      const hotelId = await createTestHotel(
        'test@example.com',
        'hashedpassword123',
        'Test Hotel',
        10
      );

      const updated = await updateMenuItem(
        '00000000-0000-0000-0000-000000000000',
        hotelId,
        'New Name',
        15.99
      );

      expect(updated).toBeNull();
    });

    it('should return null when hotel ID does not match', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }

      const hotel1Id = await createTestHotel(
        'hotel1@example.com',
        'hashedpassword123',
        'Hotel 1',
        10
      );
      const hotel2Id = await createTestHotel(
        'hotel2@example.com',
        'hashedpassword456',
        'Hotel 2',
        15
      );

      const menuItem = await createMenuItem(hotel1Id, 'Pizza', 10.99);
      const updated = await updateMenuItem(menuItem.id, hotel2Id, 'Updated Pizza', 12.99);

      expect(updated).toBeNull();
    });
  });

  describe('deleteMenuItem', () => {
    it('should delete a menu item', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }

      const hotelId = await createTestHotel(
        'test@example.com',
        'hashedpassword123',
        'Test Hotel',
        10
      );

      const menuItem = await createMenuItem(hotelId, 'Pizza', 10.99);
      const deleted = await deleteMenuItem(menuItem.id, hotelId);

      expect(deleted).toBe(true);

      const retrieved = await getMenuItemById(menuItem.id, hotelId);
      expect(retrieved).toBeNull();
    });

    it('should return false for non-existent menu item', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }

      const hotelId = await createTestHotel(
        'test@example.com',
        'hashedpassword123',
        'Test Hotel',
        10
      );

      const deleted = await deleteMenuItem('00000000-0000-0000-0000-000000000000', hotelId);

      expect(deleted).toBe(false);
    });

    it('should return false when hotel ID does not match', async () => {
      if (skipTests) {
        console.log('⏭️  Skipping test - DATABASE_URL not configured');
        return;
      }

      const hotel1Id = await createTestHotel(
        'hotel1@example.com',
        'hashedpassword123',
        'Hotel 1',
        10
      );
      const hotel2Id = await createTestHotel(
        'hotel2@example.com',
        'hashedpassword456',
        'Hotel 2',
        15
      );

      const menuItem = await createMenuItem(hotel1Id, 'Pizza', 10.99);
      const deleted = await deleteMenuItem(menuItem.id, hotel2Id);

      expect(deleted).toBe(false);

      // Verify item still exists for hotel1
      const retrieved = await getMenuItemById(menuItem.id, hotel1Id);
      expect(retrieved).toBeDefined();
    });
  });
});
