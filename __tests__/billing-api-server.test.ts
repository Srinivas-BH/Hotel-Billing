/**
 * Unit tests for billing API endpoints
 * Requirements: 4.3, 8.4
 */

import { validateTableNumber, validateQuantity } from '../lib/validation';
import { generateInvoice, generateInvoiceDeterministic } from '../lib/invoice-generator';
import { authenticateRequest, generateToken } from '../lib/auth';

describe('Billing API Unit Tests', () => {
  describe('Table Number Validation', () => {
    test('should validate valid table number', () => {
      const result = validateTableNumber(5, 10);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject table number exceeding max count', () => {
      const result = validateTableNumber(15, 10);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe('tableNumber');
      expect(result.errors[0].message).toContain('must not exceed');
    });

    test('should reject table number less than 1', () => {
      const result = validateTableNumber(0, 10);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe('tableNumber');
    });

    test('should reject negative table number', () => {
      const result = validateTableNumber(-5, 10);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject non-integer table number', () => {
      const result = validateTableNumber(5.5, 10);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('integer');
    });

    test('should reject null table number', () => {
      const result = validateTableNumber(null, 10);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject undefined table number', () => {
      const result = validateTableNumber(undefined, 10);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject string table number', () => {
      const result = validateTableNumber('5' as any, 10);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Order Quantity Validation', () => {
    test('should validate positive integer quantity', () => {
      const result = validateQuantity(5);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject zero quantity', () => {
      const result = validateQuantity(0);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe('quantity');
    });

    test('should reject negative quantity', () => {
      const result = validateQuantity(-3);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject non-integer quantity', () => {
      const result = validateQuantity(2.5);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('integer');
    });

    test('should reject null quantity', () => {
      const result = validateQuantity(null);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject undefined quantity', () => {
      const result = validateQuantity(undefined);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject string quantity', () => {
      const result = validateQuantity('5' as any);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Invoice Generation with Valid Data', () => {
    test('should generate invoice with single item', async () => {
      const orderData = {
        hotelName: 'Test Hotel',
        tableNumber: 5,
        items: [
          { dishName: 'Pasta', quantity: 2, price: 15.99 }
        ],
        gstPercentage: 18,
        serviceChargePercentage: 10,
        discountAmount: 5,
      };

      const invoice = await generateInvoice(orderData);

      expect(invoice).toBeDefined();
      expect(invoice.invoiceNumber).toBeTruthy();
      expect(invoice.tableNumber).toBe(5);
      expect(invoice.hotelName).toBe('Test Hotel');
      expect(invoice.items).toHaveLength(1);
      expect(invoice.items[0].dishName).toBe('Pasta');
      expect(invoice.items[0].quantity).toBe(2);
      expect(invoice.subtotal).toBeCloseTo(31.98, 2);
    });

    test('should generate invoice with multiple items', async () => {
      const orderData = {
        hotelName: 'Test Hotel',
        tableNumber: 3,
        items: [
          { dishName: 'Burger', quantity: 1, price: 12.50 },
          { dishName: 'Fries', quantity: 2, price: 4.99 },
          { dishName: 'Soda', quantity: 3, price: 2.50 }
        ],
        gstPercentage: 0,
        serviceChargePercentage: 0,
        discountAmount: 0,
      };

      const invoice = await generateInvoice(orderData);

      expect(invoice).toBeDefined();
      expect(invoice.items).toHaveLength(3);
      expect(invoice.subtotal).toBeCloseTo(29.98, 2);
      expect(invoice.grandTotal).toBeCloseTo(29.98, 2);
    });

    test('should generate invoice with GST', async () => {
      const orderData = {
        hotelName: 'Test Hotel',
        tableNumber: 1,
        items: [
          { dishName: 'Pizza', quantity: 1, price: 20.00 }
        ],
        gstPercentage: 18,
        serviceChargePercentage: 0,
        discountAmount: 0,
      };

      const invoice = await generateInvoice(orderData);

      expect(invoice.subtotal).toBe(20.00);
      expect(invoice.gst.percentage).toBe(18);
      expect(invoice.gst.amount).toBeCloseTo(3.60, 2);
      expect(invoice.grandTotal).toBeCloseTo(23.60, 2);
    });

    test('should generate invoice with service charge', async () => {
      const orderData = {
        hotelName: 'Test Hotel',
        tableNumber: 2,
        items: [
          { dishName: 'Steak', quantity: 1, price: 50.00 }
        ],
        gstPercentage: 0,
        serviceChargePercentage: 10,
        discountAmount: 0,
      };

      const invoice = await generateInvoice(orderData);

      expect(invoice.subtotal).toBe(50.00);
      expect(invoice.serviceCharge.percentage).toBe(10);
      expect(invoice.serviceCharge.amount).toBeCloseTo(5.00, 2);
      expect(invoice.grandTotal).toBeCloseTo(55.00, 2);
    });

    test('should generate invoice with discount', async () => {
      const orderData = {
        hotelName: 'Test Hotel',
        tableNumber: 4,
        items: [
          { dishName: 'Salad', quantity: 2, price: 10.00 }
        ],
        gstPercentage: 0,
        serviceChargePercentage: 0,
        discountAmount: 5.00,
      };

      const invoice = await generateInvoice(orderData);

      expect(invoice.subtotal).toBe(20.00);
      expect(invoice.discount).toBe(5.00);
      expect(invoice.grandTotal).toBeCloseTo(15.00, 2);
    });

    test('should apply discount before GST and service charge', async () => {
      const orderData = {
        hotelName: 'Test Hotel',
        tableNumber: 6,
        items: [
          { dishName: 'Combo Meal', quantity: 1, price: 100.00 }
        ],
        gstPercentage: 18,
        serviceChargePercentage: 10,
        discountAmount: 20.00,
      };

      const invoice = await generateInvoice(orderData);

      expect(invoice.subtotal).toBe(100.00);
      expect(invoice.discount).toBe(20.00);
      // GST and service charge on (100 - 20) = 80
      expect(invoice.gst.amount).toBeCloseTo(14.40, 2); // 18% of 80
      expect(invoice.serviceCharge.amount).toBeCloseTo(8.00, 2); // 10% of 80
      expect(invoice.grandTotal).toBeCloseTo(102.40, 2); // 100 + 14.40 + 8.00 - 20
    });
  });

  describe('Invoice Generation with Invalid Data', () => {
    test('should handle empty items array', async () => {
      const orderData = {
        hotelName: 'Test Hotel',
        tableNumber: 1,
        items: [],
        gstPercentage: 0,
        serviceChargePercentage: 0,
        discountAmount: 0,
      };

      const invoice = await generateInvoice(orderData);

      expect(invoice.subtotal).toBe(0);
      expect(invoice.grandTotal).toBe(0);
    });

    test('should handle discount exceeding subtotal', async () => {
      const orderData = {
        hotelName: 'Test Hotel',
        tableNumber: 1,
        items: [
          { dishName: 'Snack', quantity: 1, price: 10.00 }
        ],
        gstPercentage: 0,
        serviceChargePercentage: 0,
        discountAmount: 50.00, // Exceeds subtotal
      };

      const invoice = await generateInvoice(orderData);

      expect(invoice.subtotal).toBe(10.00);
      // Discount should be capped at subtotal
      expect(invoice.discount).toBeLessThanOrEqual(10.00);
      expect(invoice.grandTotal).toBeGreaterThanOrEqual(0);
    });

    test('should handle zero price items', async () => {
      const orderData = {
        hotelName: 'Test Hotel',
        tableNumber: 1,
        items: [
          { dishName: 'Free Item', quantity: 1, price: 0 }
        ],
        gstPercentage: 0,
        serviceChargePercentage: 0,
        discountAmount: 0,
      };

      const invoice = await generateInvoice(orderData);

      expect(invoice.subtotal).toBe(0);
      expect(invoice.grandTotal).toBe(0);
    });
  });

  describe('Authorization Checks', () => {
    test('should authenticate valid token', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const email = 'hotel@example.com';
      const token = generateToken(userId, email);
      const authHeader = `Bearer ${token}`;

      const user = authenticateRequest(authHeader);

      expect(user).not.toBeNull();
      expect(user?.userId).toBe(userId);
    });

    test('should reject missing authorization header', () => {
      const user = authenticateRequest(null);
      expect(user).toBeNull();
    });

    test('should reject invalid token', () => {
      const user = authenticateRequest('Bearer invalid.token');
      expect(user).toBeNull();
    });

    test('should reject malformed authorization header', () => {
      const user = authenticateRequest('InvalidFormat token');
      expect(user).toBeNull();
    });
  });

  describe('Deterministic Invoice Generation', () => {
    test('should generate unique invoice numbers', () => {
      const orderData = {
        hotelName: 'Test Hotel',
        tableNumber: 1,
        items: [{ dishName: 'Item', quantity: 1, price: 10 }],
        gstPercentage: 0,
        serviceChargePercentage: 0,
        discountAmount: 0,
      };

      const invoice1 = generateInvoiceDeterministic(orderData);
      const invoice2 = generateInvoiceDeterministic(orderData);

      expect(invoice1.invoiceNumber).not.toBe(invoice2.invoiceNumber);
    });

    test('should include all required fields', () => {
      const orderData = {
        hotelName: 'Test Hotel',
        tableNumber: 5,
        items: [{ dishName: 'Dish', quantity: 2, price: 15.50 }],
        gstPercentage: 18,
        serviceChargePercentage: 10,
        discountAmount: 5,
      };

      const invoice = generateInvoiceDeterministic(orderData);

      expect(invoice.invoiceNumber).toBeTruthy();
      expect(invoice.tableNumber).toBe(5);
      expect(invoice.hotelName).toBe('Test Hotel');
      expect(invoice.date).toBeTruthy();
      expect(invoice.items).toHaveLength(1);
      expect(invoice.subtotal).toBeDefined();
      expect(invoice.gst).toBeDefined();
      expect(invoice.serviceCharge).toBeDefined();
      expect(invoice.discount).toBeDefined();
      expect(invoice.grandTotal).toBeDefined();
    });

    test('should calculate totals correctly', () => {
      const orderData = {
        hotelName: 'Test Hotel',
        tableNumber: 1,
        items: [
          { dishName: 'Item1', quantity: 2, price: 10 },
          { dishName: 'Item2', quantity: 1, price: 15 }
        ],
        gstPercentage: 10,
        serviceChargePercentage: 5,
        discountAmount: 5,
      };

      const invoice = generateInvoiceDeterministic(orderData);

      expect(invoice.subtotal).toBe(35); // 2*10 + 1*15
      expect(invoice.discount).toBe(5);
      // GST: (35-5) * 0.10 = 3
      expect(invoice.gst.amount).toBeCloseTo(3, 2);
      // Service: (35-5) * 0.05 = 1.5
      expect(invoice.serviceCharge.amount).toBeCloseTo(1.5, 2);
      // Grand: 35 + 3 + 1.5 - 5 = 34.5
      expect(invoice.grandTotal).toBeCloseTo(34.5, 2);
    });
  });
});
