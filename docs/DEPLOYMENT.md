# Deployment Guide - Hotel Billing Management Admin Portal

This comprehensive guide walks you through deploying the Hotel Billing Management Admin Portal to production using Vercel, Supabase, and AWS S3.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup (Supabase)](#database-setup-supabase)
4. [Storage Setup (AWS S3)](#storage-setup-aws-s3)
5. [Application Deployment (Vercel)](#application-deployment-vercel)
6. [Post-Deployment Configuration](#post-deployment-configuration)
7. [Verification & Testing](#verification--testing)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance & Updates](#maintenance--updates)

---

## Prerequisites

Before starting the deployment process, ensure you have:

- [ ] A GitHub account with your project repository
- [ ] A Vercel account (sign up at https://vercel.com)
- [ ] A Supabase account (sign up at https://supabase.com)
- [ ] An AWS account with billing enabled
- [ ] AWS CLI installed locally (for S3 setup)
- [ ] Node.js 18+ installed locally
- [ ] A Hugging Face account and API key (sign up at https://huggingface.co)

### Estimated Setup Time

- First-time deployment: 45-60 minutes
- Subsequent deployments: 5-10 minutes (automated)

### Cost Estimates

- **Vercel**: Free tier (Hobby plan) or $20/month (Pro)
- **Supabase**: Free tier or $25/month (Pro)
- **AWS S3**: ~$0.023 per GB/month + transfer costs
- **Hugging Face**: Free tier (rate limited) or paid plans

---

## Environment Setup

### 1. Clone and Prepare Repository

```bash
# Clone your repository
git clone https://github.com/your-username/hotel-billing-admin.git
cd hotel-billing-admin

# Install dependencies
npm install

# Create local environment file
cp .env.example .env.local
```

### 2. Generate Secrets

Generate a secure JWT secret:

```bash
# On macOS/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Save this value - you'll need it for `JWT_SECRET`.

---

## Database Setup (Supabase)

### Step 1: Create Supabase Project

1. Go to https://app.supabase.com
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: `hotel-billing-admin-prod`
   - **Database Password**: Generate and save securely
   - **Region**: Choose closest to your users
   - **Plan**: Free or Pro
4. Click **"Create new project"**
5. Wait 1-2 minutes for provisioning

### Step 2: Get Connection String

1. Navigate to **Settings** > **Database**
2. Find **Connection string** section
3. Select **URI** tab
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your database password
6. **Important**: Use the **Connection Pooling** string (port 6543) for production:
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true
   ```

### Step 3: Run Database Migrations

**Option A: Using Supabase SQL Editor (Recommended)**

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy contents of `lib/schema.sql` from your project
4. Paste and click **"Run"**
5. Verify tables in **Table Editor**

**Option B: Using Command Line**

```bash
# Install PostgreSQL client if needed
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql-client

# Run migration
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" < lib/schema.sql
```

### Step 4: Verify Database

Check that all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Expected tables:
- `hotels`
- `menu_items`
- `invoices`
- `invoice_items`

**📖 For detailed Supabase setup, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**

---

## Storage Setup (AWS S3)

### Step 1: Configure AWS CLI

```bash
# Configure AWS credentials
aws configure

# Enter when prompted:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format (json)
```

### Step 2: Run Automated Setup Script

```bash
# Make script executable
chmod +x scripts/setup-s3-buckets.sh

# Run setup script
./scripts/setup-s3-buckets.sh
```

The script will:
- Create two S3 buckets (photos and invoices)
- Block all public access
- Configure CORS for your domain
- Set bucket policies to enforce HTTPS
- Optionally enable versioning

### Step 3: Create IAM User for Application

1. Go to AWS IAM Console
2. Click **"Users"** > **"Add users"**
3. User name: `hotel-billing-app`
4. Select **"Programmatic access"**
5. Click **"Next: Permissions"**
6. Click **"Attach existing policies directly"**
7. Click **"Create policy"**
8. Use JSON editor and paste contents from `docs/s3-configs/iam-policy.json`
9. Replace `YOUR_PHOTOS_BUCKET` and `YOUR_INVOICES_BUCKET` with your bucket names
10. Name policy: `HotelBillingS3Access`
11. Attach policy to user
12. Save **Access Key ID** and **Secret Access Key**

**📖 For detailed S3 setup, see [S3_BUCKET_SETUP.md](./S3_BUCKET_SETUP.md)**

---

## Application Deployment (Vercel)

### Step 1: Connect Repository to Vercel

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** > **"Project"**
3. Import your GitHub repository
4. Select the repository: `hotel-billing-admin`
5. Click **"Import"**

### Step 2: Configure Build Settings

Vercel should auto-detect Next.js. Verify these settings:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node Version**: 18.x

### Step 3: Add Environment Variables

In Vercel project settings, go to **Settings** > **Environment Variables**.

Add the following variables (for Production, Preview, and Development):

#### Database
```
DATABASE_URL = postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true
```

#### AWS S3
```
AWS_REGION = us-east-1
AWS_ACCESS_KEY_ID = [Your IAM Access Key]
AWS_SECRET_ACCESS_KEY = [Your IAM Secret Key]
S3_BUCKET_PHOTOS = [Your photos bucket name]
S3_BUCKET_INVOICES = [Your invoices bucket name]
```

#### JWT Authentication
```
JWT_SECRET = [Your generated secret from earlier]
JWT_EXPIRES_IN = 24h
```

#### Hugging Face AI
```
HUGGINGFACE_API_KEY = [Your Hugging Face API key]
HUGGINGFACE_MODEL = facebook/bart-large-cnn
```

#### Application
```
NEXT_PUBLIC_APP_URL = https://your-project.vercel.app
NODE_ENV = production
```

#### Optional: Puppeteer (for PDF generation)
```
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = true
```

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (2-5 minutes)
3. Vercel will provide a deployment URL

### Step 5: Configure Custom Domain (Optional)

1. In Vercel project, go to **Settings** > **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` environment variable
5. Update CORS configuration in S3 buckets

---

## Post-Deployment Configuration

### 1. Update S3 CORS for Production Domain

Update CORS configuration to include your production domain:

```bash
# Update cors-config.json with your production URL
# Then apply:
aws s3api put-bucket-cors \
  --bucket your-photos-bucket \
  --cors-configuration file://docs/s3-configs/cors-config.json

aws s3api put-bucket-cors \
  --bucket your-invoices-bucket \
  --cors-configuration file://docs/s3-configs/cors-config.json
```

### 2. Configure Vercel Security Headers

The `vercel.json` file already includes security headers:
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy

Verify these are applied by checking response headers.

### 3. Set Up Monitoring (Recommended)

**Vercel Analytics:**
1. Go to **Analytics** tab in Vercel dashboard
2. Enable Web Analytics
3. Monitor page views, performance, and errors

**Supabase Monitoring:**
1. Go to **Reports** in Supabase dashboard
2. Monitor database performance
3. Set up alerts for high usage

**AWS CloudWatch (Optional):**
1. Enable S3 metrics in AWS Console
2. Set up alarms for unusual activity
3. Monitor storage costs

### 4. Configure Backups

**Database Backups:**
- Supabase Pro plan includes automatic daily backups
- For Free tier, set up manual backup script:
  ```bash
  pg_dump [CONNECTION_STRING] > backup_$(date +%Y%m%d).sql
  ```

**S3 Versioning:**
- Already enabled if you chose "yes" during setup
- Allows recovery of deleted/overwritten files

---

## Verification & Testing

### 1. Smoke Tests

After deployment, verify core functionality:

- [ ] **Homepage loads**: Visit your deployment URL
- [ ] **Signup works**: Create a test hotel account
- [ ] **Login works**: Log in with test account
- [ ] **Photo upload works**: Upload hotel photo in profile
- [ ] **Menu management**: Add, edit, delete menu items
- [ ] **Billing workflow**: Generate an invoice
- [ ] **PDF generation**: Download invoice PDF
- [ ] **Reports**: View daily/monthly reports
- [ ] **Export**: Export CSV and PDF reports

### 2. Security Checks

- [ ] HTTPS is enforced (no HTTP access)
- [ ] S3 buckets are private (direct URLs return 403)
- [ ] Presigned URLs work and expire after 15 minutes
- [ ] JWT tokens expire after 24 hours
- [ ] Rate limiting is active (test with rapid requests)
- [ ] CORS only allows your domain

### 3. Performance Tests

Use Lighthouse or WebPageTest:

- [ ] Page load time < 3 seconds
- [ ] First Contentful Paint < 1.5 seconds
- [ ] Time to Interactive < 3.5 seconds
- [ ] Lighthouse Performance score > 90

### 4. Mobile Testing

Test on actual mobile devices:

- [ ] Responsive layout works on mobile
- [ ] Touch interactions work smoothly
- [ ] Forms are usable on small screens
- [ ] Images load appropriately

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Symptom**: "Connection timeout" or "Connection refused"

**Solutions**:
- Verify you're using the connection pooling string (port 6543)
- Check DATABASE_URL is set correctly in Vercel
- Ensure Supabase project is active (not paused)
- Verify IP allowlist in Supabase (should allow all for Vercel)

#### 2. S3 Upload Failures

**Symptom**: "Access Denied" or CORS errors

**Solutions**:
- Verify IAM user has correct permissions
- Check bucket CORS includes your domain
- Ensure presigned URLs haven't expired
- Verify bucket names match environment variables

#### 3. PDF Generation Fails

**Symptom**: "Puppeteer error" or timeout

**Solutions**:
- Ensure `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` is set
- Increase function timeout in vercel.json (already set to 30s)
- Check Vercel function logs for specific errors
- Consider using a PDF generation service for large invoices

#### 4. AI Invoice Generation Fails

**Symptom**: Falls back to deterministic method every time

**Solutions**:
- Verify HUGGINGFACE_API_KEY is correct
- Check Hugging Face API quota/rate limits
- Test API key with curl:
  ```bash
  curl https://api-inference.huggingface.co/models/facebook/bart-large-cnn \
    -H "Authorization: Bearer YOUR_API_KEY"
  ```
- Fallback is working as designed - no action needed if acceptable

#### 5. Build Failures

**Symptom**: Vercel build fails

**Solutions**:
- Check build logs in Vercel dashboard
- Verify all dependencies are in package.json
- Ensure TypeScript types are correct
- Run `npm run build` locally to reproduce

### Getting Help

1. **Check Logs**:
   - Vercel: Functions > View Logs
   - Supabase: Logs & Reports
   - AWS: CloudWatch Logs

2. **Documentation**:
   - [Vercel Docs](https://vercel.com/docs)
   - [Supabase Docs](https://supabase.com/docs)
   - [AWS S3 Docs](https://docs.aws.amazon.com/s3/)

3. **Support**:
   - Vercel: support@vercel.com
   - Supabase: Dashboard > Support
   - AWS: AWS Support Center

---

## Maintenance & Updates

### Regular Maintenance Tasks

**Weekly**:
- [ ] Review error logs in Vercel
- [ ] Check database performance in Supabase
- [ ] Monitor S3 storage costs

**Monthly**:
- [ ] Review and rotate API keys
- [ ] Check for dependency updates
- [ ] Review and optimize database queries
- [ ] Analyze usage patterns and costs

**Quarterly**:
- [ ] Update dependencies (`npm update`)
- [ ] Review and update security policies
- [ ] Test backup restoration procedures
- [ ] Audit user access and permissions

### Deploying Updates

Vercel automatically deploys when you push to your main branch:

```bash
# Make changes locally
git add .
git commit -m "Your update message"
git push origin main

# Vercel will automatically:
# 1. Build your application
# 2. Run tests (if configured)
# 3. Deploy to production
# 4. Provide deployment URL
```

### Rolling Back

If a deployment has issues:

1. Go to Vercel dashboard
2. Click **"Deployments"**
3. Find the last working deployment
4. Click **"..."** > **"Promote to Production"**

### Database Migrations

For schema changes:

1. Test migration locally
2. Create backup of production database
3. Run migration in Supabase SQL Editor
4. Verify data integrity
5. Deploy application updates

### Scaling Considerations

**When to upgrade**:

- **Vercel**: Upgrade to Pro if you exceed:
  - 100 GB bandwidth/month
  - 100 hours serverless function execution
  - Need team collaboration

- **Supabase**: Upgrade to Pro if you need:
  - More than 500 MB database
  - More than 2 GB bandwidth
  - Daily backups
  - Better performance

- **AWS S3**: Costs scale automatically with usage
  - Monitor monthly costs
  - Consider lifecycle policies for old files
  - Use CloudFront CDN for high traffic

---

## Security Best Practices

### Production Checklist

- [ ] All secrets are in environment variables (not code)
- [ ] HTTPS is enforced everywhere
- [ ] Database uses connection pooling
- [ ] S3 buckets are private
- [ ] Presigned URLs have short expiration (15 min)
- [ ] JWT tokens expire (24 hours)
- [ ] Rate limiting is enabled
- [ ] Input validation is comprehensive
- [ ] Error messages don't expose sensitive data
- [ ] Dependencies are up to date
- [ ] Backups are configured and tested

### Incident Response

If you suspect a security breach:

1. **Immediate Actions**:
   - Rotate all API keys and secrets
   - Review access logs
   - Disable compromised accounts

2. **Investigation**:
   - Check Vercel function logs
   - Review Supabase auth logs
   - Check S3 access logs (if enabled)

3. **Recovery**:
   - Restore from backup if needed
   - Update security policies
   - Notify affected users if required

---

## Additional Resources

- [Project README](../README.md)
- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [S3 Bucket Setup Guide](./S3_BUCKET_SETUP.md)
- [Security Documentation](./SECURITY.md)
- [API Documentation](../lib/README.md)

---

## Support

For deployment issues specific to this project, please:

1. Check this documentation thoroughly
2. Review error logs in respective platforms
3. Search existing GitHub issues
4. Create a new issue with:
   - Detailed error description
   - Steps to reproduce
   - Environment details
   - Relevant log excerpts

---

**Last Updated**: November 2024  
**Version**: 1.0.0
