-- Migration 001: Create orders table with optimistic locking
-- This table stores customer orders per table with status tracking and concurrency control

CREATE TABLE IF NOT EXISTS orders (
  order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL CHECK (table_number > 0),
  items JSONB NOT NULL, -- Array of {menu_item_id, name, unit_price, quantity}
  notes TEXT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('OPEN', 'BILLED', 'CANCELLED')) DEFAULT 'OPEN',
  version INTEGER NOT NULL DEFAULT 1,
  locked_by UUID REFERENCES hotels(id),
  lock_expires_at TIMESTAMP,
  invoice_id UUID,
  s3_path TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create partial unique index to ensure only one OPEN order per table
CREATE UNIQUE INDEX IF NOT EXISTS unique_open_order_per_table 
  ON orders(hotel_id, table_number) 
  WHERE status = 'OPEN';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_hotel_id ON orders(hotel_id);
CREATE INDEX IF NOT EXISTS idx_orders_table_status ON orders(table_number, status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Add comment for documentation
COMMENT ON TABLE orders IS 'Stores customer orders per table with optimistic locking for concurrency control';
COMMENT ON COLUMN orders.version IS 'Optimistic locking version number, incremented on each update';
COMMENT ON COLUMN orders.locked_by IS 'Hotel ID that currently has this order locked for billing';
COMMENT ON COLUMN orders.lock_expires_at IS 'Timestamp when the billing lock expires (5 minutes from lock time)';
COMMENT ON COLUMN orders.items IS 'JSON array of order items: [{menu_item_id, name, unit_price, quantity}]';
