export interface Category {
  categoryCode: string;
  name: string;
  createdAt?: any;
}

export interface Product {
  barcode: string;
  name: string;
  category: string;
  categoryCode?: string;
  costPrice: number;
  sellingPrice: number;
  lowStockThreshold: number;
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
}

export interface StockIn {
  id?: string;
  barcode: string;
  quantity: number;
  date: any; // Firestore Timestamp
  userId: string;
  userName: string;
  notes?: string;
  itemCondition?: 'new' | 'damaged' | 'returned';
  damageReason?: 'transport' | 'manufacturing' | 'storage' | 'customer_return';
  createdAt?: any;
}

export interface StockOut {
  id?: string;
  barcode: string;
  quantity: number;
  date: any; // Firestore Timestamp
  userId: string;
  userName: string;
  reason: string;
  notes?: string;
  createdAt?: any;
}

export interface StockBalance {
  barcode: string;
  totalIn: number;
  totalOut: number;
  balance: number;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'store_manager';
  storeId?: string;
  createdAt?: any;
  lastLogin?: any;
  isActive: boolean;
}

export interface StockMovement {
  id: string;
  barcode: string;
  productName?: string;
  type: 'IN' | 'OUT';
  quantity: number;
  date: any;
  userId: string;
  userName: string;
  reason?: string;
  notes?: string;
}

/** Reserved/pending delivery item for admin reports */
export interface ReservedStockItem {
  id: string;
  productName: string;
  barcode: string;
  quantity: number;
  status: 'reserved' | 'dispatched' | 'awaiting_delivery';
  expectedDeliveryDate?: string;
  createdAt?: any;
}

/** Aggregated product for store manager: one row per product (grouped by categoryCode + name) */
export interface GroupedProduct {
  productName: string;
  category: string;
  categoryCode: string;
  barcodes: string[];
  totalStockIn: number;
  totalStockOut: number;
  balance: number;
  lowStockThreshold: number;
  /** Representative product for edit (first barcode); costPrice etc from one of the group */
  representative: Product;
}
