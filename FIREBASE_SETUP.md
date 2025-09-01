# Firebase Setup Guide for Vercel Deployment

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "workout-tracker")
4. Choose whether to enable Google Analytics (recommended)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Google" as a sign-in provider:
   - Click "Google" in the list
   - Toggle "Enable"
   - Add your support email
   - Click "Save"

## Step 3: Enable Firestore Database

1. Go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (you can add security rules later)
4. Select a location for your database (choose one close to your users)
5. Click "Done"

## Step 4: Get Firebase Configuration

1. Go to Project Settings (gear icon next to "Project Overview")
2. Scroll down to "Your apps" section
3. Click the web app icon (</>) to add a web app
4. Register your app with a nickname (e.g., "workout-tracker-web")
5. Copy the Firebase configuration object

## Step 5: Configure Security Rules (Optional but Recommended)

### Firestore Security Rules

Go to Firestore Database > Rules and update with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow users to read/write their own workouts
    match /workouts/{workoutId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Allow users to read/write their own training plans
    match /trainingPlans/{planId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

## Step 6: Set Up Vercel Environment Variables

1. Copy these values from your Firebase config to Vercel:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

2. Add them to Vercel Dashboard > Project Settings > Environment Variables

## Step 7: Test Firebase Connection

1. Deploy your app to Vercel
2. Test authentication flow
3. Test database read/write operations
4. Check Firebase console for activity

## Troubleshooting

### Common Issues

1. **Authentication not working**: Check that Google sign-in is enabled in Firebase
2. **Database access denied**: Verify Firestore security rules
3. **Environment variables not loading**: Ensure all Firebase config vars are set in Vercel
4. **CORS errors**: Firebase handles CORS automatically, but check your domain is authorized

### Debugging

- Check Firebase console for authentication and database activity
- Use browser dev tools to check for Firebase initialization errors
- Verify environment variables are loaded correctly in the browser

## Next Steps

After setup:
1. Customize security rules for your specific needs
2. Set up Firebase Analytics (optional)
3. Configure Firebase Storage if needed
4. Set up automated backups
5. Monitor usage and costs
