/**
 * PDF report template generator
 * Creates formatted revenue summary reports with invoice details
 * Requirements: 10.2, 10.3
 */

import { Invoice, DailyReport, MonthlyReport } from '../types';

export interface ReportData {
  hotelName: string;
  reportType: 'daily' | 'monthly';
  startDate?: string;
  endDate?: string;
  dailyReports?: DailyReport[];
  monthlyReports?: MonthlyReport[];
  invoices: Invoice[];
  totalRevenue: number;
  totalInvoices: number;
}

/**
 * Generate HTML template for revenue report PDF
 * @param reportData - Report data including revenue summary and invoices
 * @returns HTML string for the report
 * Requirements: 10.2
 */
export function generateReportHTML(reportData: ReportData): string {
  const {
    hotelName,
    reportType,
    startDate,
    endDate,
    dailyReports = [],
    monthlyReports = [],
    invoices,
    totalRevenue,
    totalInvoices,
  } = reportData;

  const generatedDate = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const dateRangeText = startDate && endDate
    ? `${formatDate(startDate)} to ${formatDate(endDate)}`
    : startDate
    ? `From ${formatDate(startDate)}`
    : endDate
    ? `Until ${formatDate(endDate)}`
    : 'All Time';

  // Generate revenue summary rows
  const revenueSummaryRows = reportType === 'daily'
    ? dailyReports.map(report => `
        <tr>
          <td>${formatDate(report.date)}</td>
          <td style="text-align: center;">${report.invoiceCount}</td>
          <td style="text-align: right;">₹${report.totalRevenue.toFixed(2)}</td>
        </tr>
      `).join('')
    : monthlyReports.map(report => `
        <tr>
          <td>${report.month} (${report.year})</td>
          <td style="text-align: center;">${report.invoiceCount}</td>
          <td style="text-align: right;">₹${report.totalRevenue.toFixed(2)}</td>
        </tr>
      `).join('');

  // Generate invoice detail rows
  const invoiceRows = invoices.map(invoice => {
    const date = invoice.createdAt instanceof Date
      ? invoice.createdAt.toLocaleDateString('en-US')
      : new Date(invoice.createdAt).toLocaleDateString('en-US');
    
    return `
      <tr>
        <td>${date}</td>
        <td>${escapeHtml(invoice.invoiceNumber)}</td>
        <td style="text-align: center;">${invoice.tableNumber}</td>
        <td style="text-align: right;">₹${invoice.grandTotal.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Revenue Report - ${escapeHtml(hotelName)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 30px;
      background-color: #ffffff;
      color: #333;
      line-height: 1.6;
    }
    
    .report-container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
    }
    
    .header h1 {
      font-size: 28px;
      color: #2563eb;
      margin-bottom: 8px;
      font-weight: 700;
    }
    
    .header .report-title {
      font-size: 20px;
      color: #475569;
      font-weight: 600;
      margin-bottom: 5px;
    }
    
    .header .date-range {
      font-size: 14px;
      color: #64748b;
      margin-top: 8px;
    }
    
    .report-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      padding: 15px;
      background-color: #f8fafc;
      border-radius: 6px;
      border-left: 4px solid #2563eb;
    }
    
    .report-info .info-item {
      flex: 1;
    }
    
    .report-info .label {
      font-weight: 600;
      color: #475569;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    
    .report-info .value {
      font-size: 16px;
      color: #1e293b;
      font-weight: 600;
    }
    
    .section {
      margin-bottom: 40px;
    }
    
    .section-title {
      font-size: 18px;
      color: #1e293b;
      font-weight: 700;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 13px;
    }
    
    thead {
      background-color: #2563eb;
      color: white;
    }
    
    th {
      padding: 10px 8px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    tbody tr {
      border-bottom: 1px solid #e2e8f0;
    }
    
    tbody tr:nth-child(even) {
      background-color: #f8fafc;
    }
    
    td {
      padding: 10px 8px;
    }
    
    .summary-box {
      background-color: #f0f9ff;
      border: 2px solid #2563eb;
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 16px;
    }
    
    .summary-row.total {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 2px solid #2563eb;
      font-size: 18px;
    }
    
    .summary-row .label {
      color: #475569;
      font-weight: 600;
    }
    
    .summary-row .value {
      color: #1e293b;
      font-weight: 700;
    }
    
    .summary-row.total .label,
    .summary-row.total .value {
      color: #2563eb;
      font-weight: 700;
    }
    
    .footer {
      margin-top: 40px;
      text-align: center;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      color: #64748b;
      font-size: 12px;
    }
    
    .no-data {
      text-align: center;
      padding: 40px;
      color: #64748b;
      font-style: italic;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .report-container {
        padding: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="header">
      <h1>${escapeHtml(hotelName)}</h1>
      <div class="report-title">${reportType === 'daily' ? 'Daily' : 'Monthly'} Revenue Report</div>
      <div class="date-range">${dateRangeText}</div>
    </div>
    
    <div class="report-info">
      <div class="info-item">
        <div class="label">Report Generated</div>
        <div class="value">${generatedDate}</div>
      </div>
      <div class="info-item">
        <div class="label">Total Invoices</div>
        <div class="value">${totalInvoices}</div>
      </div>
      <div class="info-item">
        <div class="label">Total Revenue</div>
        <div class="value">₹${totalRevenue.toFixed(2)}</div>
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">Revenue Summary</h2>
      ${(dailyReports.length > 0 || monthlyReports.length > 0) ? `
        <table>
          <thead>
            <tr>
              <th>${reportType === 'daily' ? 'Date' : 'Month'}</th>
              <th style="text-align: center;">Invoice Count</th>
              <th style="text-align: right;">Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${revenueSummaryRows}
          </tbody>
        </table>
      ` : '<div class="no-data">No revenue data available for the selected period</div>'}
    </div>
    
    <div class="section">
      <h2 class="section-title">Invoice Details</h2>
      ${invoices.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Invoice ID</th>
              <th style="text-align: center;">Table</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceRows}
          </tbody>
        </table>
      ` : '<div class="no-data">No invoices found for the selected filters</div>'}
    </div>
    
    <div class="summary-box">
      <div class="summary-row">
        <span class="label">Total Invoices:</span>
        <span class="value">${totalInvoices}</span>
      </div>
      <div class="summary-row total">
        <span class="label">TOTAL REVENUE:</span>
        <span class="value">₹${totalRevenue.toFixed(2)}</span>
      </div>
    </div>
    
    <div class="footer">
      <p>This is a computer-generated report from ${escapeHtml(hotelName)}</p>
      <p>Generated on ${generatedDate}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Format date string for display
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Formatted date string
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Escape HTML special characters to prevent XSS
 * @param text - Text to escape
 * @returns Escaped text
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Generate a filename for the PDF report export
 * @param reportType - Type of report (daily or monthly)
 * @param startDate - Optional start date for the export
 * @param endDate - Optional end date for the export
 * @returns Filename string
 */
export function generateReportFilename(
  reportType: 'daily' | 'monthly',
  startDate?: string,
  endDate?: string
): string {
  const timestamp = new Date().toISOString().split('T')[0];
  
  if (startDate && endDate) {
    return `${reportType}_report_${startDate}_to_${endDate}_${timestamp}.pdf`;
  } else if (startDate) {
    return `${reportType}_report_from_${startDate}_${timestamp}.pdf`;
  } else if (endDate) {
    return `${reportType}_report_until_${endDate}_${timestamp}.pdf`;
  }
  
  return `${reportType}_report_${timestamp}.pdf`;
}
