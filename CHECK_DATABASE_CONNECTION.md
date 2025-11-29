# 🔍 Database Connection Issue

## ✅ Good News

Your app is deployed and running at:
```
https://hotel-billing-70ov.onrender.com
```

## ❌ Problem

Login/Signup are failing with "500 Internal Server Error" because the database connection is not working.

---

## 🎯 Quick Fix: Check Environment Variables

### Step 1: Visit Debug Endpoint

Go to: `https://hotel-billing-70ov.onrender.com/api/debug`

This will show which environment variables are set.

### Step 2: Check DATABASE_URL in Render

1. Go to Render Dashboard: https://dashboard.render.com
2. Click on your service
3. Go to **"Environment"** tab
4. Look for `DATABASE_URL`

**Should be:**
```
postgresql://postgres:Srinivas%242706BH@db.qbjtuqgvlvcvqrxkmsbw.supabase.co:5432/postgres
```

**Important:** Make sure the `$` is encoded as `%24`

---

## 🔍 Common Issues

### Issue 1: DATABASE_URL Not Set
- **Fix:** Add it in Render Environment tab
- **Value:** `postgresql://postgres:Srinivas%242706BH@db.qbjtuqgvlvcvqrxkmsbw.supabase.co:5432/postgres`

### Issue 2: Wrong Password Encoding
- **Problem:** `$` character needs to be `%24`
- **Wrong:** `Srinivas$2706BH`
- **Correct:** `Srinivas%242706BH`

### Issue 3: Supabase Database Not Accessible
- **Check:** Can Render connect to Supabase?
- **Fix:** Verify Supabase project is active
- **Fix:** Check Supabase allows external connections

---

## 🚀 Quick Test

### Option 1: Check Debug Endpoint
```
https://hotel-billing-70ov.onrender.com/api/debug
```

Should show:
```json
{
  "hasDatabase": true,
  "hasJWT": true,
  "hasAppUrl": true
}
```

### Option 2: Check Render Logs
1. Render Dashboard → Your Service → Logs
2. Look for "Database error" or "Connection refused"
3. This will show the exact error

---

## ✅ Fix Steps

### 1. Push Debug Endpoint (if not already)
```bash
git add .
git commit -m "Add debug endpoint"
git push origin main
```

### 2. Check Debug Endpoint
Visit: `https://hotel-billing-70ov.onrender.com/api/debug`

### 3. Fix Missing Variables
If any are `false`, add them in Render Environment tab

### 4. Check Render Logs
Look for the exact database error message

### 5. Update DATABASE_URL if Needed
Make sure it's exactly:
```
postgresql://postgres:Srinivas%242706BH@db.qbjtuqgvlvcvqrxkmsbw.supabase.co:5432/postgres
```

---

## 🎯 Do This Now

1. **Visit:** `https://hotel-billing-70ov.onrender.com/api/debug`
2. **Check:** What does it show?
3. **Go to:** Render Dashboard → Environment tab
4. **Verify:** DATABASE_URL is set correctly
5. **Check:** Render Logs for exact error

---

**Share what you see at `/api/debug` and I can help fix it! 🔍**
