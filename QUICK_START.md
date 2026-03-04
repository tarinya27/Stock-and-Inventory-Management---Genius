# Quick Start Guide

Get your Stock Management System up and running in 5 minutes!

## Step 1: Install Dependencies (2 minutes)

```bash
cd frontend
npm install
```

## Step 2: Set Up Firebase (3 minutes)

### 2.1 Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add Project"
3. Name it (e.g., "stock-management")
4. Complete the wizard

### 2.2 Enable Services

**Authentication:**
- Go to Authentication > Sign-in method
- Enable "Email/Password"
- Save

**Firestore:**
- Go to Firestore Database
- Click "Create Database"
- Select "Standard edition" (this is the regular Firestore database)
- Choose location
- Enable

### 2.3 Add Security Rules

1. Go to Firestore Database > Rules
2. Copy the contents of `firestore.rules` file
3. Paste into the rules editor
4. Click "Publish"

### 2.4 Deploy Indexes (Optional - Firestore will create them automatically)

```bash
firebase deploy --only firestore:indexes
```

Or let Firestore create them automatically when you run queries.

### 2.5 Get Firebase Config

1. Click the **gear icon** ⚙️ next to "Project Overview"
2. Select **"General"** from the dropdown menu
3. Scroll down to **"Your apps"** section
4. Click the **web icon** (`</>`) to add a web app (if you don't have one)
5. Register app:
   - App nickname: `Stock Management`
   - Click **"Register app"**
6. Copy the config object (it will be displayed after registration)

### 2.6 Update Config File

Open `frontend/src/config/firebase.ts` and replace the placeholder values:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## Step 3: Create Admin User (2 minutes)

### Option A: Using Script (Recommended)

1. Install Firebase Admin SDK:
   ```bash
   cd scripts
   npm install
   ```

2. Set up service account:
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file
   - Set environment variable:
     ```bash
     # Linux/Mac
     export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
     
     # Windows PowerShell
     $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccountKey.json"
     ```

3. Run the script:
   ```bash
   node create-admin-user.js
   ```

### Option B: Manual Setup

1. **Create user in Firebase Auth:**
   - Go to Authentication > Users
   - Click "Add user"
   - Enter email and password
   - Note the User UID

2. **Create user document in Firestore:**
   - Go to Firestore Database
   - Create collection: `users`
   - Create document with User UID as document ID
   - Add these fields:
     ```json
     {
       "uid": "YOUR_USER_UID",
       "email": "admin@example.com",
       "displayName": "Admin User",
       "role": "admin",
       "isActive": true,
       "createdAt": "TIMESTAMP",
       "lastLogin": null
     }
     ```

## Step 4: Run the Application (1 minute)

```bash
cd frontend
npm start
```

The app will open at `http://localhost:3000`

## Step 5: Login and Test

1. Login with your admin credentials
2. You should see the Dashboard
3. Go to "Products" page
4. Click "Add Product" to add your first product
5. Go to "Scan Barcode" to test stock operations

## Optional: Add Sample Data

To populate with sample products and stock records:

```bash
cd scripts
node seed-data.js
```

This adds 5 sample products and some stock movements for testing.

## Troubleshooting

### "Firebase config not found"
- Make sure you updated `frontend/src/config/firebase.ts`

### "User profile not found"
- Make sure you created the user document in Firestore `users` collection
- Document ID must match Firebase Auth UID

### "Permission denied"
- Check Firestore Security Rules are published
- Make sure rules allow authenticated users to read/write

### Barcode scanner not working?
- Check USB connection
- Try manually typing barcode + Enter
- Make sure input field is focused

## Next Steps

- Add your products
- Create additional users (Store Managers)
- Test stock IN/OUT operations
- Generate reports
- Deploy to production (see `DEPLOYMENT.md`)

## Need Help?

- Check `SETUP.md` for detailed setup
- See `docs/` folder for comprehensive documentation
- Review `PROJECT_SUMMARY.md` for overview

Happy stock managing! 🎉
