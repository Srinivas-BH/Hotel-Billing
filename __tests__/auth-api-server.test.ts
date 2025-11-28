import { hashPassword, verifyPassword, generateToken, verifyToken, authenticateRequest } from '../lib/auth';

describe('Authentication Unit Tests', () => {
  describe('Password Hashing', () => {
    test('should hash password correctly', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);
      
      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    test('should verify correct password', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword('wrongpassword', hash);
      
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token Generation', () => {
    test('should generate valid token', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const email = 'test@example.com';
      const token = generateToken(userId, email);
      
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    test('should decode token correctly', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const email = 'test@example.com';
      const token = generateToken(userId, email);
      const decoded = verifyToken(token);
      
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(userId);
      expect(decoded?.email).toBe(email);
    });

    test('should reject invalid token', () => {
      const decoded = verifyToken('invalid.token.here');
      expect(decoded).toBeNull();
    });

    test('should reject malformed token', () => {
      const decoded = verifyToken('not-a-jwt');
      expect(decoded).toBeNull();
    });
  });

  describe('Authentication Middleware', () => {
    test('should authenticate valid Bearer token', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const email = 'test@example.com';
      const token = generateToken(userId, email);
      const authHeader = `Bearer ${token}`;
      
      const user = authenticateRequest(authHeader);
      
      expect(user).not.toBeNull();
      expect(user?.userId).toBe(userId);
      expect(user?.email).toBe(email);
    });

    test('should reject missing Authorization header', () => {
      const user = authenticateRequest(null);
      expect(user).toBeNull();
    });

    test('should reject malformed Authorization header', () => {
      const user = authenticateRequest('InvalidFormat token');
      expect(user).toBeNull();
    });

    test('should reject invalid token in Authorization header', () => {
      const user = authenticateRequest('Bearer invalid.token.here');
      expect(user).toBeNull();
    });

    test('should reject empty Bearer token', () => {
      const user = authenticateRequest('Bearer ');
      expect(user).toBeNull();
    });
  });

  describe('Input Validation Scenarios', () => {
    test('should handle empty password', async () => {
      const password = '';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    test('should handle long password', async () => {
      const password = 'a'.repeat(1000);
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    test('should handle special characters in password', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    test('should handle unicode characters in password', async () => {
      const password = '密码测试🔐';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });
  });
});
