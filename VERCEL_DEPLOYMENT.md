# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Firebase Project**: Set up at [firebase.google.com](https://firebase.google.com)
3. **GitHub Repository**: Your code should be in a Git repository

## Step 1: Prepare Firebase Project

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Authentication (Google Sign-in)
3. Enable Firestore Database
4. Get your Firebase configuration from Project Settings > General > Your Apps

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts to configure your project
```

## Step 3: Configure Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add the following Firebase variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

4. Deploy to all environments (Production, Preview, Development)

## Step 4: Verify Deployment

1. Check the deployment logs for any errors
2. Test your application endpoints
3. Verify Firebase connectivity and authentication

## Troubleshooting

### Common Issues

1. **Build Errors**: Check that all dependencies are in `package.json`
2. **Environment Variables**: Ensure all required Firebase env vars are set in Vercel
3. **Firebase Connection**: Verify Firebase configuration and project settings
4. **Function Timeout**: API routes may need longer timeout (configured in vercel.json)

### Debugging

- Check Vercel function logs in the dashboard
- Use `vercel logs` command for CLI access
- Test locally with production environment variables

## Environment-Specific Configuration

### Development
- Uses Firebase with local environment variables
- Environment variables from `env.local`

### Production
- Uses Firebase with production project
- Environment variables from Vercel dashboard
- Secure Firebase configuration

## Security Notes

- Never commit Firebase credentials to Git
- Use Firebase Security Rules for database access control
- Enable Firebase Authentication with proper providers
- Enable Vercel's security features (HTTPS, etc.)

## Performance Optimization

- The `vercel.json` configuration includes:
  - Extended function timeout for API routes
  - Proper Next.js framework detection
  - External package handling for Firebase SDK
