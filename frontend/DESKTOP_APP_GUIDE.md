# Stock Management System - Desktop App (No Code Sharing)

This guide explains how to build and distribute the app as a **standalone Windows installer**. You give the office **only the .exe installer file** — no source code is shared.

---

## Build the Installer (On Your Machine)

### Step 1: Open terminal in the project
```bash
cd d:\Genius\frontend
```

### Step 2: Install dependencies (first time only)
```bash
npm install
```

### Step 3: Create the Windows installer
```bash
npm run electron-build:win
```

This will:
1. Build the React app
2. Package it with Electron
3. Create the installer in `frontend\dist\`

**Output file:** `frontend\dist\Stock Management System Setup 1.0.0.exe`

---

## Distribute to the Office

1. Copy **Stock Management System Setup 1.0.0.exe** to a USB drive or shared folder
2. On each company PC, double-click the installer
3. Follow the installation wizard
4. Launch the app from the Start Menu or desktop shortcut

**That's it.** No code files, no Node.js, no development tools needed on office machines.

---

## Requirements for Office Machines

- **Windows 10 or 11** (64-bit)
- **Internet connection** (for Firebase)
- **Nothing else** — the app is fully self-contained

---

## Why the local server?

The app is served over a local HTTP server (not `file://`) because **Firebase requires http/https** to work. Loading from `file://` would cause the dashboard and all Firestore data to show as empty.

---

## Firebase setup for desktop app

The app loads from **http://localhost:29482**. Ensure **localhost** is in Firebase Auth authorized domains (it usually is by default). If you get "Missing or insufficient permissions", add it:
1. Firebase Console → Authentication → Settings → Authorized domains
2. If localhost is missing, click "Add domain" and enter: `localhost`

---

## Debugging (if data still doesn't load)

Press **F12** in the desktop app to open DevTools. Check the Console tab for error messages. Common issues:
- **Firebase permission denied** → Check Firestore rules
- **Network error** → Office firewall may block Firebase (googleapis.com)
- **CORS** → Ensure 127.0.0.1 is in Firebase authorized domains

---

## Troubleshooting

**Build fails?**
- Ensure Node.js is installed: `node --version`
- Run `npm install` again
- Check that `.env.production` exists with Firebase config

**App won't start on office PC?**
- Ensure internet connection
- Check Windows Defender / antivirus isn't blocking it
- Try "Run as administrator" for the installer
