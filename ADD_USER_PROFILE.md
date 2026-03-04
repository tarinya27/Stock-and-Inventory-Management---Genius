# Fix: "User profile not found"

## ⚠️ Important: Document ID is NOT the email

The app looks up your profile by **User UID**, not by email. In Firestore:

- **Document ID must be** = the **User UID** from Authentication (long string like `Kx7mN2pQ...`)
- **Document ID must NOT be** = the email (e.g. `test@gmail.com`)

If you created a document with ID `test@gmail.com`, the app will not find it. Create a **new** document whose **Document ID** is the **UID** from Authentication → Users for test@gmail.com, and put the email in the `email` **field** instead.

---

## Why this happens (including "it worked yesterday")

- The app needs **two** things for each user (see below). If the Firestore profile is missing or was deleted, you get this error.
- **Common reasons it appears again later:** the user document was deleted in Firestore, you’re logging in with a different email (different user that has no profile), or the Firestore database was reset/changed.

This app needs **two** things for each user:

1. **Firebase Authentication** – email/password (you already did this)
2. **Firestore user document** – profile with role, name, etc. (this is missing)

Add the Firestore profile for your new user like this:

---

## Step 1: Get the User UID

1. Go to [Firebase Console](https://console.firebase.google.com/) → your project
2. **Build** → **Authentication** → **Users**
3. Find the user you just added
4. Copy the **User UID** (long string like `xYz123AbC...`)  
   - You can click the user row to see details and copy the UID

---

## Step 2: Create the user document in Firestore

1. In Firebase Console go to **Build** → **Firestore Database** → **Data**
2. If you don’t have a **users** collection yet:
   - Click **"Start collection"**
   - Collection ID: **`users`** (exactly like that)
   - Click **Next**
3. **Document ID:** paste the **User UID** you copied (must match exactly)
4. Add these **fields** (click "Add field" for each):

| Field          | Type      | Value                          |
|----------------|-----------|---------------------------------|
| `uid`          | string    | (same as Document ID / UID)    |
| `email`        | string    | (the user’s email)             |
| `displayName`  | string    | (e.g. Admin User)             |
| `role`         | string    | **admin** or **store_manager** |
| `isActive`     | boolean   | true                           |
| `createdAt`    | timestamp | (use “Set to current time”)    |
| `lastLogin`    | null      | (leave empty or delete field)  |

5. Click **Save**

---

## Step 3: Try logging in again

1. Open your app: `http://localhost:3000`
2. Log in with the **email** and **password** of the user you added in Authentication  
   Login should work once the Firestore document exists.

---

## Quick check

- **Document ID** = User UID from Authentication (copy-paste, no typos)
- **Collection** = `users` (lowercase)
- **role** = `admin` or `store_manager` (lowercase)

If you still get "User profile not found", double-check that the Firestore document ID is exactly the same as the UID in Authentication → Users.
