import { query } from './db';
import { MenuItem } from '../types';

/**
 * Database row type for menu_items table
 */
interface MenuItemRow {
  id: string;
  hotel_id: string;
  dish_name: string;
  price: string; // DECIMAL comes as string from pg
  created_at: Date;
  updated_at: Date;
}

/**
 * Convert database row to MenuItem type
 */
function rowToMenuItem(row: MenuItemRow): MenuItem {
  return {
    id: row.id,
    hotelId: row.hotel_id,
    dishName: row.dish_name,
    price: parseFloat(row.price),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// In-memory storage for development mode
const mockMenuItems: MenuItem[] = [];

/**
 * Create a new menu item for a hotel
 * @param hotelId - The ID of the hotel
 * @param dishName - The name of the dish
 * @param price - The price of the dish
 * @returns The created menu item
 */
export async function createMenuItem(
  hotelId: string,
  dishName: string,
  price: number
): Promise<MenuItem> {
  try {
    const result = await query<MenuItemRow>(
      `INSERT INTO menu_items (hotel_id, dish_name, price)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [hotelId, dishName, price]
    );

    if (result.rows.length === 0) {
      throw new Error('Failed to create menu item');
    }

    return rowToMenuItem(result.rows[0]);
  } catch (error) {
    // Development mode fallback
    if (process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL) {
      console.warn('Database not configured - using mock data for menu item');
      
      // Generate a valid UUID for mock data
      const mockId = crypto.randomUUID();
      
      const mockItem: MenuItem = {
        id: mockId,
        hotelId,
        dishName,
        price,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockMenuItems.push(mockItem);
      return mockItem;
    }
    
    throw error;
  }
}

/**
 * Get all menu items for a specific hotel
 * @param hotelId - The ID of the hotel
 * @returns Array of menu items
 */
export async function getMenuItems(hotelId: string): Promise<MenuItem[]> {
  try {
    const result = await query<MenuItemRow>(
      `SELECT * FROM menu_items
       WHERE hotel_id = $1
       ORDER BY dish_name ASC`,
      [hotelId]
    );

    return result.rows.map(rowToMenuItem);
  } catch (error) {
    // Development mode fallback
    if (process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL) {
      console.warn('Database not configured - returning mock menu items');
      return mockMenuItems.filter(item => item.hotelId === hotelId);
    }
    
    throw error;
  }
}

/**
 * Get a single menu item by ID
 * @param id - The menu item ID
 * @param hotelId - The hotel ID (for authorization)
 * @returns The menu item or null if not found
 */
export async function getMenuItemById(
  id: string,
  hotelId: string
): Promise<MenuItem | null> {
  try {
    const result = await query<MenuItemRow>(
      `SELECT * FROM menu_items
       WHERE id = $1 AND hotel_id = $2`,
      [id, hotelId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return rowToMenuItem(result.rows[0]);
  } catch (error) {
    // Development mode fallback
    if (process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL) {
      console.warn('Database not configured - searching mock menu items');
      const item = mockMenuItems.find(item => item.id === id && item.hotelId === hotelId);
      return item || null;
    }
    
    throw error;
  }
}

/**
 * Update an existing menu item
 * @param id - The menu item ID
 * @param hotelId - The hotel ID (for authorization)
 * @param dishName - The new dish name
 * @param price - The new price
 * @returns The updated menu item or null if not found
 */
export async function updateMenuItem(
  id: string,
  hotelId: string,
  dishName: string,
  price: number
): Promise<MenuItem | null> {
  try {
    const result = await query<MenuItemRow>(
      `UPDATE menu_items
       SET dish_name = $1, price = $2
       WHERE id = $3 AND hotel_id = $4
       RETURNING *`,
      [dishName, price, id, hotelId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return rowToMenuItem(result.rows[0]);
  } catch (error) {
    // Development mode fallback
    if (process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL) {
      console.warn('Database not configured - updating mock data');
      const item = mockMenuItems.find(item => item.id === id && item.hotelId === hotelId);
      if (item) {
        item.dishName = dishName;
        item.price = price;
        item.updatedAt = new Date();
        return item;
      }
      return null;
    }
    
    throw error;
  }
}

/**
 * Delete a menu item
 * @param id - The menu item ID
 * @param hotelId - The hotel ID (for authorization)
 * @returns True if deleted, false if not found
 */
export async function deleteMenuItem(
  id: string,
  hotelId: string
): Promise<boolean> {
  try {
    const result = await query(
      `DELETE FROM menu_items
       WHERE id = $1 AND hotel_id = $2`,
      [id, hotelId]
    );

    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    // Development mode fallback
    if (process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL) {
      console.warn('Database not configured - deleting from mock data');
      const index = mockMenuItems.findIndex(item => item.id === id && item.hotelId === hotelId);
      if (index !== -1) {
        mockMenuItems.splice(index, 1);
        return true;
      }
      return false;
    }
    
    throw error;
  }
}
