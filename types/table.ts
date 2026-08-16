/** Types cho Order theo bàn (dine-in). Khớp API BE (camelCase). */

/** Trạng thái 1 bàn suy từ đơn đang mở. */
export type TableStatus = 'available' | 'occupied';

/** Danh mục trạng thái bàn cho badge/legend. */
export const TABLE_STATUSES: { value: TableStatus; label: string }[] = [
  { value: 'available', label: 'Trống' },
  { value: 'occupied', label: 'Đang ngồi' },
];

/** Nhãn trạng thái bàn; không rõ → 'Trống'. */
export const tableStatusLabel = (s?: string): string =>
  TABLE_STATUSES.find((x) => x.value === s)?.label ?? 'Trống';

/** Tóm tắt đơn đang mở của 1 bàn (đủ để render map + bảng danh sách). */
export interface DineInOpenOrder {
  id: string;
  orderNumber?: string | null;
  guestCount?: number | null;
  seatedAt?: string | null; // ISO — giờ vào
  leftAt?: string | null; // ISO — giờ ra
  total: number; // VND
  paidAmount: number; // VND
  status: string;
  paymentStatus: string;
  itemCount: number; // tổng số lượng món
}

/** 1 phiên vào/ra của bàn (lịch sử) — mỗi đơn dine-in = 1 phiên. */
export interface DineInSession {
  id: string;
  orderNumber?: string | null;
  tableId?: string | null;
  tableName?: string | null;
  seatedAt?: string | null; // giờ vào
  leftAt?: string | null; // giờ ra (null = đang ngồi)
  guestCount?: number | null;
  total: number;
  paidAmount: number;
  paymentStatus: string;
  status: string;
  itemCount: number;
}

/** 1 bàn ăn tại chỗ + các đơn đang mở (nhiều đơn/bàn). */
export interface DiningTable {
  id: string;
  name: string;
  posX: number; // 0..1 theo chiều ngang khung sơ đồ
  posY: number; // 0..1 theo chiều dọc khung sơ đồ
  seats: number;
  sortOrder: number;
  active: boolean;
  /** Các đơn đang mở của bàn (sắp theo giờ vào tăng dần). */
  currentOrders?: DineInOpenOrder[];
  /** Đơn vào sớm nhất (tương thích ngược). */
  currentOrder?: DineInOpenOrder | null;
}

/** Các đơn đang mở của bàn (ưu tiên currentOrders, fallback currentOrder cũ). */
export const tableOpenOrders = (t: DiningTable): DineInOpenOrder[] =>
  t.currentOrders && t.currentOrders.length
    ? t.currentOrders
    : t.currentOrder
      ? [t.currentOrder]
      : [];

/** Tổng tiền các đơn đang mở của bàn (VND). */
export const tableTotal = (t: DiningTable): number =>
  tableOpenOrders(t).reduce((s, o) => s + (o.total || 0), 0);

/** Giờ vào sớm nhất trong các đơn đang mở (để đếm giờ). */
export const tableSeatedAt = (t: DiningTable): string | null | undefined =>
  tableOpenOrders(t)[0]?.seatedAt;

/** Input tạo/sửa bàn (id vắng = tạo mới). */
export interface DiningTableInput {
  id?: string;
  name?: string;
  posX?: number;
  posY?: number;
  seats?: number;
  sortOrder?: number;
}

/** Trạng thái bàn: có ≥1 đơn đang mở → đang ngồi. */
export const tableStatus = (t: DiningTable): TableStatus =>
  tableOpenOrders(t).length > 0 ? 'occupied' : 'available';
