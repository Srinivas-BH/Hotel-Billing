# 🔧 Fix: DATABASE_URL References Secret Error

## ❌ Error Message
```
Environment Variable "DATABASE_URL" references Secret "database_url", which does not exist.
```

## 🎯 Root Cause

Vercel is trying to use a secret reference instead of the actual value. This happens when:
1. You paste the variable in a specific format
2. Vercel interprets it as a secret reference
3. The secret doesn't exist

---

## ✅ SOLUTION: Add Variables Correctly

### Method 1: Use Vercel Dashboard (Easiest)

#### Step 1: Go to Your Project Settings

1. Go to https://vercel.com/dashboard
2. Click on your project (hotel-billing)
3. Click **"Settings"** tab
4. Click **"Environment Variables"** in left sidebar

#### Step 2: Delete Existing Variables (If Any)

If you see any variables with errors:
1. Click the **"..."** (three dots) next to each variable
2. Click **"Remove"**
3. Confirm removal

#### Step 3: Add Variables Fresh

Click **"Add New"** button

**Variable 1: DATABASE_URL**
```
Key: DATABASE_URL
Value: postgresql://postgres:Srinivas%242706BH@db.qbjtuqgvlvcvqrxkmsbw.supabase.co:5432/postgres
Environments: ✅ Production ✅ Preview ✅ Development
```
Click **"Save"**

**Variable 2: JWT_SECRET**
```
Key: JWT_SECRET
Value: ruC3c3ZHiHsz7pG+jEEdqr83yFTtBvstuOYeFjL2p8s=
Environments: ✅ Production ✅ Preview ✅ Development
```
Click **"Save"**

**Variable 3: JWT_EXPIRES_IN**
```
Key: JWT_EXPIRES_IN
Value: 24h
Environments: ✅ Production ✅ Preview ✅ Development
```
Click **"Save"**

**Variable 4: NEXT_PUBLIC_APP_URL**
```
Key: NEXT_PUBLIC_APP_URL
Value: https://hotel-billing.vercel.app
Environments: ✅ Production ✅ Preview ✅ Development
```
Click **"Save"**

**Variable 5: NODE_ENV**
```
Key: NODE_ENV
Value: production
Environments: ✅ Production ✅ Preview ✅ Development
```
Click **"Save"**

#### Step 4: Redeploy

1. Go to **"Deployments"** tab
2. Find the latest deployment
3. Click **"..."** (three dots)
4. Click **"Redeploy"**
5. Click **"Redeploy"** to confirm

Wait 2-3 minutes → ✅ **FIXED!**

---

## Method 2: Use Vercel CLI

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login

```bash
vercel login
```

### Step 3: Link Project

```bash
vercel link
```

Follow prompts:
- Link to existing project? **Y**
- What's your project name? **hotel-billing**

### Step 4: Remove Old Variables

```bash
vercel env rm DATABASE_URL production
vercel env rm DATABASE_URL preview
vercel env rm DATABASE_URL development
```

### Step 5: Add Variables Correctly

```bash
# Add DATABASE_URL
vercel env add DATABASE_URL
# When prompted, paste: postgresql://postgres:Srinivas%242706BH@db.qbjtuqgvlvcvqrxkmsbw.supabase.co:5432/postgres
# Select: Production, Preview, Development (use space to select, enter to confirm)

# Add JWT_SECRET
vercel env add JWT_SECRET
# When prompted, paste: ruC3c3ZHiHsz7pG+jEEdqr83yFTtBvstuOYeFjL2p8s=
# Select: Production, Preview, Development

# Add JWT_EXPIRES_IN
vercel env add JWT_EXPIRES_IN
# When prompted, paste: 24h
# Select: Production, Preview, Development

# Add NEXT_PUBLIC_APP_URL
vercel env add NEXT_PUBLIC_APP_URL
# When prompted, paste: https://hotel-billing.vercel.app
# Select: Production, Preview, Development

# Add NODE_ENV
vercel env add NODE_ENV
# When prompted, paste: production
# Select: Production, Preview, Development
```

### Step 6: Deploy

```bash
vercel --prod
```

---

## Method 3: Fresh Start (If Nothing Works)

### Step 1: Delete Project on Vercel

1. Go to Vercel dashboard
2. Click on your project
3. Settings → General
4. Scroll to bottom
5. Click **"Delete Project"**
6. Type project name to confirm
7. Click **"Delete"**

### Step 2: Create New Project

1. Go to https://vercel.com/new
2. Click **"Continue with GitHub"**
3. Find **"Hotel-Billing"**
4. Click **"Import"**

### Step 3: Set Project Name

```
hotel-billing
```
(all lowercase)

### Step 4: Add Environment Variables

**IMPORTANT:** Type or paste values directly, don't use any special syntax!

Add these 5 variables:

```
DATABASE_URL
postgresql://postgres:Srinivas%242706BH@db.qbjtuqgvlvcvqrxkmsbw.supabase.co:5432/postgres

JWT_SECRET
ruC3c3ZHiHsz7pG+jEEdqr83yFTtBvstuOYeFjL2p8s=

JWT_EXPIRES_IN
24h

NEXT_PUBLIC_APP_URL
https://hotel-billing.vercel.app

NODE_ENV
production
```

For each variable:
- Click **"Add"**
- Select **ALL** environments
- Click **"Save"**

### Step 5: Deploy

Click **"Deploy"** → Wait 2-3 minutes → ✅ **DONE!**

---

## 🔍 Verify Variables Are Correct

After adding variables:

1. Go to Settings → Environment Variables
2. You should see 5 variables
3. Each should show: "Production, Preview, Development"
4. Click on each to verify the value is correct
5. **NO variable should say "Secret reference"**

---

## ⚠️ Common Mistakes to Avoid

### ❌ Don't Do This:
- Don't wrap values in quotes: `"value"` ❌
- Don't use secret syntax: `@secret-name` ❌
- Don't use variable syntax: `${VAR}` ❌
- Don't add extra spaces ❌

### ✅ Do This:
- Paste value directly: `value` ✅
- No quotes, no special syntax ✅
- Exact value as shown above ✅

---

## 🎯 Expected Result

After fixing, you should see:

**In Vercel Dashboard:**
```
✅ DATABASE_URL (Production, Preview, Development)
✅ JWT_SECRET (Production, Preview, Development)
✅ JWT_EXPIRES_IN (Production, Preview, Development)
✅ NEXT_PUBLIC_APP_URL (Production, Preview, Development)
✅ NODE_ENV (Production, Preview, Development)
```

**Deployment Status:**
```
✅ Building...
✅ Deploying...
✅ Ready
```

**Your Live URL:**
```
https://hotel-billing.vercel.app
```

---

## 🆘 Still Having Issues?

### Try This:

1. **Clear Browser Cache**
   - Ctrl + Shift + Delete
   - Clear cache
   - Try again

2. **Use Incognito/Private Window**
   - Open Vercel in incognito mode
   - Add variables again

3. **Try Different Browser**
   - Use Chrome, Firefox, or Edge
   - Sometimes browser extensions interfere

4. **Contact Vercel Support**
   - Go to https://vercel.com/support
   - Describe the issue
   - They respond quickly!

---

## 🎉 Success Checklist

- [ ] Deleted old variables with errors
- [ ] Added DATABASE_URL correctly
- [ ] Added JWT_SECRET correctly
- [ ] Added JWT_EXPIRES_IN correctly
- [ ] Added NEXT_PUBLIC_APP_URL correctly
- [ ] Added NODE_ENV correctly
- [ ] Selected all environments for each variable
- [ ] Redeployed project
- [ ] Deployment succeeded
- [ ] App is live and working

---

## ✅ Your App Should Now Be Live!

**URL:** https://hotel-billing.vercel.app

**Test it:**
1. Visit the URL
2. Sign up
3. Add menu items
4. Generate invoice
5. Everything should work! ✅

---

**Last Updated:** November 29, 2025  
**Issue:** Secret reference error  
**Solution:** Add variables directly in Vercel dashboard  
**Status:** ✅ Fixed
