export type ZaloOrderEventType = 'create' | 'update' | 'delete';

/** Danh sách field keys của order được hỗ trợ trong whitelist filter (match diffOrders.TRACKED_FIELDS) */
export const ZALO_TRACKABLE_FIELDS: Array<{ key: string; label: string }> = [
  { key: 'status', label: 'Trạng thái' },
  { key: 'paymentStatus', label: 'Thanh toán' },
  { key: 'paymentMethod', label: 'Phương thức TT' },
  { key: 'deliveryType', label: 'Hình thức nhận hàng' },
  { key: 'total', label: 'Tổng tiền' },
  { key: 'shippingCost', label: 'Phí ship' },
  { key: 'deliveryDate', label: 'Ngày giao' },
  { key: 'deliveryTime', label: 'Giờ giao' },
  { key: 'note', label: 'Ghi chú' },
  { key: 'customer.name', label: 'Tên khách' },
  { key: 'customer.phone', label: 'SĐT khách' },
  { key: 'customer.address', label: 'Địa chỉ' },
  { key: 'items', label: 'Sản phẩm' },
];

export interface ZaloGroupConfig {
  id: string;
  name: string;
  zaloGroupId: string;
  memberUids: string[];
  notifyOnCreate?: boolean;
  notifyOnUpdate?: boolean;
  notifyOnDelete?: boolean;
  updateFieldWhitelist?: string[];
}

export interface ZaloGroupsConfiguration {
  groups: ZaloGroupConfig[];
  mainGroupId?: string;
  mainNotifyOnCreate?: boolean;
  mainNotifyOnUpdate?: boolean;
  mainNotifyOnDelete?: boolean;
  mainUpdateFieldWhitelist?: string[];
  updatedAt?: string;
  updatedBy?: string | null;
}
