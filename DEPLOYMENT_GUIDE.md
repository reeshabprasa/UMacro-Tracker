# UMacro Tracker Deployment Guide

This guide will walk you through deploying your UMacro Tracker application to the cloud.

## Prerequisites
- GitHub account
- MongoDB Atlas account
- Basic understanding of Git

## Step 1: MongoDB Atlas Setup

### 1.1 Create MongoDB Atlas Account
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Sign up for a free account
3. Create a new project

### 1.2 Create Cluster
1. Click "Build a Database"
2. Choose "FREE" tier (M0)
3. Select your preferred cloud provider and region
4. Click "Create"

### 1.3 Configure Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Set username and password (save these!)
5. Select "Read and write to any database"
6. Click "Add User"

### 1.4 Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### 1.5 Get Connection String
1. Go to "Database" in the left sidebar
2. Click "Connect"
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your actual password
6. Replace `<dbname>` with `umacro_tracker`

## Step 2: Backend Deployment (Choose One Option)

### Option A: Deploy to Railway (Recommended)

1. **Prepare Repository**
   ```bash
   cd backend
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Deploy to Railway**
   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub
   - Click "New Project"
   - Choose "Deploy from GitHub repo"
   - Select your repository
   - Set the root directory to `backend`

3. **Configure Environment Variables**
   - Go to "Variables" tab
   - Add these variables:
     ```
     MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
     DB_NAME=umacro_tracker
     SECRET_KEY=your-super-secret-key-here
     ```

4. **Deploy**
   - Railway will automatically build and deploy
   - Note the generated domain (e.g., `https://your-app.railway.app`)

### Option B: Deploy to Render

1. **Prepare Repository** (same as above)

2. **Deploy to Render**
   - Go to [render.com](https://render.com)
   - Sign in with GitHub
   - Click "New +"
   - Choose "Web Service"
   - Connect your repository
   - Set root directory to `backend`
   - Choose Python runtime
   - Set build command: `pip install -r requirements.txt`
   - Set start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`

3. **Configure Environment Variables** (same as Railway)

### Option C: Deploy to Heroku

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew install heroku/brew/heroku
   
   # Or download from heroku.com
   ```

2. **Login and Create App**
   ```bash
   heroku login
   heroku create your-app-name
   ```

3. **Configure Environment Variables**
   ```bash
   heroku config:set MONGO_URL="mongodb+srv://username:password@cluster.mongodb.net/"
   heroku config:set DB_NAME="umacro_tracker"
   heroku config:set SECRET_KEY="your-super-secret-key-here"
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

## Step 3: Frontend Deployment

### Option A: Deploy to Vercel (Recommended)

1. **Prepare Repository**
   ```bash
   cd frontend
   git add .
   git commit -m "Prepare frontend for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your repository
   - Set root directory to `frontend`
   - Configure build settings:
     - Framework Preset: Create React App
     - Build Command: `npm run build`
     - Output Directory: `build`

3. **Configure Environment Variables**
   - Go to "Settings" → "Environment Variables"
   - Add:
     ```
     REACT_APP_BACKEND_URL=https://your-backend-domain.com
     ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically

### Option B: Deploy to Netlify

1. **Prepare Repository** (same as above)

2. **Deploy to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Sign in with GitHub
   - Click "New site from Git"
   - Choose your repository
   - Set build command: `npm run build`
   - Set publish directory: `build`

3. **Configure Environment Variables**
   - Go to "Site settings" → "Environment variables"
   - Add the same variable as Vercel

## Step 4: Update CORS Settings

After deploying your backend, you need to update the CORS settings to allow your frontend domain:

1. **Find your backend domain** (from Railway/Render/Heroku)
2. **Update environment variables**:
   ```
   ALLOWED_ORIGINS=https://your-frontend-domain.com
   ```
3. **Redeploy** your backend

## Step 5: Test Your Deployment

1. **Test Backend API**
   - Visit `https://your-backend-domain.com/docs`
   - You should see the FastAPI documentation

2. **Test Frontend**
   - Visit your frontend domain
   - Try to register/login
   - Test the main functionality

## Step 6: Custom Domain (Optional)

### Backend Custom Domain
- Most platforms support custom domains
- Configure in your deployment platform's settings

### Frontend Custom Domain
- Vercel/Netlify support custom domains
- Point your domain's DNS to their servers

## Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Check that your frontend domain is in `ALLOWED_ORIGINS`
   - Ensure backend is accessible

2. **MongoDB Connection Issues**
   - Verify connection string is correct
   - Check network access settings in Atlas
   - Ensure username/password are correct

3. **Build Failures**
   - Check that all dependencies are in requirements.txt
   - Verify Python version compatibility

4. **Environment Variables**
   - Double-check all variables are set correctly
   - Ensure no typos in variable names

## Security Notes

1. **Never commit `.env` files** to Git
2. **Use strong SECRET_KEY** in production
3. **Restrict MongoDB network access** in production
4. **Enable HTTPS** (most platforms do this automatically)

## Cost Estimation

- **MongoDB Atlas**: Free tier (512MB storage)
- **Railway**: Free tier (500 hours/month)
- **Vercel**: Free tier (unlimited personal projects)
- **Total**: $0/month for development/small scale

## Next Steps

After successful deployment:
1. Set up monitoring and logging
2. Configure backups for MongoDB
3. Set up CI/CD pipelines
4. Consider scaling options as your app grows

---

**Need Help?** Check the platform-specific documentation or create an issue in your repository.
