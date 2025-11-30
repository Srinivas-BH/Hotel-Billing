import { Pool } from 'pg';

export interface OrderItem {
  menu_item_id: string;
  name: string;
  unit_price: number;
  quantity: number;
}

export interface Order {
  order_id: string;
  hotel_id: string;
  table_number: number;
  items: OrderItem[];
  notes: string;
  status: 'OPEN' | 'BILLED' | 'CANCELLED';
  version: number;
  locked_by?: string;
  lock_expires_at?: Date;
  invoice_id?: string;
  s3_path?: string;
  created_at: Date;
  updated_at: Date;
}

export class OrderService {
  constructor(private pool: Pool) {}

  async createOrder(data: {
    hotel_id: string;
    table_number: number;
    items: OrderItem[];
    notes?: string;
  }): Promise<Order> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if table already has an open order
      const existingOrder = await client.query(
        `SELECT order_id FROM orders 
         WHERE hotel_id = $1 AND table_number = $2 AND status = 'OPEN'`,
        [data.hotel_id, data.table_number]
      ).catch(err => {
        // If orders table doesn't exist, throw a more helpful error
        if (err.message.includes('relation "orders" does not exist') || err.message.includes('does not exist')) {
          throw new Error('Orders table does not exist. Please run database migrations first.');
        }
        throw err;
      });

      if (existingOrder.rows.length > 0) {
        throw new Error(`Table ${data.table_number} already has an active order`);
      }

      // Create order
      const result = await client.query(
        `INSERT INTO orders (hotel_id, table_number, items, notes, status, version)
         VALUES ($1, $2, $3, $4, 'OPEN', 1)
         RETURNING *`,
        [data.hotel_id, data.table_number, JSON.stringify(data.items), data.notes || '']
      ).catch(err => {
        if (err.message.includes('relation "orders" does not exist') || err.message.includes('does not exist')) {
          throw new Error('Orders table does not exist. Please run database migrations first.');
        }
        throw err;
      });

      // Create audit log (optional - skip if table doesn't exist)
      try {
        await client.query(
          `INSERT INTO audit_logs (hotel_id, action, entity_type, entity_id, metadata)
           VALUES ($1, 'Order Created', 'ORDER', $2, $3)`,
          [
            data.hotel_id,
            result.rows[0].order_id,
            JSON.stringify({ table_number: data.table_number, item_count: data.items.length })
          ]
        );
      } catch (auditError: any) {
        // Log warning but don't fail the order creation if audit_logs table doesn't exist
        if (auditError.message.includes('relation "audit_logs" does not exist') || auditError.message.includes('does not exist')) {
          console.warn('Audit logs table does not exist. Skipping audit log creation.');
        } else {
          throw auditError;
        }
      }

      await client.query('COMMIT');

      return {
        ...result.rows[0],
        items: result.rows[0].items
      };
    } catch (error: any) {
      await client.query('ROLLBACK').catch(() => {}); // Ignore rollback errors
      throw error;
    } finally {
      client.release();
    }
  }

  async updateOrder(
    order_id: string,
    data: {
      items: OrderItem[];
      notes?: string;
      version: number;
    }
  ): Promise<Order> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Update with optimistic locking
      const result = await client.query(
        `UPDATE orders 
         SET items = $1, notes = $2, version = version + 1, updated_at = NOW()
         WHERE order_id = $3 AND version = $4 AND status = 'OPEN'
         RETURNING *`,
        [JSON.stringify(data.items), data.notes || '', order_id, data.version]
      );

      if (result.rows.length === 0) {
        throw new Error('Order has been modified by another user or is no longer open');
      }

      // Create audit log
      await client.query(
        `INSERT INTO audit_logs (hotel_id, action, entity_type, entity_id, metadata)
         VALUES ($1, 'Order Updated', 'ORDER', $2, $3)`,
        [
          result.rows[0].hotel_id,
          order_id,
          JSON.stringify({ item_count: data.items.length })
        ]
      );

      await client.query('COMMIT');

      return {
        ...result.rows[0],
        items: result.rows[0].items
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getActiveOrder(hotel_id: string, table_number: number): Promise<Order | null> {
    const result = await this.pool.query(
      `SELECT * FROM orders 
       WHERE hotel_id = $1 AND table_number = $2 AND status = 'OPEN'
       ORDER BY created_at DESC
       LIMIT 1`,
      [hotel_id, table_number]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return {
      ...result.rows[0],
      items: result.rows[0].items
    };
  }

  async lockForBilling(order_id: string, hotel_id: string): Promise<boolean> {
    const lockExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const result = await this.pool.query(
      `UPDATE orders 
       SET locked_by = $1, lock_expires_at = $2, version = version + 1
       WHERE order_id = $3 
       AND (locked_by IS NULL OR lock_expires_at < NOW())
       AND status = 'OPEN'
       RETURNING order_id`,
      [hotel_id, lockExpiry, order_id]
    );

    return result.rows.length > 0;
  }

  async markBilled(order_id: string, invoice_id: string, version: number): Promise<Order> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE orders 
         SET status = 'BILLED', invoice_id = $1, version = version + 1, updated_at = NOW()
         WHERE order_id = $2 AND version = $3
         RETURNING *`,
        [invoice_id, order_id, version]
      );

      if (result.rows.length === 0) {
        throw new Error('Order version mismatch or order not found');
      }

      // Create audit log
      await client.query(
        `INSERT INTO audit_logs (hotel_id, action, entity_type, entity_id, metadata)
         VALUES ($1, 'Invoice Generated', 'ORDER', $2, $3)`,
        [
          result.rows[0].hotel_id,
          order_id,
          JSON.stringify({ invoice_id, table_number: result.rows[0].table_number })
        ]
      );

      // Log table freed
      await client.query(
        `INSERT INTO audit_logs (hotel_id, action, entity_type, entity_id, metadata)
         VALUES ($1, 'Table Freed', 'TABLE', $2, $3)`,
        [
          result.rows[0].hotel_id,
          order_id,
          JSON.stringify({ table_number: result.rows[0].table_number })
        ]
      );

      await client.query('COMMIT');

      return {
        ...result.rows[0],
        items: result.rows[0].items
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getAllOrdersForHotel(hotel_id: string): Promise<Order[]> {
    const result = await this.pool.query(
      `SELECT * FROM orders 
       WHERE hotel_id = $1 AND status = 'OPEN'
       ORDER BY table_number, created_at DESC`,
      [hotel_id]
    );

    return result.rows.map(row => ({
      ...row,
      items: row.items
    }));
  }
}
