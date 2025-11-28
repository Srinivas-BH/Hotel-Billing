/**
 * Unit tests for PDF report template generation
 * Tests the HTML generation for revenue reports
 */

import { generateReportHTML, generateReportFilename, ReportData } from '../lib/pdf-report-template';
import { Invoice, DailyReport, MonthlyReport } from '../types';

describe('PDF Report Template', () => {
  const mockInvoice: Invoice = {
    id: '123',
    hotelId: 'hotel-1',
    invoiceNumber: 'INV-001',
    tableNumber: 5,
    subtotal: 1000,
    gstPercentage: 18,
    gstAmount: 180,
    serviceChargePercentage: 10,
    serviceChargeAmount: 100,
    discountAmount: 50,
    grandTotal: 1230,
    invoiceJson: {
      invoiceNumber: 'INV-001',
      tableNumber: 5,
      hotelName: 'Test Hotel',
      date: '2024-01-15T10:00:00Z',
      items: [],
      subtotal: 1000,
      gst: { percentage: 18, amount: 180 },
      serviceCharge: { percentage: 10, amount: 100 },
      discount: 50,
      grandTotal: 1230,
    },
    pdfKey: 'invoices/inv-001.pdf',
    items: [],
    createdAt: new Date('2024-01-15T10:00:00Z'),
  };

  const mockDailyReport: DailyReport = {
    date: '2024-01-15',
    invoiceCount: 5,
    totalRevenue: 5000,
  };

  const mockMonthlyReport: MonthlyReport = {
    month: '2024-01',
    year: 2024,
    invoiceCount: 150,
    totalRevenue: 150000,
  };

  describe('generateReportHTML', () => {
    it('should generate HTML for daily report with revenue summary', () => {
      const reportData: ReportData = {
        hotelName: 'Test Hotel',
        reportType: 'daily',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dailyReports: [mockDailyReport],
        invoices: [mockInvoice],
        totalRevenue: 5000,
        totalInvoices: 5,
      };

      const html = generateReportHTML(reportData);

      expect(html).toContain('Test Hotel');
      expect(html).toContain('Daily Revenue Report');
      expect(html).toContain('Revenue Summary');
      expect(html).toContain('Invoice Details');
      expect(html).toContain('INV-001');
      expect(html).toContain('₹5000.00');
    });

    it('should generate HTML for monthly report with revenue summary', () => {
      const reportData: ReportData = {
        hotelName: 'Grand Hotel',
        reportType: 'monthly',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        monthlyReports: [mockMonthlyReport],
        invoices: [mockInvoice],
        totalRevenue: 150000,
        totalInvoices: 150,
      };

      const html = generateReportHTML(reportData);

      expect(html).toContain('Grand Hotel');
      expect(html).toContain('Monthly Revenue Report');
      expect(html).toContain('2024-01');
      expect(html).toContain('₹150000.00');
    });

    it('should handle empty invoice list', () => {
      const reportData: ReportData = {
        hotelName: 'Empty Hotel',
        reportType: 'daily',
        dailyReports: [],
        invoices: [],
        totalRevenue: 0,
        totalInvoices: 0,
      };

      const html = generateReportHTML(reportData);

      expect(html).toContain('Empty Hotel');
      expect(html).toContain('No invoices found');
      expect(html).toContain('₹0.00');
    });

    it('should escape HTML special characters in hotel name', () => {
      const reportData: ReportData = {
        hotelName: 'Test <Hotel> & "Suites"',
        reportType: 'daily',
        dailyReports: [],
        invoices: [],
        totalRevenue: 0,
        totalInvoices: 0,
      };

      const html = generateReportHTML(reportData);

      expect(html).toContain('&lt;Hotel&gt;');
      expect(html).toContain('&amp;');
      expect(html).toContain('&quot;Suites&quot;');
      expect(html).not.toContain('<Hotel>');
    });

    it('should include all invoice details', () => {
      const reportData: ReportData = {
        hotelName: 'Test Hotel',
        reportType: 'daily',
        dailyReports: [],
        invoices: [mockInvoice],
        totalRevenue: 1230,
        totalInvoices: 1,
      };

      const html = generateReportHTML(reportData);

      expect(html).toContain('INV-001');
      expect(html).toContain('5'); // table number
      expect(html).toContain('₹1230.00');
    });

    it('should format date range correctly', () => {
      const reportData: ReportData = {
        hotelName: 'Test Hotel',
        reportType: 'daily',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        dailyReports: [],
        invoices: [],
        totalRevenue: 0,
        totalInvoices: 0,
      };

      const html = generateReportHTML(reportData);

      expect(html).toContain('January 1, 2024');
      expect(html).toContain('January 31, 2024');
    });
  });

  describe('generateReportFilename', () => {
    it('should generate filename with date range', () => {
      const filename = generateReportFilename('daily', '2024-01-01', '2024-01-31');
      expect(filename).toMatch(/^daily_report_2024-01-01_to_2024-01-31_\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should generate filename with start date only', () => {
      const filename = generateReportFilename('monthly', '2024-01-01');
      expect(filename).toMatch(/^monthly_report_from_2024-01-01_\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should generate filename with end date only', () => {
      const filename = generateReportFilename('daily', undefined, '2024-01-31');
      expect(filename).toMatch(/^daily_report_until_2024-01-31_\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should generate filename without date range', () => {
      const filename = generateReportFilename('monthly');
      expect(filename).toMatch(/^monthly_report_\d{4}-\d{2}-\d{2}\.pdf$/);
    });
  });
});
