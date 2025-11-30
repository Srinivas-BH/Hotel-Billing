# Design Document

## Overview

This design extends the existing Hotel Billing Management system with a comprehensive Order Taking workflow and updated billing behavior. The system introduces orders as the source of truth for bills, implements table status management based on order state, provides draft persistence for reliability, and ensures data consistency through optimistic locking and audit trails.

The architecture follows a layered approach with clear separation between UI components, API routes, business logic services, and data persistence layers. The design emphasizes reliability, concurrency safety, and seamless integration with existing S3 storage and reporting infrastructure.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (React)                     │
├─────────────────────────────────────────────────────────────┤
│  Order Taking Page  │  Dashboard  │  Billing Modal/Page     │
│  - Table Selector   │  - Table    │  - Order Preload        │
│  - Menu Search      │    Grid     │  - Invoice Generation   │
│  - Cart Management  │  - Status   │  - PDF Preview          │
│  - Draft Persist    │    Display  │  - Payment Finalization │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│  /api/orders        │  /api/invoices    │  /api/reports     │
│  - POST /orders     │  - POST /generate │  - GET /daily     │
│  - PUT /orders/:id  │  - GET /:id       │  - GET /monthly   │
│  - GET /orders      │                   │  - POST /update   │
│  - PATCH /:id/status│                   │                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
├─────────────────────────────────────────────────────────────┤
│  OrderService       │  BillingService   │  ReportService    │
│  - createOrder      │  - generateInvoice│  - aggregateDaily │
│  - updateOrder      │  - lockOrder      │  - aggregateMonthly│
│  - lockForBilling   │  - finalizeInvoice│  - insertReport   │
│  - markBilled       │  - callAIEngine   │                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Persistence Layer                    │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL DB      │  Amazon S3        │  Local Storage    │
│  - orders table     │  - Order JSON     │  - Draft orders   │
│  - invoices table   │  - Invoice JSON   │  - UI state       │
│  - reports table    │  - Invoice PDF    │                   │
│  - audit_logs table │                   │                   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Order Creation Flow:**
1. User selects table and adds menu items
2. Client persists draft to localStorage on changes
3. User clicks "Save Order"
4. API validates table and menu items
5. Service creates order record with status=OPEN, version=1
6. Service uploads order JSON to S3 via presigned URL
7. Service creates audit log entry
8. Response returns order_id and status
9. Client clears localStorage draft
10. Dashboard updates to show table as BUSY

**Billing Flow:**
1. User clicks BUSY table on dashboard
2. Client fetches active order for table
3. Billing modal opens with order items preloaded
4. User applies GST/service charges/discounts
5. User clicks "Generate & Save"
6. API locks order (sets locked_by, lock_expires_at, increments version)
7. Service calls AI billing engine with menu + order
8. AI returns invoice JSON + HTML
9. Service saves invoice to DB
10. Service uploads invoice JSON + PDF to S3
11. Service marks order status=BILLED, stores invoice_id
12. Service inserts report record
13. Service creates audit log entries
14. Service marks table FREE
15. Client shows invoice preview with Print/Download
16. Client displays success notification

## Components and Interfaces

### Frontend Components

#### OrderTakingPage Component
```typescript
interface OrderTakingPageProps {
  adminId: string;
}

interface OrderItem {
  menu_item_id: string;
  name: string;
  unit_price: number;
  quantity: number;
}

interface OrderDraft {
  table_number: number;
  items: OrderItem[];
  notes: string;
  timestamp: string;
}

// Component manages:
// - Table selection validation
// - Menu search and autocomplete
// - Cart state management
// - Draft persistence to localStorage
// - Order save/update API calls
```

#### DashboardTableGrid Component
```typescript
interface TableStatus {
  table_number: number;
  status: 'FREE' | 'BUSY';
  order_id?: string;
  order_timestamp?: string;
  item_count?: number;
}

// Component displays:
// - Table grid with status colors (green=FREE, red=BUSY)
// - Order metadata for BUSY tables
// - Click handler to open billing flow
```

#### BillingModal Component
```typescript
interface BillingModalProps {
  table_number: number;
  order_id?: string;
  onClose: () => void;
  onSuccess: (invoice_id: string) => void;
}

interface BillingCalculation {
  subtotal: number;
  gst_percent: number;
  gst_amount: number;
  service_charge_percent: number;
  service_charge_amount: number;
  discount: number;
  total: number;
}

// Component manages:
// - Order preloading for BUSY tables
// - Billing calculation with rounding
// - Progress indicator during generation
// - Invoice preview display
// - Print and PDF download actions
```

### API Endpoints

#### POST /api/orders
```typescript
// Request
interface CreateOrderRequest {
  admin_id: string;
  table_number: number;
  items: OrderItem[];
  notes?: string;
  timestamp: string;
}

// Response
interface CreateOrderResponse {
  order_id: string;
  status: 'OPEN';
  version: number;
  created_at: string;
  s3_url: string;
}
```

#### PUT /api/orders/:order_id
```typescript
// Request
interface UpdateOrderRequest {
  items: OrderItem[];
  notes?: string;
  version: number; // For optimistic locking
}

// Response
interface UpdateOrderResponse {
  order_id: string;
  status: 'OPEN';
  version: number;
  updated_at: string;
  s3_url: string;
}
```

#### GET /api/orders?table=:table_number
```typescript
// Response
interface GetActiveOrderResponse {
  order_id: string | null;
  table_number: number;
  items: OrderItem[];
  notes: string;
  status: 'OPEN' | 'BILLED';
  version: number;
  created_at: string;
  updated_at: string;
}
```

#### POST /api/invoices/generate
```typescript
// Request
interface GenerateInvoiceRequest {
  order_id: string;
  gst_percent?: number;
  service_charge_percent?: number;
  discount?: number;
}

// Response
interface GenerateInvoiceResponse {
  invoice_id: string;
  invoice_json: InvoiceData;
  presigned_urls: {
    json: string;
    pdf: string;
  };
  html_preview: string;
}
```

#### PATCH /api/orders/:order_id/status
```typescript
// Request
interface UpdateOrderStatusRequest {
  status: 'BILLED' | 'CANCELLED';
  invoice_id?: string;
  version: number;
}

// Response
interface UpdateOrderStatusResponse {
  order_id: string;
  status: string;
  version: number;
  updated_at: string;
}
```

### Service Layer Interfaces

#### OrderService
```typescript
class OrderService {
  async createOrder(data: CreateOrderRequest): Promise<Order>;
  async updateOrder(orderId: string, data: UpdateOrderRequest): Promise<Order>;
  async getActiveOrder(tableNumber: number): Promise<Order | null>;
  async lockForBilling(orderId: string, adminId: string): Promise<boolean>;
  async markBilled(orderId: string, invoiceId: string, version: number): Promise<Order>;
  async uploadToS3(orderId: string, data: object): Promise<string>;
}
```

#### BillingService
```typescript
class BillingService {
  async generateInvoice(request: GenerateInvoiceRequest): Promise<Invoice>;
  async callAIEngine(order: Order, menu: MenuItem[]): Promise<AIInvoiceResponse>;
  async saveInvoice(invoice: Invoice): Promise<string>;
  async uploadInvoiceToS3(invoiceId: string, json: object, pdf: Buffer): Promise<S3Urls>;
  async finalizeOrder(orderId: string, invoiceId: string): Promise<void>;
}
```

#### ReportService
```typescript
class ReportService {
  async insertReportRecord(invoice: Invoice): Promise<void>;
  async getDailyReport(date: string): Promise<DailyReport>;
  async getMonthlyReport(year: number, month: number): Promise<MonthlyReport>;
}
```

## Data Models

### Orders Table
```sql
CREATE TABLE orders (
  order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admins(admin_id),
  table_number INTEGER NOT NULL,
  items JSONB NOT NULL, -- Array of {menu_item_id, name, unit_price, quantity}
  notes TEXT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('OPEN', 'BILLED', 'CANCELLED')),
  version INTEGER NOT NULL DEFAULT 1,
  locked_by UUID REFERENCES admins(admin_id),
  lock_expires_at TIMESTAMP,
  invoice_id UUID REFERENCES invoices(invoice_id),
  s3_path TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_open_order_per_table UNIQUE (table_number, status) 
    WHERE status = 'OPEN'
);

CREATE INDEX idx_orders_table_status ON orders(table_number, status);
CREATE INDEX idx_orders_admin ON orders(admin_id);
CREATE INDEX idx_orders_status ON orders(status);
```

### Invoices Table (Extended)
```sql
ALTER TABLE invoices ADD COLUMN order_id UUID REFERENCES orders(order_id);
ALTER TABLE invoices ADD COLUMN s3_json_path TEXT;
ALTER TABLE invoices ADD COLUMN s3_pdf_path TEXT;

CREATE INDEX idx_invoices_order ON invoices(order_id);
```

### Reports Table (Extended)
```sql
ALTER TABLE reports ADD COLUMN invoice_id UUID REFERENCES invoices(invoice_id);
ALTER TABLE reports ADD COLUMN table_number INTEGER;

CREATE INDEX idx_reports_date ON reports(date);
CREATE INDEX idx_reports_invoice ON reports(invoice_id);
```

### Audit Logs Table
```sql
CREATE TABLE audit_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admins(admin_id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'ORDER', 'INVOICE', 'TABLE'
  entity_id UUID NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
```

### TypeScript Models
```typescript
interface Order {
  order_id: string;
  admin_id: string;
  table_number: number;
  items: OrderItem[];
  notes: string;
  status: 'OPEN' | 'BILLED' | 'CANCELLED';
  version: number;
  locked_by?: string;
  lock_expires_at?: Date;
  invoice_id?: string;
  s3_path: string;
  created_at: Date;
  updated_at: Date;
}

interface OrderItem {
  menu_item_id: string;
  name: string;
  unit_price: number;
  quantity: number;
}

interface Invoice {
  invoice_id: string;
  order_id: string;
  admin_id: string;
  table_number: number;
  items: OrderItem[];
  subtotal: number;
  gst_percent: number;
  gst_amount: number;
  service_charge_percent: number;
  service_charge_amount: number;
  discount: number;
  total: number;
  s3_json_path: string;
  s3_pdf_path: string;
  created_at: Date;
}

interface AuditLog {
  log_id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, any>;
  timestamp: Date;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After reviewing the prework analysis, I've identified the following redundancies and consolidations:

**Redundant Properties:**
- Requirements 7.1 and 6.4 both test that successful billing marks order as BILLED - these can be combined
- Multiple audit logging properties (9.1-9.4) follow the same pattern and can be consolidated into one comprehensive property
- Properties 1.3 and 5.1 both test persistence to DB and S3 - can be combined into a single comprehensive persistence property

**Consolidated Properties:**
- Draft persistence (2.1, 2.2, 2.4) can be combined into a single round-trip property
- Report aggregation (8.3, 8.4) follow the same pattern and can be one property with date granularity parameter
- UI feedback properties (10.1-10.5) are examples rather than universal properties and will be tested as integration tests

### Core Correctness Properties

**Property 1: Menu price consistency**
*For any* menu item selected in an order, the auto-filled unit price should equal the price stored in the menu database.
**Validates: Requirements 1.2**

**Property 2: Order persistence completeness**
*For any* valid order data, saving the order should create both a database record with status OPEN and an S3 JSON file, and both should contain identical item data.
**Validates: Requirements 1.3, 5.1**

**Property 3: Table status reflects order state**
*For any* table with an order having status OPEN, the table status should be BUSY; for any table with no OPEN order, the table status should be FREE.
**Validates: Requirements 1.4, 3.1, 7.2**

**Property 4: Order ID immutability**
*For any* order, updating the order should preserve the original order_id across all updates.
**Validates: Requirements 1.5**

**Property 5: Draft persistence round-trip**
*For any* unsaved order draft, persisting to localStorage then restoring should produce an equivalent order with the same items, quantities, and prices.
**Validates: Requirements 2.1, 2.2, 2.4**

**Property 6: Draft merge preserves data**
*For any* restored draft and existing order, merging should produce a result that contains items from both sources without data loss.
**Validates: Requirements 2.3**

**Property 7: Order preload completeness**
*For any* BUSY table, initiating billing should preload the cart with all items from the active order, preserving quantities and unit prices.
**Validates: Requirements 4.1, 4.2**

**Property 8: Decimal precision in calculations**
*For any* billing calculation with GST, service charges, or discounts, all monetary values should be rounded to exactly 2 decimal places.
**Validates: Requirements 4.3**

**Property 9: Invoice persistence completeness**
*For any* generated invoice, the system should create a database record, an S3 JSON file, and an S3 PDF file, with the database record containing valid S3 paths.
**Validates: Requirements 5.1, 5.2, 5.4**

**Property 10: S3 path structure compliance**
*For any* invoice stored in S3, the file path should match the pattern /{admin_id}/invoices/{year}/{month}/{invoice_id}.{extension}.
**Validates: Requirements 5.5**

**Property 11: Presigned URL expiry bounds**
*For any* presigned S3 URL generated, the expiry time should be between 1 minute and 15 minutes from generation time.
**Validates: Requirements 5.3**

**Property 12: Order locking prevents concurrent billing**
*For any* order being billed, a second concurrent billing attempt should fail with a conflict error before any invoice data is created.
**Validates: Requirements 6.2, 6.5**

**Property 13: Lock state completeness**
*For any* order locked for billing, the order record should have non-null values for locked_by, lock_expires_at, and an incremented version number.
**Validates: Requirements 6.1, 6.3**

**Property 14: Billing finalizes order state**
*For any* order, successful invoice generation should atomically mark the order status as BILLED, store the invoice_id, and mark the associated table as FREE.
**Validates: Requirements 6.4, 7.1, 7.2**

**Property 15: Draft cleanup after billing**
*For any* table that has been billed, localStorage should not contain any draft data for that table.
**Validates: Requirements 7.3**

**Property 16: Report record completeness**
*For any* created invoice, a corresponding report record should exist containing invoice_id, admin_id, date, amount, and table_number.
**Validates: Requirements 8.1, 8.2**

**Property 17: Report aggregation accuracy**
*For any* date or month, the aggregated report total should equal the sum of all invoice amounts for that time period.
**Validates: Requirements 8.3, 8.4, 8.5**

**Property 18: Audit trail completeness**
*For any* state transition (order created, order updated, invoice generated, table freed), an audit log entry should exist with the correct action, entity_id, admin_id, and timestamp.
**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

## Error Handling

### Order Creation Errors
- **Invalid Table**: Return 400 with message "Table {number} does not exist"
- **Duplicate Open Order**: Return 409 with message "Table {number} already has an active order"
- **Invalid Menu Item**: Return 400 with message "Menu item {id} not found"
- **S3 Upload Failure**: Rollback DB transaction, return 500 with message "Failed to backup order to storage"

### Order Update Errors
- **Version Conflict**: Return 409 with message "Order has been modified by another user. Please refresh and try again."
- **Order Not Found**: Return 404 with message "Order {id} not found"
- **Order Already Billed**: Return 400 with message "Cannot modify order {id} - already billed"

### Billing Errors
- **Order Locked**: Return 409 with message "Order is currently being billed by another user. Please try again in a moment."
- **Lock Expired**: Automatically release lock and retry
- **Order Not Found**: Return 404 with message "No active order found for table {number}"
- **AI Engine Failure**: Return 500 with message "Invoice generation service unavailable. Please try again."
- **S3 Upload Failure**: Rollback all changes, return 500 with message "Failed to store invoice documents"

### Concurrency Errors
- **Double Billing Attempt**: Return 409 with message "This order has already been billed (Invoice: {invoice_id})"
- **Stale Lock**: Automatically clear locks older than 5 minutes
- **Version Mismatch**: Return 409 with version conflict message

### Recovery Strategies
- **Transactional Integrity**: All DB operations within billing flow use transactions with rollback on failure
- **Idempotency**: Order creation with same data within 1 minute returns existing order
- **Lock Timeout**: Locks automatically expire after 5 minutes to prevent deadlocks
- **Retry Logic**: S3 uploads retry up to 3 times with exponential backoff
- **Draft Recovery**: Client automatically restores drafts on page reload

## Testing Strategy

### Unit Testing

**Order Service Tests:**
- Test order creation with valid data
- Test order update with version checking
- Test lock acquisition and release
- Test S3 upload with presigned URLs
- Test order status transitions

**Billing Service Tests:**
- Test invoice calculation with various tax/discount combinations
- Test decimal rounding to 2 places
- Test AI engine integration with mock responses
- Test S3 upload for JSON and PDF
- Test transaction rollback on failures

**Report Service Tests:**
- Test report record insertion
- Test daily aggregation with multiple invoices
- Test monthly aggregation across date ranges
- Test empty result handling

### Property-Based Testing

We will use **fast-check** (JavaScript/TypeScript property-based testing library) for implementing property tests. Each property test will run a minimum of 100 iterations with randomly generated inputs.

**Property Test 1: Menu price consistency**
```typescript
// Feature: order-taking-billing, Property 1: Menu price consistency
// Validates: Requirements 1.2
fc.assert(
  fc.property(
    fc.record({
      menu_item_id: fc.uuid(),
      name: fc.string(),
      unit_price: fc.double({ min: 0.01, max: 10000, noNaN: true }),
    }),
    async (menuItem) => {
      // Given a menu item in the database
      await db.menuItems.insert(menuItem);
      
      // When selected in an order
      const selectedPrice = await orderService.getMenuItemPrice(menuItem.menu_item_id);
      
      // Then the price should match exactly
      expect(selectedPrice).toBeCloseTo(menuItem.unit_price, 2);
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 2: Order persistence completeness**
```typescript
// Feature: order-taking-billing, Property 2: Order persistence completeness
// Validates: Requirements 1.3, 5.1
fc.assert(
  fc.property(
    generateValidOrder(),
    async (orderData) => {
      // When saving an order
      const result = await orderService.createOrder(orderData);
      
      // Then DB record should exist
      const dbOrder = await db.orders.findById(result.order_id);
      expect(dbOrder).toBeDefined();
      expect(dbOrder.status).toBe('OPEN');
      
      // And S3 file should exist with same data
      const s3Data = await s3.getObject(dbOrder.s3_path);
      expect(s3Data.items).toEqual(dbOrder.items);
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 3: Table status reflects order state**
```typescript
// Feature: order-taking-billing, Property 3: Table status reflects order state
// Validates: Requirements 1.4, 3.1, 7.2
fc.assert(
  fc.property(
    fc.integer({ min: 1, max: 100 }),
    fc.constantFrom('OPEN', 'BILLED', 'CANCELLED'),
    async (tableNumber, orderStatus) => {
      // Given an order with specific status
      if (orderStatus === 'OPEN') {
        await createOrderForTable(tableNumber, orderStatus);
      }
      
      // When checking table status
      const tableStatus = await dashboardService.getTableStatus(tableNumber);
      
      // Then status should match order state
      if (orderStatus === 'OPEN') {
        expect(tableStatus).toBe('BUSY');
      } else {
        expect(tableStatus).toBe('FREE');
      }
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 4: Order ID immutability**
```typescript
// Feature: order-taking-billing, Property 4: Order ID immutability
// Validates: Requirements 1.5
fc.assert(
  fc.property(
    generateValidOrder(),
    fc.array(generateOrderItem(), { minLength: 1, maxLength: 10 }),
    async (initialOrder, newItems) => {
      // Given an existing order
      const created = await orderService.createOrder(initialOrder);
      const originalId = created.order_id;
      
      // When updating the order
      const updated = await orderService.updateOrder(originalId, {
        items: newItems,
        version: created.version
      });
      
      // Then order_id should remain unchanged
      expect(updated.order_id).toBe(originalId);
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 5: Draft persistence round-trip**
```typescript
// Feature: order-taking-billing, Property 5: Draft persistence round-trip
// Validates: Requirements 2.1, 2.2, 2.4
fc.assert(
  fc.property(
    generateOrderDraft(),
    (draft) => {
      // When persisting to localStorage
      draftService.saveDraft(draft);
      
      // And restoring
      const restored = draftService.loadDraft(draft.table_number);
      
      // Then data should be equivalent
      expect(restored.table_number).toBe(draft.table_number);
      expect(restored.items).toEqual(draft.items);
      expect(restored.notes).toBe(draft.notes);
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 7: Order preload completeness**
```typescript
// Feature: order-taking-billing, Property 7: Order preload completeness
// Validates: Requirements 4.1, 4.2
fc.assert(
  fc.property(
    generateValidOrder(),
    async (orderData) => {
      // Given a BUSY table with an order
      const order = await orderService.createOrder(orderData);
      
      // When initiating billing
      const preloadedCart = await billingService.preloadOrder(order.order_id);
      
      // Then all items should be present with correct prices
      expect(preloadedCart.items).toHaveLength(order.items.length);
      preloadedCart.items.forEach((item, index) => {
        expect(item.unit_price).toBe(order.items[index].unit_price);
        expect(item.quantity).toBe(order.items[index].quantity);
      });
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 8: Decimal precision in calculations**
```typescript
// Feature: order-taking-billing, Property 8: Decimal precision in calculations
// Validates: Requirements 4.3
fc.assert(
  fc.property(
    fc.double({ min: 0, max: 10000, noNaN: true }),
    fc.double({ min: 0, max: 30, noNaN: true }),
    fc.double({ min: 0, max: 20, noNaN: true }),
    fc.double({ min: 0, max: 1000, noNaN: true }),
    (subtotal, gstPercent, servicePercent, discount) => {
      // When calculating billing
      const result = billingService.calculateTotals({
        subtotal,
        gst_percent: gstPercent,
        service_charge_percent: servicePercent,
        discount
      });
      
      // Then all values should have exactly 2 decimals
      expect(result.gst_amount).toMatch(/^\d+\.\d{2}$/);
      expect(result.service_charge_amount).toMatch(/^\d+\.\d{2}$/);
      expect(result.total).toMatch(/^\d+\.\d{2}$/);
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 10: S3 path structure compliance**
```typescript
// Feature: order-taking-billing, Property 10: S3 path structure compliance
// Validates: Requirements 5.5
fc.assert(
  fc.property(
    fc.uuid(),
    fc.uuid(),
    fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
    (adminId, invoiceId, date) => {
      // When generating S3 path
      const path = s3Service.generateInvoicePath(adminId, invoiceId, date);
      
      // Then path should match expected pattern
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const expectedPattern = new RegExp(
        `^${adminId}/invoices/${year}/${month}/${invoiceId}\\.(json|pdf)$`
      );
      expect(path).toMatch(expectedPattern);
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 11: Presigned URL expiry bounds**
```typescript
// Feature: order-taking-billing, Property 11: Presigned URL expiry bounds
// Validates: Requirements 5.3
fc.assert(
  fc.property(
    fc.string(),
    (filePath) => {
      // When generating presigned URL
      const url = s3Service.generatePresignedUrl(filePath);
      const expirySeconds = extractExpiryFromUrl(url);
      
      // Then expiry should be between 60 and 900 seconds
      expect(expirySeconds).toBeGreaterThanOrEqual(60);
      expect(expirySeconds).toBeLessThanOrEqual(900);
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 13: Lock state completeness**
```typescript
// Feature: order-taking-billing, Property 13: Lock state completeness
// Validates: Requirements 6.1, 6.3
fc.assert(
  fc.property(
    generateValidOrder(),
    fc.uuid(),
    async (orderData, adminId) => {
      // Given an order
      const order = await orderService.createOrder(orderData);
      const initialVersion = order.version;
      
      // When locking for billing
      await orderService.lockForBilling(order.order_id, adminId);
      const locked = await db.orders.findById(order.order_id);
      
      // Then lock fields should be populated
      expect(locked.locked_by).toBe(adminId);
      expect(locked.lock_expires_at).toBeDefined();
      expect(locked.lock_expires_at.getTime()).toBeGreaterThan(Date.now());
      expect(locked.version).toBe(initialVersion + 1);
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 17: Report aggregation accuracy**
```typescript
// Feature: order-taking-billing, Property 17: Report aggregation accuracy
// Validates: Requirements 8.3, 8.4, 8.5
fc.assert(
  fc.property(
    fc.array(
      fc.record({
        amount: fc.double({ min: 0.01, max: 10000, noNaN: true }),
        date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') })
      }),
      { minLength: 1, maxLength: 50 }
    ),
    async (invoices) => {
      // Given multiple invoices
      for (const inv of invoices) {
        await createInvoiceWithAmount(inv.amount, inv.date);
      }
      
      // When aggregating by date
      const date = invoices[0].date;
      const report = await reportService.getDailyReport(date);
      
      // Then total should equal sum of invoices for that date
      const expectedTotal = invoices
        .filter(inv => isSameDay(inv.date, date))
        .reduce((sum, inv) => sum + inv.amount, 0);
      
      expect(report.total).toBeCloseTo(expectedTotal, 2);
    }
  ),
  { numRuns: 100 }
);
```

### Integration Testing

**Order to Billing Flow:**
- Create order → verify table BUSY → initiate billing → verify order preloaded → generate invoice → verify table FREE

**Concurrent Billing Prevention:**
- Create order → start billing from user A → attempt billing from user B → verify user B receives conflict error

**Draft Recovery:**
- Create draft → navigate away → return → verify draft restored → save order → verify draft cleared

**Report Integration:**
- Generate invoice → verify report record created → query daily report → verify invoice included in total

### End-to-End Testing

Use Playwright for E2E tests covering:
- Complete order taking workflow
- Billing flow with order preload
- Concurrent user scenarios
- Draft persistence across page reloads
- Invoice preview and download

## Security Considerations

### Authentication & Authorization
- All API endpoints require valid JWT token
- Admin ID extracted from JWT and validated against database
- Order operations restricted to orders owned by authenticated admin

### S3 Security
- Presigned URLs generated server-side only
- Short expiry times (5-15 minutes) to limit exposure
- URLs signed with admin-specific credentials
- S3 bucket policies restrict access to authenticated requests only

### Concurrency Safety
- Optimistic locking prevents lost updates
- Database constraints prevent duplicate open orders per table
- Lock expiry prevents indefinite locks
- Version numbers tracked for all updates

### Data Validation
- Table numbers validated against existing tables
- Menu item IDs validated against menu database
- Numeric values validated for reasonable ranges
- SQL injection prevented through parameterized queries

### Audit Trail
- All state transitions logged with admin ID
- Timestamps recorded for all operations
- Metadata includes relevant context for investigation
- Logs retained for compliance requirements

## Performance Considerations

### Database Optimization
- Indexes on frequently queried columns (table_number, status, admin_id)
- Unique constraint on (table_number, status) WHERE status='OPEN' prevents duplicates efficiently
- JSONB type for items allows efficient querying without separate tables

### Caching Strategy
- Menu items cached in client localStorage (refreshed daily)
- Table status computed on-demand from orders table
- Dashboard queries optimized with single query for all tables

### S3 Upload Optimization
- Presigned URLs allow direct client-to-S3 uploads (bypassing server)
- Parallel uploads for JSON and PDF
- Retry logic with exponential backoff

### Client-Side Performance
- Draft persistence debounced to avoid excessive localStorage writes
- Menu search uses local cache with fuzzy matching
- Table grid uses virtual scrolling for large table counts

## Deployment Considerations

### Database Migrations
```sql
-- Migration 001: Create orders table
CREATE TABLE orders (...);

-- Migration 002: Add order_id to invoices
ALTER TABLE invoices ADD COLUMN order_id UUID;

-- Migration 003: Create audit_logs table
CREATE TABLE audit_logs (...);

-- Migration 004: Add indexes
CREATE INDEX idx_orders_table_status ON orders(table_number, status);
```

### Environment Variables
```
S3_BUCKET_ORDERS=hotel-orders-bucket
S3_BUCKET_INVOICES=hotel-invoices-bucket
ORDER_LOCK_TIMEOUT_MINUTES=5
PRESIGNED_URL_EXPIRY_SECONDS=300
AI_BILLING_ENGINE_URL=https://api.billing-ai.example.com
```

### Monitoring & Alerts
- Alert on high rate of lock conflicts (indicates concurrency issues)
- Alert on S3 upload failures
- Monitor AI engine response times
- Track order-to-billing conversion rate

### Rollback Plan
- Database migrations are reversible
- Feature flag to disable order-based billing and revert to direct billing
- S3 data retained even if feature disabled
- Audit logs preserved for compliance

## Future Enhancements

### Phase 2 Features
- Order splitting across multiple tables
- Partial billing (bill subset of order items)
- Order modification after billing (with credit notes)
- Kitchen display system integration
- Real-time order status updates via WebSockets

### Scalability Improvements
- Redis cache for table status
- Event-driven architecture for report updates
- Async invoice generation with job queue
- CDN for invoice PDF delivery

### Analytics
- Order timing analytics (time from order to billing)
- Popular items tracking
- Table turnover rate
- Staff performance metrics
