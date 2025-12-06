# Deployment Guide

## 📋 Prerequisites

Before deploying, ensure you have:
- A GitHub account
- A Vercel account (sign up at https://vercel.com)
- A Supabase project (created at https://supabase.com)
- Git installed on your machine

---

## 🗄️ Step 1: Set Up Supabase Database

1. **Go to your Supabase project** at https://app.supabase.com
2. **Navigate to SQL Editor** (left sidebar)
3. **Create a new query**
4. **Copy and paste the entire contents** of `supabase-setup.sql`
5. **Click "Run"** to execute the SQL script
6. **Verify tables were created:**
   - Go to **Table Editor** in the sidebar
   - You should see: `profiles`, `channels`, `channel_members`, `messages`, `direct_conversations`, `direct_messages`, `message_reactions`, `dm_reactions`

7. **Get your Supabase credentials:**
   - Go to **Project Settings** > **API**
   - Copy **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - Copy **anon/public key** (looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

---

## 📤 Step 2: Upload to GitHub

### Initialize Git Repository

Open PowerShell in your project directory and run:

```powershell
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: ChatApp with real-time messaging"
```

### Create GitHub Repository

1. **Go to GitHub** (https://github.com)
2. **Click the "+" icon** in the top right → **New repository**
3. **Fill in repository details:**
   - Repository name: `chatapp` (or your preferred name)
   - Description: `Real-time chat application with Next.js and Supabase`
   - Visibility: Choose **Public** or **Private**
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. **Click "Create repository"**

### Push to GitHub

After creating the repository, GitHub will show you commands. Run these in PowerShell:

```powershell
# Add GitHub as remote origin (replace YOUR_USERNAME and YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

**If prompted for credentials:**
- Username: Your GitHub username
- Password: Use a **Personal Access Token** (not your password)
  - Create token at: https://github.com/settings/tokens
  - Select scopes: `repo` (full control of private repositories)

---

## 🚀 Step 3: Deploy to Vercel

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel** (https://vercel.com)
2. **Sign in** with your GitHub account
3. **Click "Add New Project"**
4. **Import your GitHub repository:**
   - Find your `chatapp` repository
   - Click **"Import"**

5. **Configure Project:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (leave default)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)

6. **Add Environment Variables:**
   Click "Environment Variables" and add these:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   Replace with your actual Supabase URL and anon key from Step 1.

7. **Click "Deploy"**

   Vercel will:
   - Install dependencies
   - Build your Next.js app
   - Deploy to production
   - Provide a live URL (e.g., `https://chatapp.vercel.app`)

### Method 2: Deploy via Vercel CLI

```powershell
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (Select your account)
# - Link to existing project? No
# - What's your project's name? chatapp
# - In which directory is your code located? ./
# - Want to modify settings? No

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste your Supabase URL when prompted

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste your Supabase anon key when prompted

# Deploy to production
vercel --prod
```

---

## 🔧 Step 4: Configure Supabase for Production

1. **Go to Supabase Dashboard** > **Authentication** > **URL Configuration**
2. **Add your Vercel URL to Site URL:**
   ```
   https://your-app.vercel.app
   ```

3. **Add to Redirect URLs:**
   ```
   https://your-app.vercel.app/auth/callback
   ```

4. **Configure Google OAuth (if using):**
   - Go to **Authentication** > **Providers** > **Google**
   - Add authorized redirect URI:
     ```
     https://your-app.vercel.app/auth/callback
     ```

---

## ✅ Step 5: Verify Deployment

1. **Visit your Vercel URL** (e.g., `https://chatapp.vercel.app`)
2. **Test registration:**
   - Create a new account with email/password
   - Verify you're auto-joined to `#general` and `#random` channels
3. **Test messaging:**
   - Send messages in channels
   - Create DMs
   - Test emoji reactions
4. **Test real-time features:**
   - Open in two browsers
   - Verify messages appear instantly
   - Check online presence indicators

---

## 🔄 Updating Your Deployment

### When you make changes:

```powershell
# Stage changes
git add .

# Commit changes
git commit -m "Description of changes"

# Push to GitHub
git push

# Vercel automatically redeploys on push!
```

### Manual redeploy on Vercel:
1. Go to Vercel Dashboard
2. Select your project
3. Go to **Deployments** tab
4. Click **"Redeploy"** on the latest deployment

---

## 🐛 Troubleshooting

### Build Fails on Vercel
- Check **Build Logs** in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify environment variables are set correctly

### Authentication Not Working
- Verify Supabase URL and anon key are correct
- Check redirect URLs in Supabase settings
- Ensure `.env` variables start with `NEXT_PUBLIC_`

### Real-time Features Not Working
- Verify `supabase-setup.sql` was executed successfully
- Check that tables are added to realtime publication
- Open browser console for WebSocket errors

### Database Errors
- Re-run `supabase-setup.sql` in Supabase SQL Editor
- Check **Database** > **Logs** in Supabase for errors
- Verify RLS policies are enabled

---

## 📊 Monitoring

### Vercel Dashboard
- **Analytics:** View visitor stats
- **Logs:** Real-time function logs
- **Speed Insights:** Performance metrics

### Supabase Dashboard
- **Table Editor:** View/edit data
- **Database Logs:** Monitor queries
- **API Logs:** Track API usage
- **Auth:** Monitor user signups

---

## 🔒 Security Checklist

- ✅ Environment variables are not committed to Git
- ✅ `.env` is in `.gitignore`
- ✅ Supabase RLS policies are enabled
- ✅ Redirect URLs are properly configured
- ✅ Anon key (not service role key) is used in frontend

---

## 🎉 Success!

Your ChatApp is now live! Share your URL with others to start chatting.

**Production URL:** `https://your-app.vercel.app`

### Default Channels
New users are automatically added to:
- `#general` - Main discussion channel
- `#random` - Off-topic conversations

### Features Available
✅ Real-time messaging
✅ Direct messages
✅ Channel creation
✅ Private channels with invite codes
✅ Emoji reactions
✅ Online presence
✅ User profiles with avatars
✅ Dark/light mode
✅ Message search
✅ Message editing/deletion
✅ Member management

---

## 📚 Additional Resources

- **Next.js Documentation:** https://nextjs.org/docs
- **Supabase Documentation:** https://supabase.com/docs
- **Vercel Documentation:** https://vercel.com/docs
- **GitHub Documentation:** https://docs.github.com

---

Need help? Check the [README.md](./README.md) for detailed feature documentation.
