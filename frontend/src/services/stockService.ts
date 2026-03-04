import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp,
  orderBy
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

// Get stock balance for a product (total IN – total OUT)
export const getStockBalance = async (barcode: string): Promise<StockBalance> => {
  const [totalIn, totalOut] = await Promise.all([
    getTotalStockIn(barcode),
    getTotalStockOut(barcode)
  ]);
  return {
    barcode,
    totalIn,
    totalOut,
    balance: totalIn - totalOut
  };
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
};

// Get stock movements (for reports)
export const getStockMovements = async (
  startDate?: Date,
  endDate?: Date,
  barcode?: string
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
  }
  
  if (startDate && endDate) {
    stockInQuery = query(
      collection(db, 'stock_in'),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc')
    );
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
  }
  
  if (startDate && endDate) {
    stockOutQuery = query(
      collection(db, 'stock_out'),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc')
    );
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

// Get recent stock movements (for dashboard)
export const getRecentMovements = async (limitCount: number = 10): Promise<StockMovement[]> => {
  const movements = await getStockMovements();
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

// Get low stock products
export const getLowStockProducts = async (): Promise<Array<Product & { balance: number }>> => {
  const { getAllProducts } = await import('./productService');
  const products = await getAllProducts();
  const lowStockProducts: Array<Product & { balance: number }> = [];
  
  for (const product of products) {
    const balance = await getStockBalance(product.barcode);
    if (balance.balance < product.lowStockThreshold) {
      lowStockProducts.push({ ...product, balance: balance.balance });
    }
  }
  
  return lowStockProducts;
};
