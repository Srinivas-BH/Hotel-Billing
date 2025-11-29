# 📋 Render Deployment Cheat Sheet

## 🚀 Quick Commands

```bash
# Check if ready for deployment
npm run check-render

# Build locally to test
npm run build

# Start locally to test
npm start

# Push to GitHub
git add .
git commit -m "Deploy to Render"
git push origin main
```

---

## 🔑 Environment Variables (Copy-Paste Ready)

```bash
DATABASE_URL=postgresql://postgres:Srinivas%242706BH@db.qbjtuqgvlvcvqrxkmsbw.supabase.co:5432/postgres
JWT_SECRET=ruC3c3ZHiHsz7pG+jEEdqr83yFTtBvstuOYeFjL2p8s=
JWT_EXPIRES_IN=24h
NEXT_PUBLIC_APP_URL=https://hotel-billing-admin.onrender.com
NODE_ENV=production
```

---

## ⚙️ Render Configuration

```yaml
Build Command: npm install && npm run build
Start Command: npm run start:render
Instance Type: Free
Region: Oregon (or closest)
```

---

## 🔗 Important URLs

- **Render Dashboard:** https://dashboard.render.com
- **Your App:** https://hotel-billing-admin.onrender.com
- **Health Check:** https://hotel-billing-admin.onrender.com/api/health
- **Render Docs:** https://render.com/docs

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `RENDER_QUICK_START.md` | 5-minute deployment guide |
| `RENDER_DEPLOYMENT_GUIDE.md` | Detailed step-by-step guide |
| `DEPLOY_TO_RENDER_NOW.md` | Visual guide with screenshots |
| `RENDER_DEPLOYMENT_SUMMARY.md` | Overview of changes made |
| `render.yaml` | Render configuration file |

---

## ✅ Pre-Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] Repository connected to Render
- [ ] Build command configured
- [ ] Start command configured
- [ ] All 5 environment variables added
- [ ] Free tier selected
- [ ] Deploy button clicked

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | Check `package.json` scripts |
| App crashes | Verify environment variables |
| Database error | Check `DATABASE_URL` |
| PDF fails | Add Puppeteer env vars |
| Slow first load | Normal on free tier (waking from sleep) |

---

## 📊 Monitoring

```bash
# View logs
Render Dashboard → Your Service → Logs

# View metrics
Render Dashboard → Your Service → Metrics

# View events
Render Dashboard → Your Service → Events
```

---

## 🎯 Post-Deployment

1. Update `NEXT_PUBLIC_APP_URL` with actual URL
2. Test login/signup
3. Test menu management
4. Test invoice generation
5. Monitor logs for errors

---

## 💡 Pro Tips

- Free tier sleeps after 15 min inactivity
- First request after sleep takes 30-60s
- Use UptimeRobot to prevent sleep
- Check logs regularly
- Set up custom domain in Render dashboard

---

## 🆘 Emergency Commands

```bash
# Force redeploy
Render Dashboard → Manual Deploy → Deploy Latest Commit

# Clear build cache
Render Dashboard → Settings → Clear Build Cache

# Restart service
Render Dashboard → Manual Deploy → Restart Service
```

---

**Need more help?** Check the detailed guides or Render documentation!
