# PDF Report Export - Usage Example

This document demonstrates how to use the PDF report export functionality implemented in task 11.8.

## Overview

The PDF report export functionality allows generating formatted revenue reports with:
- Revenue summary (daily or monthly)
- Filtered invoice details
- Professional PDF formatting

## Files Created

1. `lib/pdf-report-template.ts` - HTML template generator for reports
2. `lib/pdf-generator.ts` - Updated with `generateReportPDF()` function
3. `__tests__/pdf-report-template-server.test.ts` - Unit tests

## Usage Example

```typescript
import { generateReportHTML, generateReportFilename, ReportData } from '@/lib/pdf-report-template';
import { generateReportPDF } from '@/lib/pdf-generator';
import { calculateDailyRevenueRange, filterInvoices } from '@/lib/reports';
import { uploadToS3 } from '@/lib/s3';

/**
 * Example: Generate and upload a daily revenue report PDF
 */
async function generateDailyReportPDF(
  hotelId: string,
  hotelName: string,
  startDate: string,
  endDate: string
): Promise<string> {
  // 1. Fetch revenue data
  const dailyReports = await calculateDailyRevenueRange(hotelId, startDate, endDate);
  
  // 2. Fetch filtered invoices
  const { invoices } = await filterInvoices(hotelId, {
    startDate,
    endDate,
    limit: 1000, // Get all invoices for the report
  });
  
  // 3. Calculate totals
  const totalRevenue = dailyReports.reduce((sum, report) => sum + report.totalRevenue, 0);
  const totalInvoices = dailyReports.reduce((sum, report) => sum + report.invoiceCount, 0);
  
  // 4. Prepare report data
  const reportData: ReportData = {
    hotelName,
    reportType: 'daily',
    startDate,
    endDate,
    dailyReports,
    invoices,
    totalRevenue,
    totalInvoices,
  };
  
  // 5. Generate HTML
  const reportHTML = generateReportHTML(reportData);
  
  // 6. Generate PDF
  const pdfBuffer = await generateReportPDF(reportHTML);
  
  // 7. Upload to S3
  const filename = generateReportFilename('daily', startDate, endDate);
  const s3Key = `reports/${hotelId}/${filename}`;
  await uploadToS3(pdfBuffer, s3Key, 'application/pdf');
  
  return s3Key;
}

/**
 * Example: Generate and upload a monthly revenue report PDF
 */
async function generateMonthlyReportPDF(
  hotelId: string,
  hotelName: string,
  startDate: string,
  endDate: string
): Promise<string> {
  // 1. Fetch revenue data
  const monthlyReports = await calculateMonthlyRevenueRange(hotelId, startDate, endDate);
  
  // 2. Fetch filtered invoices
  const { invoices } = await filterInvoices(hotelId, {
    startDate,
    endDate,
    limit: 1000,
  });
  
  // 3. Calculate totals
  const totalRevenue = monthlyReports.reduce((sum, report) => sum + report.totalRevenue, 0);
  const totalInvoices = monthlyReports.reduce((sum, report) => sum + report.invoiceCount, 0);
  
  // 4. Prepare report data
  const reportData: ReportData = {
    hotelName,
    reportType: 'monthly',
    startDate,
    endDate,
    monthlyReports,
    invoices,
    totalRevenue,
    totalInvoices,
  };
  
  // 5. Generate HTML
  const reportHTML = generateReportHTML(reportData);
  
  // 6. Generate PDF
  const pdfBuffer = await generateReportPDF(reportHTML);
  
  // 7. Upload to S3
  const filename = generateReportFilename('monthly', startDate, endDate);
  const s3Key = `reports/${hotelId}/${filename}`;
  await uploadToS3(pdfBuffer, s3Key, 'application/pdf');
  
  return s3Key;
}
```

## API Integration (Task 11.9)

The next task (11.9) will create the export API endpoint that uses this functionality:

```typescript
// POST /api/reports/export
// Body: { format: 'pdf', reportType: 'daily' | 'monthly', startDate, endDate, filters }
// Response: { downloadUrl: string }
```

## Features

### Revenue Summary
- Daily reports: Shows revenue by date
- Monthly reports: Shows revenue by month
- Includes invoice count and total revenue for each period

### Invoice Details
- Lists all invoices matching the filter criteria
- Shows: Date, Invoice ID, Table Number, Amount
- Formatted for easy reading

### Professional Formatting
- Clean, modern design
- Hotel branding (name displayed prominently)
- Print-optimized layout
- Responsive to different content sizes

### Security
- HTML escaping to prevent XSS
- Proper date formatting
- Currency formatting (₹)

## Requirements Satisfied

✅ **Requirement 10.2**: Generate PDF document containing formatted revenue summary and invoice details
✅ **Requirement 10.3**: Include all invoices matching the current filter criteria
