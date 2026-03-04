# Quick Setup Guide

## Prerequisites

- Node.js 16+ installed
- npm or yarn
- Firebase account (free tier works)
- USB Barcode Scanner (optional for testing)

## Step-by-Step Setup

### 1. Clone/Download Project

```bash
cd stock-management-system
```

### 2. Install Dependencies

```bash
cd frontend
npm install
```

### 3. Firebase Setup

1. **Create Firebase Project**
   - Visit https://console.firebase.google.com/
   - Click "Add Project"
   - Name it (e.g., "stock-management")
   - Complete setup wizard

2. **Enable Authentication**
   - Go to Authentication > Sign-in method
   - Enable "Email/Password"
   - Save

3. **Create Firestore Database**
   - Go to Firestore Database
   - Click "Create Database"
   - Select "Standard edition" (this is the regular Firestore database)
   - Choose location
   - Enable

4. **Add Security Rules**
   - Go to Firestore Database > Rules
   - Copy rules from `docs/DATABASE_SCHEMA.md`
   - Paste and Publish

5. **Create Indexes**
   - Go to Firestore Database > Indexes
   - Create indexes listed in `docs/DATABASE_SCHEMA.md`
   - Or let Firestore create them automatically when you run queries

6. **Get Firebase Config**
   - Click the **gear icon** ⚙️ next to "Project Overview"
   - Select **"General"** from the dropdown menu
   - Scroll down to **"Your apps"** section
   - Click the **web icon** (`</>`) to add a web app (if you don't have one)
   - Register app: App nickname: `Stock Management`
   - Copy the config object (displayed after registration)

7. **Update Firebase Config**
   - Open `frontend/src/config/firebase.ts`
   - Replace placeholder values with your Firebase config

### 4. Create First Admin User

**Method 1: Using Firebase Console**

1. Go to Authentication > Users
2. Click "Add user"
3. Enter email and password (e.g., admin@example.com)
4. Note the User UID

5. Go to Firestore Database
6. Create new collection: `users`
7. Create document with User UID as document ID
8. Add fields:
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

**Method 2: Using the App (after first login)**

1. Login with Firebase Auth user
2. Manually add user document in Firestore (as above)

### 5. Run the Application

```bash
cd frontend
npm start
```

The app will open at `http://localhost:3000`

### 6. Login

- Use the admin credentials you created
- You should see the Dashboard

### 7. Add Sample Products

1. Go to "Products" page (Admin only)
2. Click "Add Product"
3. Add a test product:
   - Barcode: `1234567890123`
   - Name: `Test Product`
   - Category: `Test`
   - Cost Price: `10.00`
   - Selling Price: `20.00`
   - Low Stock Threshold: `5`

### 8. Test Stock Operations

1. Go to "Scan Barcode"
2. Enter barcode: `1234567890123`
3. Click "Stock IN"
4. Add quantity: `100`
5. Submit

6. Click "Stock OUT"
7. Enter quantity: `50`
8. Select reason: `Sale`
9. Submit

10. Verify balance shows: `50` (100 IN - 50 OUT)

### 9. Test Barcode Scanner (Optional)

1. Plug USB barcode scanner
2. Go to "Scan Barcode" page
3. Input field should auto-focus
4. Scan a barcode
5. Product details should appear automatically

## Troubleshooting

### "Firebase config not found"
- Make sure you updated `frontend/src/config/firebase.ts` with your Firebase config

### "User profile not found"
- Make sure you created a user document in Firestore `users` collection
- Document ID must match the Firebase Auth UID

### "Permission denied"
- Check Firestore Security Rules
- Make sure they're published

### "Index not found"
- Firestore will prompt you to create indexes
- Click the link in the error message
- Or create them manually in Firestore Console

### Barcode scanner not working
- Check USB connection
- Try manually typing barcode + Enter
- Make sure input field is focused

## Next Steps

1. Add more products
2. Create additional users (Store Managers)
3. Test all features
4. Deploy to Firebase Hosting (see `docs/IMPLEMENTATION_GUIDE.md`)

## Support

For detailed documentation, see:
- `docs/SYSTEM_DESIGN.md` - System architecture
- `docs/DATABASE_SCHEMA.md` - Database structure
- `docs/BARCODE_SETUP.md` - Barcode scanner guide
- `docs/IMPLEMENTATION_GUIDE.md` - Implementation details
- `docs/UI_MOCKUP.md` - UI design guide
