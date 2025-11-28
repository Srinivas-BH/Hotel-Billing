/**
 * CSV export utilities for invoice data
 * Generates CSV files with invoice date, ID, table number, and grand total
 * Requirements: 10.1, 10.3
 */

import { Invoice } from '../types';

/**
 * Convert an array of invoices to CSV format
 * @param invoices - Array of invoices to export
 * @returns CSV string with headers and data rows
 * Requirements: 10.1
 */
export function generateInvoiceCSV(invoices: Invoice[]): string {
  // CSV headers
  const headers = ['Invoice Date', 'Invoice ID', 'Table Number', 'Grand Total'];
  
  // Convert invoices to CSV rows
  const rows = invoices.map((invoice) => {
    // Format date as YYYY-MM-DD HH:MM:SS
    const date = invoice.createdAt instanceof Date 
      ? invoice.createdAt.toISOString().replace('T', ' ').substring(0, 19)
      : new Date(invoice.createdAt).toISOString().replace('T', ' ').substring(0, 19);
    
    // Escape fields that might contain commas or quotes
    const invoiceNumber = escapeCSVField(invoice.invoiceNumber);
    const tableNumber = invoice.tableNumber.toString();
    const grandTotal = invoice.grandTotal.toFixed(2);
    
    return [date, invoiceNumber, tableNumber, grandTotal];
  });
  
  // Combine headers and rows
  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ];
  
  return csvLines.join('\n');
}

/**
 * Escape a CSV field if it contains special characters
 * @param field - The field value to escape
 * @returns Escaped field value
 */
function escapeCSVField(field: string): string {
  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Generate a filename for the CSV export
 * @param startDate - Optional start date for the export
 * @param endDate - Optional end date for the export
 * @returns Filename string
 */
export function generateCSVFilename(startDate?: string, endDate?: string): string {
  const timestamp = new Date().toISOString().split('T')[0];
  
  if (startDate && endDate) {
    return `invoices_${startDate}_to_${endDate}_${timestamp}.csv`;
  } else if (startDate) {
    return `invoices_from_${startDate}_${timestamp}.csv`;
  } else if (endDate) {
    return `invoices_until_${endDate}_${timestamp}.csv`;
  }
  
  return `invoices_export_${timestamp}.csv`;
}
