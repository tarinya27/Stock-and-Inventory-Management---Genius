/**
 * Seed script to populate Firestore with sample data
 * 
 * Usage:
 * 1. Install Firebase Admin SDK: npm install firebase-admin
 * 2. Set up service account: https://firebase.google.com/docs/admin/setup
 * 3. Set GOOGLE_APPLICATION_CREDENTIALS environment variable
 * 4. Run: node scripts/seed-data.js
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin
// Make sure to set GOOGLE_APPLICATION_CREDENTIALS environment variable
// or initialize with service account key file
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
    console.log('   Example: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"');
    process.exit(1);
  }
}

const db = admin.firestore();

const sampleProducts = [
  {
    barcode: '1234567890123',
    name: 'Gaming Mouse',
    category: 'Mouse',
    costPrice: 15.00,
    sellingPrice: 25.00,
    lowStockThreshold: 10
  },
  {
    barcode: '2345678901234',
    name: 'Mechanical Keyboard',
    category: 'Keyboard',
    costPrice: 45.00,
    sellingPrice: 75.00,
    lowStockThreshold: 5
  },
  {
    barcode: '3456789012345',
    name: 'USB-C Cable',
    category: 'Cable',
    costPrice: 5.00,
    sellingPrice: 12.00,
    lowStockThreshold: 20
  },
  {
    barcode: '4567890123456',
    name: 'Wireless Headphones',
    category: 'Audio',
    costPrice: 30.00,
    sellingPrice: 55.00,
    lowStockThreshold: 8
  },
  {
    barcode: '5678901234567',
    name: 'Webcam HD 1080p',
    category: 'Camera',
    costPrice: 40.00,
    sellingPrice: 70.00,
    lowStockThreshold: 6
  }
];

const sampleStockIn = [
  {
    barcode: '1234567890123',
    quantity: 100,
    date: admin.firestore.Timestamp.fromDate(new Date('2024-01-01')),
    userId: 'system',
    userName: 'System',
    notes: 'Initial stock'
  },
  {
    barcode: '2345678901234',
    quantity: 50,
    date: admin.firestore.Timestamp.fromDate(new Date('2024-01-05')),
    userId: 'system',
    userName: 'System',
    notes: 'Initial stock'
  },
  {
    barcode: '3456789012345',
    quantity: 200,
    date: admin.firestore.Timestamp.fromDate(new Date('2024-01-10')),
    userId: 'system',
    userName: 'System',
    notes: 'Initial stock'
  }
];

const sampleStockOut = [
  {
    barcode: '1234567890123',
    quantity: 25,
    date: admin.firestore.Timestamp.fromDate(new Date('2024-01-15')),
    userId: 'system',
    userName: 'System',
    reason: 'Sale',
    notes: 'Customer sale'
  },
  {
    barcode: '2345678901234',
    quantity: 10,
    date: admin.firestore.Timestamp.fromDate(new Date('2024-01-20')),
    userId: 'system',
    userName: 'System',
    reason: 'Sale',
    notes: 'Customer sale'
  }
];

async function seedProducts() {
  console.log('Seeding products...');
  const batch = db.batch();
  
  sampleProducts.forEach(product => {
    const ref = db.collection('products').doc(product.barcode);
    batch.set(ref, {
      ...product,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  
  await batch.commit();
  console.log(`✓ Added ${sampleProducts.length} products`);
}

async function seedStockIn() {
  console.log('Seeding stock IN records...');
  const batch = db.batch();
  
  sampleStockIn.forEach((stock, index) => {
    const ref = db.collection('stock_in').doc();
    batch.set(ref, {
      ...stock,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  
  await batch.commit();
  console.log(`✓ Added ${sampleStockIn.length} stock IN records`);
}

async function seedStockOut() {
  console.log('Seeding stock OUT records...');
  const batch = db.batch();
  
  sampleStockOut.forEach((stock, index) => {
    const ref = db.collection('stock_out').doc();
    batch.set(ref, {
      ...stock,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  
  await batch.commit();
  console.log(`✓ Added ${sampleStockOut.length} stock OUT records`);
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n=== Stock Management System - Data Seeding ===\n');
  console.log('This will add sample data to your Firestore database.');
  console.log('Make sure you have:');
  console.log('1. Created a Firebase project');
  console.log('2. Set up Firestore database');
  console.log('3. Configured Firebase Admin SDK\n');

  rl.question('Do you want to continue? (yes/no): ', async (answer) => {
    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('Cancelled.');
      rl.close();
      return;
    }

    try {
      await seedProducts();
      await seedStockIn();
      await seedStockOut();
      
      console.log('\n✓ Seeding completed successfully!');
      console.log('\nYou can now:');
      console.log('1. Login to the application');
      console.log('2. Scan barcode "1234567890123" to see sample product');
      console.log('3. View stock balance and history');
    } catch (error) {
      console.error('\n✗ Error seeding data:', error);
      console.error('\nMake sure:');
      console.error('1. Firestore is enabled in your Firebase project');
      console.error('2. Security rules allow writes (or run in test mode)');
      console.error('3. Firebase Admin SDK is properly configured');
    } finally {
      rl.close();
      process.exit(0);
    }
  });
}

if (require.main === module) {
  main();
}

module.exports = { seedProducts, seedStockIn, seedStockOut };
