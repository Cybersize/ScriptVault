# Backend Deployment Guide

## Option A: Railway (Recommended - Easiest) ⭐

Railway is the easiest option and has a generous free tier.

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub (recommended)
3. Click "Deploy Now"

### Step 2: Connect Your Repository
1. In Railway dashboard, click "New Project"
2. Select "Deploy from GitHub"
3. Authorize Railway to access your GitHub
4. Select your `Secure-Data-Vault` repository

### Step 3: Configure the Service
1. In Railway, click "Add Service" → "GitHub Repo"
2. Select your repo
3. Railway will auto-detect and deploy

### Step 4: Set Environment Variables
In Railway dashboard for your service:
1. Go to **Variables** tab
2. Add these variables:
```
FIREBASE_PROJECT_ID=scriptvault-4da93
GOOGLE_APPLICATION_CREDENTIALS=/app/service-account-key.json
SCRIPT_ENCRYPTION_KEY=730ac22e5debfcb5803bef06ee81ebce93db300e3bf73ffa07315e1a9b35c101
ADMIN_SECRET=e40d17fad4c74d75dc21d499b4a03e81
PORT=8080
```

### Step 5: Add Service Account Key File
1. In Railway, go to the service settings
2. Click "Add file"
3. Name: `service-account-key.json`
4. Paste contents of your service account key JSON

### Step 6: Get Your Public URL
After deployment completes:
1. Go to your service "Settings"
2. Copy the public URL (looks like `https://scriptvault-backend-prod.up.railway.app`)
3. Note this - you'll need it for the frontend

### Step 7: Update Frontend
In your `.env` or app settings:
```
VITE_API_URL=https://scriptvault-backend-prod.up.railway.app
```

Then rebuild and deploy the frontend.

---

## Option B: Google Cloud Run

### Step 1: Prepare Dockerfile
Create `d:\Secure-Data-Vault\artifacts\api-server\Dockerfile`:
```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY . .
RUN npm install -g pnpm
RUN pnpm install
RUN pnpm run build
EXPOSE 8080
CMD ["pnpm", "run", "start"]
```

### Step 2: Deploy to Cloud Run
```powershell
cd d:\Secure-Data-Vault\artifacts\api-server

# Authenticate with Google Cloud
gcloud auth login

# Set your project
gcloud config set project scriptvault-4da93

# Deploy
gcloud run deploy api-server `
  --source . `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --set-env-vars FIREBASE_PROJECT_ID=scriptvault-4da93,SCRIPT_ENCRYPTION_KEY=730ac22e5debfcb5803bef06ee81ebce93db300e3bf73ffa07315e1a9b35c101,ADMIN_SECRET=e40d17fad4c74d75dc21d499b4a03e81
```

### Step 3: Upload Service Account Key via Cloud Console
1. After deployment, go to Cloud Run service settings
2. Add the service account key via secrets management

---

## Option C: Render

### Step 1: Create Render Account
Go to https://render.com and sign up

### Step 2: Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select the repository

### Step 3: Configure Build
- Build Command: `cd artifacts/api-server && pnpm install && pnpm run build`
- Start Command: `cd artifacts/api-server && pnpm run start`

### Step 4: Add Environment Variables
Same as Railway (see above)

### Step 5: Deploy
Click "Deploy" and Render will build and deploy automatically

---

## Final Steps (All Options)

After deploying, your backend will have a public URL like:
```
https://your-backend-url.com
```

### Update Frontend Configuration

Edit `d:\Secure-Data-Vault\artifacts\lua-platform\.env.production`:
```
VITE_API_URL=https://your-backend-url.com
```

### Rebuild and Deploy Frontend
```powershell
cd d:\Secure-Data-Vault
pnpm run build:web
pnpm run deploy:web
```

### Test
1. Visit https://scriptvault-4da93.web.app
2. Go to Admin panel
3. Try creating a license
4. It should now work from Firebase Hosting! ✅

---

## Recommended: Railway

I recommend **Railway** because:
- ✅ Easiest to set up
- ✅ Auto-deploys on GitHub push
- ✅ Free tier with decent limits
- ✅ Automatic HTTPS
- ✅ Great GitHub integration
