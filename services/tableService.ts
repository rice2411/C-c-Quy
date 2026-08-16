import { apiClient } from "@/services/api/client";
import { DiningTable, DiningTableInput, DineInSession } from "@/types";

const toOpenOrder = (o: any) => ({
  id: typeof o?.id === "string" ? o.id : "",
  orderNumber: o?.orderNumber ?? null,
  guestCount: typeof o?.guestCount === "number" ? o.guestCount : null,
  seatedAt: o?.seatedAt ?? null,
  leftAt: o?.leftAt ?? null,
  total: typeof o?.total === "number" ? o.total : 0,
  paidAmount: typeof o?.paidAmount === "number" ? o.paidAmount : 0,
  status: typeof o?.status === "string" ? o.status : "",
  paymentStatus: typeof o?.paymentStatus === "string" ? o.paymentStatus : "",
  itemCount: typeof o?.itemCount === "number" ? o.itemCount : 0,
});

/** Đọc dữ liệu bàn từ API — coi mọi field untrusted, có default an toàn. */
const toTable = (r: any): DiningTable => ({
  id: typeof r?.id === "string" ? r.id : "",
  name: typeof r?.name === "string" ? r.name : "Bàn",
  posX: typeof r?.posX === "number" ? r.posX : 0.1,
  posY: typeof r?.posY === "number" ? r.posY : 0.1,
  seats: typeof r?.seats === "number" ? r.seats : 4,
  sortOrder: typeof r?.sortOrder === "number" ? r.sortOrder : 0,
  active: typeof r?.active === "boolean" ? r.active : true,
  currentOrders: Array.isArray(r?.currentOrders) ? r.currentOrders.map(toOpenOrder) : [],
  currentOrder: r?.currentOrder ? toOpenOrder(r.currentOrder) : null,
});

/** Danh sách bàn (kèm đơn đang mở) — GET /dine-in/tables. */
export const fetchTables = async (): Promise<DiningTable[]> => {
  const res = await apiClient.get("/dine-in/tables");
  return Array.isArray(res.data) ? res.data.map(toTable) : [];
};

/** Tạo bàn mới — POST /dine-in/tables. */
export const addTable = async (
  input: Omit<DiningTableInput, "id">,
): Promise<DiningTable> => {
  const res = await apiClient.post("/dine-in/tables", input);
  return toTable(res.data);
};

/** Sửa bàn (đổi tên / vị trí kéo-thả / số ghế) — PUT /dine-in/tables/:id. */
export const updateTable = async (
  id: string,
  input: Partial<Omit<DiningTableInput, "id">>,
): Promise<DiningTable> => {
  const res = await apiClient.put(`/dine-in/tables/${id}`, input);
  return toTable(res.data);
};

/** Xoá bàn (soft) — DELETE /dine-in/tables/:id. */
export const deleteTable = async (id: string): Promise<void> => {
  await apiClient.delete(`/dine-in/tables/${id}`);
};

/** Đóng bàn của 1 đơn (set giờ ra) — POST /dine-in/orders/:orderId/checkout. */
export const checkoutTable = async (orderId: string): Promise<void> => {
  await apiClient.post(`/dine-in/orders/${orderId}/checkout`);
};

const toSession = (r: any): DineInSession => ({
  id: typeof r?.id === "string" ? r.id : "",
  orderNumber: r?.orderNumber ?? null,
  tableId: r?.tableId ?? null,
  tableName: r?.tableName ?? null,
  seatedAt: r?.seatedAt ?? null,
  leftAt: r?.leftAt ?? null,
  guestCount: typeof r?.guestCount === "number" ? r.guestCount : null,
  total: typeof r?.total === "number" ? r.total : 0,
  paidAmount: typeof r?.paidAmount === "number" ? r.paidAmount : 0,
  paymentStatus: typeof r?.paymentStatus === "string" ? r.paymentStatus : "",
  status: typeof r?.status === "string" ? r.status : "",
  itemCount: typeof r?.itemCount === "number" ? r.itemCount : 0,
});

/** Lịch sử vào/ra của 1 bàn — GET /dine-in/tables/:id/history. */
export const fetchTableHistory = async (tableId: string): Promise<DineInSession[]> => {
  const res = await apiClient.get(`/dine-in/tables/${tableId}/history`);
  return Array.isArray(res.data) ? res.data.map(toSession) : [];
};

/** Lịch sử vào/ra toàn bộ bàn — GET /dine-in/history. */
export const fetchDineInHistory = async (): Promise<DineInSession[]> => {
  const res = await apiClient.get(`/dine-in/history`);
  return Array.isArray(res.data) ? res.data.map(toSession) : [];
};
