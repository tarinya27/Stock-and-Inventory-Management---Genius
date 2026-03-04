import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ReservedStockItem } from '../types';

/**
 * Fetch reserved/pending delivery items from Firestore.
 * Collection: reserved_stock. Add documents to track reserved, dispatched, or awaiting delivery items.
 * Schema: { productName, barcode, quantity, status, expectedDeliveryDate }
 */
export const getReservedStock = async (): Promise<ReservedStockItem[]> => {
  const snapshot = await getDocs(collection(db, 'reserved_stock'));
  return snapshot.docs.map((doc) => {
    const d = doc.data();
    const date = d.expectedDeliveryDate;
    return {
      id: doc.id,
      productName: d.productName ?? '',
      barcode: d.barcode ?? '',
      quantity: d.quantity ?? 0,
      status: d.status ?? 'reserved',
      expectedDeliveryDate: date?.toDate ? date.toDate().toISOString().split('T')[0] : (typeof date === 'string' ? date : undefined)
    } as ReservedStockItem;
  });
};
