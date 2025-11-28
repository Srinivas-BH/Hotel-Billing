# Troubleshooting Guide

Common issues and their solutions for the Hotel Billing Management Admin Portal.

## Table of Contents

- [Development Issues](#development-issues)
- [Database Issues](#database-issues)
- [S3 Storage Issues](#s3-storage-issues)
- [Authentication Issues](#authentication-issues)
- [Deployment Issues](#deployment-issues)
- [Performance Issues](#performance-issues)
- [Testing Issues](#testing-issues)

---

## Development Issues

### Port 3000 Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:

```bash
# macOS/Linux - Find and kill process
lsof -ti:3000 | xargs kill -9

# Windows - Find process
netstat -ano | findstr :3000
# Then kill it
taskkill /PID <PID> /F

# Or use a different port
PORT=3001 npm run dev
```

### Module Not Found Errors

**Error**: `Cannot find module 'xyz'`

**Solution**:

```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

### TypeScript Errors After Update

**Error**: Various TypeScript compilation errors

**Solution**:

```bash
# Clear TypeScript build info
rm -rf tsconfig.tsbuildinfo

# Reinstall type definitions
npm install --save-dev @types/node @types/react @types/react-dom

# Rebuild
npm run build
```

### Hot Reload Not Working

**Issue**: Changes not reflecting in browser

**Solution**:

1. Check if you're editing the correct file
2. Restart dev server: `npm run dev`
3. Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)
4. Check for syntax errors in console
5. Disable browser extensions that might interfere

---

## Database Issues

### Connection Timeout

**Error**: `Connection timeout` or `ETIMEDOUT`

**Possible Causes & Solutions**:

1. **Wrong connection string**
   ```bash
   # Verify DATABASE_URL format
   postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true
   ```

2. **Supabase project paused** (Free tier)
   - Go to Supabase dashboard
   - Check project status
   - Unpause if needed

3. **Network/Firewall issues**
   - Check internet connection
   - Disable VPN temporarily
   - Check firewall settings

4. **Not using connection pooling**
   - Use port 6543 (pooled) instead of 5432
   - Add `?pgbouncer=true` to connection string

### Migration Errors

**Error**: `relation "xyz" already exists`

**Solution**:

```bash
# Check existing tables
psql $DATABASE_URL -c "\dt"

# Drop all tables (CAUTION: destroys data)
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Re-run migrations
npm run migrate
```

### Query Performance Issues

**Issue**: Slow database queries

**Solution**:

1. **Check indexes**:
   ```sql
   -- Verify indexes exist
   SELECT tablename, indexname 
   FROM pg_indexes 
   WHERE schemaname = 'public';
   ```

2. **Analyze query performance**:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM invoices WHERE hotel_id = 'xxx';
   ```

3. **Add missing indexes** (if needed):
   ```sql
   CREATE INDEX idx_name ON table_name(column_name);
   ```

### Too Many Connections

**Error**: `too many connections for role`

**Solution**:

- Use connection pooling (port 6543)
- Close connections properly in code
- Upgrade Supabase plan for more connections
- Check for connection leaks in application code

---

## S3 Storage Issues

### Access Denied Errors

**Error**: `Access Denied` when uploading/downloading

**Possible Causes & Solutions**:

1. **IAM permissions incorrect**
   - Verify IAM policy includes `s3:PutObject`, `s3:GetObject`
   - Check bucket names in policy match actual buckets
   - Verify IAM user credentials are correct

2. **Bucket policy too restrictive**
   - Review bucket policy
   - Ensure it allows your IAM user
   - Check for IP restrictions

3. **Presigned URL expired**
   - URLs expire after 15 minutes
   - Generate new presigned URL
   - Check server time is synchronized

### CORS Errors

**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution**:

1. **Update CORS configuration**:
   ```bash
   # Edit docs/s3-configs/cors-config.json
   # Add your domain to AllowedOrigins
   
   # Apply configuration
   aws s3api put-bucket-cors \
     --bucket your-bucket-name \
     --cors-configuration file://docs/s3-configs/cors-config.json
   ```

2. **Verify CORS is applied**:
   ```bash
   aws s3api get-bucket-cors --bucket your-bucket-name
   ```

3. **Check browser console** for specific CORS error details

### Upload Fails Silently

**Issue**: Upload appears to work but file not in S3

**Solution**:

1. **Check presigned URL generation**:
   ```typescript
   // Verify URL is generated correctly
   console.log('Presigned URL:', url);
   ```

2. **Verify Content-Type matches**:
   - Content-Type in presigned URL must match upload
   - Check file type validation

3. **Check S3 bucket exists**:
   ```bash
   aws s3 ls s3://your-bucket-name
   ```

4. **Review CloudWatch logs** (if enabled)

### File Not Found After Upload

**Issue**: File uploaded but can't be retrieved

**Solution**:

1. **Verify file key**:
   ```bash
   aws s3 ls s3://your-bucket-name/ --recursive
   ```

2. **Check key format** in database vs S3
   - Ensure consistent path format
   - Check for leading/trailing slashes

3. **Verify bucket name** in environment variables

---

## Authentication Issues

### JWT Token Invalid

**Error**: `Invalid token` or `Token expired`

**Solution**:

1. **Check JWT_SECRET matches** between environments
2. **Verify token expiration**:
   ```typescript
   // Decode token to check expiration
   const decoded = jwt.decode(token);
   console.log('Token expires:', new Date(decoded.exp * 1000));
   ```
3. **Clear browser storage** and login again
4. **Check server time** is synchronized

### Login Fails with Correct Credentials

**Issue**: Login returns error despite correct password

**Solution**:

1. **Check password hashing**:
   ```typescript
   // Verify bcrypt is working
   const hash = await bcrypt.hash('test', 10);
   const match = await bcrypt.compare('test', hash);
   console.log('Bcrypt working:', match); // Should be true
   ```

2. **Check database connection**
3. **Verify email is stored correctly** (lowercase, trimmed)
4. **Check for special characters** in password

### Session Expires Too Quickly

**Issue**: User logged out unexpectedly

**Solution**:

1. **Check JWT_EXPIRES_IN** setting (should be "24h")
2. **Verify token refresh logic** (if implemented)
3. **Check browser storage** isn't being cleared
4. **Review session management** in AuthContext

### Can't Access Protected Routes

**Issue**: Redirected to login despite being logged in

**Solution**:

1. **Check AuthGuard implementation**
2. **Verify token is in Authorization header**:
   ```javascript
   // In browser console
   console.log(localStorage.getItem('token'));
   ```
3. **Check middleware** is not blocking requests
4. **Review CORS settings** for credentials

---

## Deployment Issues

### Vercel Build Fails

**Error**: Build fails during deployment

**Common Solutions**:

1. **TypeScript errors**:
   ```bash
   # Run locally to see errors
   npm run build
   ```

2. **Missing environment variables**:
   - Check all required vars are set in Vercel
   - Verify no typos in variable names

3. **Dependency issues**:
   ```bash
   # Ensure package-lock.json is committed
   git add package-lock.json
   git commit -m "Add package-lock.json"
   ```

4. **Memory issues**:
   - Upgrade Vercel plan
   - Optimize build process
   - Check for memory leaks

### Environment Variables Not Working

**Issue**: App can't access environment variables

**Solution**:

1. **Check variable names**:
   - Client vars must start with `NEXT_PUBLIC_`
   - Server vars don't need prefix

2. **Verify variables are set** in Vercel:
   - Settings > Environment Variables
   - Check correct environment (Production/Preview/Development)

3. **Redeploy** after adding variables:
   - Variables only apply to new deployments
   - Trigger new deployment

4. **Check variable access**:
   ```typescript
   // Server-side (API routes)
   console.log(process.env.DATABASE_URL);
   
   // Client-side (components)
   console.log(process.env.NEXT_PUBLIC_APP_URL);
   ```

### Function Timeout

**Error**: `Function execution timed out`

**Solution**:

1. **Increase timeout** in vercel.json (already set to 30s)
2. **Optimize slow operations**:
   - Database queries
   - PDF generation
   - External API calls
3. **Use async/await properly**
4. **Consider background jobs** for long operations

### Database Connection Fails in Production

**Issue**: Works locally but not on Vercel

**Solution**:

1. **Use connection pooling** (port 6543)
2. **Check Supabase IP allowlist** (should allow all)
3. **Verify DATABASE_URL** in Vercel environment
4. **Check Supabase project** is not paused
5. **Review connection limits** on Supabase plan

---

## Performance Issues

### Slow Page Load

**Issue**: Pages take too long to load

**Solutions**:

1. **Optimize images**:
   - Use Next.js Image component
   - Compress images before upload
   - Use appropriate image formats (WebP)

2. **Reduce bundle size**:
   ```bash
   # Analyze bundle
   npm run build
   # Check .next/analyze output
   ```

3. **Implement code splitting**:
   - Use dynamic imports
   - Lazy load components

4. **Enable caching**:
   - React Query cache configuration
   - Browser caching headers

### Slow Database Queries

**Issue**: API endpoints respond slowly

**Solutions**:

1. **Add database indexes** (see schema.sql)
2. **Optimize queries**:
   - Avoid N+1 queries
   - Use joins instead of multiple queries
   - Limit result sets

3. **Use connection pooling**
4. **Cache frequent queries** with React Query

### PDF Generation Slow

**Issue**: Invoice PDF takes too long to generate

**Solutions**:

1. **Optimize HTML template**:
   - Reduce complexity
   - Minimize inline styles
   - Remove unnecessary elements

2. **Use Puppeteer efficiently**:
   - Reuse browser instance (if possible)
   - Set appropriate viewport size
   - Disable unnecessary features

3. **Consider alternatives**:
   - Use PDF generation service
   - Pre-generate common templates
   - Generate PDFs asynchronously

---

## Testing Issues

### Tests Failing Locally

**Issue**: Tests pass in CI but fail locally (or vice versa)

**Solutions**:

1. **Check Node version** matches CI
2. **Clear Jest cache**:
   ```bash
   npm test -- --clearCache
   ```

3. **Check environment variables**:
   - Tests may need different env vars
   - Use .env.test if needed

4. **Database state**:
   - Ensure clean database for tests
   - Use test database, not production

### Property-Based Tests Failing

**Issue**: fast-check tests fail intermittently

**Solutions**:

1. **Check test logic**:
   - Ensure property is correct
   - Verify generators produce valid data

2. **Increase iterations** to find edge cases:
   ```typescript
   fc.assert(fc.property(...), { numRuns: 1000 });
   ```

3. **Use seed for reproducibility**:
   ```typescript
   fc.assert(fc.property(...), { seed: 42 });
   ```

4. **Review counterexample**:
   - fast-check shows failing input
   - Fix code or adjust property

### E2E Tests Timing Out

**Issue**: Playwright tests timeout

**Solutions**:

1. **Increase timeout**:
   ```typescript
   test.setTimeout(60000); // 60 seconds
   ```

2. **Wait for elements properly**:
   ```typescript
   await page.waitForSelector('#element');
   ```

3. **Check test environment**:
   - Ensure dev server is running
   - Verify database is accessible

4. **Run tests in headed mode** to debug:
   ```bash
   npm run test:e2e -- --headed
   ```

---

## Getting More Help

### Debugging Steps

1. **Check logs**:
   - Browser console (F12)
   - Vercel function logs
   - Supabase logs
   - AWS CloudWatch (if enabled)

2. **Enable debug mode**:
   ```bash
   DEBUG=* npm run dev
   ```

3. **Use debugger**:
   ```typescript
   debugger; // Add breakpoint
   ```

4. **Test in isolation**:
   - Isolate the failing component
   - Test with minimal data
   - Eliminate variables

### Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)

### Support Channels

1. **Check existing issues**: Search GitHub issues
2. **Create new issue**: Include:
   - Error message
   - Steps to reproduce
   - Environment details
   - Relevant logs
3. **Community**: GitHub Discussions

---

**Last Updated**: November 2024
