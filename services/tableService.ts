import { apiClient } from "@/services/api/client";
import { DiningTable, DiningTableInput, DineInSession } from "@/types";

/** Đọc dữ liệu bàn từ API — coi mọi field untrusted, có default an toàn. */
const toTable = (r: any): DiningTable => ({
  id: typeof r?.id === "string" ? r.id : "",
  name: typeof r?.name === "string" ? r.name : "Bàn",
  posX: typeof r?.posX === "number" ? r.posX : 0.1,
  posY: typeof r?.posY === "number" ? r.posY : 0.1,
  seats: typeof r?.seats === "number" ? r.seats : 4,
  sortOrder: typeof r?.sortOrder === "number" ? r.sortOrder : 0,
  active: typeof r?.active === "boolean" ? r.active : true,
  currentOrder: r?.currentOrder
    ? {
        id: typeof r.currentOrder.id === "string" ? r.currentOrder.id : "",
        orderNumber: r.currentOrder.orderNumber ?? null,
        guestCount:
          typeof r.currentOrder.guestCount === "number" ? r.currentOrder.guestCount : null,
        seatedAt: r.currentOrder.seatedAt ?? null,
        leftAt: r.currentOrder.leftAt ?? null,
        total: typeof r.currentOrder.total === "number" ? r.currentOrder.total : 0,
        paidAmount:
          typeof r.currentOrder.paidAmount === "number" ? r.currentOrder.paidAmount : 0,
        status: typeof r.currentOrder.status === "string" ? r.currentOrder.status : "",
        paymentStatus:
          typeof r.currentOrder.paymentStatus === "string" ? r.currentOrder.paymentStatus : "",
        itemCount:
          typeof r.currentOrder.itemCount === "number" ? r.currentOrder.itemCount : 0,
      }
    : null,
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
