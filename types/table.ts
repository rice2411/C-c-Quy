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

/** 1 bàn ăn tại chỗ + đơn đang mở (nếu có). */
export interface DiningTable {
  id: string;
  name: string;
  posX: number; // 0..1 theo chiều ngang khung sơ đồ
  posY: number; // 0..1 theo chiều dọc khung sơ đồ
  seats: number;
  sortOrder: number;
  active: boolean;
  currentOrder?: DineInOpenOrder | null;
}

/** Input tạo/sửa bàn (id vắng = tạo mới). */
export interface DiningTableInput {
  id?: string;
  name?: string;
  posX?: number;
  posY?: number;
  seats?: number;
  sortOrder?: number;
}

/** Trạng thái bàn: có đơn chưa đóng (leftAt rỗng) → đang ngồi. */
export const tableStatus = (t: DiningTable): TableStatus =>
  t.currentOrder && !t.currentOrder.leftAt ? 'occupied' : 'available';
