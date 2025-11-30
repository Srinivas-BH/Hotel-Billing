-- Rollback script for order-taking-billing feature
-- Execute this to remove all changes made by the migrations
-- WARNING: This will delete all order and audit log data!

-- Drop foreign key constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_invoice_id;

-- Drop reports table
DROP TABLE IF EXISTS reports CASCADE;

-- Drop audit_logs table
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Remove columns from invoices table
ALTER TABLE invoices DROP COLUMN IF EXISTS s3_pdf_path;
ALTER TABLE invoices DROP COLUMN IF EXISTS s3_json_path;
ALTER TABLE invoices DROP COLUMN IF EXISTS order_id;

-- Drop orders table
DROP TABLE IF EXISTS orders CASCADE;

-- Note: Indexes are automatically dropped with their tables
