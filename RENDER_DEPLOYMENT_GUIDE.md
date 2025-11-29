# 🚀 Deploy Hotel Billing Admin to Render.com

This guide will help you deploy your Hotel Billing Management Admin Portal to Render.com for **FREE**.

---

## 📋 Prerequisites

Before deploying, make sure you have:

1. ✅ A GitHub account with your code pushed to a repository
2. ✅ A Render.com account (sign up at https://render.com)
3. ✅ A Supabase PostgreSQL database (already set up)
4. ✅ AWS S3 buckets configured (for file storage)
5. ✅ Hugging Face API key (optional, has fallback)

---

## 🎯 Step-by-Step Deployment

### Step 1: Push Your Code to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit your changes
git commit -m "Ready for Render deployment"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to GitHub
git push -u origin main
```

### Step 2: Create a New Web Service on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** button
3. Select **"Web Service"**
4. Connect your GitHub repository
5. Select your **hotel-billing-admin** repository

### Step 3: Configure Your Web Service

Fill in the following settings:

**Basic Settings:**
- **Name:** `hotel-billing-admin` (or your preferred name)
- **Region:** Choose closest to you (e.g., Oregon, Frankfurt)
- **Branch:** `main` (or your default branch)
- **Root Directory:** Leave blank
- **Runtime:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

**Instance Type:**
- Select **"Free"** plan

### Step 4: Add Environment Variables

Scroll down to **"Environment Variables"** section and add these **5 REQUIRED variables**:

#### 1. DATABASE_URL
```
Key: DATABASE_URL
Value: postgresql://postgres:Srinivas%242706BH@db.qbjtuqgvlvcvqrxkmsbw.supabase.co:5432/postgres
```

#### 2. JWT_SECRET
```
Key: JWT_SECRET
Value: ruC3c3ZHiHsz7pG+jEEdqr83yFTtBvstuOYeFjL2p8s=
```

#### 3. JWT_EXPIRES_IN
```
Key: JWT_EXPIRES_IN
Value: 24h
```

#### 4. NEXT_PUBLIC_APP_URL
```
Key: NEXT_PUBLIC_APP_URL
Value: https://hotel-billing-admin.onrender.com
```
*(Replace with your actual Render URL after deployment)*

#### 5. NODE_ENV
```
Key: NODE_ENV
Value: production
```

**Optional but Recommended (for full functionality):**

#### 6. AWS_REGION
```
Key: AWS_REGION
Value: us-east-1
```

#### 7. AWS_ACCESS_KEY_ID
```
Key: AWS_ACCESS_KEY_ID
Value: YOUR_AWS_ACCESS_KEY
```

#### 8. AWS_SECRET_ACCESS_KEY
```
Key: AWS_SECRET_ACCESS_KEY
Value: YOUR_AWS_SECRET_KEY
```

#### 9. S3_BUCKET_PHOTOS
```
Key: S3_BUCKET_PHOTOS
Value: YOUR_PHOTOS_BUCKET_NAME
```

#### 10. S3_BUCKET_INVOICES
```
Key: S3_BUCKET_INVOICES
Value: YOUR_INVOICES_BUCKET_NAME
```

#### 11. HUGGINGFACE_API_KEY (Optional)
```
Key: HUGGINGFACE_API_KEY
Value: YOUR_HUGGINGFACE_API_KEY
```

#### 12. HUGGINGFACE_MODEL (Optional)
```
Key: HUGGINGFACE_MODEL
Value: facebook/bart-large-cnn
```

### Step 5: Deploy!

1. Click **"Create Web Service"** button at the bottom
2. Render will start building your application
3. Wait 5-10 minutes for the build to complete
4. Your app will be live at: `https://hotel-billing-admin.onrender.com`

---

## 🔄 Update NEXT_PUBLIC_APP_URL

After your first deployment:

1. Copy your Render URL (e.g., `https://hotel-billing-admin.onrender.com`)
2. Go to **Environment** tab in Render dashboard
3. Update `NEXT_PUBLIC_APP_URL` with your actual URL
4. Click **"Save Changes"**
5. Render will automatically redeploy

---

## ✅ Verify Your Deployment

1. Visit your Render URL
2. You should see the login page
3. Try creating an account
4. Test the billing workflow

---

## 🐛 Troubleshooting

### Build Fails

**Error:** `Module not found`
- **Solution:** Make sure all dependencies are in `package.json`
- Run `npm install` locally to verify

**Error:** `Out of memory`
- **Solution:** Render free tier has 512MB RAM. Optimize your build or upgrade plan

### App Crashes on Start

**Error:** `Cannot connect to database`
- **Solution:** Check your `DATABASE_URL` is correct
- Verify Supabase database is accessible

**Error:** `Port already in use`
- **Solution:** Render automatically assigns a port. Make sure your app uses `process.env.PORT`

### PDF Generation Fails

**Error:** `Puppeteer Chrome not found`
- **Solution:** Add these environment variables:
  ```
  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
  PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
  ```

### S3 Upload Fails

**Error:** `Access Denied`
- **Solution:** Verify your AWS credentials and bucket permissions
- Check bucket CORS configuration

---

## 🎉 Success!

Your Hotel Billing Admin Portal is now live on Render.com!

**Free Tier Limitations:**
- ⚠️ App sleeps after 15 minutes of inactivity
- ⚠️ First request after sleep takes 30-60 seconds to wake up
- ⚠️ 512MB RAM limit
- ⚠️ 750 hours/month free (enough for one app)

**To avoid sleep:**
- Upgrade to paid plan ($7/month)
- Use a service like UptimeRobot to ping your app every 10 minutes

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Render Free Tier Details](https://render.com/docs/free)

---

## 🔗 Quick Links

- **Render Dashboard:** https://dashboard.render.com
- **Your App:** https://hotel-billing-admin.onrender.com
- **Logs:** Check in Render dashboard under "Logs" tab
- **Metrics:** Check in Render dashboard under "Metrics" tab

---

**Need Help?** Check the Render logs in your dashboard for detailed error messages.
