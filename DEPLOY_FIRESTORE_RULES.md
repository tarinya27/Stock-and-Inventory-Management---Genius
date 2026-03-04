# Deploy Firestore Rules to Fix "Missing or insufficient permissions"

The Current Stock report requires Firestore rules to be deployed. Follow these steps:

## 1. Install Firebase CLI (if not installed)

```bash
npm install -g firebase-tools
```

## 2. Login to Firebase (if not already)

```bash
firebase login
```

## 3. Deploy the rules

From the project root (`d:\Genius`):

```bash
firebase deploy --only firestore:rules
```

## 4. Refresh the Reports page

After deployment, refresh the Admin Reports page. The Current Stock report should load.

---

**What was fixed:**
- Added `reserved_stock` collection rules (was missing)
- Fixed `getUserRole()` to handle missing user documents
- Report now continues loading even if `reserved_stock` has permission issues
