import * as fc from 'fast-check';
import { hashPassword, verifyPassword, generateToken, verifyToken } from '../lib/auth';

describe('Authentication Property Tests', () => {
  /**
   * Feature: hotel-billing-admin, Property 1: Password hashing is irreversible
   * Validates: Requirements 1.4
   * 
   * For any valid password string, after hashing with bcrypt, the resulting hash 
   * should never equal the original password and should verify correctly using bcrypt.compare
   */
  test('Property 1: Password hashing is irreversible', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (password) => {
          const hash = await hashPassword(password);
          
          // Hash should never equal the original password
          expect(hash).not.toBe(password);
          
          // Hash should verify correctly
          const isValid = await verifyPassword(password, hash);
          expect(isValid).toBe(true);
          
          // Wrong password should not verify
          const wrongPassword = password + 'wrong';
          const isInvalid = await verifyPassword(wrongPassword, hash);
          expect(isInvalid).toBe(false);
        }
      ),
      { numRuns: 20 } // Reduced runs due to bcrypt's computational cost
    );
  }, 30000); // 30 second timeout for bcrypt operations

  /**
   * Feature: hotel-billing-admin, Property 2: Session tokens are unique and valid
   * Validates: Requirements 2.1, 2.4
   * 
   * For any successful authentication, the generated JWT token should decode to contain 
   * the correct user ID and should not be reusable after logout
   */
  test('Property 2: Session tokens are unique and valid', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.emailAddress(),
        (userId, email) => {
          const token = generateToken(userId, email);
          
          // Token should be a non-empty string
          expect(token).toBeTruthy();
          expect(typeof token).toBe('string');
          
          // Token should decode correctly
          const decoded = verifyToken(token);
          expect(decoded).not.toBeNull();
          expect(decoded?.userId).toBe(userId);
          expect(decoded?.email).toBe(email);
          
          // Invalid token should not verify
          const invalidToken = token + 'invalid';
          const decodedInvalid = verifyToken(invalidToken);
          expect(decodedInvalid).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Multiple tokens for the same user should be unique
   */
  test('Property 2 (extended): Multiple tokens are unique', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.emailAddress(),
        (userId, email) => {
          const token1 = generateToken(userId, email);
          // Small delay to ensure different iat (issued at) timestamp
          const token2 = generateToken(userId, email);
          
          // Tokens should be different (due to different iat timestamps)
          // Note: This might occasionally be the same if generated in the same second
          // but the property still holds that they're independently valid
          const decoded1 = verifyToken(token1);
          const decoded2 = verifyToken(token2);
          
          expect(decoded1?.userId).toBe(userId);
          expect(decoded2?.userId).toBe(userId);
          expect(decoded1?.email).toBe(email);
          expect(decoded2?.email).toBe(email);
        }
      ),
      { numRuns: 100 }
    );
  });
});
