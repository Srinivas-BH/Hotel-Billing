/**
 * Unit Tests for Reports API Endpoints
 * Tests the /api/reports/* endpoints
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 8.4
 */

import { NextRequest } from 'next/server';
import { GET as getDailyReports } from '../app/api/reports/daily/route';
import { GET as getMonthlyReports } from '../app/api/reports/monthly/route';
import { GET as getInvoices } from '../app/api/reports/invoices/route';
import * as auth from '../lib/auth';
import * as reports from '../lib/reports';
import * as s3 from '../lib/s3';

// Mock dependencies
jest.mock('../lib/auth');
jest.mock('../lib/reports');
jest.mock('../lib/s3');

const mockAuthenticateRequest = auth.authenticateRequest as jest.MockedFunction<typeof auth.authenticateRequest>;
const mockCalculateDailyRevenueRange = reports.calculateDailyRevenueRange as jest.MockedFunction<typeof reports.calculateDailyRevenueRange>;
const mockCalculateMonthlyRevenueRange = reports.calculateMonthlyRevenueRange as jest.MockedFunction<typeof reports.calculateMonthlyRevenueRange>;
const mockFilterInvoices = reports.filterInvoices as jest.MockedFunction<typeof reports.filterInvoices>;
const mockGeneratePresignedDownloadUrl = s3.generatePresignedDownloadUrl as jest.MockedFunction<typeof s3.generatePresignedDownloadUrl>;
const mockGetInvoicesBucket = s3.getInvoicesBucket as jest.MockedFunction<typeof s3.getInvoicesBucket>;

describe('Reports API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/reports/daily', () => {
    it('should return daily reports for authenticated user', async () => {
      // Mock authentication
      mockAuthenticateRequest.mockReturnValue({
        userId: 'test-user-id',
        email: 'test@example.com',
      });

      // Mock daily revenue calculation
      mockCalculateDailyRevenueRange.mockResolvedValue([
        { date: '2024-01-01', invoiceCount: 5, totalRevenue: 1500.50 },
        { date: '2024-01-02', invoiceCount: 3, totalRevenue: 890.25 },
      ]);

      // Create request
      const request = new NextRequest(
        'http://localhost:3000/api/reports/daily?startDate=2024-01-01&endDate=2024-01-02',
        {
          headers: {
            authorization: 'Bearer test-token',
          },
        }
      );

      // Call endpoint
      const response = await getDailyReports(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.reports).toHaveLength(2);
      expect(data.reports[0].date).toBe('2024-01-01');
      expect(data.reports[0].totalRevenue).toBe(1500.50);
      expect(mockCalculateDailyRevenueRange).toHaveBeenCalledWith(
        'test-user-id',
        '2024-01-01',
        '2024-01-02'
      );
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockAuthenticateRequest.mockReturnValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/reports/daily?startDate=2024-01-01&endDate=2024-01-02'
      );

      const response = await getDailyReports(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 for invalid date format', async () => {
      mockAuthenticateRequest.mockReturnValue({
        userId: 'test-user-id',
        email: 'test@example.com',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/reports/daily?startDate=invalid&endDate=2024-01-02',
        {
          headers: {
            authorization: 'Bearer test-token',
          },
        }
      );

      const response = await getDailyReports(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 when start date is after end date', async () => {
      mockAuthenticateRequest.mockReturnValue({
        userId: 'test-user-id',
        email: 'test@example.com',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/reports/daily?startDate=2024-01-10&endDate=2024-01-01',
        {
          headers: {
            authorization: 'Bearer test-token',
          },
        }
      );

      const response = await getDailyReports(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Start date must be before or equal to end date');
    });
  });

  describe('GET /api/reports/monthly', () => {
    it('should return monthly reports for authenticated user', async () => {
      mockAuthenticateRequest.mockReturnValue({
        userId: 'test-user-id',
        email: 'test@example.com',
      });

      mockCalculateMonthlyRevenueRange.mockResolvedValue([
        { month: '2024-01', year: 2024, invoiceCount: 45, totalRevenue: 15000.75 },
        { month: '2024-02', year: 2024, invoiceCount: 38, totalRevenue: 12500.50 },
      ]);

      const request = new NextRequest(
        'http://localhost:3000/api/reports/monthly?startDate=2024-01-01&endDate=2024-02-29',
        {
          headers: {
            authorization: 'Bearer test-token',
          },
        }
      );

      const response = await getMonthlyReports(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reports).toHaveLength(2);
      expect(data.reports[0].month).toBe('2024-01');
      expect(data.reports[0].totalRevenue).toBe(15000.75);
      expect(mockCalculateMonthlyRevenueRange).toHaveBeenCalledWith(
        'test-user-id',
        '2024-01-01',
        '2024-02-29'
      );
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockAuthenticateRequest.mockReturnValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/reports/monthly?startDate=2024-01-01&endDate=2024-02-29'
      );

      const response = await getMonthlyReports(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/reports/invoices', () => {
    it('should return paginated invoices with filters', async () => {
      mockAuthenticateRequest.mockReturnValue({
        userId: 'test-user-id',
        email: 'test@example.com',
      });

      mockGetInvoicesBucket.mockReturnValue('test-bucket');
      mockGeneratePresignedDownloadUrl.mockResolvedValue('https://s3.example.com/invoice.pdf');

      mockFilterInvoices.mockResolvedValue({
        invoices: [
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
        ],
        total: 1,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/reports/invoices?startDate=2024-01-01&endDate=2024-01-31&tableNumber=5&page=1&limit=50',
        {
          headers: {
            authorization: 'Bearer test-token',
          },
        }
      );

      const response = await getInvoices(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.invoices).toHaveLength(1);
      expect(data.invoices[0].invoiceNumber).toBe('INV-001');
      expect(data.invoices[0].tableNumber).toBe(5);
      expect(data.invoices[0].pdfUrl).toBe('https://s3.example.com/invoice.pdf');
      expect(data.pagination.total).toBe(1);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(50);
      expect(data.pagination.totalPages).toBe(1);
      expect(data.pagination.hasNextPage).toBe(false);
      expect(data.pagination.hasPreviousPage).toBe(false);

      expect(mockFilterInvoices).toHaveBeenCalledWith('test-user-id', {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        tableNumber: 5,
        invoiceId: undefined,
        page: 1,
        limit: 50,
      });
    });

    it('should handle pagination correctly', async () => {
      mockAuthenticateRequest.mockReturnValue({
        userId: 'test-user-id',
        email: 'test@example.com',
      });

      mockGetInvoicesBucket.mockReturnValue('test-bucket');
      mockGeneratePresignedDownloadUrl.mockResolvedValue('https://s3.example.com/invoice.pdf');

      mockFilterInvoices.mockResolvedValue({
        invoices: [],
        total: 150,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/reports/invoices?page=2&limit=50',
        {
          headers: {
            authorization: 'Bearer test-token',
          },
        }
      );

      const response = await getInvoices(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.total).toBe(150);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.totalPages).toBe(3);
      expect(data.pagination.hasNextPage).toBe(true);
      expect(data.pagination.hasPreviousPage).toBe(true);
    });

    it('should search by invoice ID', async () => {
      mockAuthenticateRequest.mockReturnValue({
        userId: 'test-user-id',
        email: 'test@example.com',
      });

      mockGetInvoicesBucket.mockReturnValue('test-bucket');
      mockFilterInvoices.mockResolvedValue({
        invoices: [],
        total: 0,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/reports/invoices?invoiceId=INV-123',
        {
          headers: {
            authorization: 'Bearer test-token',
          },
        }
      );

      const response = await getInvoices(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockFilterInvoices).toHaveBeenCalledWith('test-user-id', {
        startDate: undefined,
        endDate: undefined,
        tableNumber: undefined,
        invoiceId: 'INV-123',
        page: 1,
        limit: 50,
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockAuthenticateRequest.mockReturnValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/reports/invoices'
      );

      const response = await getInvoices(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should validate limit does not exceed 100', async () => {
      mockAuthenticateRequest.mockReturnValue({
        userId: 'test-user-id',
        email: 'test@example.com',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/reports/invoices?limit=200',
        {
          headers: {
            authorization: 'Bearer test-token',
          },
        }
      );

      const response = await getInvoices(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });
});
