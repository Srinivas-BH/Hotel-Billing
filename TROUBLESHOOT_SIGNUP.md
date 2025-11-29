# 🔍 Troubleshoot Signup "Internal Server Error"

## 🎯 Quick Diagnosis

I've added a debug endpoint to help diagnose the issue.

### Step 1: Push the Debug Endpoint

```bash
git add app/api/debug/route.ts app/api/auth/signup/route.ts
git commit -m "Add debug endpoint for troubleshooting"
git push origin main
```

### Step 2: Wait for Deployment (~5 minutes)

### Step 3: Check Debug Endpoint

Visit: `https://your-app.onrender.com/api/debug`

You should see:
```json
{
  "hasDatabase": true,
  "hasJWT": true,
  "hasAppUrl": true,
  "nodeEnv": "production",
  "databaseUrlPrefix": "postgresql://postgres..."
}
```

---

## ❌ Common Issues

### Issue 1: DATABASE_URL Not Set

**Symptom:** `hasDatabase: false`

**Fix:**
1. Go to Render Dashboard → Environment
2. Add `DATABASE_URL`:
   ```
   postgresql://postgres:Srinivas%242706BH@db.qbjtuqgvlvcvqrxkmsbw.supabase.co:5432/postgres
   ```
3. Save (will redeploy)

### Issue 2: Database Connection Timeout

**Symptom:** Signup takes long then fails

**Fix:**
1. Check if Supabase database is running
2. Verify the connection string is correct
3. Check if Supabase allows connections from Render's IP

### Issue 3: JWT_SECRET Not Set

**Symptom:** `hasJWT: false`

**Fix:**
1. Go to Render Dashboard → Environment
2. Add `JWT_SECRET`:
   ```
   ruC3c3ZHiHsz7pG+jEEdqr83yFTtBvstuOYeFjL2p8s=
   ```
3. Save (will redeploy)

---

## 🔍 Check Render Logs

To see the exact error:

1. Go to Render Dashboard
2. Click on your service
3. Go to "Logs" tab
4. Look for lines with "Signup error:" or "Database error:"
5. The error message will tell you exactly what's wrong

Common error messages:

### "Connection refused"
- Database is not accessible
- Check DATABASE_URL is correct
- Check Supabase is running

### "Authentication failed"
- Password in DATABASE_URL is wrong
- Check the URL encoding (% symbols)

### "Database does not exist"
- Database name is wrong
- Check the database name in the URL

### "SSL required"
- Add `?sslmode=require` to the end of DATABASE_URL

---

## ✅ Correct DATABASE_URL Format

```
postgresql://postgres:Srinivas%242706BH@db.qbjtuqgvlvcvqrxkmsbw.supabase.co:5432/postgres
```

**Important:**
- `%24` = `$` (URL encoded)
- Port is `5432`
- Database name is `postgres`

---

## 🚀 Action Plan

### 1. Push Debug Endpoint
```bash
git add .
git commit -m "Add debug endpoint"
git push origin main
```

### 2. Wait for Deployment (5 minutes)

### 3. Visit Debug Endpoint
```
https://your-app.onrender.com/api/debug
```

### 4. Check What's Missing
- If `hasDatabase: false` → Add DATABASE_URL
- If `hasJWT: false` → Add JWT_SECRET
- If both true → Check Render logs for exact error

### 5. Fix and Redeploy

---

## 💡 Quick Test: Use Mock Data

If you want to test the app without database:

1. Remove DATABASE_URL from environment variables
2. The app will use mock data in development mode
3. You can test the UI and features
4. Add DATABASE_URL back when ready

---

## 🎯 Do This Now

```bash
git add app/api/debug/route.ts app/api/auth/signup/route.ts
git commit -m "Add debug endpoint for troubleshooting"
git push origin main
```

Then visit `/api/debug` after deployment to see what's wrong!

---

**This will help us identify the exact issue! 🔍**
