import { collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Product, GroupedProduct } from '../types';
import { getStockBalances } from './stockService';

export const getProductByBarcode = async (barcode: string): Promise<Product | null> => {
  const productDoc = await getDoc(doc(db, 'products', barcode));
  
  if (!productDoc.exists()) {
    return null;
  }
  
  return { barcode, ...productDoc.data() } as Product;
};

export const getAllProducts = async (): Promise<Product[]> => {
  const productsSnapshot = await getDocs(collection(db, 'products'));
  return productsSnapshot.docs.map(doc => ({ barcode: doc.id, ...doc.data() } as Product));
};

export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  const q = query(collection(db, 'products'), where('category', '==', category));
  const productsSnapshot = await getDocs(q);
  return productsSnapshot.docs.map(d => ({ barcode: d.id, ...d.data() } as Product));
};

export const getProductsByCategoryCode = async (categoryCode: string): Promise<Product[]> => {
  const q = query(collection(db, 'products'), where('categoryCode', '==', categoryCode));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ barcode: d.id, ...d.data() } as Product));
};

export const createProduct = async (product: Omit<Product, 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<void> => {
  await setDoc(doc(db, 'products', product.barcode), {
    ...product,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const updateProduct = async (barcode: string, updates: Partial<Product>): Promise<void> => {
  await updateDoc(doc(db, 'products', barcode), {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

export const deleteProduct = async (barcode: string): Promise<void> => {
  await deleteDoc(doc(db, 'products', barcode));
};

/** Group key: categoryCode + product name (unique per product for aggregation) */
const groupKey = (p: Product): string => `${p.categoryCode ?? ''}\n${p.name}`;

/**
 * Fetch all products and aggregate stock by product (categoryCode + productName).
 * One row per product; stock = sum across all barcodes. For store manager display.
 */
export const getGroupedProductsForStoreManager = async (): Promise<GroupedProduct[]> => {
  const all = await getAllProducts();
  const balances = await getStockBalances(all.map((p) => p.barcode));
  const withBalance = all.map((p) => ({
    product: p,
    balance: balances.get(p.barcode) ?? { barcode: p.barcode, totalIn: 0, totalOut: 0, balance: 0 }
  }));

  const map = new Map<string, { products: Product[]; totalIn: number; totalOut: number }>();
  for (const { product, balance } of withBalance) {
    const key = groupKey(product);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        products: [product],
        totalIn: balance.totalIn,
        totalOut: balance.totalOut
      });
    } else {
      existing.products.push(product);
      existing.totalIn += balance.totalIn;
      existing.totalOut += balance.totalOut;
    }
  }

  const result: GroupedProduct[] = [];
  map.forEach(({ products, totalIn, totalOut }, key) => {
    const rep = products[0];
    const balance = totalIn - totalOut;
    result.push({
      productName: rep.name,
      category: rep.category ?? '',
      categoryCode: rep.categoryCode ?? '',
      barcodes: products.map((p) => p.barcode),
      totalStockIn: totalIn,
      totalStockOut: totalOut,
      balance,
      lowStockThreshold: rep.lowStockThreshold ?? 3,
      representative: rep
    });
  });

  return result.sort((a, b) => a.productName.localeCompare(b.productName));
};

/**
 * Find a grouped product by name (case-insensitive match). For store manager scan-by-name.
 * Returns the first group whose productName includes the search string, or exact match first.
 */
export const getGroupedProductByName = async (name: string): Promise<GroupedProduct | null> => {
  const grouped = await getGroupedProductsForStoreManager();
  const q = name.trim().toLowerCase();
  if (!q) return null;
  const exact = grouped.find((g) => g.productName.toLowerCase() === q);
  if (exact) return exact;
  return grouped.find((g) => g.productName.toLowerCase().includes(q)) ?? null;
};

/**
 * Totals from the product table (grouped products). Use for store manager dashboard so cards match the Products page.
 * Returns sum of totalStockIn and totalStockOut across all products.
 */
export const getProductTableStockTotals = async (): Promise<{ totalIn: number; totalOut: number }> => {
  const grouped = await getGroupedProductsForStoreManager();
  const totalIn = grouped.reduce((sum, g) => sum + g.totalStockIn, 0);
  const totalOut = grouped.reduce((sum, g) => sum + g.totalStockOut, 0);
  return { totalIn, totalOut };
};

/**
 * Low stock for store manager: based ONLY on products table.
 * Groups by product (categoryCode + productName), aggregates balance.
 * Alert when balance <= lowStockThreshold (no barcode-level logic).
 */
export const getLowStockGroupedForStoreManager = async (): Promise<GroupedProduct[]> => {
  const grouped = await getGroupedProductsForStoreManager();
  return grouped.filter((g) => g.balance <= g.lowStockThreshold);
};

/** Delete all products in a group (all barcodes with same categoryCode + productName) */
export const deleteProductGroup = async (productName: string, categoryCode: string): Promise<void> => {
  const all = await getAllProducts();
  const toDelete = all.filter(
    (p) => (p.categoryCode ?? '') === categoryCode && p.name === productName
  );
  await Promise.all(toDelete.map((p) => deleteProduct(p.barcode)));
};

/** Update all products in a group with the same name/category/categoryCode/costPrice/sellingPrice etc. */
export const updateProductGroup = async (
  productName: string,
  categoryCode: string,
  updates: Partial<Pick<Product, 'name' | 'category' | 'categoryCode' | 'costPrice' | 'sellingPrice' | 'lowStockThreshold'>>
): Promise<void> => {
  const all = await getAllProducts();
  const group = all.filter(
    (p) => (p.categoryCode ?? '') === categoryCode && p.name === productName
  );
  await Promise.all(group.map((p) => updateProduct(p.barcode, { ...updates })));
};
