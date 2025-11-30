# Requirements Document

## Introduction

This specification extends the existing Hotel Billing Management system to add a dedicated Order Taking workflow and update the billing behavior so that orders become the source of truth for bills. The system will allow staff to place and edit orders per table, manage table status based on order state, and generate bills from saved orders with proper S3 storage and reporting integration.

## Glossary

- **Order Management System**: The subsystem responsible for creating, updating, and tracking customer orders per table
- **Order**: A collection of menu items with quantities for a specific table, stored with status OPEN, BILLED, or CANCELLED
- **Table Status**: The current state of a table (FREE or BUSY) determined by whether an active order exists
- **Billing Flow**: The process of converting an order into a finalized invoice with payment details
- **Invoice**: A finalized bill document containing order details, pricing, taxes, and payment information
- **S3 Storage**: Amazon S3 cloud storage used for persisting order snapshots and invoice documents
- **Presigned URL**: A time-limited authenticated URL for secure S3 uploads without exposing credentials
- **Optimistic Locking**: A concurrency control mechanism using version numbers to prevent conflicting updates
- **Admin**: An authenticated staff member with permissions to create orders and generate bills

## Requirements

### Requirement 1

**User Story:** As a restaurant staff member, I want to create and edit orders for tables, so that I can accurately track what customers have ordered before generating their bill.

#### Acceptance Criteria

1. WHEN a staff member accesses the order taking page THEN the Order Management System SHALL display a table selector and menu panel with search functionality
2. WHEN a staff member selects a menu item THEN the Order Management System SHALL auto-fill the unit price from the menu database
3. WHEN a staff member saves an order THEN the Order Management System SHALL create an order record with status OPEN and store the order JSON to S3
4. WHEN an order is saved for a table THEN the Order Management System SHALL mark the table status as BUSY
5. WHEN a staff member edits an existing order THEN the Order Management System SHALL update the same order record and preserve the order_id

### Requirement 2

**User Story:** As a restaurant staff member, I want the system to prevent me from losing order data, so that I can navigate away and return without losing my work.

#### Acceptance Criteria

1. WHEN a staff member navigates away from an unsaved order THEN the Order Management System SHALL persist the draft order to local storage
2. WHEN a staff member returns to the order page THEN the Order Management System SHALL restore the draft order from local storage
3. WHEN a staff member saves a restored draft THEN the Order Management System SHALL merge the draft with any existing order data
4. WHEN an order is successfully saved THEN the Order Management System SHALL clear the local draft storage

### Requirement 3

**User Story:** As a restaurant staff member, I want to see which tables have active orders, so that I can prioritize billing and table management.

#### Acceptance Criteria

1. WHEN the dashboard displays tables THEN the Order Management System SHALL show BUSY status in red for tables with OPEN orders
2. WHEN a table has an active order THEN the Order Management System SHALL display the order timestamp and item count on the table tile
3. WHEN a staff member clicks a BUSY table THEN the Order Management System SHALL open the billing flow with the order preloaded
4. WHEN a table has no active order THEN the Order Management System SHALL display FREE status and allow ad-hoc billing

### Requirement 4

**User Story:** As a restaurant staff member, I want to generate bills from saved orders, so that I can finalize customer payments accurately.

#### Acceptance Criteria

1. WHEN a staff member initiates billing for a BUSY table THEN the Order Management System SHALL fetch the active order and preload the cart
2. WHEN billing is calculated THEN the Order Management System SHALL use unit prices from the saved order
3. WHEN a staff member applies GST or service charges THEN the Order Management System SHALL calculate totals with values rounded to 2 decimals
4. WHEN a bill is generated THEN the Order Management System SHALL call the AI billing engine with the menu snapshot and order data
5. WHEN the AI returns invoice data THEN the Order Management System SHALL receive invoice JSON and printable HTML

### Requirement 5

**User Story:** As a restaurant staff member, I want bills to be stored securely and permanently, so that I can retrieve them for auditing and customer service.

#### Acceptance Criteria

1. WHEN an invoice is generated THEN the Order Management System SHALL save the invoice JSON to the database
2. WHEN an invoice is generated THEN the Order Management System SHALL upload invoice JSON and PDF to S3 using presigned URLs
3. WHEN S3 uploads are initiated THEN the Order Management System SHALL use presigned URLs with short expiry times
4. WHEN an invoice is saved THEN the Order Management System SHALL store the S3 file paths in the invoice record
5. WHERE S3 storage is configured THEN the Order Management System SHALL organize files under /{admin_id}/invoices/{year}/{month}/{invoice_id}

### Requirement 6

**User Story:** As a restaurant staff member, I want the system to prevent double-billing, so that customers are not charged twice for the same order.

#### Acceptance Criteria

1. WHEN billing is initiated for an order THEN the Order Management System SHALL lock the order record using optimistic locking
2. IF a second user attempts to bill the same order THEN the Order Management System SHALL return a conflict error with a readable message
3. WHEN an order is locked for billing THEN the Order Management System SHALL set locked_by and lock_expires_at fields
4. WHEN billing completes successfully THEN the Order Management System SHALL mark the order status as BILLED
5. WHEN an order is marked BILLED THEN the Order Management System SHALL prevent further billing attempts for that order

### Requirement 7

**User Story:** As a restaurant staff member, I want tables to be automatically freed after billing, so that I can seat new customers without manual intervention.

#### Acceptance Criteria

1. WHEN an invoice is successfully generated THEN the Order Management System SHALL mark the order status as BILLED
2. WHEN an order is marked BILLED THEN the Order Management System SHALL mark the associated table as FREE
3. WHEN a table is freed THEN the Order Management System SHALL clear any local draft data for that table
4. WHEN billing completes THEN the Order Management System SHALL display a notification showing the invoice number and freed table
5. WHEN a table is freed THEN the Order Management System SHALL update the dashboard to reflect FREE status immediately

### Requirement 8

**User Story:** As a restaurant manager, I want invoices to automatically appear in daily and monthly reports, so that I can track revenue without manual data entry.

#### Acceptance Criteria

1. WHEN an invoice is created THEN the Order Management System SHALL insert a record into the Reports table
2. WHEN a report record is created THEN the Order Management System SHALL include invoice_id, admin_id, date, amount, and table_number
3. WHEN daily reports are requested THEN the Order Management System SHALL aggregate invoice amounts by date
4. WHEN monthly reports are requested THEN the Order Management System SHALL aggregate invoice amounts by year and month
5. WHEN report endpoints are called THEN the Order Management System SHALL compute totals from invoice records as the source of truth

### Requirement 9

**User Story:** As a system administrator, I want all order and billing state changes to be audited, so that I can investigate issues and maintain accountability.

#### Acceptance Criteria

1. WHEN an order is created THEN the Order Management System SHALL create an audit log entry with action "Order Created"
2. WHEN an order is updated THEN the Order Management System SHALL create an audit log entry with action "Order Updated"
3. WHEN an invoice is generated THEN the Order Management System SHALL create an audit log entry with action "Invoice Generated"
4. WHEN a table is freed THEN the Order Management System SHALL create an audit log entry with action "Table Freed"
5. WHEN audit entries are created THEN the Order Management System SHALL include timestamp, admin_id, order_id, and relevant metadata

### Requirement 10

**User Story:** As a restaurant staff member, I want real-time feedback during billing, so that I know the system is processing my request and can preview the result.

#### Acceptance Criteria

1. WHEN billing generation starts THEN the Order Management System SHALL display a progress indicator
2. WHEN invoice generation completes THEN the Order Management System SHALL display an invoice preview
3. WHEN the invoice preview is shown THEN the Order Management System SHALL provide Print and Download PDF buttons
4. WHEN billing fails THEN the Order Management System SHALL display a clear error message with recovery options
5. WHEN billing succeeds THEN the Order Management System SHALL display a toast notification with the invoice number and table status
