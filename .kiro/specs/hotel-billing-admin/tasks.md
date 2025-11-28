# Implementation Plan

- [x] 1. Set up project structure and dependencies






  - Initialize Next.js 14 project with TypeScript and App Router
  - Install core dependencies: React Query, Tailwind CSS, Zod, React Hook Form, Lucide React
  - Install backend dependencies: bcrypt, jsonwebtoken, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, puppeteer
  - Install testing dependencies: Jest, React Testing Library, fast-check, Playwright
  - Configure Tailwind CSS with mobile-first breakpoints
  - Set up environment variables structure (.env.example)
  - Create basic folder structure: app/, components/, lib/, types/, utils/
  - _Requirements: All requirements depend on proper project setup_

- [x] 2. Set up database schema and connection



  - [x] 2.1 Create Supabase project and configure connection


    - Set up Supabase PostgreSQL database
    - Configure connection string in environment variables
    - Create database client utility
    - _Requirements: All data persistence requirements_

  - [x] 2.2 Implement database schema


    - Create hotels table with all fields
    - Create menu_items table with foreign key to hotels
    - Create invoices table with foreign key to hotels
    - Create invoice_items table with foreign key to invoices
    - Add all necessary indexes for performance
    - _Requirements: 1.1, 3.1, 7.1_

  - [x] 2.3 Write property test for database schema integrity


    - **Property 3: Menu item CRUD maintains data integrity**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 3. Implement authentication system



  - [x] 3.1 Create password hashing utilities


    - Implement bcrypt hashing function with salt rounds 10
    - Implement password verification function
    - _Requirements: 1.4_

  - [x] 3.2 Write property test for password hashing


    - **Property 1: Password hashing is irreversible**
    - **Validates: Requirements 1.4**

  - [x] 3.3 Create JWT token utilities


    - Implement token generation with 24-hour expiration
    - Implement token verification and decoding
    - Create middleware for protected routes
    - _Requirements: 2.1, 2.4_

  - [x] 3.4 Write property test for session tokens


    - **Property 2: Session tokens are unique and valid**
    - **Validates: Requirements 2.1, 2.4**

  - [x] 3.5 Implement signup API endpoint


    - Create POST /api/auth/signup route
    - Validate email, password, hotel name, table count
    - Hash password before storage
    - Store hotel record in database
    - Generate and return JWT token
    - _Requirements: 1.1, 1.3, 1.4, 1.5_

  - [x] 3.6 Implement login API endpoint


    - Create POST /api/auth/login route
    - Verify credentials against database
    - Generate and return JWT token on success
    - Return error on invalid credentials
    - _Requirements: 2.1, 2.2_

  - [x] 3.7 Implement logout and session management APIs


    - Create POST /api/auth/logout route
    - Create GET /api/auth/me route for session validation
    - Implement token invalidation logic
    - _Requirements: 2.4, 2.5_

  - [x] 3.8 Write unit tests for authentication flows


    - Test signup with valid data
    - Test signup with invalid data
    - Test login with valid credentials
    - Test login with invalid credentials
    - Test token expiration
    - _Requirements: 1.3, 2.2_

- [x] 4. Implement S3 integration for file storage




  - [x] 4.1 Create S3 client and presigned URL utilities


    - Configure AWS SDK v3 S3 client
    - Implement presigned URL generation for uploads
    - Implement presigned URL generation for downloads
    - Set 15-minute expiration on all presigned URLs
    - _Requirements: 1.2, 7.3, 8.2, 13.3_

  - [x] 4.2 Write property test for presigned URL expiration


    - **Property 14: Presigned URL time-limited access**
    - **Validates: Requirements 8.2, 13.3**

  - [x] 4.3 Implement S3 presigned URL API endpoints


    - Create POST /api/s3/presigned-upload route
    - Create POST /api/s3/presigned-download route
    - Add authentication middleware
    - Validate file types and sizes
    - _Requirements: 1.2, 7.3, 8.2_

  - [x] 4.4 Configure S3 buckets with security settings


    - Set buckets to private access only
    - Configure CORS for client uploads
    - Set up bucket policies
    - _Requirements: 13.2_

  - [x] 4.5 Write unit tests for S3 operations


    - Test presigned URL generation
    - Test file type validation
    - Test bucket privacy settings
    - _Requirements: 13.2, 13.3_

- [x] 5. Implement menu management system







  - [x] 5.1 Create menu item data access layer




    - Implement create menu item function
    - Implement read menu items function
    - Implement update menu item function
    - Implement delete menu item function
    - Add hotel ID filtering for all operations
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [x] 5.2 Implement menu API endpoints


    - Create GET /api/menu route
    - Create POST /api/menu route
    - Create PUT /api/menu/:id route
    - Create DELETE /api/menu/:id route
    - Add authentication and authorization checks
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [x] 5.3 Write property test for menu CRUD operations


    - **Property 3: Menu item CRUD maintains data integrity**
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [x] 5.4 Implement input validation for menu items


    - Validate dish name is non-empty
    - Validate price is positive number
    - Return specific validation errors
    - _Requirements: 3.4_

  - [x] 5.5 Write property test for input validation


    - **Property 23: Input validation completeness**
    - **Validates: Requirements 13.4**

- [x] 6. Implement billing calculation engine



  - [x] 6.1 Create billing calculation utilities


    - Implement subtotal calculation function
    - Implement GST calculation function
    - Implement service charge calculation function
    - Implement discount application function
    - Implement grand total calculation function
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 6.2 Write property test for subtotal calculation


    - **Property 5: Bill calculation accuracy**
    - **Validates: Requirements 5.1**

  - [x] 6.3 Write property test for GST calculation


    - **Property 6: GST calculation correctness**
    - **Validates: Requirements 5.2**

  - [x] 6.4 Write property test for service charge calculation


    - **Property 7: Service charge calculation correctness**
    - **Validates: Requirements 5.3**

  - [x] 6.5 Write property test for discount application


    - **Property 8: Discount application order**
    - **Validates: Requirements 5.4**

  - [x] 6.6 Write property test for grand total calculation


    - **Property 9: Grand total calculation completeness**
    - **Validates: Requirements 5.5**

  - [x] 6.7 Validate order quantities


    - Implement positive integer validation for quantities
    - Return validation errors for invalid quantities
    - _Requirements: 4.3_

  - [x] 6.8 Write property test for quantity validation


    - **Property 4: Order quantities are positive integers**
    - **Validates: Requirements 4.3**
-

- [x] 7. Implement AI billing engine with fallback



  - [x] 7.1 Create Hugging Face API integration


    - Configure Hugging Face Inference API client
    - Implement prompt template for invoice generation
    - Add 10-second timeout and 2 retry attempts
    - Parse JSON response from AI model
    - _Requirements: 6.4_

  - [x] 7.2 Implement deterministic fallback algorithm

    - Create fallback invoice generation function
    - Generate unique invoice numbers
    - Structure invoice JSON with all required fields
    - _Requirements: 6.1, 6.3, 6.5_

  - [x] 7.3 Write property test for invoice JSON structure


    - **Property 10: Invoice JSON structure completeness**
    - **Validates: Requirements 6.1**

  - [x] 7.4 Write property test for invoice ID uniqueness


    - **Property 11: Invoice ID uniqueness**
    - **Validates: Requirements 6.3**

  - [x] 7.5 Implement invoice generation orchestration

    - Try Hugging Face API first
    - Fall back to deterministic on failure
    - Log fallback usage
    - Return structured invoice JSON
    - _Requirements: 6.4, 6.5, 14.5_

  - [x] 7.6 Write unit tests for AI fallback logic


    - Test successful AI generation
    - Test fallback on AI timeout
    - Test fallback on AI error
    - _Requirements: 6.5, 14.5_

- [x] 8. Implement PDF generation and storage



  - [x] 8.1 Create HTML invoice template


    - Design printable invoice HTML layout
    - Include all invoice fields
    - Add styling for professional appearance
    - _Requirements: 6.2_

  - [x] 8.2 Implement Puppeteer PDF generation


    - Configure Puppeteer for serverless environment
    - Render HTML template to PDF
    - Handle PDF generation errors
    - _Requirements: 7.2_

  - [x] 8.3 Implement invoice storage with atomicity


    - Store invoice JSON in database
    - Generate PDF from invoice data
    - Upload PDF to S3
    - Implement retry logic for failures
    - Ensure atomic success or rollback
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 8.4 Write property test for storage atomicity





    - **Property 12: Invoice storage atomicity**
    - **Validates: Requirements 7.1, 7.3**

  - [x] 8.5 Write property test for retrieval consistency



    - **Property 13: Invoice retrieval consistency**
    - **Validates: Requirements 8.1**

- [x] 9. Implement billing API endpoints




  - [x] 9.1 Create invoice generation API


    - Create POST /api/billing/generate route
    - Validate table number and order items
    - Calculate all billing amounts
    - Generate invoice via AI/fallback
    - Store invoice and PDF
    - Return invoice data and PDF URL
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 5.1-5.5, 6.1-6.3, 7.1-7.5_

  - [x] 9.2 Create invoice retrieval API


    - Create GET /api/billing/invoice/:id route
    - Fetch invoice from database
    - Generate presigned URL for PDF download
    - Add authorization checks
    - _Requirements: 8.1, 8.2, 8.4_

  - [x] 9.3 Write unit tests for billing APIs


    - Test invoice generation with valid data
    - Test invoice generation with invalid data
    - Test invoice retrieval
    - Test authorization checks
    - _Requirements: 4.3, 8.4_

- [x] 10. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement reports and analytics

  - [x] 11.1 Create revenue calculation utilities
    - Implement daily revenue aggregation function
    - Implement monthly revenue aggregation function
    - Add date range filtering logic
    - _Requirements: 9.1, 9.2, 9.4_

  - [x] 11.2 Write property test for daily revenue calculation
    - **Property 15: Daily revenue calculation accuracy**
    - **Validates: Requirements 9.1**

  - [x] 11.3 Write property test for monthly revenue calculation
    - **Property 16: Monthly revenue calculation accuracy**
    - **Validates: Requirements 9.2**

  - [x] 11.4 Write property test for date range filtering
    - **Property 17: Date range filtering correctness**
    - **Validates: Requirements 9.4**

  - [x] 11.5 Implement reports API endpoints
    - Create GET /api/reports/daily route
    - Create GET /api/reports/monthly route
    - Create GET /api/reports/invoices route with search/filter
    - Add pagination for invoice list
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 8.4_

  - [x] 11.6 Implement CSV export functionality
    - Create CSV generation utility
    - Include invoice date, ID, table number, grand total
    - Apply current filter criteria
    - _Requirements: 10.1, 10.3_

  - [x] 11.7 Write property test for CSV export completeness















    - **Property 18: CSV export data completeness**
    - **Validates: Requirements 10.1**

  - [x] 11.8 Implement PDF report export functionality




    - Create PDF report template
    - Generate formatted revenue summary
    - Include filtered invoice details
    - _Requirements: 10.2, 10.3_
-

  - [x] 11.9 Create export API endpoint




    - Create POST /api/reports/export route
    - Support CSV and PDF formats
    - Generate download URLs
    - Handle export errors
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 11.10 Write unit tests for reports and exports






    - Test daily report generation
    - Test monthly report generation
    - Test invoice search and filtering
    - Test CSV export
    - Test PDF export
    - _Requirements: 9.1, 9.2, 10.1, 10.2_

- [x] 12. Implement profile management



  - [x] 12.1 Create profile API endpoints

    - Create GET /api/profile route
    - Create PUT /api/profile route
    - Validate hotel name and table count
    - Handle photo upload via S3 presigned URL
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 12.2 Write property test for profile update validation





    - **Property 25: Profile update validation**
    - **Validates: Requirements 15.4**

  - [x] 12.3 Write unit tests for profile management





    - Test profile retrieval
    - Test profile update with valid data
    - Test profile update with invalid data
    - Test photo upload
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

- [x] 13. Implement frontend authentication components



  - [x] 13.1 Create authentication context and provider


    - Implement SessionProvider with React Context
    - Store JWT token in state
    - Provide login, logout, and user state
    - _Requirements: 1.5, 2.1, 2.4_

  - [x] 13.2 Create AuthGuard HOC


    - Protect authenticated routes
    - Redirect to login if not authenticated
    - Handle session expiration
    - _Requirements: 2.5_

  - [x] 13.3 Create login page with LoginForm component


    - Email and password inputs with validation
    - Submit handler calling login API
    - Display error messages
    - Redirect on success
    - _Requirements: 2.1, 2.2_

  - [x] 13.4 Create signup page with SignupForm component


    - Email, password, hotel name, table count inputs
    - Photo upload with S3 presigned URL
    - Form validation with Zod
    - Submit handler calling signup API
    - Display validation errors
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 13.5 Write unit tests for auth components





    - Test LoginForm rendering and submission
    - Test SignupForm rendering and submission
    - Test AuthGuard redirect behavior
    - _Requirements: 1.3, 2.2_

- [x] 14. Implement frontend menu management page


  - [x] 14.1 Create menu management page with MenuList component


    - Display all menu items in grid/list
    - Show dish name and price
    - Add edit and delete buttons
    - Handle delete confirmation
    - _Requirements: 3.5_

  - [x] 14.2 Create MenuItemForm component


    - Modal form for add/edit
    - Dish name and price inputs
    - Validation with Zod
    - Submit handler calling menu API
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 14.3 Implement menu autocomplete component


    - Create autocomplete input component
    - Case-insensitive substring matching
    - Display matching items in dropdown
    - Handle item selection
    - Cache menu data locally for 50+ items
    - Debounce input (300ms)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 14.4 Write property test for autocomplete matching





    - **Property 20: Menu autocomplete substring matching**
    - **Validates: Requirements 12.2**

  - [x] 14.5 Write unit tests for menu components





    - Test MenuList rendering
    - Test MenuItemForm validation
    - Test autocomplete filtering
    - _Requirements: 3.4, 12.2_

- [x] 15. Implement frontend billing page



  - [x] 15.1 Create billing workflow page with integrated components


    - Implement TableSelector for table selection
    - Implement OrderEntry with menu autocomplete
    - Implement BillCalculator with real-time calculations
    - Add generate invoice button
    - Handle errors gracefully
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 15.2 Create InvoicePreview component and modal


    - Display formatted invoice with all details
    - Show itemized list
    - Show all calculations
    - Print button
    - Download PDF button
    - _Requirements: 6.2, 8.3_

  - [x] 15.3 Write unit tests for billing components




    - Test TableSelector validation
    - Test OrderEntry item management
    - Test BillCalculator real-time updates
    - Test InvoicePreview rendering
    - _Requirements: 4.3, 5.1_

- [x] 16. Implement frontend reports page




  - [x] 16.1 Create reports page with integrated components


    - Implement InvoiceSearch with date range, table number, and invoice ID filters
    - Implement InvoiceTable with pagination
    - Display date, invoice ID, table, total
    - Add view/download buttons for each invoice
    - Fetch data with React Query
    - Handle loading and error states
    - _Requirements: 8.1, 8.2, 8.4, 9.3_

  - [x] 16.2 Create RevenueChart component


    - Visual chart for daily/monthly revenue
    - Toggle between daily and monthly views
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 16.3 Create ReportExport component


    - Export to CSV button
    - Export to PDF button
    - Apply current filters to export
    - Handle download
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 16.4 Write unit tests for reports components





    - Test InvoiceSearch filter application
    - Test InvoiceTable pagination
    - Test ReportExport button clicks
    - _Requirements: 8.4, 10.3_
- [x] 17. Implement frontend profile page



  - [x] 17.1 Create profile page with ProfileForm


    - Hotel name input
    - Table count input
    - Photo upload with S3 presigned URL
    - Save button
    - Display current profile data
    - Handle form submission
    - Show success/error messages
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_
-

  - [x] 17.2 Write unit tests for profile components









    - Test ProfileForm rendering
    - Test profile update submission
    - Test validation errors
    - _Requirements: 15.4_rs
    - _Requirements: 15.4_
 

- [x] 18. Implement responsive design and mobile optimization












  - [x] 18.1 Implement responsive layouts across all pages


    - Mobile-first grid layouts
    - Responsive navigation (hamburger menu)
    - Touch-friendly button sizes (min 44x44px)
    - Stacked form layouts on mobile
    - Use Next.js Image component for images
    - Responsive image sizing
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 18.2 Write property test for responsive breakpoints




    - **Property 19: Responsive layout breakpoints**
    - **Validates: Requirements 11.3**

  - [x] 18.3 Optimize performance for mobile



    - Code splitting
    - Lazy loading
    - Ensure load times under 3 seconds
    - _Requirements: 11.5_



- [ ] 19. Implement security measures






  - [x] 19.1 Enforce HTTPS in production


    - Configure Next.js for HTTPS only
    - Redirect HTTP to HTTPS
    - _Requirements: 2.3, 13.1_

  - [x] 19.2 Write property test for HTTPS enforcement


    - **Property 21: HTTPS enforcement**
    - **Validates: Requirements 13.1**

  - [x] 19.3 Write property test for S3 bucket privacy


    - **Property 22: S3 bucket privacy**
    - **Validates: Requirements 13.2**



  - [x] 19.4 Implement input sanitization


    - Validate all form inputs with Zod
    - Sanitize user inputs before processing
    - Use parameterized database queries


    - _Requirements: 13.4_

  - [x] 19.5 Implement rate limiting


    - Add rate limiting middleware (100 requests per 15 minutes)
    - Apply to all API routes
    - _Requirements: Security best practices_

  - [x] 19.6 Configure secure token transmission


    - Store tokens in Authorization headers
    - Set secure cookie options if using cookies
    - _Requirements: 13.5_

  - [-] 19.7 Write unit tests for security measures














    - Test input validation
    - Test rate limiting
    - Test authorization checks
    - _Requirements: 13.4_

- [x] 20. Implement error handling






  - [x] 20.1 Create error handling utilities




    - Structured error response format
    - Error logging utility
    - User-friendly error messages
    - _Requirements: 14.1, 14.3_

  - [x] 20.2 Write property test for error messages


    - **Property 24: Error message user-friendliness**
    - **Validates: Requirements 14.1, 14.3**

  - [x] 20.2 Implement frontend error handling


    - Toast notifications for errors
    - Inline validation errors on forms
    - Retry buttons for failed operations
    - Graceful degradation
    - _Requirements: 14.1, 14.2, 14.4_

  - [x] 20.3 Implement backend error handling


    - Try-catch blocks for all async operations
    - Automatic retry for transient failures
    - Transaction rollback on database errors
    - _Requirements: 7.5, 14.4_

  - [x] 20.4 Write unit tests for error handling


    - Test validation error display
    - Test network error handling
    - Test retry logic
    - _Requirements: 14.1, 14.2, 14.4_

- [ ] 21. Final checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.
-

- [x] 22. Create deployment configuration




  - [x] 22.1 Configure environment variables

    - Create .env.example file
    - Document all required variables
    - Set up Vercel environment variables
    - _Requirements: All requirements depend on proper configuration_


  - [x] 22.2 Configure Vercel deployment

    - Set up vercel.json configuration
    - Configure build settings
    - Set up automatic deployments
    - _Requirements: Deployment requirements_


  - [x] 22.3 Configure Supabase production database

    - Set up production database
    - Run migrations
    - Configure connection pooling
    - _Requirements: All data persistence requirements_


  - [x] 22.4 Configure AWS S3 production buckets

    - Create production S3 buckets
    - Set bucket policies
    - Configure CORS
    - _Requirements: 1.2, 7.3, 13.2_



  - [x] 22.5 Write deployment documentation


    - Document deployment process
    - Document environment setup
    - Document troubleshooting steps
    - _Requirements: All requirements_