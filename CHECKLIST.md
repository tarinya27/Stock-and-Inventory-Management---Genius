# Setup Checklist

Use this checklist to ensure everything is set up correctly.

## Pre-Setup

- [ ] Node.js 16+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Firebase account created
- [ ] USB Barcode Scanner (optional, for testing)

## Firebase Setup

- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] Security rules deployed (`firestore.rules`)
- [ ] Indexes created (or will be auto-created)
- [ ] Firebase config copied to `frontend/src/config/firebase.ts`

## Application Setup

- [ ] Dependencies installed (`cd frontend && npm install`)
- [ ] Firebase config updated in `firebase.ts`
- [ ] Application runs (`npm start`)
- [ ] No console errors

## User Setup

- [ ] Admin user created in Firebase Authentication
- [ ] Admin user document created in Firestore `users` collection
- [ ] User role set to "admin"
- [ ] Can login successfully

## Testing

- [ ] Login works
- [ ] Dashboard displays
- [ ] Can navigate between pages
- [ ] Can add a product (Admin)
- [ ] Can scan/enter barcode
- [ ] Product details display correctly
- [ ] Stock balance shows correctly
- [ ] Can add stock IN
- [ ] Can record stock OUT
- [ ] Balance updates after operations
- [ ] Reports generate correctly
- [ ] Low stock alerts work

## Barcode Scanner (Optional)

- [ ] USB scanner connected
- [ ] Scanner works as keyboard input
- [ ] Auto-focus works on scan page
- [ ] Barcode scans successfully
- [ ] Product loads automatically

## Production Readiness

- [ ] All features tested
- [ ] Error handling works
- [ ] Loading states display
- [ ] Security rules are correct
- [ ] Sample data removed (if added)
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic with Firebase)
- [ ] Monitoring set up
- [ ] Backups configured

## Documentation

- [ ] README.md reviewed
- [ ] SETUP.md reviewed
- [ ] QUICK_START.md reviewed
- [ ] All docs in `docs/` folder reviewed
- [ ] Team members have access to docs

## Deployment (Optional)

- [ ] Firebase CLI installed
- [ ] Logged into Firebase
- [ ] Firebase project initialized
- [ ] Build successful (`npm run build`)
- [ ] Deployed to Firebase Hosting
- [ ] App accessible at Firebase URL
- [ ] Custom domain configured (if needed)

## Post-Deployment

- [ ] Can access app from production URL
- [ ] Login works in production
- [ ] All features work in production
- [ ] Performance is acceptable
- [ ] No console errors in production
- [ ] Mobile responsive (test on phone/tablet)

## Maintenance

- [ ] Regular backups scheduled
- [ ] Monitoring alerts configured
- [ ] Billing alerts set up
- [ ] Team trained on system
- [ ] Documentation updated

---

## Quick Test Flow

1. ✅ Login → Should see Dashboard
2. ✅ Add Product → Should create successfully
3. ✅ Scan Barcode → Should show product details
4. ✅ Stock IN → Should add stock
5. ✅ Stock OUT → Should reduce stock
6. ✅ View Reports → Should show movements
7. ✅ Check Low Stock → Should show alerts if applicable

If all checkboxes are checked, your system is ready! 🎉
