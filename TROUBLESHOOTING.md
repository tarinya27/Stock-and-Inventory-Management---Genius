# Troubleshooting Guide

## Common Issues and Solutions

### Module Not Found: date-fns

**Error:**
```
Module not found: Error: Can't resolve 'date-fns/addDays'
Module not found: Error: Can't resolve 'date-fns/addSeconds'
```

**Solution:**
The `date-fns` package is missing. It's required by `@mui/x-date-pickers` with `AdapterDateFns`.

1. **Install date-fns:**
   ```bash
   cd frontend
   npm install date-fns@^2.30.0
   ```

2. **If npm install fails with cache errors:**
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Then install
   npm install
   ```

3. **Alternative: Delete node_modules and reinstall**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```
   
   On Windows PowerShell:
   ```powershell
   cd frontend
   Remove-Item -Recurse -Force node_modules
   Remove-Item package-lock.json
   npm install
   ```

### Firebase Config Not Found

**Error:**
```
Firebase: No Firebase App '[DEFAULT]' has been created
```

**Solution:**
1. Make sure you've updated `frontend/src/config/firebase.ts` with your Firebase config
2. Get your config from Firebase Console > Project Settings > General > Your apps
3. Replace the placeholder values in `firebase.ts`

### User Profile Not Found

**Error:**
```
User profile not found
```

**Solution:**
1. Make sure you created a user document in Firestore `users` collection
2. Document ID must match the Firebase Auth UID
3. User document must have `role` field set to "admin" or "store_manager"

### Permission Denied (Firestore)

**Error:**
```
FirebaseError: Missing or insufficient permissions
```

**Solution:**
1. Check Firestore Security Rules are deployed
2. Make sure rules allow authenticated users to read/write
3. Verify you're logged in
4. Check user role in Firestore `users` collection

### Barcode Scanner Not Working

**Symptoms:**
- Scanner doesn't trigger product lookup
- Input field doesn't auto-focus

**Solution:**
1. Check USB connection
2. Try different USB port
3. Verify scanner is in "keyboard mode" (not serial mode)
4. Test by manually typing barcode + Enter
5. Make sure input field is visible and focused
6. Check browser console for errors

### Build Fails

**Error:**
```
Failed to compile
```

**Solution:**
1. Check Node.js version (should be 16+):
   ```bash
   node --version
   ```

2. Clear cache and reinstall:
   ```bash
   cd frontend
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

3. Check for TypeScript errors:
   ```bash
   npm run build
   ```

### Port Already in Use

**Error:**
```
Something is already running on port 3000
```

**Solution:**
1. Use a different port:
   ```bash
   PORT=3001 npm start
   ```
   
   On Windows:
   ```powershell
   $env:PORT=3001; npm start
   ```

2. Or kill the process using port 3000:
   ```bash
   # Find process
   netstat -ano | findstr :3000
   # Kill process (replace PID with actual process ID)
   taskkill /PID <PID> /F
   ```

### Insufficient Stock Error

**Error:**
```
Insufficient stock. Available: X, Requested: Y
```

**Solution:**
This is expected behavior - the system prevents stock OUT when balance is insufficient. Check:
1. Current balance is correct
2. You're not trying to remove more than available
3. Add stock IN first if needed

### Reports Not Loading

**Symptoms:**
- Reports page shows "No movements found"
- Reports are empty

**Solution:**
1. Check date range is correct
2. Verify stock movements exist in Firestore
3. Check Firestore indexes are created
4. Look for errors in browser console
5. Verify Firestore security rules allow reads

### Low Stock Not Showing

**Symptoms:**
- Low Stock page is empty
- No alerts displayed

**Solution:**
1. Check products have `lowStockThreshold` set
2. Verify stock balance is below threshold
3. Check Firestore queries are working
4. Look for errors in browser console

### Date Picker Not Working

**Error:**
```
Cannot read property 'format' of undefined
```

**Solution:**
1. Make sure `date-fns` is installed (see first issue above)
2. Check `AdapterDateFns` is imported correctly
3. Verify `LocalizationProvider` wraps date picker components

### Authentication Issues

**Error:**
```
Firebase: Error (auth/user-not-found)
```

**Solution:**
1. Verify user exists in Firebase Authentication
2. Check email/password are correct
3. Make sure Email/Password provider is enabled
4. Check user document exists in Firestore `users` collection

### TypeScript Errors

**Error:**
```
Type 'X' is not assignable to type 'Y'
```

**Solution:**
1. Check type definitions in `src/types/index.ts`
2. Verify imports are correct
3. Make sure all dependencies are installed
4. Restart TypeScript server in your IDE

## Getting More Help

1. **Check Browser Console:**
   - Open Developer Tools (F12)
   - Look for errors in Console tab
   - Check Network tab for failed requests

2. **Check Firebase Console:**
   - Go to Firebase Console
   - Check Authentication > Users
   - Check Firestore > Data
   - Check Firestore > Rules

3. **Check Logs:**
   - Look for error messages in terminal
   - Check Firebase Console > Functions > Logs (if using Cloud Functions)

4. **Verify Setup:**
   - Go through `CHECKLIST.md`
   - Verify all steps are completed
   - Check `SETUP.md` for detailed instructions

## Still Having Issues?

1. Make sure all dependencies are installed:
   ```bash
   cd frontend
   npm install
   ```

2. Verify Firebase configuration is correct

3. Check Firestore security rules are deployed

4. Verify user exists in both Firebase Auth and Firestore

5. Clear browser cache and try again

6. Try in incognito/private browsing mode

7. Check if issue persists in different browser
