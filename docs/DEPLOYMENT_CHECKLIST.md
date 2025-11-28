# Deployment Checklist

Use this checklist to ensure all deployment steps are completed correctly.

## Pre-Deployment Checklist

### Code Preparation
- [ ] All tests passing locally (`npm test`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No linting errors (`npm run lint`)
- [ ] All environment variables documented in `.env.example`
- [ ] Sensitive data removed from code
- [ ] Git repository is clean and up to date

### Documentation
- [ ] README.md is up to date
- [ ] API documentation is current
- [ ] Deployment guide reviewed
- [ ] Environment variables documented

## Database Setup (Supabase)

### Account & Project
- [ ] Supabase account created
- [ ] New project created
- [ ] Database password saved securely
- [ ] Project region selected (closest to users)

### Database Configuration
- [ ] Connection string obtained
- [ ] Connection pooling enabled (port 6543)
- [ ] Migrations run successfully
- [ ] All tables created (hotels, menu_items, invoices, invoice_items)
- [ ] Indexes verified
- [ ] Test query executed successfully

### Security
- [ ] Row Level Security policies reviewed (optional)
- [ ] Database password is strong
- [ ] Connection string stored securely
- [ ] Backup strategy planned

## Storage Setup (AWS S3)

### AWS Account
- [ ] AWS account created
- [ ] Billing alerts configured
- [ ] AWS CLI installed and configured

### S3 Buckets
- [ ] Photos bucket created
- [ ] Invoices bucket created
- [ ] Public access blocked on both buckets
- [ ] CORS configured for application domain
- [ ] Bucket policies set (HTTPS enforcement)
- [ ] Versioning enabled (optional but recommended)
- [ ] Lifecycle policies configured (optional)

### IAM Configuration
- [ ] IAM user created for application
- [ ] S3 access policy attached
- [ ] Access key ID obtained
- [ ] Secret access key obtained and stored securely
- [ ] Permissions tested

## Application Deployment (Vercel)

### Vercel Account
- [ ] Vercel account created
- [ ] GitHub repository connected
- [ ] Project imported

### Build Configuration
- [ ] Framework preset: Next.js
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`
- [ ] Node version: 18.x

### Environment Variables
All variables set for Production, Preview, and Development:

#### Database
- [ ] `DATABASE_URL` (with connection pooling)

#### AWS S3
- [ ] `AWS_REGION`
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `S3_BUCKET_PHOTOS`
- [ ] `S3_BUCKET_INVOICES`

#### Authentication
- [ ] `JWT_SECRET` (generated securely)
- [ ] `JWT_EXPIRES_IN`

#### AI Service
- [ ] `HUGGINGFACE_API_KEY`
- [ ] `HUGGINGFACE_MODEL`

#### Application
- [ ] `NEXT_PUBLIC_APP_URL` (production URL)
- [ ] `NODE_ENV` (set to "production")

#### Optional
- [ ] `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` (set to "true")

### Deployment
- [ ] Initial deployment triggered
- [ ] Build completed successfully
- [ ] Deployment URL obtained
- [ ] Custom domain configured (if applicable)

## Post-Deployment Configuration

### S3 CORS Update
- [ ] Production domain added to CORS configuration
- [ ] CORS applied to photos bucket
- [ ] CORS applied to invoices bucket
- [ ] CORS tested from production domain

### Security Headers
- [ ] Security headers verified in vercel.json
- [ ] HTTPS enforcement confirmed
- [ ] Headers tested with browser dev tools

### Monitoring Setup
- [ ] Vercel Analytics enabled
- [ ] Supabase monitoring reviewed
- [ ] AWS CloudWatch configured (optional)
- [ ] Error tracking configured (optional)

### Backups
- [ ] Database backup strategy confirmed
- [ ] S3 versioning verified
- [ ] Backup restoration tested

## Verification & Testing

### Smoke Tests
- [ ] Homepage loads
- [ ] Signup flow works
- [ ] Login works
- [ ] Photo upload works
- [ ] Menu CRUD operations work
- [ ] Invoice generation works
- [ ] PDF download works
- [ ] Reports display correctly
- [ ] CSV export works
- [ ] PDF export works

### Security Tests
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] S3 buckets are private (direct URLs return 403)
- [ ] Presigned URLs work
- [ ] Presigned URLs expire after 15 minutes
- [ ] JWT tokens expire after 24 hours
- [ ] Rate limiting active
- [ ] CORS only allows configured domains
- [ ] No sensitive data in error messages

### Performance Tests
- [ ] Page load time < 3 seconds
- [ ] Lighthouse Performance score > 90
- [ ] API response times acceptable
- [ ] PDF generation completes in reasonable time
- [ ] Mobile performance acceptable

### Mobile Tests
- [ ] Responsive layout works on mobile
- [ ] Touch interactions work
- [ ] Forms usable on small screens
- [ ] Images load appropriately
- [ ] Navigation works on mobile

### Cross-Browser Tests
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari
- [ ] Mobile Chrome

## Documentation Updates

- [ ] Production URLs updated in documentation
- [ ] Environment variable examples updated
- [ ] Deployment guide reflects actual setup
- [ ] Troubleshooting guide updated with production issues
- [ ] README badges updated (if applicable)

## Team Communication

- [ ] Deployment announced to team
- [ ] Access credentials shared securely
- [ ] Monitoring access granted
- [ ] Support procedures documented
- [ ] Incident response plan reviewed

## Maintenance Planning

### Regular Tasks Scheduled
- [ ] Weekly log reviews
- [ ] Monthly dependency updates
- [ ] Quarterly security audits
- [ ] Backup restoration tests

### Monitoring Alerts
- [ ] Error rate alerts
- [ ] Performance degradation alerts
- [ ] Cost alerts (AWS, Vercel, Supabase)
- [ ] Uptime monitoring

## Rollback Plan

- [ ] Previous deployment identified
- [ ] Rollback procedure documented
- [ ] Database rollback strategy defined
- [ ] Team knows how to execute rollback

## Sign-Off

- [ ] Technical lead approval
- [ ] Security review completed
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Team trained on new deployment

---

## Quick Reference

### Important URLs
- **Production**: https://your-app.vercel.app
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://app.supabase.com
- **AWS Console**: https://console.aws.amazon.com

### Emergency Contacts
- Vercel Support: support@vercel.com
- Supabase Support: Dashboard > Support
- AWS Support: AWS Support Center

### Key Commands
```bash
# Rollback deployment
# (In Vercel dashboard: Deployments > Previous > Promote)

# Check database status
psql $DATABASE_URL -c "SELECT 1"

# Verify S3 access
aws s3 ls s3://your-bucket-name

# View logs
# (In Vercel dashboard: Functions > Logs)
```

---

**Deployment Date**: _____________  
**Deployed By**: _____________  
**Version**: _____________  
**Notes**: _____________
