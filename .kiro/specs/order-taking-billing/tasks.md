# Implementation Plan

- [x] 1. Database schema and migrations



  - Create orders table with optimistic locking fields
  - Add order_id column to invoices table
  - Create audit_logs table
  - Add indexes for performance
  - Create database migration scripts
  - _Requirements: 1.3, 1.4, 1.5, 6.1, 6.3, 9.1-9.5_



- [ ] 1.1 Write property test for order ID immutability
  - **Property 4: Order ID immutability**
  - **Validates: Requirements 1.5**

- [ ] 2. S3 service utilities
  - Implement presigned URL generation with configurable expiry
  - Create S3 path generation following /{admin_id}/invoices/{year}/{month}/ pattern
  - Add order JSON upload functionality
  - Add invoice JSON and PDF upload functionality
  - Implement retry logic with exponential backoff
  - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [ ] 2.1 Write property test for S3 path structure
  - **Property 10: S3 path structure compliance**
  - **Validates: Requirements 5.5**

- [ ] 2.2 Write property test for presigned URL expiry
  - **Property 11: Presigned URL expiry bounds**
  - **Validates: Requirements 5.3**

- [ ] 3. Order service layer
  - Implement createOrder with DB transaction and S3 backup
  - Implement updateOrder with optimistic locking (version check)
  - Implement getActiveOrder query by table number
  - Implement lockForBilling with lock expiry logic
  - Implement markBilled status transition
  - Add automatic lock cleanup for expired locks
  - _Requirements: 1.3, 1.5, 2.3, 6.1, 6.3, 6.4, 7.1_

- [ ] 3.1 Write property test for order persistence completeness
  - **Property 2: Order persistence completeness**
  - **Validates: Requirements 1.3, 5.1**

- [ ] 3.2 Write property test for lock state completeness
  - **Property 13: Lock state completeness**
  - **Validates: Requirements 6.1, 6.3**

- [ ] 4. Audit logging service
  - Create AuditLogService with log entry creation
  - Implement logging for Order Created action
  - Implement logging for Order Updated action
  - Implement logging for Invoice Generated action
  - Implement logging for Table Freed action
  - Add metadata capture for all log entries
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 4.1 Write property test for audit trail completeness
  - **Property 18: Audit trail completeness**
  - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

- [ ] 5. API endpoints for orders
  - Implement POST /api/orders endpoint
  - Implement PUT /api/orders/:order_id endpoint with version validation
  - Implement GET /api/orders?table=:table_number endpoint
  - Implement PATCH /api/orders/:order_id/status endpoint
  - Add error handling for version conflicts
  - Add error handling for duplicate open orders
  - _Requirements: 1.3, 1.5, 2.3, 6.2, 6.5_

- [ ] 5.1 Write integration tests for order API endpoints
  - Test order creation flow
  - Test order update with version conflict
  - Test duplicate open order prevention
  - _Requirements: 1.3, 1.5, 6.2_

- [ ] 6. Draft persistence service (client-side)
  - Implement localStorage-based draft save
  - Implement draft load with table number key
  - Implement draft merge logic
  - Implement draft clear on successful save
  - Add debouncing for auto-save
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.3_

- [ ] 6.1 Write property test for draft round-trip
  - **Property 5: Draft persistence round-trip**
  - **Validates: Requirements 2.1, 2.2, 2.4**

- [ ] 6.2 Write property test for draft merge
  - **Property 6: Draft merge preserves data**
  - **Validates: Requirements 2.3**

- [ ] 7. Order Taking page UI
  - Create /app/orders/page.tsx route
  - Implement table selector dropdown with validation
  - Implement menu search panel with autocomplete
  - Implement cart area with item list and quantity controls
  - Add Save Order, Cancel, and Hold buttons
  - Integrate draft persistence on changes
  - Add loading states and error handling
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [ ] 7.1 Write property test for menu price consistency
  - **Property 1: Menu price consistency**
  - **Validates: Requirements 1.2**

- [ ] 8. Dashboard table status updates
  - Update table status computation to check for OPEN orders
  - Add BUSY status styling (red background)
  - Display order timestamp and item count on BUSY tables
  - Update table click handler to pass order context
  - Add real-time status refresh
  - _Requirements: 1.4, 3.1, 3.2, 3.3, 3.4_

- [ ] 8.1 Write property test for table status reflection
  - **Property 3: Table status reflects order state**
  - **Validates: Requirements 1.4, 3.1, 7.2**

- [ ] 9. Billing service layer
  - Implement generateInvoice with order locking
  - Implement calculateTotals with 2-decimal rounding
  - Implement AI billing engine integration
  - Implement invoice save to DB with transaction
  - Implement invoice upload to S3 (JSON + PDF)
  - Implement order finalization (mark BILLED, free table)
  - Add concurrent billing prevention logic
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 6.1, 6.2, 6.4, 7.1, 7.2_

- [ ] 9.1 Write property test for decimal precision
  - **Property 8: Decimal precision in calculations**
  - **Validates: Requirements 4.3**

- [ ] 9.2 Write property test for invoice persistence
  - **Property 9: Invoice persistence completeness**
  - **Validates: Requirements 5.1, 5.2, 5.4**

- [ ] 9.3 Write property test for billing finalization
  - **Property 14: Billing finalizes order state**
  - **Validates: Requirements 6.4, 7.1, 7.2**

- [ ] 10. API endpoint for invoice generation
  - Implement POST /api/invoices/generate endpoint
  - Add order validation and locking
  - Add progress tracking for long operations
  - Return invoice JSON, HTML preview, and presigned URLs
  - Add error handling for lock conflicts
  - Add error handling for AI engine failures
  - _Requirements: 4.4, 4.5, 5.2, 6.1, 6.2_

- [ ] 10.1 Write integration test for concurrent billing prevention
  - Test two simultaneous billing attempts
  - Verify second attempt receives conflict error
  - **Validates: Requirements 6.2**

- [ ] 11. Billing modal/page updates
  - Update billing modal to accept order_id prop
  - Implement order preload when order_id provided
  - Lock unit prices from order (disable editing)
  - Add progress indicator during invoice generation
  - Display invoice preview with Print and Download buttons
  - Show success notification with invoice number and table status
  - Clear localStorage draft on success
  - _Requirements: 3.3, 4.1, 4.2, 7.3, 7.4, 10.1, 10.2, 10.3, 10.5_

- [ ] 11.1 Write property test for order preload completeness
  - **Property 7: Order preload completeness**
  - **Validates: Requirements 4.1, 4.2**

- [ ] 11.2 Write property test for draft cleanup
  - **Property 15: Draft cleanup after billing**
  - **Validates: Requirements 7.3**

- [ ] 12. Report service integration
  - Update report service to insert record on invoice creation
  - Ensure report record includes invoice_id, admin_id, date, amount, table_number
  - Update getDailyReport to aggregate from invoices
  - Update getMonthlyReport to aggregate from invoices
  - Add invoice-based aggregation queries
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 12.1 Write property test for report record completeness
  - **Property 16: Report record completeness**
  - **Validates: Requirements 8.1, 8.2**

- [ ] 12.2 Write property test for report aggregation accuracy
  - **Property 17: Report aggregation accuracy**
  - **Validates: Requirements 8.3, 8.4, 8.5**

- [ ] 13. Update existing billing flow for ad-hoc bills
  - Ensure FREE tables can still create ad-hoc bills
  - Maintain backward compatibility with existing billing
  - Add conditional logic for order-based vs ad-hoc billing
  - _Requirements: 3.4_

- [ ] 14. Environment configuration
  - Add S3_BUCKET_ORDERS environment variable
  - Add ORDER_LOCK_TIMEOUT_MINUTES configuration
  - Add PRESIGNED_URL_EXPIRY_SECONDS configuration
  - Update .env.example with new variables
  - Document configuration in README
  - _Requirements: 5.3, 6.1_

- [ ] 15. Error handling and user feedback
  - Implement error messages for all failure scenarios
  - Add toast notifications for success cases
  - Add loading spinners for async operations
  - Implement retry UI for recoverable errors
  - Add validation messages for form inputs
  - _Requirements: 10.1, 10.4, 10.5_

- [ ] 15.1 Write E2E tests for user feedback flows
  - Test progress indicator during billing
  - Test invoice preview display
  - Test success notification
  - Test error message display
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Integration testing
  - Test complete order-to-billing flow
  - Test draft persistence across page reloads
  - Test concurrent user scenarios
  - Test table status updates in real-time
  - Test report integration end-to-end
  - _Requirements: All_

- [ ] 17.1 Write E2E test for complete order workflow
  - Create order → verify BUSY → bill → verify FREE
  - Test draft recovery after navigation
  - _Requirements: 1.3, 1.4, 2.1, 2.2, 7.2_

- [ ] 18. Documentation and deployment
  - Update API documentation with new endpoints
  - Create database migration guide
  - Document order-taking workflow for users
  - Update deployment checklist
  - Add monitoring and alerting configuration
  - _Requirements: All_

- [ ] 19. Final checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.
