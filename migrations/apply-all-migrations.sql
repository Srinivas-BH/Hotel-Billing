-- ============================================================================
-- COMPLETE MIGRATION SCRIPT FOR ORDER TAKING & BILLING FEATURE
-- ============================================================================
-- Run this entire file in Supabase SQL Editor to apply all migrations at once
-- This extends the base hotel-billing-admin schema with order management
-- ============================================================================

-- Migration 001: Create orders table with optimistic locking
-- ----------------------------------------------------------------------------

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

-- Add comments
COMMENT ON TABLE orders IS 'Stores customer orders per table with optimistic locking for concurrency control';
COMMENT ON COLUMN orders.version IS 'Optimistic locking version number, incremented on each update';
COMMENT ON COLUMN orders.locked_by IS 'Hotel ID that currently has this order locked for billing';
COMMENT ON COLUMN orders.lock_expires_at IS 'Timestamp when the billing lock expires (5 minutes from lock time)';
COMMENT ON COLUMN orders.items IS 'JSON array of order items: [{menu_item_id, name, unit_price, quantity}]';

-- Migration 002: Extend invoices table with order reference and S3 paths
-- ----------------------------------------------------------------------------

ALTER TABLE invoices 
  ADD COLUMN IF NOT EXISTS order_id UUID;

ALTER TABLE invoices 
  ADD COLUMN IF NOT EXISTS s3_json_path TEXT;

ALTER TABLE invoices 
  ADD COLUMN IF NOT EXISTS s3_pdf_path TEXT;

-- Create index for order lookups
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);

-- Add comments
COMMENT ON COLUMN invoices.order_id IS 'Reference to the order that generated this invoice';
COMMENT ON COLUMN invoices.s3_json_path IS 'S3 path to invoice JSON file: /{hotel_id}/invoices/{year}/{month}/{invoice_id}.json';
COMMENT ON COLUMN invoices.s3_pdf_path IS 'S3 path to invoice PDF file: /{hotel_id}/invoices/{year}/{month}/{invoice_id}.pdf';

-- Migration 003: Create audit_logs table for tracking all state transitions
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('ORDER', 'INVOICE', 'TABLE')),
  entity_id UUID NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_hotel_id ON audit_logs(hotel_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Add comments
COMMENT ON TABLE audit_logs IS 'Audit trail for all order and billing state transitions';
COMMENT ON COLUMN audit_logs.action IS 'Action performed: Order Created, Order Updated, Invoice Generated, Table Freed, etc.';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity: ORDER, INVOICE, or TABLE';
COMMENT ON COLUMN audit_logs.entity_id IS 'UUID of the affected entity';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context: {table_number, order_items, invoice_amount, etc.}';

-- Migration 004: Create reports table for daily/monthly aggregations
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reports (
  report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient aggregation queries
CREATE INDEX IF NOT EXISTS idx_reports_hotel_id ON reports(hotel_id);
CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(date);
CREATE INDEX IF NOT EXISTS idx_reports_invoice_id ON reports(invoice_id);
CREATE INDEX IF NOT EXISTS idx_reports_hotel_date ON reports(hotel_id, date);

-- Add comments
COMMENT ON TABLE reports IS 'Invoice summaries for daily and monthly reporting';
COMMENT ON COLUMN reports.invoice_id IS 'Reference to the invoice record';
COMMENT ON COLUMN reports.table_number IS 'Table number for the order/invoice';
COMMENT ON COLUMN reports.amount IS 'Grand total amount from the invoice';
COMMENT ON COLUMN reports.date IS 'Date of the invoice (for aggregation)';

-- Migration 005: Add foreign key constraints
-- ----------------------------------------------------------------------------

-- Add foreign key from orders.order_id to invoices.id (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_order_id_fkey'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_order_id_fkey 
      FOREIGN KEY (order_id) 
      REFERENCES invoices(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- Add foreign key from invoices.order_id to orders.order_id (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'invoices_order_id_fkey'
  ) THEN
    ALTER TABLE invoices
      ADD CONSTRAINT invoices_order_id_fkey 
      FOREIGN KEY (order_id) 
      REFERENCES orders(order_id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the migrations were successful

-- Check all tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('orders', 'audit_logs', 'reports') THEN '✅ New table'
    WHEN table_name = 'invoices' THEN '✅ Extended table'
    ELSE '✅ Existing table'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('hotels', 'menu_items', 'invoices', 'invoice_items', 'orders', 'audit_logs', 'reports')
ORDER BY table_name;

-- Check indexes
SELECT 
  tablename,
  indexname,
  '✅ Index created' as status
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'audit_logs', 'reports', 'invoices')
ORDER BY tablename, indexname;

-- Check foreign keys
SELECT
  conrelid::regclass AS table_name,
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition,
  '✅ Constraint added' as status
FROM pg_constraint
WHERE contype = 'f'
  AND conrelid::regclass::text IN ('orders', 'invoices', 'audit_logs', 'reports')
ORDER BY table_name, constraint_name;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ ALL MIGRATIONS APPLIED SUCCESSFULLY!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'New tables created:';
  RAISE NOTICE '  - orders (with optimistic locking)';
  RAISE NOTICE '  - audit_logs (for state tracking)';
  RAISE NOTICE '  - reports (for aggregations)';
  RAISE NOTICE '';
  RAISE NOTICE 'Extended tables:';
  RAISE NOTICE '  - invoices (added order_id, s3_json_path, s3_pdf_path)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Verify tables in Supabase dashboard';
  RAISE NOTICE '  2. Continue with Task 2: S3 service utilities';
  RAISE NOTICE '  3. Implement order management API endpoints';
  RAISE NOTICE '============================================================================';
END $$;
