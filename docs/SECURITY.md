# Security Documentation

## Token Transmission

The Hotel Billing Admin Portal uses JWT tokens for authentication. Tokens are transmitted securely using the following methods:

### Primary Method: Authorization Header

Tokens are primarily transmitted via the `Authorization` header using the Bearer scheme:

```
Authorization: Bearer <jwt-token>
```

**Benefits:**
- Standard HTTP authentication method
- Works well with API clients and mobile apps
- No CSRF concerns
- Easy to implement in frontend applications

**Implementation:**
```typescript
// Client-side example
fetch('/api/menu', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Alternative Method: HTTP-Only Cookies

For browser-based applications, tokens can also be stored in HTTP-only cookies with secure options:

**Cookie Configuration:**
- `httpOnly: true` - Prevents JavaScript access (XSS protection)
- `secure: true` - Only transmitted over HTTPS in production
- `sameSite: 'strict'` - Prevents CSRF attacks
- `maxAge: 24h` - Token expiration time
- `path: '/'` - Available for all routes

**Implementation:**
```typescript
// Server-side example
import { getSecureCookieOptions } from '@/lib/auth';

const cookieOptions = getSecureCookieOptions();
response.cookies.set('auth-token', token, cookieOptions);
```

## Rate Limiting

API endpoints are protected with rate limiting to prevent abuse:

- **Limit:** 100 requests per 15 minutes per IP address
- **Scope:** All `/api/*` routes
- **Headers:** Rate limit information included in response headers
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets
  - `Retry-After`: Seconds to wait before retrying (on 429 responses)

**Response on Rate Limit Exceeded:**
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "resetTime": "2024-01-01T12:00:00.000Z"
}
```

## HTTPS Enforcement

In production, all HTTP requests are automatically redirected to HTTPS:

- **Status Code:** 301 (Permanent Redirect)
- **HSTS Header:** `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- **Scope:** All routes

## Security Headers

All responses include the following security headers:

- `Strict-Transport-Security`: Forces HTTPS for 1 year
- `X-Content-Type-Options: nosniff`: Prevents MIME type sniffing
- `X-Frame-Options: DENY`: Prevents clickjacking
- `X-XSS-Protection: 1; mode=block`: Enables XSS filter
- `Referrer-Policy: strict-origin-when-cross-origin`: Controls referrer information

## Input Sanitization

All user inputs are validated and sanitized before processing:

### String Sanitization
- Trims whitespace
- Removes null bytes
- Removes control characters (except newlines and tabs)

### Email Sanitization
- Converts to lowercase
- Removes whitespace
- Validates email format

### Numeric Sanitization
- Parses and validates numeric values
- Rejects non-numeric inputs

### File Name Sanitization
- Removes path separators
- Prevents path traversal attacks
- Limits length to 255 characters

## Database Security

All database queries use parameterized queries to prevent SQL injection:

```typescript
// Safe parameterized query
await query('SELECT * FROM hotels WHERE email = $1', [email]);

// NEVER do this (vulnerable to SQL injection)
// await query(`SELECT * FROM hotels WHERE email = '${email}'`);
```

## S3 Bucket Security

S3 buckets are configured with strict security settings:

- **Access:** Private only (no public access)
- **Authentication:** Presigned URLs with 15-minute expiration
- **Protocol:** HTTPS only
- **CORS:** Configured for specific origins only

## Password Security

Passwords are hashed using bcrypt with 10 salt rounds:

- **Algorithm:** bcrypt
- **Salt Rounds:** 10
- **Minimum Length:** 8 characters
- **Storage:** Only hashed passwords stored in database

## Best Practices

1. **Never log sensitive data** (passwords, tokens, etc.)
2. **Use environment variables** for secrets and configuration
3. **Rotate JWT secrets** regularly in production
4. **Monitor rate limit violations** for potential attacks
5. **Keep dependencies updated** to patch security vulnerabilities
6. **Use HTTPS** in all production environments
7. **Validate all inputs** on both client and server side
8. **Implement proper error handling** without exposing system details

## Environment Variables

Required security-related environment variables:

```bash
# JWT Configuration
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=24h

# Database (use SSL in production)
DATABASE_URL=postgresql://...

# AWS S3
AWS_ACCESS_KEY_ID=<access-key>
AWS_SECRET_ACCESS_KEY=<secret-key>
S3_BUCKET_PHOTOS=<bucket-name>
S3_BUCKET_INVOICES=<bucket-name>

# Node Environment
NODE_ENV=production
```

## Incident Response

If a security incident is detected:

1. **Immediately rotate** JWT secrets
2. **Invalidate all active sessions** by changing JWT_SECRET
3. **Review logs** for suspicious activity
4. **Patch vulnerabilities** as soon as possible
5. **Notify affected users** if data was compromised
6. **Document the incident** for future reference
