# Database Migrations for Order Taking & Billing Feature

This directory contains SQL migration scripts to extend the Hotel Billing Admin database with order management capabilities.

## Migration Files

Execute these migrations in order:

1. **001_create_orders_table.sql** - Creates the `orders` table with optimistic locking
2. **002_extend_invoices_table.sql** - Adds order reference and S3 paths to `invoices` table
3. **003_create_audit_logs_table.sql** - Creates the `audit_logs` table for state tracking
4. **004_create_reports_table.sql** - Creates the `reports` table for aggregations
5. **005_add_foreign_key_constraints.sql** - Adds foreign key from orders to invoices

## How to Apply Migrations

### Using Supabase SQL Editor

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste each migration file in order (001 → 005)
4. Execute each migration
5. Verify success before proceeding to the next

### Using psql Command Line

```bash
# Connect to your database
psql "postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:5432/postgres"

# Execute migrations in order
\i migrations/001_create_orders_table.sql
\i migrations/002_extend_invoices_table.sql
\i migrations/003_create_audit_logs_table.sql
\i migrations/004_create_reports_table.sql
\i migrations/005_add_foreign_key_constraints.sql
```

### Using Node.js Migration Script

```bash
# Run all migrations
npm run migrate

# Or run individually
node scripts/run-migration.js 001
```

## Rollback

To rollback all changes (⚠️ **WARNING: This deletes all order and audit data!**):

```bash
psql "postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:5432/postgres" < migrations/rollback.sql
```

## Schema Overview

### New Tables

**orders**
- Stores customer orders per table
- Includes optimistic locking (version field)
- Tracks order status (OPEN, BILLED, CANCELLED)
- Stores order items as JSONB
- Includes locking mechanism for concurrent billing prevention

**audit_logs**
- Complete audit trail for all state transitions
- Tracks actions: Order Created, Order Updated, Invoice Generated, Table Freed
- Stores metadata for investigation and compliance

**reports**
- Invoice summaries for efficient daily/monthly reporting
- Links to invoices for source of truth
- Indexed for fast aggregation queries

### Extended Tables

**invoices**
- Added `order_id` - links invoice to originating order
- Added `s3_json_path` - S3 location of invoice JSON
- Added `s3_pdf_path` - S3 location of invoice PDF

## Verification

After applying migrations, verify the schema:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('orders', 'audit_logs', 'reports');

-- Check orders table structure
\d orders

-- Check invoices extensions
\d invoices

-- Check indexes
SELECT indexname, tablename FROM pg_indexes 
WHERE tablename IN ('orders', 'audit_logs', 'reports', 'invoices')
ORDER BY tablename, indexname;

-- Check constraints
SELECT conname, contype, conrelid::regclass 
FROM pg_constraint 
WHERE conrelid IN ('orders'::regclass, 'invoices'::regclass);
```

## Performance Considerations

All tables include appropriate indexes for:
- Foreign key lookups
- Status filtering
- Date range queries
- Aggregation operations

The `unique_open_order_per_table` partial index ensures only one OPEN order exists per table efficiently.

## Security Notes

- All tables include `hotel_id` for multi-tenancy
- Foreign keys use `ON DELETE CASCADE` or `ON DELETE SET NULL` appropriately
- Audit logs are retained even if related entities are deleted (SET NULL)
- Check constraints prevent invalid data (positive amounts, valid statuses)

## Troubleshooting

**Error: relation "orders" already exists**
- The table was already created. Check if you need to rollback first.

**Error: column "order_id" of relation "invoices" already exists**
- The column was already added. Safe to skip this migration.

**Error: foreign key constraint violation**
- Ensure migrations are run in order (001 → 005)
- Check that referenced tables exist before adding foreign keys

## Next Steps

After applying migrations:
1. Update environment variables (see main README)
2. Deploy API endpoints for order management
3. Update frontend components for order taking
4. Run integration tests to verify database operations
