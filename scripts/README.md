# Helper Scripts

These scripts help you set up and manage your stock management system.

## Prerequisites

1. Install Firebase Admin SDK:
   ```bash
   cd scripts
   npm install
   ```

2. Set up Firebase Admin credentials:
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file
   - Set environment variable:
     ```bash
     export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
     ```
   
   Or on Windows:
   ```powershell
   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccountKey.json"
   ```

## Available Scripts

### 1. Create Admin User

Creates an admin user in Firebase Authentication and Firestore.

```bash
node scripts/create-admin-user.js
```

The script will prompt you for:
- Email address
- Password (minimum 6 characters)
- Display Name

After running, you can login with these credentials as an Admin.

### 2. Create Store Manager User

Creates a store manager user in Firebase Authentication and Firestore.

```bash
node scripts/create-store-manager-user.js
```

The script will prompt you for:
- Email address
- Password (minimum 6 characters)
- Display Name

After running, you can login with these credentials as a Store Manager.

### 3. Seed Sample Data

Populates Firestore with sample products and stock records.

```bash
node scripts/seed-data.js
```

This will add:
- 5 sample products (Gaming Mouse, Keyboard, USB-C Cable, etc.)
- Sample stock IN records
- Sample stock OUT records

Useful for testing the system before adding real data.

## Manual Setup Alternative

If you prefer to set up manually:

### Create Admin User Manually

1. **Firebase Authentication:**
   - Go to Firebase Console > Authentication > Users
   - Click "Add user"
   - Enter email and password
   - Note the User UID

2. **Firestore User Document:**
   - Go to Firestore Database
   - Create collection: `users`
   - Create document with User UID as document ID
   - Add fields:
     
     **For Admin:**
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
     
     **For Store Manager:**
     ```json
     {
       "uid": "USER_UID_FROM_AUTH",
       "email": "manager@example.com",
       "displayName": "Store Manager",
       "role": "store_manager",
       "isActive": true,
       "createdAt": "TIMESTAMP",
       "lastLogin": null
     }
     ```

### Add Products Manually

1. Login to the application as Admin
2. Go to "Products" page
3. Click "Add Product"
4. Fill in product details

## Troubleshooting

### "Error initializing Firebase Admin"

Make sure:
1. You've generated the service account key
2. The `GOOGLE_APPLICATION_CREDENTIALS` environment variable is set
3. The JSON file path is correct

### "Permission denied"

Make sure:
1. Firestore Security Rules allow writes (or run in test mode temporarily)
2. The service account has proper permissions
3. You're using the correct Firebase project

### "User already exists"

If you get this error:
1. The user already exists in Firebase Authentication
2. You can either:
   - Login with existing credentials
   - Or manually update the Firestore user document to set `role: "admin"`
