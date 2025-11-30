-- Migration 005: Add foreign key constraint from orders to invoices
-- This must be done after invoices table is extended with order_id

-- Add foreign key constraint from orders.invoice_id to invoices.id
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_invoice_id 
  FOREIGN KEY (invoice_id) 
  REFERENCES invoices(id) 
  ON DELETE SET NULL;

-- Add comment
COMMENT ON CONSTRAINT fk_orders_invoice_id ON orders IS 'Links order to its generated invoice';
