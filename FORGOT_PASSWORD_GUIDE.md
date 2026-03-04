# Forgot Email or Password – What to Do

## You can see your email, but not your password

- **Email:** You can look it up in Firebase (see below).
- **Password:** Firebase never stores it in plain text, so it **cannot be viewed** anywhere. You must **reset** it.

---

## Option 1: Find your email, then reset password (recommended)

### Step 1: Find your email in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Open your project (e.g. **Stock-management-s**).
3. In the left menu, go to **Build** → **Authentication**.
4. Open the **Users** tab.
5. You’ll see a list of all users with their **email addresses**.  
   Note the one you used for this app.

### Step 2: Reset your password from the app

1. Open your app: `http://localhost:3000` (with the app running).
2. On the login page, click **“Forgot password?”**.
3. Enter the **email** you found in Step 1.
4. Click **“Send reset link”**.
5. Check that email’s **inbox** (and **spam/junk**).
6. Open the email from Firebase and use the link to set a **new password**.
7. Return to the app and log in with that email and the new password.

### If “Forgot password?” doesn’t work

- In Firebase Console go to **Authentication** → **Templates**.
- Check that **“Password reset”** is enabled and the sender name/email look correct.
- Ensure your Firebase project has **Email/Password** sign-in enabled under **Authentication** → **Sign-in method**.

---

## Option 2: Create a new admin user

If you’d rather use a new account:

1. In Firebase Console go to **Authentication** → **Users**.
2. Click **“Add user”**.
3. Enter a new **email** and **password** and save.
4. Copy the new user’s **User UID** (shown in the users table).
5. Go to **Firestore Database** → **Data**.
6. Open or create the **users** collection.
7. Add a **new document** with:
   - **Document ID:** the **User UID** from step 4.
   - **Fields:**  
     `uid` (string) = same UID  
     `email` (string) = new email  
     `displayName` (string) = e.g. "Admin"  
     `role` (string) = `admin`  
     `isActive` (boolean) = `true`  
     `createdAt` (timestamp) = now  
     `lastLogin` = leave empty or null  
8. Save.
9. In the app, log in with the **new email** and **password**.

---

## Summary

| I forgot… | What to do |
|----------|------------|
| **Email** | Firebase Console → Authentication → Users → check the list. |
| **Password** | Use **“Forgot password?”** on the login page with that email, or create a new user (Option 2). |

Passwords are never visible; resetting or creating a new user is the only way to get back in.
