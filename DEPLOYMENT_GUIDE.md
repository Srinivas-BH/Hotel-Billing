# 🚀 AWS Deployment Guide - Hotel Billing Management System

Complete guide to deploy your Hotel Billing Management System on AWS using AWS Amplify.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS Account Setup](#aws-account-setup)
3. [Database Setup (Supabase)](#database-setup)
4. [AWS S3 Configuration](#aws-s3-configuration)
5. [AWS Amplify Deployment](#aws-amplify-deployment)
6. [Environment Variables](#environment-variables)
7. [Custom Domain Setup](#custom-domain-setup)
8. [Monitoring & Logs](#monitoring--logs)
9. [Troubleshooting](#troubleshooting)

## ✅ Prerequisites

Before starting, ensure you have:

- ✅ AWS Account (free tier eligible)
- ✅ GitHub account with your code pushed
- ✅ Supabase account (or PostgreSQL database)
- ✅ Domain name (optional, for custom domain)
- ✅ Credit card for AWS verification (won't be charged on free tier)

## 🔐 AWS Account Setup

### Step 1: Create AWS Account

1. Go to [AWS Console](https://aws.amazon.com/)
2. Click "Create an AWS Account"
3. Fill in your details:
   - Email address
   - Password
   - AWS account name
4. Choose "Personal" account type
5. Enter payment information (required for verification)
6. Verify your phone number
7. Select "Free" support plan

### Step 2: Enable Required Services

1. **AWS Amplify** - For hosting the application
2. **AWS S3** - For file storage (invoices, photos)
3. **AWS IAM** - For access management

## 🗄️ Database Setup

### Option 1: Supabase (Recommended)

1. **Create Supabase Project**
   - Go to [Supabase](https://supabase.com/)
   - Click "New Project"
   - Choose organization
   - Enter project details:
     - Name: `hotel-billing-db`
     - Database Password: (save this!)
     - Region: Choose closest to your users
   - Click "Create new project"

2. **Run Database Schema**
   - Go to SQL Editor in Supabase
   - Copy content from `database-schema.sql`
   - Paste and click "Run"
   - Verify tables are created

3. **Get Connection String**
   - Go to Project Settings → Database
   - Copy the connection string
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres`
   - **Important**: URL-encode special characters in password
     - `$` becomes `%24`
     - `@` becomes `%40`
     - `#` becomes `%23`

### Option 2: AWS RDS PostgreSQL

1. Go to AWS RDS Console
2. Click "Create database"
3. Choose PostgreSQL
4. Select "Free tier" template
5. Configure:
   - DB instance identifier: `hotel-billing-db`
   - Master username: `postgres`
   - Master password: (save this!)
6. Enable public access
7. Create database
8. Run schema from `database-schema.sql`

## 📦 AWS S3 Configuration

### Step 1: Create S3 Buckets

1. **Go to S3 Console**
   - Navigate to [S3 Console](https://s3.console.aws.amazon.com/)

2. **Create Photos Bucket**
   - Click "Create bucket"
   - Bucket name: `hotel-billing-photos-[your-unique-id]`
   - Region: Same as your Amplify app
   - Block all public access: ✅ (keep checked)
   - Enable versioning: Optional
   - Click "Create bucket"

3. **Create Invoices Bucket**
   - Click "Create bucket"
   - Bucket name: `hotel-billing-invoices-[your-unique-id]`
   - Region: Same as your Amplify app
   - Block all public access: ✅ (keep checked)
   - Click "Create bucket"

### Step 2: Configure CORS

For each bucket:

1. Go to bucket → Permissions → CORS
2. Add this configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### Step 3: Create IAM User for S3 Access

1. **Go to IAM Console**
   - Navigate to [IAM Console](https://console.aws.amazon.com/iam/)

2. **Create User**
   - Click "Users" → "Add users"
   - User name: `hotel-billing-s3-user`
   - Access type: ✅ Programmatic access
   - Click "Next: Permissions"

3. **Attach Policies**
   - Click "Attach existing policies directly"
   - Search and select: `AmazonS3FullAccess`
   - Click "Next" → "Create user"

4. **Save Credentials**
   - **Access Key ID**: Save this!
   - **Secret Access Key**: Save this! (won't be shown again)

## 🌐 AWS Amplify Deployment

### Step 1: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Hotel Billing System"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/hotel-billing-admin.git

# Push to GitHub
git push -u origin main
```

### Step 2: Connect to AWS Amplify

1. **Go to AWS Amplify Console**
   - Navigate to [AWS Amplify](https://console.aws.amazon.com/amplify/)
   - Click "Get Started" under "Amplify Hosting"

2. **Connect Repository**
   - Choose "GitHub"
   - Click "Continue"
   - Authorize AWS Amplify to access GitHub
   - Select your repository
   - Select branch: `main`
   - Click "Next"

3. **Configure Build Settings**
   - App name: `hotel-billing-admin`
   - Environment: `production`
   - Build settings will be auto-detected
   - Edit `amplify.yml` if needed:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

4. **Advanced Settings**
   - Click "Advanced settings"
   - Add environment variables (see next section)

### Step 3: Add Environment Variables

In Amplify Console → Environment variables, add:

```env
# Database
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:5432/postgres

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=24h

# Application
NEXT_PUBLIC_APP_URL=https://your-app.amplifyapp.com
NODE_ENV=production

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
S3_BUCKET_PHOTOS=hotel-billing-photos-your-id
S3_BUCKET_INVOICES=hotel-billing-invoices-your-id

# Hugging Face AI (Optional)
HUGGINGFACE_API_KEY=your-huggingface-api-key
HUGGINGFACE_MODEL=facebook/bart-large-cnn
```

**Important Notes:**
- URL-encode special characters in DATABASE_URL
- Generate a strong JWT_SECRET (32+ characters)
- Use your actual S3 bucket names
- NEXT_PUBLIC_APP_URL will be provided after first deployment

### Step 4: Deploy

1. Click "Save and deploy"
2. Wait for deployment (5-10 minutes)
3. Monitor the build logs
4. Once complete, you'll get a URL like: `https://main.d1234567890.amplifyapp.com`

### Step 5: Update Environment Variables

1. Copy your Amplify app URL
2. Go back to Environment variables
3. Update `NEXT_PUBLIC_APP_URL` with your actual URL
4. Save and redeploy

## 🌍 Custom Domain Setup

### Step 1: Add Custom Domain

1. In Amplify Console, go to "Domain management"
2. Click "Add domain"
3. Enter your domain: `yourdomain.com`
4. Click "Configure domain"

### Step 2: Configure DNS

1. Amplify will provide DNS records
2. Go to your domain registrar (GoDaddy, Namecheap, etc.)
3. Add the provided CNAME records:
   ```
   Type: CNAME
   Name: www
   Value: [provided by Amplify]
   ```

4. Wait for DNS propagation (5-30 minutes)
5. SSL certificate will be automatically provisioned

### Step 3: Verify

1. Visit `https://yourdomain.com`
2. Verify SSL certificate is active (🔒 in browser)
3. Test all functionality

## 📊 Monitoring & Logs

### View Build Logs

1. Go to Amplify Console
2. Click on your app
3. Select a deployment
4. View build logs for debugging

### View Application Logs

1. In Amplify Console, go to "Monitoring"
2. View:
   - Request count
   - Error rate
   - Response time
   - Data transfer

### Set Up Alarms

1. Go to CloudWatch
2. Create alarms for:
   - High error rate
   - Slow response time
   - High data transfer

## 🔧 Troubleshooting

### Build Fails

**Issue**: Build fails with "Module not found"
```bash
# Solution: Clear cache and rebuild
# In Amplify Console:
# 1. Go to Build settings
# 2. Clear cache
# 3. Redeploy
```

**Issue**: Environment variables not working
```bash
# Solution: Verify variables are set correctly
# 1. Check for typos
# 2. Ensure no trailing spaces
# 3. URL-encode special characters
# 4. Redeploy after changes
```

### Database Connection Fails

**Issue**: "password authentication failed"
```bash
# Solution: Check DATABASE_URL encoding
# Special characters must be URL-encoded:
# $ → %24
# @ → %40
# # → %23
# Example:
# Wrong: postgresql://postgres:Pass$123@host:5432/db
# Right: postgresql://postgres:Pass%24123@host:5432/db
```

**Issue**: "Connection timeout"
```bash
# Solution: Check Supabase/RDS settings
# 1. Verify database is running
# 2. Check firewall rules
# 3. Ensure public access is enabled
# 4. Verify connection string is correct
```

### S3 Upload Fails

**Issue**: "Access Denied" when uploading
```bash
# Solution: Check IAM permissions
# 1. Verify AWS credentials are correct
# 2. Check bucket policy
# 3. Verify CORS configuration
# 4. Ensure bucket names match environment variables
```

### Application Errors

**Issue**: 500 Internal Server Error
```bash
# Solution: Check application logs
# 1. Go to Amplify Console → Monitoring
# 2. Check CloudWatch logs
# 3. Look for error stack traces
# 4. Fix code and redeploy
```

## 🎯 Post-Deployment Checklist

- [ ] Application loads successfully
- [ ] Can create new account (signup)
- [ ] Can login with credentials
- [ ] Can add menu items
- [ ] Can generate invoices
- [ ] PDF download works
- [ ] Reports page loads
- [ ] Profile update works
- [ ] Mobile responsive design works
- [ ] HTTPS is enabled
- [ ] Custom domain works (if configured)
- [ ] All environment variables are set
- [ ] Database connection is stable
- [ ] S3 uploads work (if configured)

## 💰 Cost Estimation

### AWS Free Tier (First 12 Months)

- **Amplify**: 1000 build minutes/month, 15 GB storage, 15 GB data transfer
- **S3**: 5 GB storage, 20,000 GET requests, 2,000 PUT requests
- **RDS** (if used): 750 hours/month of db.t2.micro

### After Free Tier

- **Amplify**: ~$0.01 per build minute, ~$0.15/GB storage
- **S3**: ~$0.023/GB storage, ~$0.005 per 1000 requests
- **Supabase**: Free tier available, Pro starts at $25/month

**Estimated Monthly Cost**: $0-10 for small to medium usage

## 🔄 Continuous Deployment

Once set up, every push to your GitHub repository will:

1. Trigger automatic build
2. Run tests
3. Deploy to production
4. Update your live site

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Amplify automatically deploys!
```

## 📞 Support

- **AWS Support**: [AWS Support Center](https://console.aws.amazon.com/support/)
- **Amplify Docs**: [AWS Amplify Documentation](https://docs.amplify.aws/)
- **Supabase Docs**: [Supabase Documentation](https://supabase.com/docs)

## 🎉 Success!

Your Hotel Billing Management System is now live on AWS! 🚀

**Next Steps:**
1. Share your app URL with users
2. Monitor performance and errors
3. Gather user feedback
4. Iterate and improve

---

**Need Help?** Open an issue on GitHub or contact support.
