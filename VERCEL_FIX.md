# Fix Vercel Environment Variable Error

## ❌ Error Message

```
Environment Variable "DATABASE_URL" references Secret "database_url", which does not exist.
```

## ✅ Solution

This error happens when Vercel tries to use a secret that hasn't been created. Here's how to fix it:

---

## Method 1: Add Variables Directly (Easiest)

### Step 1: Go to Project Settings

1. Go to your Vercel dashboard
2. Click on your "hotel-billing" project
3. Click **"Settings"** tab
4. Click **"Environment Variables"** in left menu

### Step 2: Add Variables One by One

**Variable 1:**
```
Key: DATABASE_URL
Value: postgresql://postgres:Srinivas%242706BH@db.qbjtuqgvlvcvqrxkmsbw.supabase.co:5432/postgres
Environment: Production, Preview, Development (select all)
```
Click "Save"

**Variable 2:**
```
Key: JWT_SECRET
Value: ruC3c3ZHiHsz7pG+jEEdqr83yFTtBvstuOYeFjL2p8s=
Environment: Production, Preview, Development (select all)
```
Click "Save"

**Variable 3:**
```
Key: JWT_EXPIRES_IN
Value: 24h
Environment: Production, Preview, Development (select all)
```
Click "Save"

**Variable 4:**
```
Key: NEXT_PUBLIC_APP_URL
Value: https://hotel-billing.vercel.app
Environment: Production, Preview, Development (select all)
```
Click "Save"

**Variable 5:**
```
Key: NODE_ENV
Value: production
Environment: Production, Preview, Development (select all)
```
Click "Save"

### Step 3: Redeploy

1. Go to **"Deployments"** tab
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**
4. Wait 2 minutes
5. ✅ **Fixed!**

---

## Method 2: Remove GitHub Actions (If Using)

If you set up GitHub Actions, it might be causing the issue.

### Step 1: Remove Workflow File

Delete or rename the file:
```
.github/workflows/deploy.yml
```

### Step 2: Push Changes

```bash
git rm .github/workflows/deploy.yml
git commit -m "Remove GitHub Actions workflow"
git push
```

### Step 3: Deploy Manually

Use Method 1 above to add environment variables directly in Vercel dashboard.

---

## Method 3: Use Vercel CLI

### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

### Step 2: Login

```bash
vercel login
```

### Step 3: Add Environment Variables

```bash
vercel env add DATABASE_URL production
# Paste: postgresql://postgres:Srinivas%242706BH@db.qbjtuqgvlvcvqrxkmsbw.supabase.co:5432/postgres

vercel env add JWT_SECRET production
# Paste: ruC3c3ZHiHsz7pG+jEEdqr83yFTtBvstuOYeFjL2p8s=

vercel env add JWT_EXPIRES_IN production
# Paste: 24h

vercel env add NEXT_PUBLIC_APP_URL production
# Paste: https://hotel-billing.vercel.app

vercel env add NODE_ENV production
# Paste: production
```

### Step 4: Deploy

```bash
vercel --prod
```

---

## ✅ Verification

After fixing, verify:

1. Go to Vercel dashboard
2. Settings → Environment Variables
3. You should see all 5 variables listed
4. Each should show "Production, Preview, Development"

---

## 🎉 Success!

Your deployment should now work without errors!

**Next:** Visit your Vercel URL and test the app.
