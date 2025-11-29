# ✅ AWS Amplify Deployment Checklist

Use this checklist to deploy your Hotel Billing Management System to AWS Amplify.

## 📋 Pre-Deployment Checklist

### 1. Code Preparation
- [ ] All code is committed to Git
- [ ] All tests are passing (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] Environment variables documented in `.env.example`

### 2. GitHub Setup
- [ ] Code pushed to GitHub repository
- [ ] Repository is accessible
- [ ] Main branch is up to date
- [ ] .gitignore is properly configured

### 3. Database Setup
- [ ] Supabase project created (or PostgreSQL database ready)
- [ ] Database schema applied (`database-schema.sql`)
- [ ] Database connection tested (`node test-db-connection.js`)
- [ ] Connection string obtained
- [ ] Special characters in password URL-encoded

### 4. AWS Account
- [ ] AWS account created
- [ ] Payment method added (for verification)
- [ ] AWS Amplify service accessible
- [ ] IAM permissions configured (if needed)

### 5. AWS S3 (Optional but Recommended)
- [ ] S3 buckets created (photos and invoices)
- [ ] CORS configured on buckets
- [ ] IAM user created for S3 access
- [ ] Access keys obtained (Access Key ID and Secret)
- [ ] Bucket names documented

## 🚀 Deployment Steps

### Step 1: Connect to AWS Amplify
- [ ] Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
- [ ] Click "New app" → "Host web app"
- [ ] Select "GitHub" as source
- [ ] Authorize AWS Amplify
- [ ] Select your repository
- [ ] Select branch: `main`

### Step 2: Configure Build Settings
- [ ] App name: `hotel-billing-admin`
- [ ] Build settings auto-detected
- [ ] Verify `amplify.yml` is recognized
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`

### Step 3: Add Environment Variables
Add these in Amplify Console → Environment variables:

#### Required Variables
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - Secret key (32+ characters)
- [ ] `JWT_EXPIRES_IN` - Token expiration (e.g., 24h)
- [ ] `NEXT_PUBLIC_APP_URL` - Your app URL (update after first deploy)
- [ ] `NODE_ENV` - Set to `production`

#### Optional Variables (for full functionality)
- [ ] `AWS_REGION` - AWS region (e.g., us-east-1)
- [ ] `AWS_ACCESS_KEY_ID` - S3 access key
- [ ] `AWS_SECRET_ACCESS_KEY` - S3 secret key
- [ ] `S3_BUCKET_PHOTOS` - Photos bucket name
- [ ] `S3_BUCKET_INVOICES` - Invoices bucket name
- [ ] `HUGGINGFACE_API_KEY` - AI API key (optional)
- [ ] `HUGGINGFACE_MODEL` - AI model name (optional)

### Step 4: Deploy
- [ ] Click "Save and deploy"
- [ ] Monitor build logs
- [ ] Wait for deployment (5-10 minutes)
- [ ] Note your app URL

### Step 5: Post-Deployment Configuration
- [ ] Copy your Amplify app URL
- [ ] Update `NEXT_PUBLIC_APP_URL` environment variable
- [ ] Redeploy to apply changes
- [ ] Verify SSL certificate is active (🔒)

## 🧪 Post-Deployment Testing

### Functionality Tests
- [ ] Application loads successfully
- [ ] Homepage displays correctly
- [ ] Can navigate to signup page
- [ ] Can create new account
- [ ] Can login with credentials
- [ ] Dashboard loads after login
- [ ] Can add menu items
- [ ] Can generate invoices
- [ ] PDF download works
- [ ] Reports page loads
- [ ] Can view daily/monthly reports
- [ ] Can export reports as PDF
- [ ] Profile page loads
- [ ] Can update profile information
- [ ] Can logout successfully

### Technical Tests
- [ ] All pages load within 3 seconds
- [ ] No console errors in browser
- [ ] Mobile responsive design works
- [ ] HTTPS is enforced
- [ ] Database queries work
- [ ] S3 uploads work (if configured)
- [ ] Authentication persists across page refreshes
- [ ] Session expires correctly

### Security Tests
- [ ] Cannot access dashboard without login
- [ ] Cannot access other users' data
- [ ] Passwords are not visible in network requests
- [ ] JWT tokens are secure
- [ ] HTTPS is enforced
- [ ] No sensitive data in client-side code

## 🌍 Custom Domain Setup (Optional)

- [ ] Domain name purchased
- [ ] In Amplify Console, go to "Domain management"
- [ ] Click "Add domain"
- [ ] Enter your domain
- [ ] Copy provided DNS records
- [ ] Add CNAME records to domain registrar
- [ ] Wait for DNS propagation (5-30 minutes)
- [ ] Verify SSL certificate is issued
- [ ] Test custom domain access

## 📊 Monitoring Setup

- [ ] Enable Amplify monitoring
- [ ] Set up CloudWatch alarms
- [ ] Configure error notifications
- [ ] Set up performance monitoring
- [ ] Enable access logs

## 🔄 Continuous Deployment

- [ ] Verify auto-deploy is enabled
- [ ] Test by pushing a small change
- [ ] Confirm automatic build triggers
- [ ] Verify deployment succeeds

## 📝 Documentation Updates

- [ ] Update README with production URL
- [ ] Document any deployment-specific configurations
- [ ] Update team on deployment status
- [ ] Share access credentials securely

## 🎉 Launch Checklist

### Before Going Live
- [ ] All tests passing
- [ ] Performance is acceptable
- [ ] Security measures in place
- [ ] Backup strategy defined
- [ ] Monitoring configured
- [ ] Error handling tested
- [ ] User documentation ready

### Launch Day
- [ ] Final deployment completed
- [ ] All functionality verified
- [ ] Team notified
- [ ] Users can access application
- [ ] Monitoring active
- [ ] Support channels ready

### Post-Launch
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Address any issues promptly
- [ ] Plan next iteration

## 🆘 Troubleshooting

### Build Fails
- [ ] Check build logs in Amplify Console
- [ ] Verify all dependencies in package.json
- [ ] Check for TypeScript errors
- [ ] Verify environment variables are set
- [ ] Clear cache and rebuild

### Database Connection Fails
- [ ] Verify DATABASE_URL is correct
- [ ] Check special characters are URL-encoded
- [ ] Verify database is running
- [ ] Check firewall rules
- [ ] Test connection locally

### Application Errors
- [ ] Check CloudWatch logs
- [ ] Verify environment variables
- [ ] Check for missing dependencies
- [ ] Verify API endpoints are accessible
- [ ] Test locally with production env vars

## 📞 Support Resources

- **AWS Amplify Docs**: https://docs.amplify.aws/
- **Supabase Docs**: https://supabase.com/docs
- **Project README**: See README.md
- **Deployment Guide**: See DEPLOYMENT_GUIDE.md
- **GitHub Issues**: Open an issue for help

## ✅ Deployment Complete!

Once all items are checked:

🎉 **Congratulations!** Your Hotel Billing Management System is live on AWS!

**Your Application URL**: `https://your-app.amplifyapp.com`

**Next Steps**:
1. Share the URL with your team
2. Monitor performance and errors
3. Gather user feedback
4. Plan feature enhancements
5. Celebrate your success! 🎊

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Production URL**: _______________
**Status**: ⬜ In Progress | ⬜ Complete
