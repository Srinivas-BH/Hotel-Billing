/**
 * Property-Based Test: Order ID Immutability
 * Feature: order-taking-billing, Property 4: Order ID immutability
 * Validates: Requirements 1.5
 * 
 * Property: For any order, when it is updated, the order_id should remain unchanged
 */

import fc from 'fast-check';
import { OrderService, OrderItem } from '../lib/services/orderService';
import { query, closePool, getPool } from '../lib/db';

describe('Feature: order-taking-billing, Property 4: Order ID immutability', () => {
  let orderService: OrderService;
  let testHotelId: string;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️  DATABASE_URL not set. Skipping property tests.');
      return;
    }

    try {
      const pool = getPool();
      orderService = new OrderService(pool);

      // Create a test hotel
      const result = await query<{ id: string }>(
        `INSERT INTO hotels (email, password_hash, hotel_name, table_count)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [`test-order-${Date.now()}@test.com`, 'hash', 'Test Hotel', 10]
      );
      testHotelId = result.rows[0].id;
    } catch (error) {
      console.error('Failed to create test hotel:', error);
      throw error;
    }
  }, 30000);

  afterAll(async () => {
    try {
      // Cleanup
      if (testHotelId) {
        await query('DELETE FROM hotels WHERE id = $1', [testHotelId]);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    } finally {
      await closePool();
    }
  }, 30000);

  afterEach(async () => {
    // Clean up orders after each test
    if (testHotelId) {
      await query('DELETE FROM orders WHERE hotel_id = $1', [testHotelId]);
    }
  });

  test('Property 4: Order ID remains immutable across updates', async () => {
    if (!process.env.DATABASE_URL) {
      console.warn('Skipping test - DATABASE_URL not set');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }), // table_number
        fc.array(
          fc.record({
            menu_item_id: fc.uuid(),
            name: fc.string({ minLength: 3, maxLength: 50 }),
            unit_price: fc.integer({ min: 1, max: 1000 }).map(n => n / 100), // Convert to decimal
            quantity: fc.integer({ min: 1, max: 10 })
          }),
          { minLength: 1, maxLength: 5 }
        ), // initial items
        fc.array(
          fc.record({
            menu_item_id: fc.uuid(),
            name: fc.string({ minLength: 3, maxLength: 50 }),
            unit_price: fc.integer({ min: 1, max: 1000 }).map(n => n / 100), // Convert to decimal
            quantity: fc.integer({ min: 1, max: 10 })
          }),
          { minLength: 1, maxLength: 5 }
        ), // updated items
        fc.string({ maxLength: 100 }), // notes
        async (tableNumber, initialItems, updatedItems, notes) => {
          // Create an order
          const order = await orderService.createOrder({
            hotel_id: testHotelId,
            table_number: tableNumber,
            items: initialItems as OrderItem[],
            notes
          });

          const originalOrderId = order.order_id;

          // Update the order
          const updatedOrder = await orderService.updateOrder(order.order_id, {
            items: updatedItems as OrderItem[],
            notes: notes + ' updated',
            version: order.version
          });

          // Property: Order ID must remain unchanged
          expect(updatedOrder.order_id).toBe(originalOrderId);
          
          // Additional verification: version should increment
          expect(updatedOrder.version).toBe(order.version + 1);
          
          // Verify in database
          const dbCheck = await query<{ order_id: string }>(
            'SELECT order_id FROM orders WHERE order_id = $1',
            [originalOrderId]
          );
          
          expect(dbCheck.rows.length).toBe(1);
          expect(dbCheck.rows[0].order_id).toBe(originalOrderId);
        }
      ),
      { numRuns: 50, timeout: 30000 }
    );
  });

  test('Property 4: Order ID persists through multiple updates', async () => {
    if (!process.env.DATABASE_URL) {
      console.warn('Skipping test - DATABASE_URL not set');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }), // table_number
        fc.array(
          fc.record({
            menu_item_id: fc.uuid(),
            name: fc.string({ minLength: 3, maxLength: 50 }),
            unit_price: fc.integer({ min: 1, max: 1000 }).map(n => n / 100), // Convert to decimal
            quantity: fc.integer({ min: 1, max: 10 })
          }),
          { minLength: 1, maxLength: 3 }
        ), // initial items
        fc.integer({ min: 2, max: 5 }), // number of updates
        async (tableNumber, initialItems, updateCount) => {
          // Create an order
          const order = await orderService.createOrder({
            hotel_id: testHotelId,
            table_number: tableNumber,
            items: initialItems as OrderItem[],
            notes: 'Initial order'
          });

          const originalOrderId = order.order_id;
          let currentVersion = order.version;

          // Perform multiple updates
          for (let i = 0; i < updateCount; i++) {
            const updatedOrder = await orderService.updateOrder(originalOrderId, {
              items: initialItems as OrderItem[],
              notes: `Update ${i + 1}`,
              version: currentVersion
            });

            // Property: Order ID must remain unchanged after each update
            expect(updatedOrder.order_id).toBe(originalOrderId);
            currentVersion = updatedOrder.version;
          }

          // Final verification
          const finalOrder = await orderService.getActiveOrder(testHotelId, tableNumber);
          expect(finalOrder).not.toBeNull();
          expect(finalOrder!.order_id).toBe(originalOrderId);
          expect(finalOrder!.version).toBe(order.version + updateCount);
        }
      ),
      { numRuns: 30, timeout: 30000 }
    );
  });

  test('Property 4: Order ID is unique and never reused', async () => {
    if (!process.env.DATABASE_URL) {
      console.warn('Skipping test - DATABASE_URL not set');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            table_number: fc.integer({ min: 1, max: 10 }),
            items: fc.array(
              fc.record({
                menu_item_id: fc.uuid(),
                name: fc.string({ minLength: 3, maxLength: 50 }),
                unit_price: fc.integer({ min: 1, max: 1000 }).map(n => n / 100), // Convert to decimal
                quantity: fc.integer({ min: 1, max: 10 })
              }),
              { minLength: 1, maxLength: 3 }
            )
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (orderSpecs) => {
          const orderIds = new Set<string>();

          // Create multiple orders
          for (const spec of orderSpecs) {
            try {
              const order = await orderService.createOrder({
                hotel_id: testHotelId,
                table_number: spec.table_number,
                items: spec.items as OrderItem[],
                notes: 'Test order'
              });

              // Property: Each order ID must be unique
              expect(orderIds.has(order.order_id)).toBe(false);
              orderIds.add(order.order_id);

              // Clean up to allow next order for same table
              await query(
                'UPDATE orders SET status = $1 WHERE order_id = $2',
                ['BILLED', order.order_id]
              );
            } catch (error: any) {
              // Skip if table already has an open order
              if (!error.message.includes('already has an active order')) {
                throw error;
              }
            }
          }

          // Verify all IDs are unique
          expect(orderIds.size).toBeGreaterThan(0);
        }
      ),
      { numRuns: 20, timeout: 30000 }
    );
  });
});
