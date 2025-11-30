-- Migration 003: Create audit_logs table for tracking all state transitions
-- Provides complete audit trail for orders, invoices, and table status changes

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

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Audit trail for all order and billing state transitions';
COMMENT ON COLUMN audit_logs.action IS 'Action performed: Order Created, Order Updated, Invoice Generated, Table Freed, etc.';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity: ORDER, INVOICE, or TABLE';
COMMENT ON COLUMN audit_logs.entity_id IS 'UUID of the affected entity';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context: {table_number, order_items, invoice_amount, etc.}';
