import {
  collection,
  getDocs,
  writeBatch,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Order } from '@/types';
import { Product } from '@/types';
import { OrderStatus } from '@/types/enums';
import { UserRole } from '@/types/user';
import { CommissionGroup, calcItemCommission } from '@/types/commissionGroup';
import { getAllUsers } from './userService';

export interface CollaboratorCommissionSummary {
  collaboratorUid: string;
  collaboratorName: string;
  /** Đơn hàng với commissionAmount đã được tính lại từ groups + products hiện tại */
  orders: Order[];
  totalSales: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
}

/**
 * Tính lại commissionAmount cho 1 đơn dựa trên groups + products hiện tại.
 * Trả về số tiền tính được (không ghi lại Firestore).
 */
function recalcOrderCommission(
  order: Order,
  groups: CommissionGroup[],
  products: Product[],
): number {
  if (!Array.isArray(order.items) || order.items.length === 0) return 0;
  return order.items.reduce((sum, item) => {
    const product = products.find(p => p.id === (item.id ?? item.productId));
    if (!product) return sum;
    const perUnit = calcItemCommission(item.price ?? product.price, product.costPrice, groups);
    return sum + perUnit * (item.quantity ?? 1);
  }, 0);
}

/**
 * Fetch tất cả đơn của CTV (createdBy = uid của COLABORATOR),
 * tính lại commission từ groups + products, trả về summaries theo CTV.
 */
export const buildFullCommissionSummary = async (
  groups: CommissionGroup[],
  products: Product[],
): Promise<CollaboratorCommissionSummary[]> => {
  const users = await getAllUsers();
  const collaborators = users.filter(u => u.role === UserRole.COLABORATOR);
  if (collaborators.length === 0) return [];

  // Batch query orders by createdBy for each CTV
  const ordersRef = collection(db, 'orders');
  const allOrders: Order[] = [];

  // Firestore `in` supports up to 30 items; chunk if needed
  const CHUNK = 30;
  for (let i = 0; i < collaborators.length; i += CHUNK) {
    const uids = collaborators.slice(i, i + CHUNK).map(u => u.uid);
    const snap = await getDocs(query(ordersRef, where('createdBy', 'in', uids)));
    snap.forEach(d => allOrders.push({ id: d.id, ...d.data() } as Order));
  }

  const map = new Map<string, CollaboratorCommissionSummary>();

  // Init entry for every CTV (even those with no orders)
  for (const ctv of collaborators) {
    map.set(ctv.uid, {
      collaboratorUid: ctv.uid,
      collaboratorName: ctv.customName || ctv.displayName || ctv.email || ctv.uid,
      orders: [],
      totalSales: 0,
      totalCommission: 0,
      pendingCommission: 0,
      paidCommission: 0,
    });
  }

  for (const order of allOrders) {
    const uid = order.createdBy || '';
    const summary = map.get(uid);
    if (!summary) continue;

    const isCancelled =
      order.status === OrderStatus.CANCELLED || order.status === OrderStatus.RETURNED;

    // Recalculate commission from current groups/products
    const commissionAmount = isCancelled ? 0 : recalcOrderCommission(order, groups, products);

    // Attach recalculated amount to order object (in-memory only)
    const enrichedOrder: Order = { ...order, commissionAmount };

    summary.orders.push(enrichedOrder);
    if (!isCancelled) {
      const productSales = (order.total ?? 0) - (order.shippingCost ?? 0);
      summary.totalSales += productSales > 0 ? productSales : 0;
      summary.totalCommission += commissionAmount;
      if (order.commissionStatus === 'paid') {
        summary.paidCommission += commissionAmount;
      } else {
        summary.pendingCommission += commissionAmount;
      }
    }
  }

  // Only return CTVs with at least 1 order
  return Array.from(map.values())
    .filter(s => s.orders.length > 0)
    .sort((a, b) => b.pendingCommission - a.pendingCommission);
};

/** @deprecated Dùng buildFullCommissionSummary thay thế */
export const fetchCommissionOrders = async (): Promise<Order[]> => {
  try {
    const snap = await getDocs(
      query(collection(db, 'orders'), where('commissionAmount', '>', 0)),
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
  } catch (error) {
    console.error('fetchCommissionOrders error:', error);
    return [];
  }
};

/** @deprecated Dùng buildFullCommissionSummary thay thế */
export const buildCommissionSummary = async (
  orders: Order[],
): Promise<CollaboratorCommissionSummary[]> => {
  const users = await getAllUsers();
  const collaborators = users.filter(u => u.role === UserRole.COLABORATOR);
  const map = new Map<string, CollaboratorCommissionSummary>();
  for (const order of orders) {
    const uid = order.createdBy || '';
    if (!uid) continue;
    if (!map.has(uid)) {
      const user = collaborators.find(u => u.uid === uid);
      const name = user?.customName || user?.displayName || user?.email || uid;
      map.set(uid, { collaboratorUid: uid, collaboratorName: name, orders: [], totalSales: 0, totalCommission: 0, pendingCommission: 0, paidCommission: 0 });
    }
    const summary = map.get(uid)!;
    const commission = order.commissionAmount ?? 0;
    summary.orders.push(order);
    summary.totalSales += order.total;
    summary.totalCommission += commission;
    order.commissionStatus === 'paid' ? (summary.paidCommission += commission) : (summary.pendingCommission += commission);
  }
  return Array.from(map.values()).sort((a, b) => b.pendingCommission - a.pendingCommission);
};

/** Đánh dấu danh sách đơn là đã trả hoa hồng (batch update) */
export const markCommissionPaid = async (orderIds: string[]): Promise<void> => {
  if (orderIds.length === 0) return;
  const paidAt = new Date().toISOString();
  const BATCH_SIZE = 450;
  for (let i = 0; i < orderIds.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    for (const id of orderIds.slice(i, i + BATCH_SIZE)) {
      batch.update(doc(db, 'orders', id), { commissionStatus: 'paid', commissionPaidAt: paidAt });
    }
    await batch.commit();
  }
};

/** Huỷ đánh dấu (reset về pending) */
export const markCommissionPending = async (orderIds: string[]): Promise<void> => {
  if (orderIds.length === 0) return;
  const BATCH_SIZE = 450;
  for (let i = 0; i < orderIds.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    for (const id of orderIds.slice(i, i + BATCH_SIZE)) {
      batch.update(doc(db, 'orders', id), { commissionStatus: 'pending', commissionPaidAt: null });
    }
    await batch.commit();
  }
};
