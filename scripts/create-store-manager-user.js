/**
 * Script to create a store manager user in Firebase
 * 
 * Usage:
 * 1. Install Firebase Admin SDK: npm install firebase-admin
 * 2. Set up service account (see seed-data.js for instructions)
 * 3. Run: node scripts/create-store-manager-user.js
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    console.log('\nPlease set up Firebase Admin SDK:');
    console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
    console.log('2. Click "Generate New Private Key"');
    console.log('3. Save the JSON file');
    console.log('4. Set GOOGLE_APPLICATION_CREDENTIALS environment variable');
    process.exit(1);
  }
}

const auth = admin.auth();
const db = admin.firestore();

async function createStoreManagerUser() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n=== Create Store Manager User ===\n');

  rl.question('Email: ', async (email) => {
    rl.question('Password (min 6 characters): ', async (password) => {
      rl.question('Display Name: ', async (displayName) => {
        try {
          // Create user in Firebase Authentication
          const userRecord = await auth.createUser({
            email: email,
            password: password,
            displayName: displayName,
            emailVerified: false
          });

          console.log('\n✓ User created in Firebase Authentication');
          console.log(`  UID: ${userRecord.uid}`);

          // Create user document in Firestore
          await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: email,
            displayName: displayName,
            role: 'store_manager',
            isActive: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastLogin: null
          });

          console.log('✓ User document created in Firestore');
          console.log('\n✓ Store Manager user created successfully!');
          console.log(`\nYou can now login with:`);
          console.log(`  Email: ${email}`);
          console.log(`  Password: ${password}`);
          console.log(`  Role: Store Manager`);
        } catch (error) {
          console.error('\n✗ Error creating user:', error.message);
          if (error.code === 'auth/email-already-exists') {
            console.log('\nUser already exists. You can:');
            console.log('1. Login with existing credentials');
            console.log('2. Or update the user document in Firestore to set role="store_manager"');
          }
        } finally {
          rl.close();
          process.exit(0);
        }
      });
    });
  });
}

if (require.main === module) {
  createStoreManagerUser();
}

module.exports = { createStoreManagerUser };
