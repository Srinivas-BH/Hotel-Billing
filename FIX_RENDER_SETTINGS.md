# 🔧 Fix Render Settings - 2 Quick Changes

Based on your screenshots, here are the exact fixes needed:

---

## ❌ Issue 1: Wrong Health Check Path

**Current:** `/healthz`  
**Should be:** `/api/health`

### Fix:
1. In Render Dashboard, go to your service
2. Scroll to **"Health Checks"** section
3. Click **"Edit"** next to Health Check Path
4. Change from `/healthz` to `/api/health`
5. Click **"Save Changes"**

---

## ❌ Issue 2: TypeScript Build Error

The error says you need `@types/react` but it's in devDependencies.

### Fix:
Add `@types/react` and `@types/node` to dependencies in package.json:

```json
{
  "dependencies": {
    "@types/node": "^20.11.30",
    "@types/react": "^18.2.70",
    "@types/react-dom": "^18.2.22"
  }
}
```

---

## ✅ Quick Fix Commands

Run these in your terminal:

```bash
# This will update package.json automatically
npm install --save @types/node @types/react @types/react-dom

# Then commit and push
git add package.json package-lock.json
git commit -m "Fix: Move TypeScript types to dependencies"
git push origin main
```

---

## 📋 After Pushing

1. **Wait 1-2 minutes** for Render to detect the new commit
2. **Watch the logs** - build should succeed this time
3. **Update health check path** to `/api/health`

---

## ✅ Expected Success

After these fixes, you'll see:

```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (25/25)
✓ Build complete!
==> Your service is live 🎉
```

---

## 🎯 Do This Now

```bash
npm install --save @types/node @types/react @types/react-dom
git add .
git commit -m "Fix TypeScript types for Render"
git push origin main
```

Then update health check path in Render dashboard.

**Your build will succeed! ✅**
