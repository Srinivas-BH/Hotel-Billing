# Design Document

## Overview

The Hotel Billing Management Admin Portal is a full-stack web application built with Next.js, React, and PostgreSQL. The system uses a modern serverless architecture with Next.js API routes handling backend logic, Supabase PostgreSQL for data persistence, and Amazon S3 for file storage. The AI billing engine leverages the Hugging Face Inference API (with deterministic fallback) to generate structured invoices. The frontend provides a responsive, mobile-first interface using Tailwind CSS, with React Query for efficient data fetching and caching. Authentication is handled via JWT tokens with bcrypt password hashing. All file operations use S3 presigned URLs for secure, direct client-to-cloud transfers.

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (Next.js React App + Tailwind CSS + React Query)           │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │   Menu   │  │ Billing  │  │ Reports  │   │
│  │   API    │  │   API    │  │   API    │  │   API    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────┬───────────────┬────────────┬──────────────────────┘
         │               │            │
         ▼               ▼            ▼
┌─────────────┐  ┌─────────────┐  ┌──────────────┐
│  Supabase   │  │   Amazon    │  │  Hugging     │
│ PostgreSQL  │  │     S3      │  │   Face API   │
│  Database   │  │   Storage   │  │ (AI Engine)  │
└─────────────┘  └─────────────┘  └──────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- React Query (TanStack Query)
- Lucide React (icons)
- React Hook Form (form management)
- Zod (validation)

**Backend:**
- Next.js API Routes
- Node.js runtime
- JWT (jsonwebtoken)
- bcrypt (password hashing)
- Puppeteer (PDF generation)

**Database:**
- Supabase PostgreSQL (free tier)

**Storage:**
- Amazon S3 (presigned URLs)
- AWS SDK v3

**AI:**
- Hugging Face Inference API (primary)
- Deterministic fallback algorithm

**Deployment:**
- Vercel (frontend + API routes)
- Supabase Cloud (database)
- AWS S3 (file storage)

## Components and Interfaces

### Frontend Components

#### Authentication Components
- `LoginForm`: Email/password login with validation
- `SignupForm`: Registration with hotel details and photo upload
- `AuthGuard`: HOC for protecting authenticated routes
- `SessionProvider`: Context provider for auth state

#### Dashboard Components
- `DashboardLayout`: Main layout with navigation and header
- `RevenueChart`: Visual representation of daily/monthly revenue
- `RevenueStats`: Summary cards showing key metrics
- `QuickActions`: Shortcut buttons for common tasks

#### Menu Management Components
- `MenuList`: Displays all menu items with edit/delete actions
- `MenuItemForm`: Add/edit menu item modal
- `MenuItemCard`: Individual menu item display
- `BulkImportModal`: Optional CSV import interface

#### Billing Components
- `TableSelector`: Dropdown or grid for selecting table number
- `OrderEntry`: Autocomplete input for adding menu items
- `OrderList`: Current order items with quantities
- `BillCalculator`: Real-time display of subtotal, GST, service charge, discount, total
- `InvoicePreview`: Formatted invoice display
- `InvoicePrintView`: Print-optimized invoice layout

#### Reports Components
- `InvoiceSearch`: Search and filter interface
- `InvoiceTable`: Paginated table of invoices
- `ReportExport`: Export buttons for CSV/PDF
- `DateRangePicker`: Date filter component

#### Profile Components
- `ProfileForm`: Edit hotel name, photo, table count
- `PhotoUpload`: S3 presigned URL upload component

### Backend API Endpoints

#### Authentication APIs
```
POST /api/auth/signup
  Body: { email, password, hotelName, tableCount, photoFile }
  Response: { token, user }

POST /api/auth/login
  Body: { email, password }
  Response: { token, user }

POST /api/auth/logout
  Headers: { Authorization: Bearer <token> }
  Response: { success: true }

GET /api/auth/me
  Headers: { Authorization: Bearer <token> }
  Response: { user }
```

#### Menu APIs
```
GET /api/menu
  Headers: { Authorization: Bearer <token> }
  Response: { items: MenuItem[] }

POST /api/menu
  Headers: { Authorization: Bearer <token> }
  Body: { dishName, price }
  Response: { item: MenuItem }

PUT /api/menu/:id
  Headers: { Authorization: Bearer <token> }
  Body: { dishName, price }
  Response: { item: MenuItem }

DELETE /api/menu/:id
  Headers: { Authorization: Bearer <token> }
  Response: { success: true }
```

#### Billing APIs
```
POST /api/billing/generate
  Headers: { Authorization: Bearer <token> }
  Body: { tableNumber, items: [{ menuItemId, quantity }], gst, serviceCharge, discount }
  Response: { invoice: Invoice, pdfUrl: string }

GET /api/billing/invoice/:id
  Headers: { Authorization: Bearer <token> }
  Response: { invoice: Invoice, pdfUrl: string }
```

#### Reports APIs
```
GET /api/reports/daily
  Headers: { Authorization: Bearer <token> }
  Query: { startDate, endDate }
  Response: { reports: DailyReport[] }

GET /api/reports/monthly
  Headers: { Authorization: Bearer <token> }
  Query: { startDate, endDate }
  Response: { reports: MonthlyReport[] }

GET /api/reports/invoices
  Headers: { Authorization: Bearer <token> }
  Query: { startDate, endDate, tableNumber, invoiceId, page, limit }
  Response: { invoices: Invoice[], total: number }

POST /api/reports/export
  Headers: { Authorization: Bearer <token> }
  Body: { format: 'csv' | 'pdf', startDate, endDate, filters }
  Response: { downloadUrl: string }
```

#### Profile APIs
```
GET /api/profile
  Headers: { Authorization: Bearer <token> }
  Response: { profile: HotelProfile }

PUT /api/profile
  Headers: { Authorization: Bearer <token> }
  Body: { hotelName, tableCount, photoFile }
  Response: { profile: HotelProfile }
```

#### S3 APIs
```
POST /api/s3/presigned-upload
  Headers: { Authorization: Bearer <token> }
  Body: { fileName, fileType, folder }
  Response: { uploadUrl: string, fileKey: string }

POST /api/s3/presigned-download
  Headers: { Authorization: Bearer <token> }
  Body: { fileKey }
  Response: { downloadUrl: string }
```

## Data Models

### Database Schema

```sql
-- Hotels table
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

-- Menu items table
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  dish_name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Invoices table
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
  created_at TIMESTAMP DEFAULT NOW()
);

-- Invoice items table
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  dish_name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total DECIMAL(10, 2) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_menu_items_hotel_id ON menu_items(hotel_id);
CREATE INDEX idx_invoices_hotel_id ON invoices(hotel_id);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);
CREATE INDEX idx_invoices_table_number ON invoices(table_number);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
```

### TypeScript Interfaces

```typescript
interface Hotel {
  id: string;
  email: string;
  hotelName: string;
  hotelPhotoKey: string | null;
  tableCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface MenuItem {
  id: string;
  hotelId: string;
  dishName: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

interface InvoiceItem {
  id: string;
  invoiceId: string;
  menuItemId: string | null;
  dishName: string;
  price: number;
  quantity: number;
  total: number;
}

interface Invoice {
  id: string;
  hotelId: string;
  invoiceNumber: string;
  tableNumber: number;
  subtotal: number;
  gstPercentage: number;
  gstAmount: number;
  serviceChargePercentage: number;
  serviceChargeAmount: number;
  discountAmount: number;
  grandTotal: number;
  invoiceJson: InvoiceJSON;
  pdfKey: string | null;
  items: InvoiceItem[];
  createdAt: Date;
}

interface InvoiceJSON {
  invoiceNumber: string;
  tableNumber: number;
  hotelName: string;
  date: string;
  items: {
    dishName: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  gst: {
    percentage: number;
    amount: number;
  };
  serviceCharge: {
    percentage: number;
    amount: number;
  };
  discount: number;
  grandTotal: number;
}

interface DailyReport {
  date: string;
  invoiceCount: number;
  totalRevenue: number;
}

interface MonthlyReport {
  month: string;
  year: number;
  invoiceCount: number;
  totalRevenue: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Password hashing is irreversible
*For any* valid password string, after hashing with bcrypt, the resulting hash should never equal the original password and should verify correctly using bcrypt.compare
**Validates: Requirements 1.4**

### Property 2: Session tokens are unique and valid
*For any* successful authentication, the generated JWT token should decode to contain the correct user ID and should not be reusable after logout
**Validates: Requirements 2.1, 2.4**

### Property 3: Menu item CRUD maintains data integrity
*For any* menu item, after creating, reading, updating, or deleting, the database state should accurately reflect the operation with correct associations to the hotel
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 4: Order quantities are positive integers
*For any* order submission, all item quantities should be validated as positive integers before processing
**Validates: Requirements 4.3**

### Property 5: Bill calculation accuracy
*For any* set of order items with prices and quantities, the calculated subtotal should equal the sum of (price × quantity) for all items
**Validates: Requirements 5.1**

### Property 6: GST calculation correctness
*For any* order with GST enabled, the GST amount should equal (subtotal - discount) × (GST percentage / 100), and the total should include this amount
**Validates: Requirements 5.2**

### Property 7: Service charge calculation correctness
*For any* order with service charge enabled, the service charge amount should equal (subtotal - discount) × (service charge percentage / 100), and the total should include this amount
**Validates: Requirements 5.3**

### Property 8: Discount application order
*For any* order with a discount, the discount should be subtracted from the subtotal before calculating GST and service charge
**Validates: Requirements 5.4**

### Property 9: Grand total calculation completeness
*For any* invoice, the grand total should equal subtotal + GST amount + service charge amount - discount amount
**Validates: Requirements 5.5**

### Property 10: Invoice JSON structure completeness
*For any* generated invoice, the JSON record should contain all required fields: items, quantities, prices, subtotal, GST, service charge, discount, grand total, invoice ID, and table number
**Validates: Requirements 6.1**

### Property 11: Invoice ID uniqueness
*For any* two invoices generated at any time, their invoice IDs should be unique across the entire system
**Validates: Requirements 6.3**

### Property 12: Invoice storage atomicity
*For any* invoice generation, both the database record and S3 PDF upload should succeed together, or both should fail with retry capability
**Validates: Requirements 7.1, 7.3**

### Property 13: Invoice retrieval consistency
*For any* stored invoice, retrieving it by ID should return the same data that was originally stored, including all items and calculations
**Validates: Requirements 8.1**

### Property 14: Presigned URL time-limited access
*For any* presigned URL generated for S3 access, the URL should work within the expiration time and fail after expiration
**Validates: Requirements 8.2, 13.3**

### Property 15: Daily revenue calculation accuracy
*For any* date range, the daily revenue should equal the sum of all invoice grand totals for invoices created on that day
**Validates: Requirements 9.1**

### Property 16: Monthly revenue calculation accuracy
*For any* month and year, the monthly revenue should equal the sum of all invoice grand totals for invoices created in that month
**Validates: Requirements 9.2**

### Property 17: Date range filtering correctness
*For any* date range filter applied to invoices, all returned invoices should have creation dates within the specified range (inclusive)
**Validates: Requirements 9.4**

### Property 18: CSV export data completeness
*For any* CSV export, each row should contain invoice date, invoice ID, table number, and grand total for all invoices matching the filter
**Validates: Requirements 10.1**

### Property 19: Responsive layout breakpoints
*For any* screen width less than 768 pixels, the layout should adapt to mobile-optimized styling with appropriate component reflow
**Validates: Requirements 11.3**

### Property 20: Menu autocomplete substring matching
*For any* input string, the autocomplete results should include all menu items where the dish name contains the input as a case-insensitive substring
**Validates: Requirements 12.2**

### Property 21: HTTPS enforcement
*For any* API request, the server should reject non-HTTPS requests in production and only accept secure connections
**Validates: Requirements 13.1**

### Property 22: S3 bucket privacy
*For any* S3 bucket used by the system, direct public access should be denied, and all access should require presigned URLs
**Validates: Requirements 13.2**

### Property 23: Input validation completeness
*For any* form submission, all inputs should be validated against their schema before processing, and invalid inputs should be rejected with specific error messages
**Validates: Requirements 13.4**

### Property 24: Error message user-friendliness
*For any* error condition, the displayed message should be understandable to non-technical users and should not expose sensitive system details
**Validates: Requirements 14.1, 14.3**

### Property 25: Profile update validation
*For any* profile update with invalid data (negative table count, empty hotel name), the system should reject the update and preserve the existing valid data
**Validates: Requirements 15.4**

## Error Handling

### Error Categories

**Validation Errors (400)**
- Invalid email format
- Weak password (< 8 characters)
- Negative or zero prices
- Non-positive quantities
- Invalid table numbers
- Missing required fields

**Authentication Errors (401)**
- Invalid credentials
- Expired token
- Missing token
- Invalid token signature

**Authorization Errors (403)**
- Accessing another hotel's data
- Insufficient permissions

**Not Found Errors (404)**
- Menu item not found
- Invoice not found
- Hotel not found

**Conflict Errors (409)**
- Duplicate email during signup
- Duplicate invoice number

**External Service Errors (502/503)**
- S3 upload failure
- Hugging Face API timeout
- Database connection failure

**Server Errors (500)**
- Unexpected exceptions
- PDF generation failure
- Unhandled edge cases

### Error Handling Strategy

**Frontend Error Handling:**
- Display toast notifications for transient errors
- Show inline validation errors on forms
- Provide retry buttons for failed operations
- Log errors to console in development
- Graceful degradation for non-critical features

**Backend Error Handling:**
- Structured error responses with error codes
- Detailed logging with request context
- Automatic retry for transient failures (S3, AI API)
- Fallback to deterministic billing if AI fails
- Transaction rollback for database errors
- Rate limiting for API endpoints

**AI Billing Engine Fallback:**
```typescript
async function generateInvoice(orderData) {
  try {
    // Try Hugging Face API first
    return await generateInvoiceWithAI(orderData);
  } catch (error) {
    // Fall back to deterministic algorithm
    console.warn('AI service unavailable, using fallback');
    return generateInvoiceDeterministic(orderData);
  }
}
```

## Testing Strategy

### Unit Testing

**Framework:** Jest + React Testing Library

**Unit Test Coverage:**
- Authentication utilities (password hashing, token generation)
- Billing calculation functions (subtotal, GST, service charge, grand total)
- Input validation functions
- Date formatting and filtering utilities
- S3 presigned URL generation
- Invoice number generation
- CSV/PDF export formatting

**Example Unit Tests:**
- Test that bcrypt hashing produces different hashes for the same password
- Test that JWT tokens contain correct payload
- Test that subtotal calculation sums item totals correctly
- Test that GST is applied to post-discount subtotal
- Test that invoice numbers are formatted correctly
- Test that date range filters work with edge dates

### Property-Based Testing

**Framework:** fast-check (JavaScript property-based testing library)

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with format: `**Feature: hotel-billing-admin, Property {number}: {property_text}**`
- Tests run in CI/CD pipeline
- Seed-based reproducibility for failed tests

**Property Test Coverage:**
- Password hashing properties (Property 1)
- Session token uniqueness (Property 2)
- Menu CRUD integrity (Property 3)
- Order quantity validation (Property 4)
- All billing calculations (Properties 5-9)
- Invoice structure and uniqueness (Properties 10-11)
- Storage atomicity (Property 12)
- Retrieval consistency (Property 13)
- Revenue calculations (Properties 15-16)
- Date filtering (Property 17)
- Export completeness (Property 18)
- Autocomplete matching (Property 20)
- Input validation (Property 23)
- Profile update validation (Property 25)

**Example Property Test:**
```typescript
// Property 9: Grand total calculation completeness
test('Feature: hotel-billing-admin, Property 9: Grand total equals subtotal + GST + service charge - discount', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({ price: fc.float({ min: 0.01, max: 1000 }), quantity: fc.integer({ min: 1, max: 100 }) })),
      fc.float({ min: 0, max: 30 }), // GST percentage
      fc.float({ min: 0, max: 20 }), // Service charge percentage
      fc.float({ min: 0, max: 100 }), // Discount amount
      (items, gstPct, servicePct, discount) => {
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const gstAmount = (subtotal - discount) * (gstPct / 100);
        const serviceAmount = (subtotal - discount) * (servicePct / 100);
        const expected = subtotal + gstAmount + serviceAmount - discount;
        
        const result = calculateGrandTotal(items, gstPct, servicePct, discount);
        
        expect(result).toBeCloseTo(expected, 2);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

**Framework:** Playwright for E2E tests

**Integration Test Scenarios:**
- Complete signup flow with photo upload
- Login and session management
- Menu item creation and editing
- Full billing workflow (select table → add items → generate invoice → download PDF)
- Invoice search and filtering
- Revenue report generation
- CSV/PDF export
- Profile update with photo change
- Mobile responsive behavior

### Performance Testing

**Metrics:**
- Page load time < 3 seconds on 3G
- API response time < 500ms for most endpoints
- Invoice generation < 2 seconds
- Autocomplete response < 100ms
- PDF generation < 3 seconds

**Tools:**
- Lighthouse for frontend performance
- Artillery for API load testing
- React DevTools Profiler for component optimization

## Security Considerations

### Authentication Security
- Passwords hashed with bcrypt (salt rounds: 10)
- JWT tokens with 24-hour expiration
- HTTP-only cookies for token storage (optional)
- Secure token transmission in Authorization header

### Data Security
- All S3 buckets set to private
- Presigned URLs with 15-minute expiration
- SQL injection prevention via parameterized queries
- XSS prevention via React's built-in escaping
- CSRF protection via SameSite cookies

### Input Validation
- Zod schemas for all API inputs
- Email format validation
- Password strength requirements (min 8 chars)
- Numeric range validation for prices and quantities
- File type validation for uploads (images only)
- File size limits (5MB for hotel photos)

### API Security
- Rate limiting (100 requests per 15 minutes per IP)
- CORS configuration for allowed origins
- HTTPS enforcement in production
- Authorization checks on all protected endpoints
- Hotel ID verification to prevent cross-hotel data access

## Deployment Architecture

### Vercel Deployment
- Next.js app deployed to Vercel
- Automatic HTTPS
- Edge caching for static assets
- Serverless functions for API routes
- Environment variables for secrets

### Supabase Configuration
- PostgreSQL database on Supabase cloud
- Connection pooling enabled
- Automatic backups
- Row-level security policies

### AWS S3 Configuration
- Separate buckets for hotel photos and invoices
- Bucket versioning enabled
- Lifecycle policies for old invoices (optional)
- CloudFront CDN for faster access (optional)

### Environment Variables
```
# Database
DATABASE_URL=postgresql://...

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_PHOTOS=hotel-photos-bucket
S3_BUCKET_INVOICES=hotel-invoices-bucket

# JWT
JWT_SECRET=...
JWT_EXPIRES_IN=24h

# Hugging Face
HUGGINGFACE_API_KEY=...
HUGGINGFACE_MODEL=facebook/bart-large-cnn

# App
NEXT_PUBLIC_APP_URL=https://...
NODE_ENV=production
```

## AI Billing Engine Implementation

### Hugging Face Integration

**Primary Approach:**
- Use Hugging Face Inference API with a text generation model
- Send structured prompt with order data
- Parse JSON response for invoice structure
- Timeout: 10 seconds
- Retry: 2 attempts

**Prompt Template:**
```
Generate a structured hotel invoice in JSON format with the following details:

Hotel: {hotelName}
Table: {tableNumber}
Date: {date}
Items: {itemsList}
GST: {gstPercentage}%
Service Charge: {serviceChargePercentage}%
Discount: {discountAmount}

Return only valid JSON with this structure:
{
  "invoiceNumber": "unique-id",
  "items": [...],
  "subtotal": number,
  "gst": { "percentage": number, "amount": number },
  "serviceCharge": { "percentage": number, "amount": number },
  "discount": number,
  "grandTotal": number
}
```

### Deterministic Fallback

**Implementation:**
```typescript
function generateInvoiceDeterministic(orderData) {
  const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const items = orderData.items.map(item => ({
    dishName: item.dishName,
    quantity: item.quantity,
    price: item.price,
    total: item.price * item.quantity
  }));
  
  const subtotal = items.reduce((sum, item) => item.total, 0);
  const discountedSubtotal = subtotal - orderData.discount;
  const gstAmount = discountedSubtotal * (orderData.gstPercentage / 100);
  const serviceChargeAmount = discountedSubtotal * (orderData.serviceChargePercentage / 100);
  const grandTotal = subtotal + gstAmount + serviceChargeAmount - orderData.discount;
  
  return {
    invoiceNumber,
    tableNumber: orderData.tableNumber,
    hotelName: orderData.hotelName,
    date: new Date().toISOString(),
    items,
    subtotal,
    gst: { percentage: orderData.gstPercentage, amount: gstAmount },
    serviceCharge: { percentage: orderData.serviceChargePercentage, amount: serviceChargeAmount },
    discount: orderData.discount,
    grandTotal
  };
}
```

## PDF Generation

### Puppeteer Implementation

**Approach:**
- Generate HTML invoice template
- Use Puppeteer to render HTML to PDF
- Upload PDF to S3
- Store S3 key in database

**HTML Template:**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .invoice-details { margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .totals { margin-top: 20px; text-align: right; }
  </style>
</head>
<body>
  <div class="header">
    <h1>{hotelName}</h1>
    <p>Invoice: {invoiceNumber}</p>
  </div>
  <div class="invoice-details">
    <p>Table: {tableNumber}</p>
    <p>Date: {date}</p>
  </div>
  <table>
    <thead>
      <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
    </thead>
    <tbody>
      {itemRows}
    </tbody>
  </table>
  <div class="totals">
    <p>Subtotal: {subtotal}</p>
    <p>GST ({gstPercentage}%): {gstAmount}</p>
    <p>Service Charge ({serviceChargePercentage}%): {serviceChargeAmount}</p>
    <p>Discount: -{discount}</p>
    <h3>Grand Total: {grandTotal}</h3>
  </div>
</body>
</html>
```

## Performance Optimizations

### Frontend Optimizations
- React Query caching for menu items (stale time: 5 minutes)
- Lazy loading of invoice list with pagination
- Image optimization with Next.js Image component
- Code splitting for route-based chunks
- Debounced autocomplete input (300ms)
- Memoized calculation components

### Backend Optimizations
- Database connection pooling
- Indexed queries on frequently filtered columns
- Batch invoice retrieval for reports
- Presigned URL caching (5 minutes)
- Compressed API responses (gzip)

### S3 Optimizations
- Direct client-to-S3 uploads via presigned URLs
- Multipart uploads for large files
- CloudFront CDN for frequently accessed files (optional)
- Appropriate cache headers

## Mobile Responsiveness

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Mobile-Specific Adaptations
- Hamburger navigation menu
- Stacked form layouts
- Touch-friendly button sizes (min 44x44px)
- Simplified table views with horizontal scroll
- Bottom sheet modals for forms
- Swipe gestures for list actions
- Optimized image sizes for mobile bandwidth

### Tailwind Responsive Classes
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>

<button className="w-full md:w-auto px-4 py-2">
  {/* Full width on mobile, auto on desktop */}
</button>
```
