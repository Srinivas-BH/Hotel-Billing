/**
 * Unit Tests for Reports Export API Endpoint
 * Tests the /api/reports/export endpoint
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { NextRequest } from 'next/server';
import { POST as exportReport } from '../app/api/reports/export/route';
import * as auth from '../lib/auth';
import * as reports from '../lib/reports';
import * as csvExport from '../lib/csv-export';
import * as pdfReportTemplate from '../lib/pdf-report-template';
import * as pdfGenerator from '../lib/pdf-generator';
import * as s3 from '../lib/s3';
import * as db from '../lib/db';
import { S3Client } from '@aws-sdk/client-s3';

// Mock dependencies
jest.mock('../lib/auth');
jest.mock('../lib/reports');
jest.mock('../lib/csv-export');
jest.mock('../lib/pdf-report-template');
jest.mock('../lib/pdf-generator');
jest.mock('../lib/s3');
jest.mock('../lib/db');
jest.mock('@aws-sdk/client-s3');

const mockAuthenticateRequest = auth.authenticateRequest as jest.MockedFunction<typeof auth.authenticateRequest>;
const mockFilterInvoices = reports.filterInvoices as jest.MockedFunction<typeof reports.filterInvoices>;
const mockCalculateDailyRevenueRange = reports.calculateDailyRevenueRange as jest.MockedFunction<typeof reports.calculateDailyRevenueRange>;
const mockCalculateMonthlyRevenueRange = reports.calculateMonthlyRevenueRange as jest.MockedFunction<typeof reports.calculateMonthlyRevenueRange>;
const mockGenerateInvoiceCSV = csvExport.generateInvoiceCSV as jest.MockedFunction<typeof csvExport.generateInvoiceCSV>;
const mockGenerateCSVFilename = csvExport.generateCSVFilename as jest.MockedFunction<typeof csvExport.generateCSVFilename>;
const mockGenerateReportHTML = pdfReportTemplate.generateReportHTML as jest.MockedFunction<typeof pdfReportTemplate.generateReportHTML>;
const mockGenerateReportFilename = pdfReportTemplate.generateReportFilename as jest.MockedFunction<typeof pdfReportTemplate.generateReportFilename>;
const mockGenerateReportPDF = pdfGenerator.generateReportPDF as jest.MockedFunction<typeof pdfGenerator.generateReportPDF>;
const mockGetInvoicesBucket = s3.getInvoicesBucket as jest.MockedFunction<typeof s3.getInvoicesBucket>;
const mockGenerateFileKey = s3.generateFileKey as jest.MockedFunction<typeof s3.generateFileKey>;
const mockGetS3Client = s3.getS3Client as jest.MockedFunction<typeof s3.getS3Client>;
const mockGeneratePresignedDownloadUrl = s3.generatePresignedDownloadUrl as jest.MockedFunction<typeof s3.generatePresignedDownloadUrl>;
const mockQuery = db.query as jest.MockedFunction<typeof db.query>;

describe('POST /api/reports/export', () => {
  const mockInvoices = [
    {
      id: 'inv-1',
      hotelId: 'test-user-id',
      invoiceNumber: 'INV-001',
      tableNumber: 5,
      subtotal: 100,
      gstPercentage: 18,
      gstAmount: 18,
      serviceChargePercentage: 10,
      serviceChargeAmount: 10,
      discountAmount: 0,
      grandTotal: 128,
      invoiceJson: {},
      pdfKey: 'invoices/inv-1.pdf',
      items: [],
      createdAt: new Date('2024-01-15'),
    },
    {
      id: 'inv-2',
      hotelId: 'test-user-id',
      invoiceNumber: 'INV-002',
      tableNumber: 3,
      subtotal: 200,
      gstPercentage: 18,
      gstAmount: 36,
      serviceChargePercentage: 10,
      serviceChargeAmount: 20,
      discountAmount: 10,
      grandTotal: 246,
      invoiceJson: {},
      pdfKey: 'invoices/inv-2.pdf',
      items: [],
      createdAt: new Date('2024-01-16'),
    },
  ];

  const mockS3Client = {
    send: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup common mocks
    mockAuthenticateRequest.mockReturnValue({
      userId: 'test-user-id',
      email: 'test@example.com',
    });

    mockQuery.mockResolvedValue({
      rows: [{ hotel_name: 'Test Hotel' }],
      command: 'SELECT',
      rowCount: 1,
      oid: 0,
      fields: [],
    });

    mockGetInvoicesBucket.mockReturnValue('test-invoices-bucket');
    mockGetS3Client.mockReturnValue(mockS3Client as any);
    mockS3Client.send.mockResolvedValue({});
  });

  describe('CSV Export', () => {
    it('should export invoices as CSV successfully', async () => {
      mockFilterInvoices.mockResolvedValue({
        invoices: mockInvoices,
        total: 2,
      });

      mockGenerateInvoiceCSV.mockReturnValue('Invoice Date,Invoice ID,Table Number,Grand Total\n2024-01-15,INV-001,5,128.00');
      mockGenerateCSVFilename.mockReturnValue('invoices_2024-01-01_to_2024-01-31_2024-01-20.csv');
      mockGenerateFileKey.mockReturnValue('exports/123456-abc-invoices.csv');
      mockGeneratePresignedDownloadUrl.mockResolvedValue('https://s3.example.com/download-url');

      const request = new NextRequest(
        'http://localhost:3000/api/reports/export',
        {
          method: 'POST',
          headers: {
            authorization: 'Bearer test-token',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            format: 'csv',
            startDate: '2024-01-01',
            endDate: '2024-01-31',
          }),
        }
      );

      const response = await exportReport(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.downloadUrl).toBe('https://s3.example.com/download-url');
      expect(data.format).toBe('csv');
      expect(data.recordCount).toBe(2);
      expect(data.filename).toBe('invoices_2024-01-01_to_2024-01-31_2024-01-20.csv');

      expect(mockFilterInvoices).toHaveBeenCalledWith('test-user-id', {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        tableNumber: undefined,
        invoiceId: undefined,
        page: 1,
        limit: 10000,
      });

      expect(mockGenerateInvoiceCSV).toHaveBeenCalledWith(mockInvoices);
      expect(mockS3Client.send).toHaveBeenCalled();
      expect(mockGeneratePresignedDownloadUrl).toHaveBeenCalledWith(
        'test-invoices-bucket',
        'exports/123456-abc-invoices.csv'
      );
    });

    it('should export CSV with table number filter', async () => {
      mockFilterInvoices.mockResolvedValue({
        invoices: [mockInvoices[0]],
        total: 1,
      });

      mockGenerateInvoiceCSV.mockReturnValue('Invoice Date,Invoice ID,Table Number,Grand Total\n2024-01-15,INV-001,5,128.00');
      mockGenerateCSVFilename.mockReturnValue('invoices_export_2024-01-20.csv');
      mockGenerateFileKey.mockReturnValue('exports/123456-abc-invoices.csv');
      mockGeneratePresignedDownloadUrl.mockResolvedValue('https://s3.example.com/download-url');

      const request = new NextRequest(
        'http://localhost:3000/api/reports/export',
        {
          method: 'POST',
          headers: {
            authorization: 'Bearer test-token',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            format: 'csv',
            tableNumber: 5,
          }),
        }
      );

      const response = await exportReport(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recordCount).toBe(1);
      expect(mockFilterInvoices).toHaveBeenCalledWith('test-user-id', {
        startDate: undefined,
        endDate: undefined,
        tableNumber: 5,
        invoiceId: undefined,
        page: 1,
        limit: 10000,
      });
    });
  });

  describe('PDF Export', () => {
    it('should export daily report as PDF successfully', async () => {
      mockFilterInvoices.mockResolvedValue({
        invoices: mockInvoices,
        total: 2,
      });

      mockCalculateDailyRevenueRange.mockResolvedValue([
        { date: '2024-01-15', invoiceCount: 1, totalRevenue: 128 },
        { date: '2024-01-16', invoiceCount: 1, totalRevenue: 246 },
      ]);

      mockGenerateReportHTML.mockReturnValue('<html>Report HTML</html>');
      mockGenerateReportPDF.mockResolvedValue(Buffer.from('PDF content'));
      mockGenerateReportFilename.mockReturnValue('daily_report_2024-01-01_to_2024-01-31_2024-01-20.pdf');
      mockGenerateFileKey.mockReturnValue('exports/123456-abc-report.pdf');
      mockGeneratePresignedDownloadUrl.mockResolvedValue('https://s3.example.com/download-url');

      const request = new NextRequest(
        'http://localhost:3000/api/reports/export',
        {
          method: 'POST',
          headers: {
            authorization: 'Bearer test-token',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            format: 'pdf',
            reportType: 'daily',
            startDate: '2024-01-01',
            endDate: '2024-01-31',
          }),
        }
      );

      const response = await exportReport(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.downloadUrl).toBe('https://s3.example.com/download-url');
      expect(data.format).toBe('pdf');
      expect(data.recordCount).toBe(2);
      expect(data.totalRevenue).toBe(374); // 128 + 246

      expect(mockCalculateDailyRevenueRange).toHaveBeenCalledWith(
        'test-user-id',
        '2024-01-01',
        '2024-01-31'
      );

      expect(mockGenerateReportHTML).toHaveBeenCalledWith(
        expect.objectContaining({
          hotelName: 'Test Hotel',
          reportType: 'daily',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          totalRevenue: 374,
          totalInvoices: 2,
        })
      );

      expect(mockGenerateReportPDF).toHaveBeenCalledWith('<html>Report HTML</html>');
      expect(mockS3Client.send).toHaveBeenCalled();
    });

    it('should export monthly report as PDF successfully', async () => {
      mockFilterInvoices.mockResolvedValue({
        invoices: mockInvoices,
        total: 2,
      });

      mockCalculateMonthlyRevenueRange.mockResolvedValue([
        { month: '2024-01', year: 2024, invoiceCount: 2, totalRevenue: 374 },
      ]);

      mockGenerateReportHTML.mockReturnValue('<html>Report HTML</html>');
      mockGenerateReportPDF.mockResolvedValue(Buffer.from('PDF content'));
      mockGenerateReportFilename.mockReturnValue('monthly_report_2024-01-01_to_2024-01-31_2024-01-20.pdf');
      mockGenerateFileKey.mockReturnValue('exports/123456-abc-report.pdf');
      mockGeneratePresignedDownloadUrl.mockResolvedValue('https://s3.example.com/download-url');

      const request = new NextRequest(
        'http://localhost:3000/api/reports/export',
        {
          method: 'POST',
          headers: {
            authorization: 'Bearer test-token',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            format: 'pdf',
            reportType: 'monthly',
            startDate: '2024-01-01',
            endDate: '2024-01-31',
          }),
        }
      );

      const response = await exportReport(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.format).toBe('pdf');
      expect(mockCalculateMonthlyRevenueRange).toHaveBeenCalledWith(
        'test-user-id',
        '2024-01-01',
        '2024-01-31'
      );
    });
  });

  describe('Validation', () => {
    it('should return 401 for unauthenticated requests', async () => {
      mockAuthenticateRequest.mockReturnValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/reports/export',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            format: 'csv',
          }),
        }
      );

      const response = await exportReport(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 for invalid format', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/export',
        {
          method: 'POST',
          headers: {
            authorization: 'Bearer test-token',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            format: 'invalid',
          }),
        }
      );

      const response = await exportReport(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for invalid date format', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/export',
        {
          method: 'POST',
          headers: {
            authorization: 'Bearer test-token',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            format: 'csv',
            startDate: 'invalid-date',
          }),
        }
      );

      const response = await exportReport(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 when start date is after end date', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reports/export',
        {
          method: 'POST',
          headers: {
            authorization: 'Bearer test-token',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            format: 'csv',
            startDate: '2024-01-31',
            endDate: '2024-01-01',
          }),
        }
      );

      const response = await exportReport(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Start date must be before or equal to end date');
    });

    it('should return 404 when hotel is not found', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const request = new NextRequest(
        'http://localhost:3000/api/reports/export',
        {
          method: 'POST',
          headers: {
            authorization: 'Bearer test-token',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            format: 'csv',
          }),
        }
      );

      const response = await exportReport(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Hotel not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle S3 upload errors gracefully', async () => {
      mockFilterInvoices.mockResolvedValue({
        invoices: mockInvoices,
        total: 2,
      });

      mockGenerateInvoiceCSV.mockReturnValue('CSV content');
      mockGenerateCSVFilename.mockReturnValue('invoices.csv');
      mockGenerateFileKey.mockReturnValue('exports/invoices.csv');
      mockS3Client.send.mockRejectedValue(new Error('S3 upload failed'));

      const request = new NextRequest(
        'http://localhost:3000/api/reports/export',
        {
          method: 'POST',
          headers: {
            authorization: 'Bearer test-token',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            format: 'csv',
          }),
        }
      );

      const response = await exportReport(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Export failed');
      expect(data.message).toContain('S3 upload failed');
    });

    it('should handle PDF generation errors gracefully', async () => {
      mockFilterInvoices.mockResolvedValue({
        invoices: mockInvoices,
        total: 2,
      });

      mockCalculateDailyRevenueRange.mockResolvedValue([]);
      mockGenerateReportHTML.mockReturnValue('<html>Report</html>');
      mockGenerateReportPDF.mockRejectedValue(new Error('PDF generation failed'));

      const request = new NextRequest(
        'http://localhost:3000/api/reports/export',
        {
          method: 'POST',
          headers: {
            authorization: 'Bearer test-token',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            format: 'pdf',
            reportType: 'daily',
            startDate: '2024-01-01',
            endDate: '2024-01-31',
          }),
        }
      );

      const response = await exportReport(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Export failed');
      expect(data.message).toContain('PDF generation failed');
    });
  });
});
