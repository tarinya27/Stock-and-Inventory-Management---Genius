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

## Updating All Installed Machines

When you make code changes (e.g., barcode fixes, Firestore optimizations), you need to rebuild and redistribute:

### Step 1: Bump the version (optional but recommended)

Edit `frontend/package.json` and change the version:

```json
"version": "1.0.1"
```

This helps users know they have the latest build.

### Step 2: Build the new installer

```bash
cd d:\Genius\frontend
npm run electron-build:win
```

This creates a new installer in `frontend\dist\`.

### Step 3: Distribute to machines

1. Copy **Stock Management System Setup 1.0.1.exe** (or whatever version) to:
   - USB drive
   - Shared network folder (e.g., `\\server\share\StockApp`)
   - Or email to each machine

2. On each office PC:
   - Close the app if it’s running
   - Run the new installer
   - Install over the existing version (no need to uninstall)

3. Users can launch the app from the Start Menu or desktop shortcut as before.

---

## Distribute to the Office (First Time)

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

---

## App works on your PC but not on company PC?

This is usually caused by **corporate firewall or network**.

### Step 1: Find out what "not working" means

On the company PC, open the app and press **F12** to open DevTools. Go to the **Console** tab. Look for red errors:

| Error | What it means |
|-------|----------------|
| `Failed to fetch` / `net::ERR_CONNECTION_REFUSED` | Firewall blocks Firebase |
| `Missing or insufficient permissions` | Firestore rules or Auth domain |
| `auth/network-request-failed` | Network blocked |
| Blank white screen | Check Console for any error |

### Step 2: Test Firebase connectivity

On the company PC, open **Command Prompt** and run:

```cmd
ping firebase.googleapis.com
ping firestore.googleapis.com
```

- If both fail → **Firewall is blocking Firebase**. IT must allow these domains.
- If both succeed → Problem is likely Auth or Firestore rules.

### Step 3: Ask IT to allow these domains (if needed)

Corporate firewalls often block Google. Ask IT to allow outbound HTTPS to:

- `*.googleapis.com`
- `*.firebaseio.com`
- `*.firebaseapp.com`
- `*.google.com`

Or allow the app through the firewall (e.g., add `Stock Management System.exe` to exceptions).

### Step 4: Firebase Auth – add domains

1. Go to [Firebase Console](https://console.firebase.google.com) → your project
2. **Authentication** → **Settings** → **Authorized domains**
3. Ensure these exist:
   - `localhost`
   - `127.0.0.1`

### Step 5: Proxy / VPN

If the company uses a VPN or proxy:

- Try connecting from the company PC **without** VPN first
- If it works without VPN → VPN is blocking Firebase
- Ask IT to allow Firebase through the proxy

### Step 6: Antivirus

On the company PC:

- Temporarily disable antivirus and test
- If it works → Add the app to antivirus exclusions

### Step 7: Run as admin

Right‑click the app → **Run as administrator**. Some corporate setups block apps by default.

---

**Quick checklist for company machine:**

1. [ ] Internet works (check in browser)
2. [ ] F12 → Console shows no red errors (or note the exact error)
3. [ ] `ping firebase.googleapis.com` succeeds
4. [ ] `localhost` is in Firebase Auth domains
5. [ ] Antivirus not blocking the app
6. [ ] Try "Run as administrator"
