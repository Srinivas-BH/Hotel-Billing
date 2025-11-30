-- Migration 004: Create reports table for daily/monthly aggregations
-- Stores invoice summaries for efficient reporting

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

-- Add comments for documentation
COMMENT ON TABLE reports IS 'Invoice summaries for daily and monthly reporting';
COMMENT ON COLUMN reports.invoice_id IS 'Reference to the invoice record';
COMMENT ON COLUMN reports.table_number IS 'Table number for the order/invoice';
COMMENT ON COLUMN reports.amount IS 'Grand total amount from the invoice';
COMMENT ON COLUMN reports.date IS 'Date of the invoice (for aggregation)';
