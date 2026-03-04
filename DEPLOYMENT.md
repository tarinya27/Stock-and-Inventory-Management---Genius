# Deployment Guide

## Deploy to Firebase Hosting

### Prerequisites

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init
   ```
   
   Select:
   - ✅ Firestore (for database rules and indexes)
   - ✅ Hosting (for web app)
   - Use existing project (select your Firebase project)
   - Public directory: `frontend/build`
   - Single-page app: Yes
   - Overwrite index.html: No

### Build and Deploy

1. **Build the React app:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy Firestore rules and indexes:**
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only firestore:indexes
   ```

3. **Deploy the web app:**
   ```bash
   firebase deploy --only hosting
   ```

4. **Or deploy everything:**
   ```bash
   firebase deploy
   ```

Your app will be available at: `https://YOUR_PROJECT_ID.web.app`

## Environment Variables

For production, you can set environment variables in Firebase Hosting or use the config directly in `firebase.ts`.

### Option 1: Direct Configuration (Current)

Update `frontend/src/config/firebase.ts` with your Firebase config before building.

### Option 2: Environment Variables

1. Create `.env.production` file:
   ```
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

2. Build will automatically use these values:
   ```bash
   npm run build
   ```

## Custom Domain

1. Go to Firebase Console > Hosting
2. Click "Add custom domain"
3. Follow the instructions to verify domain ownership
4. Update DNS records as instructed
5. Wait for SSL certificate provisioning

## Continuous Deployment (Optional)

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm install
      
      - name: Build
        run: |
          cd frontend
          npm run build
        env:
          REACT_APP_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          REACT_APP_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          REACT_APP_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
          REACT_APP_FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}
          REACT_APP_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}
          REACT_APP_FIREBASE_APP_ID: ${{ secrets.FIREBASE_APP_ID }}
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: ${{ secrets.FIREBASE_PROJECT_ID }}
```

## Performance Optimization

### Enable Caching

Firebase Hosting automatically caches static assets. For better performance:

1. **Enable Compression:**
   - Already enabled by default in Firebase Hosting

2. **CDN:**
   - Firebase Hosting uses Google's CDN automatically

3. **Code Splitting:**
   - React already does code splitting
   - Consider lazy loading routes for better initial load

### Monitor Performance

1. Use Firebase Performance Monitoring
2. Check Firebase Console > Hosting > Usage
3. Monitor Firestore reads/writes

## Security Checklist

- [ ] Firestore Security Rules are deployed
- [ ] Authentication is enabled
- [ ] HTTPS is enforced (automatic with Firebase Hosting)
- [ ] Environment variables are not exposed in client code
- [ ] API keys are restricted in Firebase Console
- [ ] User roles are properly configured

## Backup Strategy

### Firestore Backup

1. **Manual Export:**
   ```bash
   gcloud firestore export gs://YOUR_BUCKET/backup-$(date +%Y%m%d)
   ```

2. **Automated Backups:**
   - Set up Cloud Scheduler to run exports daily
   - Store backups in Cloud Storage

### Database Migration

If you need to migrate data:

1. Export from Firestore
2. Transform data if needed
3. Import to new project/database

## Rollback

If something goes wrong:

1. **Rollback Hosting:**
   ```bash
   firebase hosting:rollback
   ```

2. **Rollback Firestore Rules:**
   - Go to Firebase Console > Firestore > Rules
   - Click "History" to see previous versions
   - Restore previous version

## Monitoring

### Firebase Console

- **Hosting:** View usage, bandwidth, errors
- **Firestore:** Monitor reads/writes, storage
- **Authentication:** View user activity
- **Performance:** Track app performance metrics

### Set Up Alerts

1. Go to Firebase Console > Project Settings > Usage and billing
2. Set up billing alerts
3. Monitor Firestore usage
4. Set up error alerts in Firebase Console

## Troubleshooting

### Build Fails

- Check Node.js version (should be 16+)
- Clear `node_modules` and reinstall
- Check for TypeScript errors

### Deploy Fails

- Verify Firebase login: `firebase login --reauth`
- Check project ID: `firebase use --add`
- Verify build directory exists: `ls frontend/build`

### App Not Loading

- Check Firebase config in `firebase.ts`
- Verify Firestore rules allow reads
- Check browser console for errors
- Verify Authentication is enabled

### Performance Issues

- Enable Firestore indexes
- Optimize queries (limit results, use pagination)
- Consider Cloud Functions for heavy operations
- Use Firestore caching

## Production Checklist

Before going live:

- [ ] Firebase config is correct
- [ ] Admin user is created
- [ ] Firestore rules are deployed
- [ ] Indexes are created
- [ ] Sample data is removed (if needed)
- [ ] Custom domain is configured (optional)
- [ ] SSL certificate is active
- [ ] Monitoring is set up
- [ ] Backups are configured
- [ ] Team members have access
- [ ] Documentation is updated
