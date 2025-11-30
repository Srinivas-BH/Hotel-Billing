# Complete Database Schema Documentation

## Overview

This document describes the complete database schema for the Hotel Billing Management System with Order Taking functionality.

## Database Tables

### 1. hotels
Stores hotel/restaurant information and authentication details.

```sql
CREATE TABLE hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  hotel_name VARCHAR(255) NOT NULL,
  hotel_photo_key VARCHAR(500),
  table_count INTEGER NOT NULL CHECK (table_count > 0),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- Primary key on `id`
- Unique index on `email`

---

### 2. menu_items
Stores menu items (dishes) with prices.

```sql
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  dish_name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- Primary key on `id`
- Index on `hotel_id`

**Foreign Keys:**
- `hotel_id` → `hotels(id)` ON DELETE CASCADE

---

### 3. orders (NEW - Order Taking Feature)
Stores customer orders per table with optimistic locking.

```sql
CREATE TABLE orders (
  order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL CHECK (table_number > 0),
  items JSONB NOT NULL,
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
```

**Indexes:**
- Primary key on `order_id`
- Index on `hotel_id`
- Index on `(table_number, status)`
- Index on `status`
- Index on `created_at`
- **Unique partial index:** `unique_open_order_per_table` on `(hotel_id, table_number)` WHERE `status = 'OPEN'`

**Foreign Keys:**
- `hotel_id` → `hotels(id)` ON DELETE CASCADE
- `locked_by` → `hotels(id)`
- `invoice_id` → `invoices(id)` ON DELETE SET NULL

**JSONB Structure for items:**
```json
[
  {
    "menu_item_id": "uuid",
    "name": "Dish Name",
    "unit_price": 10.50,
    "quantity": 2
  }
]
```

---


### 4. invoices (EXTENDED)
Stores generated invoices with order references and S3 paths.

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  table_number INTEGER NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  gst_percentage DECIMAL(5, 2) DEFAULT 0,
  gst_amount DECIMAL(10, 2) DEFAULT 0,
  service_charge_percentage DECIMAL(5, 2) DEFAULT 0,
  service_charge_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  grand_total DECIMAL(10, 2) NOT NULL,
  invoice_json JSONB NOT NULL,
  pdf_key VARCHAR(500),
  -- NEW COLUMNS FOR ORDER TAKING:
  order_id UUID REFERENCES orders(order_id) ON DELETE SET NULL,
  s3_json_path TEXT,
  s3_pdf_path TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- Primary key on `id`
- Unique index on `invoice_number`
- Index on `hotel_id`
- Index on `created_at`
- Index on `table_number`
- Index on `order_id` (NEW)

**Foreign Keys:**
- `hotel_id` → `hotels(id)` ON DELETE CASCADE
- `order_id` → `orders(order_id)` ON DELETE SET NULL (NEW)

---

### 5. invoice_items
Stores individual items in each invoice.

```sql
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  dish_name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total DECIMAL(10, 2) NOT NULL
);
```

**Indexes:**
- Primary key on `id`
- Index on `invoice_id`

**Foreign Keys:**
- `invoice_id` → `invoices(id)` ON DELETE CASCADE
- `menu_item_id` → `menu_items(id)` ON DELETE SET NULL

---

### 6. audit_logs (NEW - Order Taking Feature)
Tracks all state changes for orders, invoices, and tables.

```sql
CREATE TABLE audit_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('ORDER', 'INVOICE', 'TABLE')),
  entity_id UUID NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Indexes:**
- Primary key on `log_id`
- Index on `hotel_id`
- Index on `(entity_type, entity_id)`
- Index on `timestamp DESC`
- Index on `action`

**Foreign Keys:**
- `hotel_id` → `hotels(id)` ON DELETE CASCADE

**Common Actions:**
- "Order Created"
- "Order Updated"
- "Invoice Generated"
- "Table Freed"

---

### 7. reports (NEW - Order Taking Feature)
Stores invoice summaries for efficient daily/monthly reporting.

```sql
CREATE TABLE reports (
  report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Indexes:**
- Primary key on `report_id`
- Index on `hotel_id`
- Index on `date`
- Index on `invoice_id`
- Composite index on `(hotel_id, date)`

**Foreign Keys:**
- `hotel_id` → `hotels(id)` ON DELETE CASCADE
- `invoice_id` → `invoices(id)` ON DELETE CASCADE

---

## Entity Relationships

```
hotels (1) ──────< (many) menu_items
  │
  ├──────< (many) orders
  │         │
  │         └──────< (1) invoices
  │                   │
  │                   ├──────< (many) invoice_items
  │                   └──────< (many) reports
  │
  └──────< (many) audit_logs
```

## Order Workflow

### 1. Taking an Order
```sql
-- Create new order
INSERT INTO orders (hotel_id, table_number, items, notes, status, version)
VALUES ($1, $2, $3, $4, 'OPEN', 1);

-- Log the action
INSERT INTO audit_logs (hotel_id, action, entity_type, entity_id, metadata)
VALUES ($1, 'Order Created', 'ORDER', $2, $3);
```

### 2. Updating an Order (Optimistic Locking)
```sql
-- Update order with version check
UPDATE orders 
SET items = $1, notes = $2, version = version + 1, updated_at = NOW()
WHERE order_id = $3 AND version = $4 AND status = 'OPEN'
RETURNING *;

-- If no rows returned, version conflict occurred
```

### 3. Generating Bill
```sql
-- Lock the order
UPDATE orders 
SET locked_by = $1, lock_expires_at = NOW() + INTERVAL '5 minutes', version = version + 1
WHERE order_id = $2 
AND (locked_by IS NULL OR lock_expires_at < NOW())
AND status = 'OPEN';

-- Generate invoice
INSERT INTO invoices (hotel_id, invoice_number, table_number, order_id, ...)
VALUES (...);

-- Mark order as billed
UPDATE orders 
SET status = 'BILLED', invoice_id = $1, version = version + 1
WHERE order_id = $2;

-- Create report entry
INSERT INTO reports (hotel_id, invoice_id, table_number, amount, date)
VALUES ($1, $2, $3, $4, CURRENT_DATE);
```

### 4. Checking Table Status
```sql
-- Get all OPEN orders for a hotel
SELECT table_number, order_id, items, created_at
FROM orders
WHERE hotel_id = $1 AND status = 'OPEN'
ORDER BY table_number;

-- Check specific table
SELECT * FROM orders
WHERE hotel_id = $1 AND table_number = $2 AND status = 'OPEN'
LIMIT 1;
```

## API Endpoints

### Orders API

**POST /api/orders**
- Create new order
- Body: `{ table_number, items, notes }`
- Returns: `{ order_id, status, version }`

**GET /api/orders?table={number}**
- Get active order for specific table
- Returns: `{ order }` or `{ order: null }`

**GET /api/orders**
- Get all open orders for hotel
- Returns: `{ orders: [] }`

**PUT /api/orders/:order_id**
- Update existing order
- Body: `{ items, notes, version }`
- Returns: `{ order_id, status, version }`
- Status 409 if version conflict

**PATCH /api/orders/:order_id**
- Mark order as billed
- Body: `{ status: 'BILLED', invoice_id, version }`
- Returns: `{ order_id, status, version }`

## Table Status Logic

### FREE Table
- No OPEN order exists for the table
- Displayed in GREEN on dashboard
- Clicking opens order taking page

### BUSY Table
- OPEN order exists for the table
- Displayed in RED on dashboard
- Shows order timestamp and item count
- Clicking in "Billing Section" opens billing modal
- Clicking in "Table Status" section opens order for editing

### After Billing
- Order status changes from OPEN → BILLED
- Table automatically becomes FREE
- Invoice is generated and stored
- Report entry is created

## Concurrency Control

### Optimistic Locking
- Each order has a `version` number
- Version increments on every update
- Updates require current version number
- Prevents lost updates in concurrent scenarios

### Billing Lock
- `locked_by` and `lock_expires_at` fields
- Prevents double-billing
- Lock expires after 5 minutes
- Automatic cleanup of expired locks

## Data Integrity

### Constraints
- All prices and amounts must be >= 0
- Quantities must be > 0
- Table numbers must be > 0
- Order status must be OPEN, BILLED, or CANCELLED
- Only one OPEN order per table (enforced by unique index)

### Cascading Deletes
- Deleting hotel → deletes all related data
- Deleting invoice → deletes invoice_items and reports
- Deleting order → sets invoice.order_id to NULL

## Performance Considerations

### Indexes
- All foreign keys are indexed
- Composite index on (hotel_id, table_number) for fast table lookups
- Partial unique index prevents duplicate OPEN orders
- Date indexes for efficient report queries

### JSONB Usage
- Order items stored as JSONB for flexibility
- Allows querying and indexing JSON data
- Efficient storage and retrieval

## Migration Files

All migrations are in the `migrations/` directory:

1. `001_create_orders_table.sql`
2. `002_extend_invoices_table.sql`
3. `003_create_audit_logs_table.sql`
4. `004_create_reports_table.sql`
5. `005_add_foreign_key_constraints.sql`

Run all at once: `migrations/apply-all-migrations.sql`

## Verification

Run verification script:
```bash
node scripts/verify-complete-setup.js
```

This checks:
- All tables exist
- All columns are present
- All indexes are created
- All foreign keys are set up
- API files exist
- Sample data queries work

---

**Last Updated:** 2025-11-30
**Database Version:** PostgreSQL 17.6 (Supabase)
**Application:** Hotel Billing Management System v2.0 (with Order Taking)
