/**
 * Revenue calculation and reporting utilities for the Hotel Billing Management Admin Portal
 * Implements daily/monthly revenue aggregation and date range filtering
 */

import { query } from './db';
import { DailyReport, MonthlyReport, Invoice } from '../types';

/**
 * Calculate daily revenue by aggregating all invoices for a specific date
 * @param hotelId - The hotel ID to filter invoices
 * @param date - The date to calculate revenue for (YYYY-MM-DD format)
 * @returns Daily report with invoice count and total revenue
 * Requirements: 9.1
 */
export async function calculateDailyRevenue(
  hotelId: string,
  date: string
): Promise<DailyReport> {
  const result = await query<{ invoice_count: string; total_revenue: string }>(
    `SELECT 
      COUNT(*) as invoice_count,
      COALESCE(SUM(grand_total), 0) as total_revenue
    FROM invoices
    WHERE hotel_id = $1 
      AND DATE(created_at) = $2`,
    [hotelId, date]
  );

  const row = result.rows[0];
  
  return {
    date,
    invoiceCount: parseInt(row.invoice_count, 10),
    totalRevenue: parseFloat(row.total_revenue),
  };
}

/**
 * Calculate daily revenue for a date range
 * @param hotelId - The hotel ID to filter invoices
 * @param startDate - Start date (YYYY-MM-DD format)
 * @param endDate - End date (YYYY-MM-DD format)
 * @returns Array of daily reports
 * Requirements: 9.1, 9.4
 */
export async function calculateDailyRevenueRange(
  hotelId: string,
  startDate: string,
  endDate: string
): Promise<DailyReport[]> {
  const result = await query<{
    date: string;
    invoice_count: string;
    total_revenue: string;
  }>(
    `SELECT 
      DATE(created_at) as date,
      COUNT(*) as invoice_count,
      COALESCE(SUM(grand_total), 0) as total_revenue
    FROM invoices
    WHERE hotel_id = $1 
      AND DATE(created_at) >= $2 
      AND DATE(created_at) <= $3
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC`,
    [hotelId, startDate, endDate]
  );

  return result.rows.map((row) => ({
    date: row.date,
    invoiceCount: parseInt(row.invoice_count, 10),
    totalRevenue: parseFloat(row.total_revenue),
  }));
}

/**
 * Calculate monthly revenue by aggregating all invoices for a specific month
 * @param hotelId - The hotel ID to filter invoices
 * @param year - The year
 * @param month - The month (1-12)
 * @returns Monthly report with invoice count and total revenue
 * Requirements: 9.2
 */
export async function calculateMonthlyRevenue(
  hotelId: string,
  year: number,
  month: number
): Promise<MonthlyReport> {
  const result = await query<{ invoice_count: string; total_revenue: string }>(
    `SELECT 
      COUNT(*) as invoice_count,
      COALESCE(SUM(grand_total), 0) as total_revenue
    FROM invoices
    WHERE hotel_id = $1 
      AND EXTRACT(YEAR FROM created_at) = $2
      AND EXTRACT(MONTH FROM created_at) = $3`,
    [hotelId, year, month]
  );

  const row = result.rows[0];
  
  return {
    month: `${year}-${String(month).padStart(2, '0')}`,
    year,
    invoiceCount: parseInt(row.invoice_count, 10),
    totalRevenue: parseFloat(row.total_revenue),
  };
}

/**
 * Calculate monthly revenue for a date range
 * @param hotelId - The hotel ID to filter invoices
 * @param startDate - Start date (YYYY-MM-DD format)
 * @param endDate - End date (YYYY-MM-DD format)
 * @returns Array of monthly reports
 * Requirements: 9.2, 9.4
 */
export async function calculateMonthlyRevenueRange(
  hotelId: string,
  startDate: string,
  endDate: string
): Promise<MonthlyReport[]> {
  const result = await query<{
    year: number;
    month: number;
    invoice_count: string;
    total_revenue: string;
  }>(
    `SELECT 
      EXTRACT(YEAR FROM created_at)::integer as year,
      EXTRACT(MONTH FROM created_at)::integer as month,
      COUNT(*) as invoice_count,
      COALESCE(SUM(grand_total), 0) as total_revenue
    FROM invoices
    WHERE hotel_id = $1 
      AND DATE(created_at) >= $2 
      AND DATE(created_at) <= $3
    GROUP BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
    ORDER BY year ASC, month ASC`,
    [hotelId, startDate, endDate]
  );

  return result.rows.map((row) => ({
    month: `${row.year}-${String(row.month).padStart(2, '0')}`,
    year: row.year,
    invoiceCount: parseInt(row.invoice_count, 10),
    totalRevenue: parseFloat(row.total_revenue),
  }));
}

/**
 * Filter invoices by date range with optional table number and invoice ID filters
 * @param hotelId - The hotel ID to filter invoices
 * @param startDate - Start date (YYYY-MM-DD format, optional)
 * @param endDate - End date (YYYY-MM-DD format, optional)
 * @param tableNumber - Table number filter (optional)
 * @param invoiceId - Invoice ID filter (optional)
 * @param page - Page number for pagination (default 1)
 * @param limit - Number of items per page (default 50)
 * @returns Filtered invoices and total count
 * Requirements: 9.4, 8.4
 */
export async function filterInvoices(
  hotelId: string,
  options: {
    startDate?: string;
    endDate?: string;
    tableNumber?: number;
    invoiceId?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<{ invoices: Invoice[]; total: number }> {
  const {
    startDate,
    endDate,
    tableNumber,
    invoiceId,
    page = 1,
    limit = 50,
  } = options;

  // Build dynamic query
  const conditions: string[] = ['hotel_id = $1'];
  const params: any[] = [hotelId];
  let paramIndex = 2;

  if (startDate) {
    conditions.push(`DATE(created_at) >= $${paramIndex}`);
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    conditions.push(`DATE(created_at) <= $${paramIndex}`);
    params.push(endDate);
    paramIndex++;
  }

  if (tableNumber !== undefined) {
    conditions.push(`table_number = $${paramIndex}`);
    params.push(tableNumber);
    paramIndex++;
  }

  if (invoiceId) {
    conditions.push(`invoice_number ILIKE $${paramIndex}`);
    params.push(`%${invoiceId}%`);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  // Get total count
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM invoices WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Get paginated invoices
  const offset = (page - 1) * limit;
  const invoicesResult = await query<any>(
    `SELECT 
      id, hotel_id, invoice_number, table_number,
      subtotal, gst_percentage, gst_amount,
      service_charge_percentage, service_charge_amount,
      discount_amount, grand_total, invoice_json,
      pdf_key, created_at
    FROM invoices 
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  const invoices: Invoice[] = invoicesResult.rows.map((row) => ({
    id: row.id,
    hotelId: row.hotel_id,
    invoiceNumber: row.invoice_number,
    tableNumber: row.table_number,
    subtotal: parseFloat(row.subtotal),
    gstPercentage: parseFloat(row.gst_percentage),
    gstAmount: parseFloat(row.gst_amount),
    serviceChargePercentage: parseFloat(row.service_charge_percentage),
    serviceChargeAmount: parseFloat(row.service_charge_amount),
    discountAmount: parseFloat(row.discount_amount),
    grandTotal: parseFloat(row.grand_total),
    invoiceJson: row.invoice_json,
    pdfKey: row.pdf_key,
    items: [], // Items not loaded in list view
    createdAt: new Date(row.created_at),
  }));

  return { invoices, total };
}
