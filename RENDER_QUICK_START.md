# ⚡ Quick Start: Deploy to Render in 5 Minutes

## 🎯 What You Need (Copy These Values)

### ✅ 5 Required Environment Variables

```bash
# 1. DATABASE_URL
postgresql://postgres:Srinivas%242706BH@db.qbjtuqgvlvcvqrxkmsbw.supabase.co:5432/postgres

# 2. JWT_SECRET
ruC3c3ZHiHsz7pG+jEEdqr83yFTtBvstuOYeFjL2p8s=

# 3. JWT_EXPIRES_IN
24h

# 4. NEXT_PUBLIC_APP_URL (Update after first deploy)
https://hotel-billing-admin.onrender.com

# 5. NODE_ENV
production
```

---

## 🚀 Deployment Steps

### 1️⃣ Push to GitHub
```bash
git add .
git commit -m "Deploy to Render"
git push origin main
```

### 2️⃣ Create Web Service on Render
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo

### 3️⃣ Configure Service
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start:render`
- **Plan:** Free

### 4️⃣ Add Environment Variables
Copy-paste the 5 variables above into Render's Environment section.

### 5️⃣ Deploy!
Click **"Create Web Service"** and wait 5-10 minutes.

---

## ✅ After Deployment

1. Copy your Render URL (e.g., `https://your-app.onrender.com`)
2. Update `NEXT_PUBLIC_APP_URL` environment variable with your actual URL
3. Save changes (Render will auto-redeploy)

---

## 🎉 Done!

Your app is live! Visit your Render URL to see it in action.

**Note:** Free tier apps sleep after 15 minutes of inactivity. First request after sleep takes 30-60 seconds.

---

## 📞 Need Help?

Check `RENDER_DEPLOYMENT_GUIDE.md` for detailed troubleshooting.
