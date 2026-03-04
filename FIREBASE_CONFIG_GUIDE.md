# How to Get Firebase Config - Step by Step

## Visual Guide

When you click the gear icon ⚙️ next to "Project Overview", you'll see a dropdown menu with these options:

- **General** ← Click this one!
- Usage and billing
- Integrations
- Service accounts
- Data privacy
- Users and permissions
- Alerts

## Detailed Steps

### Step 1: Open Project Settings
1. In Firebase Console, look at the top left
2. You'll see "Project Overview" with a **gear icon** ⚙️ next to it
3. Click the **gear icon** ⚙️

### Step 2: Select General
1. A dropdown menu will appear
2. Click **"General"** (first option in the list)
3. This opens the Project Settings page

### Step 3: Find Your Apps Section
1. On the General page, scroll down
2. Look for **"Your apps"** section
3. Or look for **"SDK setup and configuration"**

### Step 4: Add Web App (If Needed)
1. If you don't see a web app listed, click the **web icon** (`</>`)
2. Register your app:
   - App nickname: `Stock Management`
   - (Don't check Firebase Hosting - you can add that later)
   - Click **"Register app"**

### Step 5: Copy Config
1. After registering, you'll see your Firebase config
2. It looks like this:

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

3. **Copy this entire config object**

### Step 6: Update Your Code
1. Open `frontend/src/config/firebase.ts`
2. Replace the placeholder values with your actual config
3. Save the file
4. Restart your development server

## Quick Reference

**Navigation Path:**
```
Firebase Console → Gear Icon ⚙️ → General → Scroll to "Your apps" → Web Icon → Copy Config
```

## Troubleshooting

### Can't find "Your apps" section?
- Make sure you're on the "General" tab (not other tabs)
- Scroll down - it's usually below the project information
- If you already have apps, they'll be listed there

### Already have a web app?
- If you see your app listed, click on it
- The config will be displayed
- You can copy it from there

### Config not showing?
- Make sure you completed the registration process
- Try refreshing the page
- Check if you're logged into the correct Firebase project
