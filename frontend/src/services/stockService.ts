import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
  orderBy,
  limit,
  increment
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Product, StockIn, StockOut, StockBalance, StockMovement } from '../types';

// Get total stock IN for a product
export const getTotalStockIn = async (barcode: string): Promise<number> => {
  const q = query(
    collection(db, 'stock_in'),
    where('barcode', '==', barcode)
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.reduce((total, doc) => {
    return total + (doc.data().quantity || 0);
  }, 0);
};

// Get total stock OUT for a product
export const getTotalStockOut = async (barcode: string): Promise<number> => {
  const q = query(
    collection(db, 'stock_out'),
    where('barcode', '==', barcode)
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.reduce((total, doc) => {
    return total + (doc.data().quantity || 0);
  }, 0);
};

// Get stock balance for a product (reads from stock_balances; falls back to calculation for legacy data)
export const getStockBalance = async (barcode: string): Promise<StockBalance> => {
  const balRef = doc(db, 'stock_balances', barcode);
  const balSnap = await getDoc(balRef);
  if (balSnap.exists()) {
    const d = balSnap.data();
    return {
      barcode,
      totalIn: d?.totalIn ?? 0,
      totalOut: d?.totalOut ?? 0,
      balance: d?.balance ?? 0
    };
  }
  // Legacy: calculate from stock_in/stock_out and cache in stock_balances
  const [totalIn, totalOut] = await Promise.all([
    getTotalStockIn(barcode),
    getTotalStockOut(barcode)
  ]);
  const balance = totalIn - totalOut;
  await setDoc(balRef, { totalIn, totalOut, balance }, { merge: true });
  return { barcode, totalIn, totalOut, balance };
};

/** Batch fetch stock balances (1 read per barcode from stock_balances; falls back per missing doc) */
export const getStockBalances = async (barcodes: string[]): Promise<Map<string, StockBalance>> => {
  const result = new Map<string, StockBalance>();
  const missing: string[] = [];
  const docs = await Promise.all(barcodes.map((b) => getDoc(doc(db, 'stock_balances', b))));
  docs.forEach((snap, i) => {
    const barcode = barcodes[i];
    if (snap.exists()) {
      const d = snap.data();
      result.set(barcode, {
        barcode,
        totalIn: d?.totalIn ?? 0,
        totalOut: d?.totalOut ?? 0,
        balance: d?.balance ?? 0
      });
    } else {
      missing.push(barcode);
    }
  });
  // Lazy migration for missing docs
  await Promise.all(
    missing.map(async (barcode) => {
      const bal = await getStockBalance(barcode);
      result.set(barcode, bal);
    })
  );
  return result;
};

// Check if barcode already used for stock-in (each barcode = 1 unit, used at most once)
export const isBarcodeUsedForStockIn = async (barcode: string): Promise<boolean> => {
  const q = query(
    collection(db, 'stock_in'),
    where('barcode', '==', barcode)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

// Check if barcode already used for stock-out (each barcode = 1 unit, used at most once)
export const isBarcodeUsedForStockOut = async (barcode: string): Promise<boolean> => {
  const q = query(
    collection(db, 'stock_out'),
    where('barcode', '==', barcode)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

// Get sold date for a barcode (when it was stocked out). Returns null if never sold.
export const getSoldDateForBarcode = async (barcode: string): Promise<Date | null> => {
  const q = query(
    collection(db, 'stock_out'),
    where('barcode', '==', barcode)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const data = snapshot.docs[0].data();
  const date = data?.date;
  if (!date) return null;
  if (date.toDate && typeof date.toDate === 'function') return date.toDate();
  if (date instanceof Date) return date;
  return null;
};

// Add stock IN (1 unit per barcode; prevents duplicate)
export const addStockIn = async (
  barcode: string,
  quantity: number,
  userId: string,
  userName: string,
  notes?: string,
  date?: Date,
  itemCondition?: 'new' | 'damaged' | 'returned',
  damageReason?: 'transport' | 'manufacturing' | 'storage' | 'customer_return'
): Promise<void> => {
  const alreadyUsed = await isBarcodeUsedForStockIn(barcode);
  if (alreadyUsed) {
    throw new Error('This barcode has already been used for Stock IN. Each barcode can only be used once.');
  }

  const qty = Math.max(1, quantity);
  const stockInData: Omit<StockIn, 'id'> = {
    barcode,
    quantity: qty,
    date: date ? Timestamp.fromDate(date) : serverTimestamp(),
    userId,
    userName,
    notes: notes || '',
    ...(itemCondition && { itemCondition }),
    ...(damageReason && { damageReason }),
    createdAt: serverTimestamp()
  };
  
  await addDoc(collection(db, 'stock_in'), stockInData);
  // Update denormalized balance (reduces read quota for getStockBalance)
  const balRef = doc(db, 'stock_balances', barcode);
  await setDoc(balRef, { totalIn: increment(qty), totalOut: increment(0), balance: increment(qty) }, { merge: true });
};

// Add stock OUT (1 unit per barcode; prevents duplicate)
export const addStockOut = async (
  barcode: string,
  quantity: number,
  userId: string,
  userName: string,
  reason: string,
  notes?: string,
  date?: Date
): Promise<void> => {
  const alreadyUsed = await isBarcodeUsedForStockOut(barcode);
  if (alreadyUsed) {
    throw new Error('This barcode has already been used for Stock OUT. Each barcode can only be used once.');
  }

  const balance = await getStockBalance(barcode);
  const qty = Math.max(1, quantity);
  if (balance.balance < qty) {
    throw new Error(`Insufficient stock. Available: ${balance.balance}, Requested: ${qty}`);
  }
  
  const stockOutData: Omit<StockOut, 'id'> = {
    barcode,
    quantity: qty,
    date: date ? Timestamp.fromDate(date) : serverTimestamp(),
    userId,
    userName,
    reason,
    notes: notes || '',
    createdAt: serverTimestamp()
  };
  
  await addDoc(collection(db, 'stock_out'), stockOutData);
  // Update denormalized balance (reduces read quota for getStockBalance)
  const balRef = doc(db, 'stock_balances', barcode);
  await setDoc(balRef, { totalIn: increment(0), totalOut: increment(qty), balance: increment(-qty) }, { merge: true });
};

// Get stock movements (for reports). Use limitCount when fetching "recent" only (no date/barcode filter).
export const getStockMovements = async (
  startDate?: Date,
  endDate?: Date,
  barcode?: string,
  limitCount?: number
): Promise<StockMovement[]> => {
  const movements: StockMovement[] = [];
  
  // Get stock IN
  let stockInQuery = query(collection(db, 'stock_in'), orderBy('date', 'desc'));
  
  if (barcode) {
    stockInQuery = query(
      collection(db, 'stock_in'),
      where('barcode', '==', barcode),
      orderBy('date', 'desc')
    );
  } else if (startDate && endDate) {
    stockInQuery = query(
      collection(db, 'stock_in'),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc')
    );
  }
  if (limitCount != null && !startDate && !barcode) {
    stockInQuery = query(stockInQuery, limit(limitCount));
  }
  
  const stockInSnapshot = await getDocs(stockInQuery);
  stockInSnapshot.docs.forEach(doc => {
    const data = doc.data();
    movements.push({
      id: doc.id,
      barcode: data.barcode,
      type: 'IN',
      quantity: data.quantity,
      date: data.date,
      userId: data.userId,
      userName: data.userName,
      notes: data.notes
    });
  });
  
  // Get stock OUT
  let stockOutQuery = query(collection(db, 'stock_out'), orderBy('date', 'desc'));
  
  if (barcode) {
    stockOutQuery = query(
      collection(db, 'stock_out'),
      where('barcode', '==', barcode),
      orderBy('date', 'desc')
    );
  } else if (startDate && endDate) {
    stockOutQuery = query(
      collection(db, 'stock_out'),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc')
    );
  }
  if (limitCount != null && !startDate && !barcode) {
    stockOutQuery = query(stockOutQuery, limit(limitCount));
  }
  
  const stockOutSnapshot = await getDocs(stockOutQuery);
  stockOutSnapshot.docs.forEach(doc => {
    const data = doc.data();
    movements.push({
      id: doc.id,
      barcode: data.barcode,
      type: 'OUT',
      quantity: data.quantity,
      date: data.date,
      userId: data.userId,
      userName: data.userName,
      reason: data.reason,
      notes: data.notes
    });
  });
  
  // Sort by date (most recent first)
  return movements.sort((a, b) => {
    const dateA = a.date?.toMillis() || 0;
    const dateB = b.date?.toMillis() || 0;
    return dateB - dateA;
  });
};

// Get recent stock movements (for dashboard) - uses limit in query to avoid fetching all docs
export const getRecentMovements = async (limitCount: number = 10): Promise<StockMovement[]> => {
  const movements = await getStockMovements(undefined, undefined, undefined, limitCount * 2);
  return movements.slice(0, limitCount);
};

/** Get total quantity added (Stock In) and removed (Stock Out) for a given day. Uses full day range so all of today's movements are counted. */
export const getTodayStockTotals = async (): Promise<{ todayIn: number; todayOut: number }> => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const movements = await getStockMovements(todayStart, todayEnd);
  const todayIn = movements.filter((m) => m.type === 'IN').reduce((sum, m) => sum + (m.quantity ?? 0), 0);
  const todayOut = movements.filter((m) => m.type === 'OUT').reduce((sum, m) => sum + (m.quantity ?? 0), 0);
  return { todayIn, todayOut };
};

// Get low stock products (uses batch getStockBalances to reduce reads)
export const getLowStockProducts = async (): Promise<Array<Product & { balance: number }>> => {
  const { getAllProducts } = await import('./productService');
  const products = await getAllProducts();
  const balances = await getStockBalances(products.map((p) => p.barcode));
  const lowStockProducts: Array<Product & { balance: number }> = [];
  for (const product of products) {
    const bal = balances.get(product.barcode);
    const balanceVal = bal?.balance ?? 0;
    if (balanceVal < product.lowStockThreshold) {
      lowStockProducts.push({ ...product, balance: balanceVal });
    }
  }
  return lowStockProducts;
};
