# Guide: Creating Admin and Store Manager Users in Firebase

This guide shows you how to create users with different roles (Admin and Store Manager) in Firebase.

## Overview

Each user needs **two things** in Firebase:
1. **Firebase Authentication** - Email/password login credentials
2. **Firestore User Document** - Profile with role, name, etc.

---

## Method 1: Manual Creation via Firebase Console (Recommended for Beginners)

### Step 1: Create User in Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Build** → **Authentication** → **Users**
4. Click **"Add user"** (or **"Add user"** button)
5. Fill in:
   - **Email**: e.g., `admin@example.com` or `manager@example.com`
   - **Password**: (minimum 6 characters)
   - **Email verification**: Leave unchecked (or verify manually)
6. Click **"Add user"**
7. **IMPORTANT**: Copy the **User UID** (long string like `xYz123AbC...`)
   - Click on the user row to see details
   - Copy the **UID** field

### Step 2: Create User Document in Firestore

1. In Firebase Console, go to **Build** → **Firestore Database** → **Data**
2. If you don't have a **`users`** collection:
   - Click **"Start collection"**
   - Collection ID: **`users`** (exactly lowercase)
   - Click **Next**
3. **Document ID**: Paste the **User UID** you copied from Step 1
   - ⚠️ **CRITICAL**: The Document ID must be the User UID, NOT the email!
4. Add these fields (click "Add field" for each):

#### For Admin User:
| Field          | Type      | Value                          |
|----------------|-----------|--------------------------------|
| `uid`          | string    | (same as Document ID / UID)    |
| `email`        | string    | admin@example.com              |
| `displayName`  | string    | Admin User                     |
| `role`         | string    | **admin** (lowercase)          |
| `isActive`     | boolean   | true                           |
| `createdAt`    | timestamp | Click "Set to current time"    |
| `lastLogin`    | null      | (leave empty or delete field)  |

#### For Store Manager User:
| Field          | Type      | Value                          |
|----------------|-----------|--------------------------------|
| `uid`          | string    | (same as Document ID / UID)    |
| `email`        | string    | manager@example.com            |
| `displayName`  | string    | Store Manager                  |
| `role`         | string    | **store_manager** (lowercase)  |
| `isActive`     | boolean   | true                           |
| `createdAt`    | timestamp | Click "Set to current time"    |
| `lastLogin`    | null      | (leave empty or delete field)  |

5. Click **Save**

### Step 3: Test Login

1. Open your app: `http://localhost:3000`
2. Select the correct role from the dropdown
3. Enter email and password
4. Click **Login**

---

## Method 2: Using Script (For Advanced Users)

### Prerequisites

1. Install Node.js dependencies:
   ```bash
   cd scripts
   npm install
   ```

2. Set up Firebase Admin SDK:
   - Go to Firebase Console → **Project Settings** → **Service Accounts**
   - Click **"Generate New Private Key"**
   - Save the JSON file securely
   - Set environment variable:
     ```bash
     # Windows PowerShell
     $env:GOOGLE_APPLICATION_CREDENTIALS="path\to\service-account-key.json"
     
     # Windows CMD
     set GOOGLE_APPLICATION_CREDENTIALS=path\to\service-account-key.json
     
     # Linux/Mac
     export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account-key.json"
     ```

### Create Admin User

```bash
cd scripts
node create-admin-user.js
```

Follow the prompts:
- Email: `admin@example.com`
- Password: (your password)
- Display Name: `Admin User`

The script will:
- Create user in Firebase Authentication
- Create user document in Firestore with `role: 'admin'`

### Create Store Manager User

The script currently only creates admin users. To create a store manager:

1. **Option A**: Modify `create-admin-user.js` temporarily:
   - Change line 61: `role: 'store_manager'` instead of `role: 'admin'`
   - Run the script
   - Change it back

2. **Option B**: Use Method 1 (Manual) for store managers

---

## Quick Reference: User Roles

### Admin Role
- **Role value**: `admin` (lowercase)
- **Menu items**: Dashboard, Reports, Low Stock, Products
- **Access**: Can view reports and low stock alerts

### Store Manager Role
- **Role value**: `store_manager` (lowercase)
- **Menu items**: Dashboard, Scan Barcode, Categories, Products, Stock In
- **Access**: Can manage inventory, scan barcodes, add stock

---

## Common Issues & Solutions

### Issue: "User profile not found"
**Solution**: 
- Make sure the Firestore document ID is exactly the User UID from Authentication
- Check that the `users` collection exists
- Verify the document has a `role` field

### Issue: "Role mismatch" error
**Solution**:
- Ensure the `role` field in Firestore matches what you selected on login
- Check for typos: `admin` or `store_manager` (lowercase, with underscore)

### Issue: Can't see menu items
**Solution**:
- Verify the `role` field in Firestore is correct
- Check browser console for errors
- Make sure you selected the correct role on login page

---

## Example: Creating Both Users

### Admin User Example:
```
Authentication:
- Email: admin@myshop.com
- Password: Admin123!
- UID: abc123xyz789

Firestore (users collection):
- Document ID: abc123xyz789
- Fields:
  - uid: "abc123xyz789"
  - email: "admin@myshop.com"
  - displayName: "Admin User"
  - role: "admin"
  - isActive: true
  - createdAt: [current timestamp]
```

### Store Manager User Example:
```
Authentication:
- Email: manager@myshop.com
- Password: Manager123!
- UID: def456uvw012

Firestore (users collection):
- Document ID: def456uvw012
- Fields:
  - uid: "def456uvw012"
  - email: "manager@myshop.com"
  - displayName: "Store Manager"
  - role: "store_manager"
  - isActive: true
  - createdAt: [current timestamp]
```

---

## Verification Checklist

After creating a user, verify:

- [ ] User exists in Firebase Authentication → Users
- [ ] User document exists in Firestore → users collection
- [ ] Document ID = User UID (not email)
- [ ] `role` field is set correctly (`admin` or `store_manager`)
- [ ] `isActive` is `true`
- [ ] Can login with email/password
- [ ] Correct menu items appear based on role
- [ ] Can access role-specific routes

---

## Need Help?

If you encounter issues:
1. Check browser console (F12) for error messages
2. Verify Firestore document structure matches the schema
3. Ensure role values are exactly `admin` or `store_manager` (lowercase)
4. Check that Document ID matches User UID exactly
