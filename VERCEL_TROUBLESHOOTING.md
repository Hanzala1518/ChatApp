# Vercel Deployment Troubleshooting

## 🔴 Common Vercel Errors & Solutions

### Error 1: "Build failed with exit code 1"

**Cause:** TypeScript or build errors

**Solution:**
```powershell
# Test build locally first
npm run build

# If it fails, check the error and fix it
# Then commit and push
git add .
git commit -m "Fix build errors"
git push
```

---

### Error 2: "Module not found" or "Cannot find module"

**Cause:** Missing dependencies in package.json

**Solution:**
```powershell
# Delete node_modules and lock file
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# Reinstall dependencies
npm install

# Test build
npm run build

# If successful, commit and push
git add package-lock.json
git commit -m "Update dependencies"
git push
```

---

### Error 3: "Environment variables are missing"

**Cause:** NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not set

**Solution in Vercel Dashboard:**
1. Go to your project on Vercel
2. Click **Settings** tab
3. Click **Environment Variables** in sidebar
4. Add these variables:
   - Variable: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://xxxxx.supabase.co` (your Supabase URL)
   - Click **Save**
   
   - Variable: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `eyJhbGci...` (your Supabase anon key)
   - Click **Save**

5. Go to **Deployments** tab
6. Click **⋯** (three dots) on latest deployment
7. Click **Redeploy**

---

### Error 4: "Cannot find package '@supabase/ssr'"

**Cause:** Vercel cache issue

**Solution:**
1. Go to Vercel Dashboard > Your Project
2. Click **Settings** > **General**
3. Scroll to **Build & Development Settings**
4. Clear build cache
5. Redeploy

**OR via CLI:**
```powershell
vercel --prod --force
```

---

### Error 5: "ENOENT: no such file or directory"

**Cause:** Missing files or incorrect paths

**Solution:**
```powershell
# Ensure all files are committed
git status

# Add any missing files
git add .
git commit -m "Add missing files"
git push
```

---

### Error 6: "serverExternalPackages is not supported"

**Cause:** Using incorrect Next.js configuration

**Solution:**
Check `next.config.ts` - it should be minimal:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

export default nextConfig;
```

---

### Error 7: "Failed to compile"

**Cause:** Syntax errors in code

**Solution:**
```powershell
# Check for TypeScript errors
npm run lint

# Fix any errors shown
# Then commit and push
git add .
git commit -m "Fix TypeScript errors"
git push
```

---

## ✅ Step-by-Step Deployment Checklist

### Before Deploying to Vercel:

- [ ] **1. Build passes locally**
  ```powershell
  npm run build
  ```

- [ ] **2. No TypeScript errors**
  ```powershell
  npm run lint
  ```

- [ ] **3. All files committed to Git**
  ```powershell
  git status
  ```

- [ ] **4. Pushed to GitHub**
  ```powershell
  git push
  ```

### On Vercel:

- [ ] **5. Repository imported correctly**
  - Framework Preset: Next.js
  - Root Directory: `./`

- [ ] **6. Environment variables added**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- [ ] **7. Build settings correct**
  - Build Command: `npm run build`
  - Output Directory: `.next`
  - Install Command: `npm install`

### After Deployment:

- [ ] **8. Supabase configured**
  - Site URL added
  - Redirect URLs added

- [ ] **9. Test the live site**
  - Registration works
  - Login works
  - Messages send
  - Real-time updates work

---

## 🔍 How to View Build Logs

1. Go to Vercel Dashboard
2. Click on your project
3. Click **Deployments** tab
4. Click on the failed deployment
5. Click **Building** section to see logs
6. Scroll through logs to find the error

**Look for:**
- `Error:` messages
- `Module not found`
- `Failed to compile`
- `Process exited with code 1`

---

## 🛠️ Quick Fixes

### Force Redeploy with Clean Cache
```powershell
# Via Vercel Dashboard
# Settings > General > Clear Build Cache > Redeploy
```

### Redeploy via CLI
```powershell
vercel --prod --force
```

### Check Environment Variables
```powershell
# Via Vercel Dashboard
# Settings > Environment Variables
# Ensure both variables are set for Production
```

---

## 📞 Next Steps if Still Failing

1. **Copy the exact error message** from Vercel build logs
2. **Check if error mentions:**
   - Missing packages → Run `npm install [package-name]`
   - TypeScript errors → Fix in code
   - Environment variables → Add in Vercel settings
   - Build configuration → Check `next.config.ts`

3. **Test locally first:**
   ```powershell
   npm run build
   ```
   If it fails locally, fix it before redeploying

4. **Commit and push fixes:**
   ```powershell
   git add .
   git commit -m "Fix deployment error"
   git push
   ```

5. **Vercel auto-deploys on push** - wait for new deployment

---

## 🎯 Most Common Fix

**90% of deployment errors are due to missing environment variables!**

Make sure you've added both in Vercel Dashboard > Settings > Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Then redeploy!

---

## 📋 Share Error Details

If you need help, share:
1. Screenshot of Vercel build logs (the error section)
2. Last few lines of the error message
3. What step you're stuck on

This will help diagnose the exact issue!
