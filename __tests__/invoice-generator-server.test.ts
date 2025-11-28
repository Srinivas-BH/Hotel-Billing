/**
 * Unit tests for AI invoice generation with fallback logic
 * Tests successful AI generation, fallback on timeout, and fallback on error
 * Requirements: 6.5, 14.5
 */

import {
  generateInvoice,
  generateInvoiceDeterministic,
  generateInvoiceNumber,
  OrderData,
} from '../lib/invoice-generator';

// Mock fetch for testing
global.fetch = jest.fn();

describe('Invoice Generator Unit Tests', () => {
  const mockOrderData: OrderData = {
    hotelName: 'Test Hotel',
    tableNumber: 5,
    items: [
      { dishName: 'Pasta', quantity: 2, price: 15.99 },
      { dishName: 'Salad', quantity: 1, price: 8.50 },
    ],
    gstPercentage: 10,
    serviceChargePercentage: 5,
    discountAmount: 5.0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set environment variable for tests
    process.env.HUGGINGFACE_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.HUGGINGFACE_API_KEY;
  });

  describe('generateInvoiceNumber', () => {
    it('should generate invoice number with correct format', () => {
      const invoiceNumber = generateInvoiceNumber();
      
      expect(invoiceNumber).toMatch(/^INV-\d+-[a-z0-9]+$/);
      expect(invoiceNumber.startsWith('INV-')).toBe(true);
    });

    it('should generate unique invoice numbers', () => {
      const numbers = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        numbers.add(generateInvoiceNumber());
      }
      
      expect(numbers.size).toBe(100);
    });
  });

  describe('generateInvoiceDeterministic', () => {
    it('should generate invoice with all required fields', () => {
      const invoice = generateInvoiceDeterministic(mockOrderData);

      expect(invoice).toHaveProperty('invoiceNumber');
      expect(invoice).toHaveProperty('tableNumber');
      expect(invoice).toHaveProperty('hotelName');
      expect(invoice).toHaveProperty('date');
      expect(invoice).toHaveProperty('items');
      expect(invoice).toHaveProperty('subtotal');
      expect(invoice).toHaveProperty('gst');
      expect(invoice).toHaveProperty('serviceCharge');
      expect(invoice).toHaveProperty('discount');
      expect(invoice).toHaveProperty('grandTotal');
    });

    it('should calculate subtotal correctly', () => {
      const invoice = generateInvoiceDeterministic(mockOrderData);
      const expectedSubtotal = 2 * 15.99 + 1 * 8.50;

      expect(invoice.subtotal).toBeCloseTo(expectedSubtotal, 2);
    });

    it('should calculate GST correctly', () => {
      const invoice = generateInvoiceDeterministic(mockOrderData);
      const subtotal = 2 * 15.99 + 1 * 8.50;
      const discountedSubtotal = subtotal - 5.0;
      const expectedGST = discountedSubtotal * 0.1;

      expect(invoice.gst.percentage).toBe(10);
      expect(invoice.gst.amount).toBeCloseTo(expectedGST, 2);
    });

    it('should calculate service charge correctly', () => {
      const invoice = generateInvoiceDeterministic(mockOrderData);
      const subtotal = 2 * 15.99 + 1 * 8.50;
      const discountedSubtotal = subtotal - 5.0;
      const expectedServiceCharge = discountedSubtotal * 0.05;

      expect(invoice.serviceCharge.percentage).toBe(5);
      expect(invoice.serviceCharge.amount).toBeCloseTo(expectedServiceCharge, 2);
    });

    it('should calculate grand total correctly', () => {
      const invoice = generateInvoiceDeterministic(mockOrderData);
      const subtotal = 2 * 15.99 + 1 * 8.50;
      const discountedSubtotal = subtotal - 5.0;
      const gst = discountedSubtotal * 0.1;
      const serviceCharge = discountedSubtotal * 0.05;
      const expectedGrandTotal = subtotal + gst + serviceCharge - 5.0;

      expect(invoice.grandTotal).toBeCloseTo(expectedGrandTotal, 2);
    });

    it('should cap discount at subtotal', () => {
      const orderDataWithLargeDiscount: OrderData = {
        ...mockOrderData,
        discountAmount: 1000, // Much larger than subtotal
      };

      const invoice = generateInvoiceDeterministic(orderDataWithLargeDiscount);
      
      expect(invoice.discount).toBeLessThanOrEqual(invoice.subtotal);
      expect(invoice.grandTotal).toBeGreaterThanOrEqual(0);
    });

    it('should handle zero GST and service charge', () => {
      const orderDataNoCharges: OrderData = {
        ...mockOrderData,
        gstPercentage: 0,
        serviceChargePercentage: 0,
        discountAmount: 0,
      };

      const invoice = generateInvoiceDeterministic(orderDataNoCharges);
      const expectedSubtotal = 2 * 15.99 + 1 * 8.50;

      expect(invoice.gst.amount).toBe(0);
      expect(invoice.serviceCharge.amount).toBe(0);
      expect(invoice.discount).toBe(0);
      expect(invoice.grandTotal).toBeCloseTo(expectedSubtotal, 2);
    });
  });

  describe('generateInvoice - AI fallback logic', () => {
    it('should use deterministic fallback when API key is not configured', async () => {
      delete process.env.HUGGINGFACE_API_KEY;

      const invoice = await generateInvoice(mockOrderData);

      expect(invoice).toHaveProperty('invoiceNumber');
      expect(invoice.hotelName).toBe(mockOrderData.hotelName);
      expect(invoice.tableNumber).toBe(mockOrderData.tableNumber);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should fall back to deterministic on AI timeout', async () => {
      // Mock fetch to simulate timeout
      (fetch as jest.Mock).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      const invoice = await generateInvoice(mockOrderData);

      expect(invoice).toHaveProperty('invoiceNumber');
      expect(invoice.hotelName).toBe(mockOrderData.hotelName);
      expect(invoice.tableNumber).toBe(mockOrderData.tableNumber);
      expect(fetch).toHaveBeenCalled();
    });

    it('should fall back to deterministic on AI error', async () => {
      // Mock fetch to simulate API error
      (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      const invoice = await generateInvoice(mockOrderData);

      expect(invoice).toHaveProperty('invoiceNumber');
      expect(invoice.hotelName).toBe(mockOrderData.hotelName);
      expect(invoice.tableNumber).toBe(mockOrderData.tableNumber);
      expect(fetch).toHaveBeenCalled();
    });

    it('should fall back to deterministic on invalid API response', async () => {
      // Mock fetch to return invalid response
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [{ generated_text: 'Invalid response without JSON' }],
      });

      const invoice = await generateInvoice(mockOrderData);

      expect(invoice).toHaveProperty('invoiceNumber');
      expect(invoice.hotelName).toBe(mockOrderData.hotelName);
      expect(invoice.tableNumber).toBe(mockOrderData.tableNumber);
    });

    it('should fall back to deterministic on HTTP error status', async () => {
      // Mock fetch to return error status
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const invoice = await generateInvoice(mockOrderData);

      expect(invoice).toHaveProperty('invoiceNumber');
      expect(invoice.hotelName).toBe(mockOrderData.hotelName);
      expect(invoice.tableNumber).toBe(mockOrderData.tableNumber);
    });

    it('should use AI response when successful', async () => {
      const mockAIInvoice = {
        invoiceNumber: 'INV-AI-12345',
        tableNumber: mockOrderData.tableNumber,
        hotelName: mockOrderData.hotelName,
        date: new Date().toISOString(),
        items: mockOrderData.items.map(item => ({
          dishName: item.dishName,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })),
        subtotal: 40.48,
        gst: { percentage: 10, amount: 3.548 },
        serviceCharge: { percentage: 5, amount: 1.774 },
        discount: 5.0,
        grandTotal: 40.802,
      };

      // Mock successful AI response
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [{
          generated_text: JSON.stringify(mockAIInvoice),
        }],
      });

      const invoice = await generateInvoice(mockOrderData);

      expect(invoice.invoiceNumber).toBe('INV-AI-12345');
      expect(fetch).toHaveBeenCalled();
    });

    it('should retry on failure before falling back', async () => {
      // Mock fetch to fail twice then succeed
      let callCount = 0;
      (fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => [{ generated_text: 'Invalid' }],
        });
      });

      const invoice = await generateInvoice(mockOrderData);

      // Should have retried (initial + 2 retries = 3 calls)
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(invoice).toHaveProperty('invoiceNumber');
    });
  });
});
