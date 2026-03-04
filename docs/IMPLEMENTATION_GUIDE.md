# Implementation Guide

## Setup Instructions

### 1. Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add Project"
   - Enter project name (e.g., "stock-management")
   - Follow the setup wizard

2. **Enable Authentication**
   - In Firebase Console, go to "Authentication"
   - Click "Get Started"
   - Enable "Email/Password" provider
   - Save

3. **Create Firestore Database**
   - Go to "Firestore Database"
   - Click "Create Database"
   - Select "Standard edition" (this is the regular Firestore database)
   - Choose a location close to your users
   - Click "Enable"

4. **Configure Security Rules**
   - Go to Firestore Database > Rules
   - Copy the security rules from `docs/DATABASE_SCHEMA.md`
   - Paste and publish

5. **Create Indexes**
   - Go to Firestore Database > Indexes
   - Create the following composite indexes:
     - Collection: `stock_in`
       - Fields: `barcode` (Ascending), `date` (Descending)
     - Collection: `stock_in`
       - Fields: `date` (Descending)
     - Collection: `stock_in`
       - Fields: `userId` (Ascending), `date` (Descending)
     - Collection: `stock_out`
       - Fields: `barcode` (Ascending), `date` (Descending)
     - Collection: `stock_out`
       - Fields: `date` (Descending)
     - Collection: `stock_out`
       - Fields: `userId` (Ascending), `date` (Descending)
     - Collection: `products`
       - Fields: `category` (Ascending)
     - Collection: `products`
       - Fields: `name` (Ascending)

6. **Get Firebase Config**
   - Click the **gear icon** ⚙️ next to "Project Overview"
   - Select **"General"** from the dropdown menu
   - Scroll down to **"Your apps"** section
   - Click the **web icon** (`</>`) to add a web app (if you don't have one)
   - Register app: App nickname: `Stock Management`
   - Copy the Firebase configuration object (displayed after registration)
   - Update `frontend/src/config/firebase.ts` with your config

### 2. Install Dependencies

```bash
cd frontend
npm install
```

### 3. Create Initial Admin User

You can create the first admin user using Firebase Console or create a simple script:

**Option 1: Using Firebase Console**
1. Go to Authentication > Users
2. Click "Add user"
3. Enter email and password
4. Note the UID

5. Go to Firestore Database
6. Create a document in `users` collection with the UID as document ID:
```json
{
  "uid": "USER_UID_FROM_AUTH",
  "email": "admin@example.com",
  "displayName": "Admin User",
  "role": "admin",
  "isActive": true,
  "createdAt": "TIMESTAMP",
  "lastLogin": null
}
```

**Option 2: Using Firebase CLI**
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
# Then use Firestore console to add user document
```

### 4. Run the Application

```bash
cd frontend
npm start
```

The app will open at `http://localhost:3000`

## Backend Logic and Formulas

### Stock Balance Calculation

The balance is calculated using the formula:

```
Balance = Total IN - Total OUT
```

**Implementation:**
```typescript
// Get all stock IN records for a product
const totalIn = sum of all quantities in stock_in collection where barcode = productBarcode

// Get all stock OUT records for a product
const totalOut = sum of all quantities in stock_out collection where barcode = productBarcode

// Calculate balance
const balance = totalIn - totalOut
```

**Real-time Calculation:**
- Balance is calculated on-demand when viewing product details
- No pre-calculated values stored (for accuracy)
- For better performance with large datasets, consider Cloud Functions to maintain a `stock_balance` collection

### Stock IN Logic

```typescript
1. Validate quantity > 0
2. Create stock_in document with:
   - barcode
   - quantity
   - date (defaults to now)
   - userId
   - userName
   - notes (optional)
3. Balance automatically updates (calculated on next view)
```

### Stock OUT Logic

```typescript
1. Validate quantity > 0
2. Check current balance
3. If quantity > balance, throw error
4. Create stock_out document with:
   - barcode
   - quantity
   - date (defaults to now)
   - userId
   - userName
   - reason (Sale, Return, Damaged, Other)
   - notes (optional)
5. Balance automatically updates (calculated on next view)
```

## Barcode Scanner Setup

### USB Barcode Scanner

1. **Physical Setup**
   - Plug USB barcode scanner into computer
   - Most scanners work immediately (HID keyboard mode)

2. **Scanner Configuration** (if needed)
   - Some scanners require configuration via:
     - Configuration cards (scan special barcodes)
     - Software from manufacturer
     - DIP switches

3. **Test Scanner**
   - Open the app
   - Navigate to "Scan Barcode" page
   - The input field should auto-focus
   - Scan a barcode
   - Scanner sends barcode + Enter key
   - App processes automatically

### Testing Without Scanner

You can test by manually typing barcodes:
1. Click on barcode input field
2. Type barcode (e.g., "1234567890123")
3. Press Enter
4. Product details should appear

## Adding Sample Data

### Add Products

1. Login as Admin
2. Go to "Products" page
3. Click "Add Product"
4. Fill in:
   - Barcode (e.g., "1234567890123")
   - Name (e.g., "Gaming Mouse")
   - Category (e.g., "Mouse")
   - Cost Price (e.g., 15.00)
   - Selling Price (e.g., 25.00)
   - Low Stock Threshold (e.g., 10)

### Add Stock IN

1. Go to "Scan Barcode"
2. Scan or enter product barcode
3. Click "Stock IN"
4. Enter quantity
5. Submit

### Record Stock OUT

1. Go to "Scan Barcode"
2. Scan or enter product barcode
3. Click "Stock OUT"
4. Enter quantity (must be <= balance)
5. Select reason
6. Submit

## Deployment

### Deploy to Firebase Hosting

```bash
# Build the app
cd frontend
npm run build

# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase Hosting
firebase init hosting
# Select: Use existing project
# Public directory: build
# Single-page app: Yes
# Overwrite index.html: No

# Deploy
firebase deploy --only hosting
```

The app will be available at: `https://YOUR_PROJECT_ID.web.app`

## Troubleshooting

### Issue: "Product not found" when scanning
**Solution:** Make sure the product exists in the `products` collection with the scanned barcode as document ID.

### Issue: Barcode scanner not working
**Solution:**
- Check USB connection
- Try different USB port
- Check scanner is in "keyboard mode" (not serial mode)
- Test by manually typing in the input field

### Issue: "Insufficient stock" error
**Solution:** Check current balance. Stock OUT cannot exceed available balance.

### Issue: Slow performance with many products
**Solution:**
- Consider implementing pagination
- Use Cloud Functions to maintain `stock_balance` collection
- Add more Firestore indexes

### Issue: Authentication errors
**Solution:**
- Check Firebase config in `frontend/src/config/firebase.ts`
- Verify Authentication is enabled in Firebase Console
- Check user exists in both Authentication and Firestore `users` collection

## Security Best Practices

1. **Never expose Firebase Admin SDK** in frontend code
2. **Use Firestore Security Rules** to restrict access
3. **Validate all inputs** on both client and server (via Cloud Functions)
4. **Use HTTPS** in production
5. **Regular backups** of Firestore data
6. **Monitor** Firebase usage and set up billing alerts

## Optional Enhancements

### Cloud Functions for Stock Balance

Create a Cloud Function to maintain `stock_balance` collection:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.updateStockBalance = functions.firestore
  .document('stock_in/{id}')
  .onWrite(async (change, context) => {
    const barcode = change.after.data().barcode;
    // Recalculate and update stock_balance collection
  });

exports.updateStockBalanceOut = functions.firestore
  .document('stock_out/{id}')
  .onWrite(async (change, context) => {
    const barcode = change.after.data().barcode;
    // Recalculate and update stock_balance collection
  });
```

### Multi-Store Support

1. Add `storeId` field to `stock_in` and `stock_out` collections
2. Filter queries by `storeId`
3. Add store selection in UI
4. Create `stores` collection

### Export Reports to CSV/PDF

Use libraries like:
- `papaparse` for CSV export
- `jspdf` for PDF export

### Real-time Updates

Use Firestore `onSnapshot` listeners for real-time updates:
```typescript
import { onSnapshot } from 'firebase/firestore';

onSnapshot(collection(db, 'stock_in'), (snapshot) => {
  // Update UI in real-time
});
```
