# Deployment Guide - GitHub & Vercel

## 🚀 Deploy Your Application

Your code is already on GitHub. Now let's deploy it so it's live on the internet!

**GitHub Repository:** https://github.com/Srinivas-BH/Hotel-Billing.git

---

## Option 1: Deploy to Vercel (Recommended) ⭐

Vercel is the best platform for Next.js applications. It's free and takes 5 minutes!

### Step 1: Create Vercel Account

1. Go to https://vercel.com
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub

### Step 2: Import Your Repository

1. Click "Add New..." → "Project"
2. Find "Hotel-Billing" in your repositories
3. Click "Import"

### Step 3: Configure Project

**Framework Preset:** Next.js (auto-detected)

**Build Command:** `npm run build`

**Output Directory:** `.next`

**Install Command:** `npm install`

### Step 4: Add Environment Variables

Click "Environment Variables" and add:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.qbjtuqgvlvcvqrxkmsbw.supabase.co:5432/postgres
JWT_SECRET=your-production-secret-key
JWT_EXPIRES_IN=24h
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

**Important:** 
- Replace `YOUR_PASSWORD` with your Supabase password
- Generate a new `JWT_SECRET` for production (use: `openssl rand -base64 32`)
- Update `NEXT_PUBLIC_APP_URL` after deployment

### Step 5: Deploy!

1. Click "Deploy"
2. Wait 2-3 minutes
3. Your app will be live!

### Step 6: Get Your URL

After deployment, you'll get a URL like:
```
https://hotel-billing-xyz.vercel.app
```

### Step 7: Update Environment Variable

1. Go to Project Settings → Environment Variables
2. Update `NEXT_PUBLIC_APP_URL` with your actual Vercel URL
3. Redeploy (Deployments → ... → Redeploy)

---

## Option 2: Deploy with Vercel CLI

If you prefer command line:

### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

### Step 2: Login

```bash
vercel login
```

### Step 3: Deploy

```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? **Your account**
- Link to existing project? **N**
- What's your project's name? **hotel-billing**
- In which directory is your code located? **./**
- Want to override settings? **N**

### Step 4: Add Environment Variables

```bash
vercel env add DATABASE_URL
# Paste your Supabase connection string

vercel env add JWT_SECRET
# Paste your JWT secret

vercel env add JWT_EXPIRES_IN
# Enter: 24h

vercel env add NEXT_PUBLIC_APP_URL
# Enter your Vercel URL

vercel env add NODE_ENV
# Enter: production
```

### Step 5: Deploy to Production

```bash
vercel --prod
```

---

## Option 3: GitHub Actions (Automatic Deployment)

Set up automatic deployment on every push:

### Step 1: Create GitHub Action

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm test
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Step 2: Add Secrets to GitHub

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add these secrets:
   - `VERCEL_TOKEN` - Get from Vercel Account Settings → Tokens
   - `VERCEL_ORG_ID` - Get from Vercel project settings
   - `VERCEL_PROJECT_ID` - Get from Vercel project settings

---

## Post-Deployment Checklist

### ✅ Verify Deployment

1. **Visit your URL**
   - Check if site loads
   - Test all pages

2. **Test Features**
   - Sign up / Login
   - Add menu items
   - Generate invoice
   - View reports
   - Export PDF

3. **Check Performance**
   - Open DevTools → Network
   - Generate invoice
   - Should be < 2 seconds

4. **Test Mobile**
   - Open on phone
   - Test all features
   - Check responsiveness

### ✅ Update Documentation

1. **Update README.md**
   ```markdown
   ## Live Demo
   https://your-app.vercel.app
   ```

2. **Update AWS_BLOG_POST.md**
   - Add live demo URL
   - Add production screenshots

3. **Push changes**
   ```bash
   git add .
   git commit -m "Add live demo URL"
   git push
   ```

---

## Troubleshooting

### Build Fails

**Error:** "Module not found"
**Solution:** 
```bash
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### Database Connection Fails

**Error:** "Connection timeout"
**Solution:** 
- Check `DATABASE_URL` in Vercel environment variables
- Ensure Supabase allows connections from Vercel IPs
- Test connection string locally first

### Environment Variables Not Working

**Solution:**
1. Go to Vercel Project Settings
2. Environment Variables
3. Verify all variables are set
4. Redeploy

### 500 Internal Server Error

**Solution:**
1. Check Vercel logs (Deployments → View Function Logs)
2. Look for error messages
3. Fix the issue
4. Redeploy

---

## Performance Optimization

### Enable Caching

Vercel automatically caches:
- Static assets
- API responses (with headers)
- Page renders

### Add Custom Domain (Optional)

1. Go to Vercel Project Settings
2. Domains
3. Add your domain
4. Update DNS records
5. Wait for SSL certificate

---

## Monitoring

### Vercel Analytics

1. Go to your project on Vercel
2. Analytics tab
3. View:
   - Page views
   - Performance metrics
   - Error rates

### Set Up Alerts

1. Project Settings → Notifications
2. Add email for:
   - Deployment failures
   - Performance issues
   - Error spikes

---

## Cost

### Vercel Free Tier Includes:

✅ Unlimited deployments  
✅ 100GB bandwidth/month  
✅ Automatic HTTPS  
✅ Global CDN  
✅ Serverless functions  
✅ Analytics  

**Perfect for this project!**

---

## Quick Commands Reference

```bash
# Deploy to Vercel
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls

# Remove deployment
vercel rm [deployment-url]

# Add environment variable
vercel env add [NAME]

# Pull environment variables
vercel env pull
```

---

## Success Checklist

- [ ] Vercel account created
- [ ] Repository imported to Vercel
- [ ] Environment variables configured
- [ ] Application deployed
- [ ] Live URL obtained
- [ ] All features tested
- [ ] Performance verified
- [ ] Documentation updated
- [ ] Blog post updated with live URL

---

## 🎉 You're Live!

Once deployed, your application will be accessible at:

```
https://hotel-billing-[your-id].vercel.app
```

Share it with the world! 🚀

---

## Next Steps

1. **Test thoroughly** on production
2. **Update blog post** with live URL
3. **Take screenshots** of live site
4. **Submit to AWS Builder Center**
5. **Promote on social media**

---

**Need Help?**

- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- GitHub Issues: https://github.com/Srinivas-BH/Hotel-Billing/issues

---

**Last Updated:** November 28, 2025  
**Status:** Ready to Deploy  
**Platform:** Vercel (Recommended)
