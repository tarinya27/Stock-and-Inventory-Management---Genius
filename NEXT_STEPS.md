# Next Steps - Fix Firebase Configuration

You're seeing a Firebase API key error. Follow these steps to fix it:

## Step 1: Get Your Firebase Configuration (5 minutes)

### 1.1 Create/Open Firebase Project

1. Go to **https://console.firebase.google.com/**
2. Click **"Add Project"** (or select existing project)
3. Enter project name: `stock-management` (or your preferred name)
4. Click **"Continue"** → **"Continue"** → **"Create Project"**
5. Wait for project creation, then click **"Continue"**

### 1.2 Enable Authentication

1. In Firebase Console, click **"Authentication"** in the left menu
2. Click **"Get Started"** (if first time)
3. Go to **"Sign-in method"** tab
4. Click on **"Email/Password"**
5. Toggle **"Enable"** to ON
6. Click **"Save"**

### 1.3 Create Firestore Database

1. Click **"Firestore Database"** in the left menu
2. Click **"Create Database"**
3. Select **"Standard edition"** (choose this - it's the regular Firestore database)
   - **Note**: Enterprise edition is for advanced features and larger scale. Standard edition is perfect for this project.
4. Choose a location (closest to your users)
5. Click **"Enable"**
6. **Important**: After creation, go to the **"Rules"** tab and make sure rules are set (we'll add them in the next step)

### 1.4 Add Security Rules

1. In Firestore Database, go to **"Rules"** tab
2. Open `firestore.rules` file from your project
3. Copy ALL the content
4. Paste into the Rules editor in Firebase Console
5. Click **"Publish"**

### 1.5 Get Firebase Config

1. Click the **gear icon** ⚙️ next to "Project Overview"
2. Select **"General"** from the dropdown menu
3. Scroll down to **"Your apps"** section (or look for "SDK setup and configuration")
4. If you don't have a web app yet, click the **web icon** (`</>`) to add one
5. Register app:
   - App nickname: `Stock Management`
   - (Don't check Firebase Hosting - you can add that later)
   - Click **"Register app"**
6. **Copy the config object** - it looks like this (you'll see it right after registering):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

## Step 2: Update Firebase Config File (2 minutes)

1. Open `frontend/src/config/firebase.ts` in your editor
2. Replace the placeholder values with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

3. **Save the file**

## Step 3: Restart Development Server (1 minute)

1. Stop your current server (Ctrl+C in terminal)
2. Restart it:
   ```bash
   cd frontend
   npm start
   ```

## Step 4: Create Admin User (3 minutes)

You need to create a user before you can login.

### Option A: Using Firebase Console (Easiest)

1. Go to Firebase Console > **Authentication** > **Users**
2. Click **"Add user"**
3. Enter:
   - Email: `admin@example.com` (or your email)
   - Password: `admin123` (or secure password)
4. Click **"Add user"**
5. **Copy the User UID** (you'll see it in the user list)

6. Go to **Firestore Database** > **Data**
7. Click **"Start collection"**
8. Collection ID: `users`
9. Document ID: **Paste the User UID** you copied
10. Add these fields (click "Add field" for each):

| Field | Type | Value |
|-------|------|-------|
| `uid` | string | (same as document ID) |
| `email` | string | admin@example.com |
| `displayName` | string | Admin User |
| `role` | string | admin |
| `isActive` | boolean | true |
| `createdAt` | timestamp | (click "Set" - it will use current time) |
| `lastLogin` | null | (leave empty/null) |

11. Click **"Save"**

### Option B: Using Script (If you set up Firebase Admin SDK)

```bash
cd scripts
npm install
node create-admin-user.js
```

## Step 5: Test Login (1 minute)

1. Go to your app: `http://localhost:3000`
2. You should see the login page (no more API key error!)
3. Enter your credentials:
   - Email: `admin@example.com` (or what you created)
   - Password: `admin123` (or what you set)
4. Click **"Login"**
5. You should be redirected to the Dashboard! 🎉

## Step 6: Add Your First Product (2 minutes)

1. After logging in, click **"Products"** in the sidebar
2. Click **"Add Product"** button
3. Fill in:
   - Barcode: `1234567890123`
   - Product Name: `Test Product`
   - Category: `Test`
   - Cost Price: `10.00`
   - Selling Price: `20.00`
   - Low Stock Threshold: `5`
4. Click **"Create"**

## Step 7: Test Stock Operations (3 minutes)

1. Click **"Scan Barcode"** in the sidebar
2. Enter barcode: `1234567890123`
3. You should see product details
4. Click **"Stock IN"**
5. Enter quantity: `100`
6. Click **"Add Stock"**
7. Check the balance shows `100`
8. Click **"Stock OUT"**
9. Enter quantity: `25`
10. Select reason: `Sale`
11. Click **"Record Stock OUT"**
12. Balance should now show `75` (100 - 25)

## ✅ You're Done!

Your system is now fully configured and working! 

## Quick Reference

- **Firebase Console**: https://console.firebase.google.com/
- **Config File**: `frontend/src/config/firebase.ts`
- **Security Rules**: `firestore.rules` (already deployed)
- **Admin User**: Created in Firebase Auth + Firestore

## Troubleshooting

### Still seeing API key error?
- Make sure you saved `firebase.ts` file
- Restart the development server
- Check browser console for errors
- Verify config values are correct (no quotes around placeholders)

### "User profile not found" error?
- Make sure you created the user document in Firestore
- Document ID must match Firebase Auth UID exactly
- Check `role` field is set to `"admin"`

### "Permission denied" error?
- Make sure Firestore Security Rules are published
- Check rules allow authenticated users to read/write
- Verify you're logged in

## Next Steps After Setup

1. ✅ Add more products
2. ✅ Create Store Manager users
3. ✅ Test all features
4. ✅ Deploy to production (see `DEPLOYMENT.md`)

Need help? Check `TROUBLESHOOTING.md` for common issues.
