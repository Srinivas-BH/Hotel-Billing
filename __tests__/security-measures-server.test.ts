/**
 * Unit Tests for Security Measures
 * Tests input validation, rate limiting, and authorization checks
 */

import {
  sanitizeString,
  sanitizeEmail,
  sanitizeNumber,
  sanitizeFileName,
  validateMenuItemInput,
  validateEmail,
  validatePassword,
  validateSignupInput,
} from '../lib/validation';
import { checkRateLimit, getClientIdentifier } from '../lib/rate-limit';
import { authenticateRequest, extractTokenFromHeader, generateToken, verifyToken } from '../lib/auth';

describe('Security Measures - Input Validation', () => {
  describe('String Sanitization', () => {
    test('should trim whitespace from strings', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
      expect(sanitizeString('\n\ttest\n\t')).toBe('test');
    });

    test('should remove null bytes', () => {
      expect(sanitizeString('hello\0world')).toBe('helloworld');
    });

    test('should remove control characters except newlines and tabs', () => {
      const input = 'hello\x01\x02world';
      const result = sanitizeString(input);
      expect(result).toBe('helloworld');
    });

    test('should handle empty strings', () => {
      expect(sanitizeString('')).toBe('');
      expect(sanitizeString('   ')).toBe('');
    });
  });

  describe('Email Sanitization', () => {
    test('should convert email to lowercase', () => {
      expect(sanitizeEmail('TEST@EXAMPLE.COM')).toBe('test@example.com');
      expect(sanitizeEmail('User@Domain.Com')).toBe('user@domain.com');
    });

    test('should remove whitespace', () => {
      expect(sanitizeEmail(' test@example.com ')).toBe('test@example.com');
      expect(sanitizeEmail('test @example.com')).toBe('test@example.com');
    });

    test('should remove control characters', () => {
      expect(sanitizeEmail('test\x01@example.com')).toBe('test@example.com');
    });
  });

  describe('Number Sanitization', () => {
    test('should parse valid numbers', () => {
      expect(sanitizeNumber(42)).toBe(42);
      expect(sanitizeNumber('42')).toBe(42);
      expect(sanitizeNumber('3.14')).toBe(3.14);
    });

    test('should return NaN for invalid inputs', () => {
      expect(sanitizeNumber('abc')).toBeNaN();
      expect(sanitizeNumber(null)).toBeNaN();
      expect(sanitizeNumber(undefined)).toBeNaN();
    });
  });

  describe('File Name Sanitization', () => {
    test('should remove path separators', () => {
      expect(sanitizeFileName('../../etc/passwd')).toBe('____etc_passwd');
      expect(sanitizeFileName('folder/file.txt')).toBe('folder_file.txt');
    });

    test('should prevent path traversal', () => {
      expect(sanitizeFileName('../../../secret.txt')).not.toContain('..');
    });

    test('should limit length to 255 characters', () => {
      const longName = 'a'.repeat(300);
      const result = sanitizeFileName(longName);
      expect(result.length).toBeLessThanOrEqual(255);
    });
  });

  describe('Menu Item Validation', () => {
    test('should validate valid menu item', () => {
      const result = validateMenuItemInput('Pizza', 12.99);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedDishName).toBe('Pizza');
      expect(result.sanitizedPrice).toBe(12.99);
    });

    test('should reject empty dish name', () => {
      const result = validateMenuItemInput('   ', 12.99);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'dishName',
        message: 'Dish name must be non-empty',
      });
    });

    test('should reject negative price', () => {
      const result = validateMenuItemInput('Pizza', -5);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'price',
        message: 'Price must be a positive number',
      });
    });

    test('should reject zero price', () => {
      const result = validateMenuItemInput('Pizza', 0);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'price',
        message: 'Price must be a positive number',
      });
    });
  });

  describe('Email Validation', () => {
    test('should validate valid email', () => {
      const result = validateEmail('test@example.com');
      expect(result.valid).toBe(true);
      expect(result.sanitizedEmail).toBe('test@example.com');
    });

    test('should reject invalid email format', () => {
      const result = validateEmail('invalid-email');
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'Email must be a valid email address',
      });
    });

    test('should sanitize and validate email', () => {
      const result = validateEmail('  TEST@EXAMPLE.COM  ');
      expect(result.valid).toBe(true);
      expect(result.sanitizedEmail).toBe('test@example.com');
    });
  });

  describe('Password Validation', () => {
    test('should validate valid password', () => {
      const result = validatePassword('password123');
      expect(result.valid).toBe(true);
    });

    test('should reject short password', () => {
      const result = validatePassword('short');
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'password',
        message: 'Password must be at least 8 characters long',
      });
    });

    test('should reject missing password', () => {
      const result = validatePassword(null);
      expect(result.valid).toBe(false);
    });
  });

  describe('Signup Input Validation', () => {
    test('should validate valid signup data', () => {
      const result = validateSignupInput(
        'test@example.com',
        'password123',
        'Test Hotel',
        5
      );
      expect(result.valid).toBe(true);
      expect(result.sanitizedEmail).toBe('test@example.com');
      expect(result.sanitizedHotelName).toBe('Test Hotel');
      expect(result.sanitizedTableCount).toBe(5);
    });

    test('should reject invalid email in signup', () => {
      const result = validateSignupInput(
        'invalid-email',
        'password123',
        'Test Hotel',
        5
      );
      expect(result.valid).toBe(false);
    });

    test('should reject short password in signup', () => {
      const result = validateSignupInput(
        'test@example.com',
        'short',
        'Test Hotel',
        5
      );
      expect(result.valid).toBe(false);
    });

    test('should reject negative table count', () => {
      const result = validateSignupInput(
        'test@example.com',
        'password123',
        'Test Hotel',
        -1
      );
      expect(result.valid).toBe(false);
    });
  });
});

describe('Security Measures - Rate Limiting', () => {
  test('should allow requests within limit', () => {
    const clientId = 'test-client-1';
    
    for (let i = 0; i < 50; i++) {
      const result = checkRateLimit(clientId);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    }
  });

  test('should block requests exceeding limit', () => {
    const clientId = 'test-client-2';
    
    // Make 100 requests (the limit)
    for (let i = 0; i < 100; i++) {
      checkRateLimit(clientId);
    }
    
    // The 101st request should be blocked
    const result = checkRateLimit(clientId);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  test('should provide reset time', () => {
    const clientId = 'test-client-3';
    const result = checkRateLimit(clientId);
    
    expect(result.resetTime).toBeGreaterThan(Date.now());
  });

  test('should extract client identifier from request', () => {
    const mockRequest = {
      headers: new Map([
        ['x-forwarded-for', '192.168.1.1, 10.0.0.1'],
      ]),
    } as any;

    const originalGet = mockRequest.headers.get.bind(mockRequest.headers);
    mockRequest.headers.get = (key: string) => {
      return originalGet(key) || null;
    };

    const identifier = getClientIdentifier(mockRequest);
    expect(identifier).toBe('192.168.1.1');
  });
});

describe('Security Measures - Authorization Checks', () => {
  const testUserId = 'test-user-123';
  const testEmail = 'test@example.com';

  test('should generate and verify valid token', () => {
    const token = generateToken(testUserId, testEmail);
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');

    const decoded = verifyToken(token);
    expect(decoded).toBeTruthy();
    expect(decoded?.userId).toBe(testUserId);
    expect(decoded?.email).toBe(testEmail);
  });

  test('should reject invalid token', () => {
    const decoded = verifyToken('invalid-token');
    expect(decoded).toBeNull();
  });

  test('should extract token from Authorization header', () => {
    const token = 'test-token-123';
    const authHeader = `Bearer ${token}`;
    
    const extracted = extractTokenFromHeader(authHeader);
    expect(extracted).toBe(token);
  });

  test('should reject malformed Authorization header', () => {
    expect(extractTokenFromHeader('InvalidFormat')).toBeNull();
    expect(extractTokenFromHeader('Bearer')).toBeNull();
    expect(extractTokenFromHeader(null)).toBeNull();
  });

  test('should authenticate valid request', () => {
    const token = generateToken(testUserId, testEmail);
    const authHeader = `Bearer ${token}`;
    
    const user = authenticateRequest(authHeader);
    expect(user).toBeTruthy();
    expect(user?.userId).toBe(testUserId);
    expect(user?.email).toBe(testEmail);
  });

  test('should reject request without token', () => {
    const user = authenticateRequest(null);
    expect(user).toBeNull();
  });

  test('should reject request with invalid token', () => {
    const authHeader = 'Bearer invalid-token';
    const user = authenticateRequest(authHeader);
    expect(user).toBeNull();
  });
});
