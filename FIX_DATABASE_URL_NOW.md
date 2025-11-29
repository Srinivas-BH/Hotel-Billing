# 🔧 Fix DATABASE_URL - IPv6 Issue

## ❌ Problem Found!

```
"databaseError": "connect ENETUNREACH 2406:da14:271:9904:2081:d225:8f06:9a4f:5432"
```

Your DATABASE_URL contains an **IPv6 address** that Render cannot reach.

---

## ✅ Solution: Update DATABASE_URL in Render

### Step 1: Go to Render Dashboard

https://dashboard.render.com

### Step 2: Click on Your Service

Find "Hotel-Billing" or "hotel-billing-admin" and click it

### Step 3: Go to Environment Tab

Click on the **"Environment"** tab in the left sidebar

### Step 4: Find DATABASE_URL

Scroll down to find the `DATABASE_URL` variable

### Step 5: Click "Edit" Button

Click the pencil/edit icon next to DATABASE_URL

### Step 6: Replace with This Value

**Delete the current value and paste this:**

```
postgresql://postgres:Srinivas%242706BH@db.qbjtuqgvlvcvqrxkmsbw.supabase.co:5432/postgres
```

**Important:**
- Use the **hostname** `db.qbjtuqgvlvcvqrxkmsbw.supabase.co`
- NOT an IP address
- `%24` = `$` (URL encoded)

### Step 7: Click "Save Changes"

This will trigger an automatic redeploy (takes 2-3 minutes)

---

## ⏱️ After Saving

1. **Wait 2-3 minutes** for redeploy
2. **Visit:** `https://hotel-billing-70ov.onrender.com/api/debug`
3. **Should show:** `"databaseConnection": "connected"` ✅
4. **Try signup** - should work! 🎉

---

## 🔍 Verify It Worked

After redeploy, visit `/api/debug` and you should see:

```json
{
  "databaseConnection": "connected",  ← Changed from "error"!
  "databaseError": null                ← No more error!
}
```

---

## 📋 Checklist

- [ ] Go to Render Dashboard
- [ ] Click on your service
- [ ] Go to Environment tab
- [ ] Find DATABASE_URL
- [ ] Click Edit
- [ ] Paste the correct URL (with hostname, not IP)
- [ ] Click Save Changes
- [ ] Wait 2-3 minutes
- [ ] Check `/api/debug`
- [ ] Try signup/login

---

## 🎯 The Correct DATABASE_URL

```
postgresql://postgres:Srinivas%242706BH@db.qbjtuqgvlvcvqrxkmsbw.supabase.co:5432/postgres
```

**Key parts:**
- `postgres` = username
- `Srinivas%242706BH` = password ($ encoded as %24)
- `db.qbjtuqgvlvcvqrxkmsbw.supabase.co` = hostname (NOT IP!)
- `5432` = port
- `postgres` = database name

---

## 🚀 Do This Now!

1. Open Render Dashboard
2. Go to Environment tab
3. Edit DATABASE_URL
4. Paste the correct value
5. Save

**Your app will work in 2 minutes! 🎉**
