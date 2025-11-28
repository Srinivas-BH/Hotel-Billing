import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;
const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Hash a password using bcrypt with 10 salt rounds
 * @param password - Plain text password to hash
 * @returns Promise resolving to the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 * @param password - Plain text password to verify
 * @param hash - Hashed password to compare against
 * @returns Promise resolving to true if password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 * @param userId - User ID to encode in the token
 * @param email - User email to encode in the token
 * @returns JWT token string
 */
export function generateToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value (e.g., "Bearer <token>")
 * @returns Token string or null if not found
 */
export function extractTokenFromHeader(authHeader: string | null | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Middleware to authenticate requests
 * @param authHeader - Authorization header from request
 * @returns Decoded user info or null if authentication fails
 */
export function authenticateRequest(authHeader: string | null | undefined): { userId: string; email: string } | null {
  const token = extractTokenFromHeader(authHeader);
  if (!token) {
    return null;
  }
  return verifyToken(token);
}

/**
 * Get secure cookie options for token storage
 * @returns Cookie options object for Next.js responses
 */
export function getSecureCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
} {
  return {
    httpOnly: true, // Prevent JavaScript access to cookie
    secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
    sameSite: 'strict', // Prevent CSRF attacks
    maxAge: 24 * 60 * 60, // 24 hours in seconds
    path: '/', // Cookie available for all routes
  };
}

/**
 * Extract token from cookie
 * @param cookieHeader - Cookie header from request
 * @returns Token string or null if not found
 */
export function extractTokenFromCookie(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) {
    return null;
  }

  // Parse cookies
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies['auth-token'] || null;
}

/**
 * Authenticate request from either Authorization header or cookie
 * @param authHeader - Authorization header from request
 * @param cookieHeader - Cookie header from request
 * @returns Decoded user info or null if authentication fails
 */
export function authenticateRequestWithCookie(
  authHeader: string | null | undefined,
  cookieHeader: string | null | undefined
): { userId: string; email: string } | null {
  // Try Authorization header first
  let token = extractTokenFromHeader(authHeader);
  
  // Fall back to cookie if header not present
  if (!token) {
    token = extractTokenFromCookie(cookieHeader);
  }

  if (!token) {
    return null;
  }

  return verifyToken(token);
}
