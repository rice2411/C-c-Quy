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
import {
  CommissionGroup,
  findGroupForMargin,
  rateForQuantity,
  itemCommissionAtRate,
} from '@/types/commissionGroup';
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

const isCancelled = (order: Order): boolean =>
  order.status === OrderStatus.CANCELLED || order.status === OrderStatus.RETURNED;

/** Khoá tháng "YYYY-MM" từ ngày giao của đơn (null nếu không có ngày hợp lệ) */
const monthKeyOf = (dateStr?: string): string => {
  if (!dateStr) return 'unknown';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 'unknown';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Nhóm hoa hồng của 1 sản phẩm:
 * - Có costPrice & có lợi nhuận → nhóm theo margin.
 * - Không có costPrice → nhóm đầu tiên (dùng fallbackRate).
 * - Lợi nhuận <= 0 → undefined (không tính hoa hồng, không cộng số lượng).
 */
const groupOfProduct = (
  product: Product | undefined,
  groups: CommissionGroup[],
): CommissionGroup | undefined => {
  if (!product || groups.length === 0) return undefined;
  if (product.costPrice !== undefined && product.costPrice >= 0) {
    const profit = product.price - product.costPrice;
    if (profit <= 0) return undefined;
    return findGroupForMargin(profit / product.price, groups);
  }
  return [...groups].sort((a, b) => a.order - b.order)[0];
};

/**
 * Tính hoa hồng cho từng đơn của 1 CTV theo logic bậc số lượng:
 * - Gom đơn theo tháng (ngày giao).
 * - Trong mỗi tháng, đếm tổng SL bán theo từng nhóm (bỏ đơn huỷ/hoàn).
 * - Số lượng tháng của mỗi nhóm quyết định % lợi nhuận (rate) cho nhóm đó.
 * - Mỗi đơn: cộng hoa hồng từng item theo rate của nhóm tương ứng trong tháng.
 * Trả về map orderId -> mảng thông tin HH theo từng item (khớp index order.items).
 */
interface ItemCommissionInfo {
  amount: number;      // HH cả dòng
  groupName: string;   // nhóm rơi vào
  groupQty: number;    // tổng SL nhóm trong tháng (quyết định bậc)
  rate: number;        // % lợi nhuận đã áp
}

const ZERO_ITEM: ItemCommissionInfo = { amount: 0, groupName: '', groupQty: 0, rate: 0 };

const computeCommissionByMonth = (
  orders: Order[],
  groups: CommissionGroup[],
  products: Product[],
): Map<string, ItemCommissionInfo[]> => {
  const productById = new Map(products.map(p => [p.id, p]));
  const result = new Map<string, ItemCommissionInfo[]>();

  // Gom theo tháng
  const byMonth = new Map<string, Order[]>();
  for (const o of orders) {
    const m = monthKeyOf(o.deliveryDate);
    if (!byMonth.has(m)) byMonth.set(m, []);
    byMonth.get(m)!.push(o);
  }

  for (const monthOrders of byMonth.values()) {
    // 1. Đếm SL theo nhóm trong tháng (bỏ đơn huỷ/hoàn)
    const qtyByGroup = new Map<string, number>();
    for (const o of monthOrders) {
      if (isCancelled(o)) continue;
      for (const item of o.items ?? []) {
        const product = productById.get(item.id ?? item.productId ?? '');
        const group = groupOfProduct(product, groups);
        if (!group) continue;
        qtyByGroup.set(group.id, (qtyByGroup.get(group.id) ?? 0) + (item.quantity ?? 1));
      }
    }

    // 2. Rate mỗi nhóm theo SL tháng
    const rateByGroup = new Map<string, number>();
    for (const g of groups) {
      rateByGroup.set(g.id, rateForQuantity(g, qtyByGroup.get(g.id) ?? 0));
    }

    // 3. Hoa hồng từng item của từng đơn (giữ index khớp order.items)
    for (const o of monthOrders) {
      const items = o.items ?? [];
      if (isCancelled(o)) { result.set(o.id, items.map(() => ZERO_ITEM)); continue; }
      const perItem = items.map((item): ItemCommissionInfo => {
        const product = productById.get(item.id ?? item.productId ?? '');
        if (!product) return ZERO_ITEM;
        const group = groupOfProduct(product, groups);
        if (!group) return ZERO_ITEM;
        const rate = rateByGroup.get(group.id) ?? 0;
        const perUnit = itemCommissionAtRate(
          item.price ?? product.price,
          product.costPrice,
          group.fallbackRate,
          rate,
        );
        return {
          amount: perUnit * (item.quantity ?? 1),
          groupName: group.name,
          groupQty: qtyByGroup.get(group.id) ?? 0,
          rate,
        };
      });
      result.set(o.id, perItem);
    }
  }

  return result;
};

/** Dựng summary cho 1 CTV từ danh sách đơn của họ (đã áp logic bậc tháng). */
const buildSummaryForOrders = (
  uid: string,
  name: string,
  orders: Order[],
  groups: CommissionGroup[],
  products: Product[],
): CollaboratorCommissionSummary => {
  const commissionMap = computeCommissionByMonth(orders, groups, products);
  const summary: CollaboratorCommissionSummary = {
    collaboratorUid: uid,
    collaboratorName: name,
    orders: [],
    totalSales: 0,
    totalCommission: 0,
    pendingCommission: 0,
    paidCommission: 0,
  };

  for (const order of orders) {
    const perItem = commissionMap.get(order.id) ?? [];
    const items = (order.items ?? []).map((it, i) => ({
      ...it,
      commissionAmount: perItem[i]?.amount ?? 0,
      commissionGroupName: perItem[i]?.groupName || undefined,
      commissionGroupQty: perItem[i]?.groupQty || undefined,
      commissionRate: perItem[i]?.rate || undefined,
    }));
    const commissionAmount = perItem.reduce((a, b) => a + b.amount, 0);
    summary.orders.push({ ...order, items, commissionAmount });
    if (!isCancelled(order)) {
      const productSales = (order.total ?? 0) - (order.shippingCost ?? 0);
      summary.totalSales += productSales > 0 ? productSales : 0;
      summary.totalCommission += commissionAmount;
      if (order.commissionStatus === 'paid') summary.paidCommission += commissionAmount;
      else summary.pendingCommission += commissionAmount;
    }
  }

  // Đơn mới nhất lên đầu
  summary.orders.sort((a, b) => {
    const da = a.deliveryDate ? new Date(a.deliveryDate).getTime() : 0;
    const dbt = b.deliveryDate ? new Date(b.deliveryDate).getTime() : 0;
    return dbt - da;
  });

  return summary;
};

/**
 * Fetch tất cả đơn của CTV (createdBy = uid của COLABORATOR),
 * tính lại commission theo bậc số lượng tháng, trả về summaries theo CTV.
 */
export const buildFullCommissionSummary = async (
  groups: CommissionGroup[],
  products: Product[],
): Promise<CollaboratorCommissionSummary[]> => {
  const users = await getAllUsers();
  const collaborators = users.filter(u => u.role === UserRole.COLABORATOR);
  if (collaborators.length === 0) return [];

  const ordersRef = collection(db, 'orders');
  const ordersByUid = new Map<string, Order[]>();

  // Firestore `in` supports up to 30 items; chunk if needed
  const CHUNK = 30;
  for (let i = 0; i < collaborators.length; i += CHUNK) {
    const uids = collaborators.slice(i, i + CHUNK).map(u => u.uid);
    const snap = await getDocs(query(ordersRef, where('createdBy', 'in', uids)));
    snap.forEach(d => {
      const order = { id: d.id, ...d.data() } as Order;
      const uid = order.createdBy || '';
      if (!ordersByUid.has(uid)) ordersByUid.set(uid, []);
      ordersByUid.get(uid)!.push(order);
    });
  }

  const summaries: CollaboratorCommissionSummary[] = [];
  for (const ctv of collaborators) {
    const orders = ordersByUid.get(ctv.uid) ?? [];
    if (orders.length === 0) continue;
    const name = ctv.customName || ctv.displayName || ctv.email || ctv.uid;
    summaries.push(buildSummaryForOrders(ctv.uid, name, orders, groups, products));
  }

  return summaries.sort((a, b) => b.pendingCommission - a.pendingCommission);
};

/**
 * Tính hoa hồng cho 1 CTV cụ thể (theo uid người đang đăng nhập).
 * Chỉ query đơn của chính CTV đó nên không cần đọc toàn bộ users.
 */
export const buildMyCommissionSummary = async (
  uid: string,
  collaboratorName: string,
  groups: CommissionGroup[],
  products: Product[],
): Promise<CollaboratorCommissionSummary> => {
  if (!uid) {
    return {
      collaboratorUid: uid, collaboratorName, orders: [],
      totalSales: 0, totalCommission: 0, pendingCommission: 0, paidCommission: 0,
    };
  }
  const ordersRef = collection(db, 'orders');
  const snap = await getDocs(query(ordersRef, where('createdBy', '==', uid)));
  const orders = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
  return buildSummaryForOrders(uid, collaboratorName, orders, groups, products);
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
