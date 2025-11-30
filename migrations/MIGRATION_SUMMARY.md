# Migration Summary - Order Taking & Billing Feature

## Overview

This migration adds comprehensive order management capabilities to the Hotel Billing Admin system, including:
- Order creation and tracking per table
- Optimistic locking for concurrency control
- Complete audit trail for all state transitions
- Enhanced reporting with invoice-order linkage
- S3 storage paths for invoices

## Database Changes

### New Tables Created

1. **orders** (Migration 001)
   - Primary table for storing customer orders
   - Includes optimistic locking (version field)
   - Supports OPEN, BILLED, and CANCELLED statuses
   - Stores order items as JSONB for flexibility
   - Unique constraint ensures one OPEN order per table

2. **audit_logs** (Migration 003)
   - Complete audit trail for compliance
   - Tracks all state transitions
   - Stores metadata for investigation
   - Indexed for efficient querying

3. **reports** (Migration 004)
   - Invoice summaries for reporting
   - Links to invoices as source of truth
   - Optimized for daily/monthly aggregations

### Extended Tables

1. **invoices** (Migration 002)
   - Added `order_id` column (links to orders)
   - Added `s3_json_path` column
   - Added `s3_pdf_path` column
   - New index on order_id

### Foreign Key Relationships

- orders.hotel_id → hotels.id
- orders.locked_by → hotels.id
- orders.invoice_id → invoices.id (added in Migration 005)
- invoices.order_id → orders.order_id
- audit_logs.hotel_id → hotels.id
- reports.hotel_id → hotels.id
- reports.invoice_id → invoices.id

## Performance Optimizations

### Indexes Created

**orders table:**
- idx_orders_hotel_id (hotel_id)
- idx_orders_table_status (table_number, status)
- idx_orders_status (status)
- idx_orders_created_at (created_at)

**invoices table:**
- idx_invoices_order_id (order_id)

**audit_logs table:**
- idx_audit_logs_hotel_id (hotel_id)
- idx_audit_logs_entity (entity_type, entity_id)
- idx_audit_logs_timestamp (timestamp DESC)
- idx_audit_logs_action (action)

**reports table:**
- idx_reports_hotel_id (hotel_id)
- idx_reports_date (date)
- idx_reports_invoice_id (invoice_id)
- idx_reports_hotel_date (hotel_id, date)

### Constraints

- Partial unique index on orders: `unique_open_order_per_table`
  - Ensures only one OPEN order per (hotel_id, table_number)
  - Does not apply to BILLED or CANCELLED orders
  - Prevents duplicate active orders efficiently

- Check constraints:
  - orders.table_number > 0
  - orders.status IN ('OPEN', 'BILLED', 'CANCELLED')
  - audit_logs.entity_type IN ('ORDER', 'INVOICE', 'TABLE')
  - reports.amount >= 0

## Data Integrity

### Cascade Behavior

- **ON DELETE CASCADE**: When hotel is deleted, all related orders, audit logs, and reports are deleted
- **ON DELETE SET NULL**: When order/invoice is deleted, references are nullified (preserves audit trail)

### Optimistic Locking

The `orders.version` field implements optimistic locking:
1. Initial version = 1
2. Every update increments version
3. Updates must provide current version
4. Concurrent updates fail with version mismatch error

### Lock Expiry

The `orders.lock_expires_at` field prevents deadlocks:
- Set when order is locked for billing
- Automatically expires after 5 minutes
- Expired locks can be cleared automatically

## Storage Estimates

Assuming 1000 hotels, 50 tables each, 100 orders/day:

**orders table:**
- ~5 million rows/year
- ~500 bytes/row (with JSONB items)
- ~2.5 GB/year

**audit_logs table:**
- ~20 million rows/year (4 logs per order lifecycle)
- ~300 bytes/row
- ~6 GB/year

**reports table:**
- ~36 million rows/year
- ~150 bytes/row
- ~5.4 GB/year

**Total additional storage:** ~14 GB/year

## Migration Execution Time

Estimated execution time on empty database:
- Migration 001: ~2 seconds
- Migration 002: ~1 second
- Migration 003: ~2 seconds
- Migration 004: ~2 seconds
- Migration 005: ~1 second

**Total:** ~8 seconds

On existing database with data:
- Migrations 001, 003, 004: Same as above
- Migration 002: Depends on existing invoice count (~1 second per 10,000 invoices)
- Migration 005: ~1 second

## Rollback Impact

Running rollback.sql will:
- ✅ Drop orders table (all order data lost)
- ✅ Drop audit_logs table (all audit history lost)
- ✅ Drop reports table (all report data lost)
- ✅ Remove columns from invoices (S3 paths and order references lost)
- ⚠️ Existing invoices remain intact
- ⚠️ Invoice data in invoice_json column preserved

**Data Recovery:** If S3 backups exist, order data can be reconstructed from S3 JSON files.

## Verification Queries

After migration, run these queries to verify:

```sql
-- Check table existence
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('orders', 'audit_logs', 'reports')
ORDER BY table_name;

-- Check column additions to invoices
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'invoices' 
AND column_name IN ('order_id', 's3_json_path', 's3_pdf_path');

-- Check indexes
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('orders', 'audit_logs', 'reports', 'invoices')
AND schemaname = 'public'
ORDER BY tablename, indexname;

-- Check constraints
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid IN ('orders'::regclass, 'invoices'::regclass, 'audit_logs'::regclass, 'reports'::regclass)
ORDER BY conrelid::regclass::text, conname;

-- Test insert into orders
INSERT INTO orders (hotel_id, table_number, items, status)
VALUES (
  (SELECT id FROM hotels LIMIT 1),
  1,
  '[{"menu_item_id": "test", "name": "Test Item", "unit_price": 10.00, "quantity": 1}]'::jsonb,
  'OPEN'
)
RETURNING order_id, version, created_at;

-- Clean up test
DELETE FROM orders WHERE items::text LIKE '%Test Item%';
```

## Troubleshooting

### Common Issues

**Issue:** `ERROR: relation "orders" already exists`
**Solution:** Table was already created. Check if you need to rollback first or skip this migration.

**Issue:** `ERROR: column "order_id" of relation "invoices" already exists`
**Solution:** Column was already added. Safe to continue with next migration.

**Issue:** `ERROR: insert or update on table "orders" violates foreign key constraint`
**Solution:** Ensure hotel_id exists in hotels table before creating orders.

**Issue:** `ERROR: duplicate key value violates unique constraint "unique_open_order_per_table"`
**Solution:** An OPEN order already exists for this table. Close or bill the existing order first.

### Performance Issues

If queries are slow after migration:
1. Run `ANALYZE orders;` to update statistics
2. Run `ANALYZE audit_logs;` to update statistics
3. Run `ANALYZE reports;` to update statistics
4. Check index usage with `EXPLAIN ANALYZE`

## Next Steps

After successful migration:
1. ✅ Update environment variables (S3_BUCKET_ORDERS, etc.)
2. ✅ Deploy API endpoints (/api/orders, /api/invoices/generate)
3. ✅ Update frontend components (Order Taking page, Dashboard)
4. ✅ Run integration tests
5. ✅ Monitor audit logs for proper tracking
6. ✅ Verify reporting aggregations

## Support

For issues or questions:
1. Check migrations/README.md for detailed instructions
2. Review error messages in PostgreSQL logs
3. Verify DATABASE_URL environment variable
4. Ensure database user has CREATE TABLE permissions
5. Check Supabase dashboard for migration status
