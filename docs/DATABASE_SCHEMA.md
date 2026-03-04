# Database Schema

## Firebase Firestore Structure

### Collections

#### 1. `products`
Stores product information.

```typescript
{
  barcode: string;           // Unique identifier (primary key)
  name: string;              // Product name
  category: string;          // Product category (e.g., "Laptop", "Mouse", "Keyboard")
  costPrice: number;        // Cost price
  sellingPrice: number;      // Selling price
  lowStockThreshold: number; // Alert when stock falls below this
  createdAt: Timestamp;      // Creation date
  updatedAt: Timestamp;      // Last update date
  createdBy: string;        // User ID who created
}
```

**Indexes Required:**
- `category` (ascending)
- `name` (ascending)

#### 2. `stock_in`
Records stock additions.

```typescript
{
  id: string;                // Auto-generated document ID
  barcode: string;           // Product barcode (reference to products)
  quantity: number;          // Quantity added
  date: Timestamp;           // Date of stock addition
  userId: string;            // User ID who added stock
  userName: string;          // User name (denormalized for reports)
  notes: string;             // Optional notes/reason
  createdAt: Timestamp;      // Record creation timestamp
}
```

**Indexes Required:**
- `barcode` (ascending) + `date` (descending)
- `date` (descending)
- `userId` (ascending) + `date` (descending)

#### 3. `stock_out`
Records stock removals (sales/usage).

```typescript
{
  id: string;                // Auto-generated document ID
  barcode: string;           // Product barcode (reference to products)
  quantity: number;          // Quantity removed
  date: Timestamp;           // Date of stock removal
  userId: string;            // User ID who recorded stock out
  userName: string;          // User name (denormalized for reports)
  reason: string;            // Reason type (e.g., "Sale", "Return", "Damaged", "Other")
  notes: string;             // Optional additional notes
  createdAt: Timestamp;      // Record creation timestamp
}
```

**Indexes Required:**
- `barcode` (ascending) + `date` (descending)
- `date` (descending)
- `userId` (ascending) + `date` (descending)

#### 4. `users` (Firebase Authentication + Firestore)
User information and roles.

```typescript
{
  uid: string;               // Firebase Auth UID
  email: string;             // User email
  displayName: string;       // User full name
  role: "admin" | "store_manager";  // User role
  storeId?: string;          // Optional: assigned store ID (for multi-store)
  createdAt: Timestamp;      // Account creation date
  lastLogin: Timestamp;      // Last login timestamp
  isActive: boolean;         // Account status
}
```

**Note:** Basic user data is stored in Firebase Authentication. Extended user profile is stored in Firestore `users` collection.

#### 5. `stores` (Optional - for multi-store feature)
Store information.

```typescript
{
  id: string;                // Store ID
  name: string;              // Store name
  address: string;           // Store address
  isActive: boolean;         // Store status
  createdAt: Timestamp;      // Creation date
}
```

## Stock Balance Calculation

### Real-time Balance Query

The balance is calculated dynamically using Firestore aggregation queries:

```typescript
// Total IN for a product
const totalIn = await getTotalStockIn(barcode);

// Total OUT for a product
const totalOut = await getTotalStockOut(barcode);

// Balance
const balance = totalIn - totalOut;
```

### Optimized Approach (Optional)

For better performance with large datasets, you can maintain a `stock_balance` collection:

```typescript
// Collection: stock_balance
{
  barcode: string;           // Product barcode
  totalIn: number;           // Sum of all stock_in quantities
  totalOut: number;          // Sum of all stock_out quantities
  balance: number;           // Calculated balance
  lastUpdated: Timestamp;    // Last update timestamp
}
```

This collection is updated via Cloud Functions triggers when stock_in or stock_out documents are created/updated/deleted.

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to get user role
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return getUserRole() == 'admin';
    }
    
    // Products collection
    match /products/{barcode} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAdmin();
    }
    
    // Stock IN collection
    match /stock_in/{id} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAdmin();
    }
    
    // Stock OUT collection
    match /stock_out/{id} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAdmin();
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.uid == request.auth.uid;
      allow update: if isAuthenticated() && (userId == request.auth.uid || isAdmin());
      allow delete: if isAdmin();
    }
    
    // Stock balance collection (if using optimized approach)
    match /stock_balance/{barcode} {
      allow read: if isAuthenticated();
      allow write: if false; // Only Cloud Functions can write
    }
  }
}
```

## Query Examples

### Get Product with Stock Balance
```typescript
// 1. Get product
const product = await db.collection('products').doc(barcode).get();

// 2. Get total IN
const inSnapshot = await db.collection('stock_in')
  .where('barcode', '==', barcode)
  .get();
const totalIn = inSnapshot.docs.reduce((sum, doc) => sum + doc.data().quantity, 0);

// 3. Get total OUT
const outSnapshot = await db.collection('stock_out')
  .where('barcode', '==', barcode)
  .get();
const totalOut = outSnapshot.docs.reduce((sum, doc) => sum + doc.data().quantity, 0);

// 4. Calculate balance
const balance = totalIn - totalOut;
```

### Get Low Stock Products
```typescript
const products = await db.collection('products').get();
const lowStockProducts = [];

for (const productDoc of products.docs) {
  const product = productDoc.data();
  const balance = await getProductBalance(product.barcode);
  
  if (balance < product.lowStockThreshold) {
    lowStockProducts.push({ ...product, balance });
  }
}
```

### Get Stock Movements (Reports)
```typescript
// Get stock IN for date range
const stockIn = await db.collection('stock_in')
  .where('date', '>=', startDate)
  .where('date', '<=', endDate)
  .orderBy('date', 'desc')
  .get();

// Get stock OUT for date range
const stockOut = await db.collection('stock_out')
  .where('date', '>=', startDate)
  .where('date', '<=', endDate)
  .orderBy('date', 'desc')
  .get();
```

## Indexes Required

Create these composite indexes in Firestore:

1. `stock_in`: `barcode` (Ascending) + `date` (Descending)
2. `stock_in`: `date` (Descending)
3. `stock_in`: `userId` (Ascending) + `date` (Descending)
4. `stock_out`: `barcode` (Ascending) + `date` (Descending)
5. `stock_out`: `date` (Descending)
6. `stock_out`: `userId` (Ascending) + `date` (Descending)
7. `products`: `category` (Ascending)
8. `products`: `name` (Ascending)
