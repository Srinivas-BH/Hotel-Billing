-- Migration 002: Extend invoices table with order reference and S3 paths
-- Links invoices to orders and stores S3 file locations

ALTER TABLE invoices 
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(order_id) ON DELETE SET NULL;

ALTER TABLE invoices 
  ADD COLUMN IF NOT EXISTS s3_json_path TEXT;

ALTER TABLE invoices 
  ADD COLUMN IF NOT EXISTS s3_pdf_path TEXT;

-- Create index for order lookups
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);

-- Add comments for documentation
COMMENT ON COLUMN invoices.order_id IS 'Reference to the order that generated this invoice';
COMMENT ON COLUMN invoices.s3_json_path IS 'S3 path to invoice JSON file: /{hotel_id}/invoices/{year}/{month}/{invoice_id}.json';
COMMENT ON COLUMN invoices.s3_pdf_path IS 'S3 path to invoice PDF file: /{hotel_id}/invoices/{year}/{month}/{invoice_id}.pdf';
