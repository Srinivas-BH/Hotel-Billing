# 🔧 Fix Signup "Internal Server Error"

## ❌ Problem

The signup page shows "Internal server error" when trying to create an account.

## 🔍 Root Cause

This is likely a **database connection issue**. The app is trying to connect to the database but failing.

---

## ✅ Solution: Check Environment Variables

### Step 1: Verify DATABASE_URL

1. Go to Render Dashboard
2. Click on your service
3. Go to **"Environment"** tab
4. Check if `DATABASE_URL` is set correctly

**Should be:**
```
DATABASE_URL=postgresql://postgres:Srinivas%242706BH@db.qbjtuqgvlvcvqrxkmsbw.supabase.co:5432/postgres
```

### Step 2: Check All Required Variables

Make sure these are all set:

```
DATABASE_URL=postgresql://postgres:Srinivas%242706BH@db.qbjtuqgvlvcvqrxkmsbw.supabase.co:5432/postgres
JWT_SECRET=ruC3c3ZHiHsz7pG+jEEdqr83yFTtBvstuOYeFjL2p8s=
JWT_EXPIRES_IN=24h
NEXT_PUBLIC_APP_URL=https://hotel-billing-admin.onrender.com
NODE_ENV=production
```

---

## 🚀 Quick Fix Steps

### 1. First, push the health check fix:

```bash
git add app/api/health/route.ts
git commit -m "Fix health check timeout"
git push origin main
```

### 2. Then verify environment variables in Render:

1. Go to Environment tab
2. Check DATABASE_URL is correct
3. If missing or wrong, update it
4. Save changes (will trigger redeploy)

---

## 🔍 Alternative: Check Render Logs

To see the exact error:

1. Go to Render Dashboard
2. Click on your service
3. Go to "Logs" tab
4. Look for lines starting with "Signup error:" or "Database error:"
5. Share the error message if you need help

---

## ✅ Expected After Fix

After fixing the database connection, signup will work:

1. Fill in the form
2. Click "Create account"
3. Account created successfully
4. Redirected to dashboard

---

## 🎯 Do This Now

**Step 1:** Push health check fix
```bash
git add app/api/health/route.ts
git commit -m "Fix health check"
git push origin main
```

**Step 2:** Check Render environment variables
- Verify DATABASE_URL is correct
- Verify all 5 required variables are set

**Step 3:** Wait for redeploy (~5 minutes)

**Step 4:** Try signup again

---

## 💡 If Database URL is Wrong

If you need to update the DATABASE_URL:

1. Go to Supabase dashboard
2. Get the correct connection string
3. Update in Render environment variables
4. Save (will trigger redeploy)

---

**Push the health check fix first, then we'll debug the signup error! 🚀**
