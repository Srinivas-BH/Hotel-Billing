/**
 * Property-Based Tests for HTTPS Enforcement
 * 
 * **Feature: hotel-billing-admin, Property 21: HTTPS enforcement**
 * **Validates: Requirements 13.1**
 */

import * as fc from 'fast-check';
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../middleware';

describe('Property 21: HTTPS enforcement', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('For any API request in production with HTTP protocol, the server should redirect to HTTPS', () => {
    process.env.NODE_ENV = 'production';

    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('/api/auth/login'),
          fc.constant('/api/auth/signup'),
          fc.constant('/api/menu'),
          fc.constant('/api/billing/generate'),
          fc.constant('/api/reports/daily'),
          fc.constant('/api/profile'),
          fc.constant('/dashboard'),
          fc.constant('/billing'),
          fc.constant('/menu'),
          fc.constant('/reports')
        ),
        (path) => {
          // Create a mock request with HTTP protocol
          const url = `http://example.com${path}`;
          const request = new NextRequest(url, {
            headers: {
              'x-forwarded-proto': 'http',
            },
          });

          const response = middleware(request);

          // Should redirect to HTTPS
          if (response.status === 301 || response.status === 308) {
            const location = response.headers.get('location');
            expect(location).toBeTruthy();
            expect(location).toMatch(/^https:/);
            return true;
          }

          // If not redirecting, fail the property
          return false;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('For any API request in production with HTTPS protocol, the server should accept the request', () => {
    process.env.NODE_ENV = 'production';

    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('/api/auth/login'),
          fc.constant('/api/auth/signup'),
          fc.constant('/api/menu'),
          fc.constant('/api/billing/generate'),
          fc.constant('/api/reports/daily'),
          fc.constant('/api/profile')
        ),
        (path) => {
          // Create a mock request with HTTPS protocol
          const url = `https://example.com${path}`;
          const request = new NextRequest(url, {
            headers: {
              'x-forwarded-proto': 'https',
            },
          });

          const response = middleware(request);

          // Should not redirect (status 200 or continue processing)
          expect(response.status).not.toBe(301);
          expect(response.status).not.toBe(308);

          // Should have security headers
          expect(response.headers.get('Strict-Transport-Security')).toBeTruthy();
          expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
          expect(response.headers.get('X-Frame-Options')).toBe('DENY');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('For any request in development, the server should not enforce HTTPS', () => {
    process.env.NODE_ENV = 'development';

    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('/api/auth/login'),
          fc.constant('/api/menu'),
          fc.constant('/dashboard')
        ),
        (path) => {
          // Create a mock request with HTTP protocol in development
          const url = `http://localhost:3000${path}`;
          const request = new NextRequest(url, {
            headers: {
              'x-forwarded-proto': 'http',
            },
          });

          const response = middleware(request);

          // Should not redirect in development
          expect(response.status).not.toBe(301);
          expect(response.status).not.toBe(308);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
