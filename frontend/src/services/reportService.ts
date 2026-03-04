import { getStockMovements } from './stockService';
import { getGroupedProductsForStoreManager } from './productService';
import { getReservedStock } from './reservedStockService';

const LOW_STOCK_THRESHOLD = 3;

/** Current stock report item with balance and low-stock flag */
export interface CurrentStockReportItem {
  productName: string;
  category: string;
  balance: number;
  isLowStock: boolean;
}

/** Stock movement aggregation by time period */
export interface MovementAggregate {
  period: string;
  stockIn: number;
  stockOut: number;
  netMovement: number;
  cumulativeBalance: number;
}

/** Fast-moving product item */
export interface FastMovingProduct {
  productName: string;
  category: string;
  totalOut: number;
  /** Most recent sale date in the report period (ISO string) */
  latestSaleDate?: string;
}

/** Inventory value item */
export interface InventoryValueItem {
  productName: string;
  category: string;
  balance: number;
  costPrice: number;
  value: number;
  isLowStock?: boolean;
}

/** Category value for pie chart */
export interface CategoryValue {
  name: string;
  value: number;
}

/** Stock status for reporting */
export type StockStatus = 'ok' | 'low' | 'out';

/** 1. Current Stock Report - balance per product, highlight low stock (≤3) */
export const getCurrentStockReport = async (): Promise<{
  items: (CurrentStockReportItem & { status: StockStatus })[];
  lowStockCount: number;
  outOfStockCount: number;
  healthyStockCount: number;
  totalProducts: number;
  pendingDeliveryCount: number;
}> => {
  const grouped = await getGroupedProductsForStoreManager();
  let reserved: Awaited<ReturnType<typeof getReservedStock>> = [];
  try {
    reserved = await getReservedStock();
  } catch {
    // reserved_stock may not exist or user may lack permission; continue with empty
  }
  const items: (CurrentStockReportItem & { status: StockStatus })[] = grouped.map((g) => {
    const balance = g.balance;
    const threshold = g.lowStockThreshold ?? LOW_STOCK_THRESHOLD;
    const status: StockStatus = balance === 0 ? 'out' : balance <= threshold ? 'low' : 'ok';
    return {
      productName: g.productName,
      category: g.category || g.categoryCode,
      balance,
      isLowStock: balance <= threshold,
      status
    };
  });
  const outOfStockCount = items.filter((i) => i.status === 'out').length;
  const lowStockCount = items.filter((i) => i.status === 'low').length;
  const healthyStockCount = items.filter((i) => i.status === 'ok').length;
  const pendingDeliveryCount = reserved.filter((r) => r.status === 'awaiting_delivery' || r.status === 'reserved' || r.status === 'dispatched').length;
  return {
    items,
    lowStockCount,
    outOfStockCount,
    healthyStockCount,
    totalProducts: items.length,
    pendingDeliveryCount
  };
};

/** 2. Stock Movement Report - In vs Out by day/week/month */
export const getStockMovementReport = async (
  period: 'day' | 'week' | 'month',
  startDate?: Date,
  endDate?: Date
): Promise<{
  aggregates: MovementAggregate[];
  insights: string[];
  totalIn: number;
  totalOut: number;
  netChange: number;
  highestStockOutDay: { period: string; value: number } | null;
}> => {
  const now = new Date();
  const p = String(period).toLowerCase();
  const daysBack = p === 'day' ? 7 : p === 'week' ? 28 : 90;
  const defaultStart = new Date(now);
  defaultStart.setDate(defaultStart.getDate() - daysBack);
  defaultStart.setHours(0, 0, 0, 0);

  const start = startDate ? new Date(startDate) : defaultStart;
  const end = endDate ? new Date(endDate) : now;
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const movements = await getStockMovements(start, end);

  const groupKey = (d: Date): string => {
    if (p === 'day') return d.toISOString().slice(0, 10);
    if (p === 'week') {
      const wk = getWeekNumber(d);
      return `${d.getFullYear()}-W${String(wk).padStart(2, '0')}`;
    }
    // month or monthly
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const map = new Map<string, { in: number; out: number }>();
  for (const m of movements) {
    const d = m.date?.toDate ? m.date.toDate() : new Date(m.date);
    const key = groupKey(d);
    const entry = map.get(key) ?? { in: 0, out: 0 };
    if (m.type === 'IN') entry.in += m.quantity ?? 0;
    else entry.out += m.quantity ?? 0;
    map.set(key, entry);
  }

  const sorted = Array.from(map.entries())
    .map(([p, v]) => ({ period: p, stockIn: v.in, stockOut: v.out }))
    .sort((a, b) => a.period.localeCompare(b.period));

  let cumulative = 0;
  const aggregates: MovementAggregate[] = sorted.map((a) => {
    const net = a.stockIn - a.stockOut;
    cumulative += net;
    return {
      period: a.period,
      stockIn: a.stockIn,
      stockOut: a.stockOut,
      netMovement: net,
      cumulativeBalance: cumulative
    };
  });

  const totalIn = aggregates.reduce((s, a) => s + a.stockIn, 0);
  const totalOut = aggregates.reduce((s, a) => s + a.stockOut, 0);
  const netChange = totalIn - totalOut;

  const highestOut = aggregates.reduce(
    (best, a) => (a.stockOut > (best?.value ?? 0) ? { period: a.period, value: a.stockOut } : best),
    null as { period: string; value: number } | null
  );

  const insights: string[] = [];
  if (totalIn > totalOut) insights.push(`Net inflow: ${netChange} units over the period.`);
  else if (totalOut > totalIn) insights.push(`Net outflow: ${-netChange} units. Consider restocking.`);
  else insights.push('Stock In and Out are balanced.');

  return {
    aggregates,
    insights,
    totalIn,
    totalOut,
    netChange,
    highestStockOutDay: highestOut && highestOut.value > 0 ? highestOut : null
  };
};

function getWeekNumber(d: Date): number {
  const onejan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
}

/** Delivery urgency status derived from expected date */
export type DeliveryStatus = 'overdue' | 'due_soon' | 'due_today' | 'scheduled';

/** Enriched pending delivery item with urgency status */
export interface PendingDeliveryItem {
  id: string;
  productName: string;
  barcode: string;
  quantity: number;
  status: string;
  expectedDeliveryDate: string | undefined;
  expectedDate: Date | null;
  daysPending: number; // negative = overdue, 0 = today, positive = future
  deliveryStatus: DeliveryStatus;
}

/** 3. Pending Delivery / Reserved Stock Report */
export const getReservedStockReport = async (
  startDate?: Date,
  endDate?: Date,
  statusFilter?: 'all' | 'overdue' | 'due_soon' | 'scheduled'
): Promise<{
  items: PendingDeliveryItem[];
  statusCounts: Record<string, number>;
  deliveryStatusCounts: Record<DeliveryStatus, number>;
  kpis: { totalOrders: number; overdueCount: number; dueSoonCount: number; totalQuantity: number };
  byDate: { date: string; quantity: number; orderCount: number; status: DeliveryStatus }[];
  overdueTrend: { date: string; overdueCount: number }[];
  insights: string[];
}> => {
  let raw: Awaited<ReturnType<typeof getReservedStock>> = [];
  try {
    raw = await getReservedStock();
  } catch (err) {
    console.warn('Failed to fetch reserved stock, using empty data:', err);
    // Return empty report so UI shows "no data" instead of "report failed to load"
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const items: PendingDeliveryItem[] = raw.map((i) => {
    const expStr = i.expectedDeliveryDate;
    const expDate = expStr ? new Date(expStr) : null;
    if (expDate) expDate.setHours(0, 0, 0, 0);
    const daysPending = expDate ? Math.floor((expDate.getTime() - today.getTime()) / 86400000) : 0;
    let deliveryStatus: DeliveryStatus = 'scheduled';
    if (expDate) {
      if (daysPending < 0) deliveryStatus = 'overdue';
      else if (daysPending === 0) deliveryStatus = 'due_today';
      else if (daysPending <= 3) deliveryStatus = 'due_soon';
      else deliveryStatus = 'scheduled';
    }
    return {
      id: i.id,
      productName: i.productName,
      barcode: i.barcode,
      quantity: i.quantity,
      status: i.status,
      expectedDeliveryDate: expStr,
      expectedDate: expDate,
      daysPending,
      deliveryStatus
    } as PendingDeliveryItem;
  });

  let filtered = items;
  if (startDate || endDate) {
    filtered = filtered.filter((i) => {
      if (!i.expectedDate) return false;
      const d = i.expectedDate.getTime();
      if (startDate && d < startDate.getTime()) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (d > end.getTime()) return false;
      }
      return true;
    });
  }
  if (statusFilter && statusFilter !== 'all') {
    filtered = filtered.filter((i) => i.deliveryStatus === statusFilter);
  }

  const statusCounts: Record<string, number> = {};
  for (const i of filtered) {
    statusCounts[i.status] = (statusCounts[i.status] ?? 0) + 1;
  }

  const deliveryStatusCounts: Record<DeliveryStatus, number> = {
    overdue: filtered.filter((i) => i.deliveryStatus === 'overdue').length,
    due_soon: filtered.filter((i) => i.deliveryStatus === 'due_soon').length,
    due_today: filtered.filter((i) => i.deliveryStatus === 'due_today').length,
    scheduled: filtered.filter((i) => i.deliveryStatus === 'scheduled').length
  };

  const dueTodayOrNext2 = filtered.filter(
    (i) => i.deliveryStatus === 'due_today' || (i.deliveryStatus === 'due_soon' && i.daysPending <= 2)
  ).length;

  const kpis = {
    totalOrders: filtered.length,
    overdueCount: deliveryStatusCounts.overdue,
    dueSoonCount: dueTodayOrNext2,
    totalQuantity: filtered.reduce((s, i) => s + i.quantity, 0)
  };

  const byDateMap = new Map<string, { quantity: number; orderCount: number; status: DeliveryStatus }>();
  for (const i of filtered) {
    const key = i.expectedDeliveryDate ?? 'no-date';
    const entry = byDateMap.get(key) ?? { quantity: 0, orderCount: 0, status: i.deliveryStatus };
    entry.quantity += i.quantity;
    entry.orderCount += 1;
    byDateMap.set(key, entry);
  }
  const byDate = Array.from(byDateMap.entries())
    .filter(([k]) => k !== 'no-date')
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const overdueByDate = new Map<string, number>();
  for (const i of filtered.filter((x) => x.deliveryStatus === 'overdue')) {
    const key = i.expectedDeliveryDate ?? '';
    if (key) overdueByDate.set(key, (overdueByDate.get(key) ?? 0) + 1);
  }
  const overdueTrend = Array.from(overdueByDate.entries())
    .map(([date, overdueCount]) => ({ date, overdueCount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const insights: string[] = [];
  if (filtered.length === 0) insights.push('No pending delivery items match the selected filters.');
  else {
    if (kpis.overdueCount > 0) insights.push(`${kpis.overdueCount} overdue delivery(ies) require immediate attention.`);
    if (kpis.dueSoonCount > 0) insights.push(`${kpis.dueSoonCount} delivery(ies) due today or in the next 2 days.`);
  }

  return {
    items: filtered,
    statusCounts,
    deliveryStatusCounts,
    kpis,
    byDate,
    overdueTrend,
    insights
  };
};

/** 4. Fast-Moving Products - by stock out in period (for Pareto chart) */
export const getFastMovingProductsReport = async (
  start: Date,
  end: Date
): Promise<{
  items: FastMovingProduct[];
  totalSold: number;
  insights: string[];
}> => {
  const movements = await getStockMovements(start, end);
  const outOnly = movements.filter((m) => m.type === 'OUT');

  const byProduct = new Map<string, { category: string; out: number; latestDate: number | null }>();
  const productService = await import('./productService');
  const products = await productService.getAllProducts();
  const productMap = new Map(products.map((p) => [p.barcode, p]));

  for (const m of outOnly) {
    const p = productMap.get(m.barcode);
    const name = p?.name ?? m.barcode;
    const cat = p?.category ?? p?.categoryCode ?? '';
    const entry = byProduct.get(name) ?? { category: cat, out: 0, latestDate: null };
    entry.out += m.quantity ?? 0;
    let ms = 0;
    if (m.date) {
      if (typeof (m.date as { toMillis?: () => number }).toMillis === 'function') {
        ms = (m.date as { toMillis: () => number }).toMillis();
      } else {
        ms = new Date(m.date as Date | string).getTime();
      }
    }
    if (ms && (!entry.latestDate || ms > entry.latestDate)) entry.latestDate = ms;
    byProduct.set(name, entry);
  }

  const items: FastMovingProduct[] = Array.from(byProduct.entries())
    .map(([productName, v]) => ({
      productName,
      category: v.category,
      totalOut: v.out,
      latestSaleDate: v.latestDate ? new Date(v.latestDate).toISOString().slice(0, 10) : undefined
    }))
    .sort((a, b) => b.totalOut - a.totalOut);

  const totalSold = items.reduce((s, i) => s + i.totalOut, 0);

  const insights: string[] = [];
  if (items.length > 0) {
    insights.push(`Top seller: ${items[0].productName} (${items[0].totalOut} units sold).`);
  }
  return { items, totalSold, insights };
};

/** 5. Inventory Value Report - balance × costPrice */
export const getInventoryValueReport = async (): Promise<{
  byProduct: InventoryValueItem[];
  byCategory: CategoryValue[];
  totalValue: number;
  lowStockCount: number;
  highestValueCategory: { name: string; value: number };
  insights: string[];
}> => {
  const grouped = await getGroupedProductsForStoreManager();
  const byProduct: InventoryValueItem[] = grouped.map((g) => {
    const cost = g.representative?.costPrice ?? 0;
    const value = g.balance * cost;
    const threshold = g.lowStockThreshold ?? LOW_STOCK_THRESHOLD;
    return {
      productName: g.productName,
      category: g.category || g.categoryCode,
      balance: g.balance,
      costPrice: cost,
      value,
      isLowStock: g.balance > 0 && g.balance <= threshold
    };
  });

  const catMap = new Map<string, number>();
  for (const p of byProduct) {
    const key = p.category || 'Uncategorized';
    catMap.set(key, (catMap.get(key) ?? 0) + p.value);
  }
  const byCategory: CategoryValue[] = Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));

  const totalValue = byProduct.reduce((s, p) => s + p.value, 0);
  const lowStockCount = byProduct.filter((p) => p.isLowStock).length;
  const highestValueCategory =
    byCategory.length > 0
      ? byCategory.reduce((a, b) => (a.value >= b.value ? a : b), byCategory[0])
      : { name: '—', value: 0 };

  const insights: string[] = [];
  insights.push(`Highest category value: ${highestValueCategory.name} (LKR ${highestValueCategory.value.toLocaleString()}).`);
  insights.push(`Total inventory value: LKR ${totalValue.toLocaleString()}.`);
  if (lowStockCount > 0) insights.push(`${lowStockCount} product(s) are low on stock.`);

  return { byProduct, byCategory, totalValue, lowStockCount, highestValueCategory, insights };
};
