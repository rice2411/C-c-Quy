/**
 * Danh sách collection root Firestore hiển thị trong Settings → Database Explorer.
 * Firestore client không liệt kê dynamic được, nên cần khai báo tường minh tại đây.
 */
export interface DatabaseCollectionConfig {
  id: string;
  label: string;
}

export const DATABASE_COLLECTIONS: DatabaseCollectionConfig[] = [
  { id: 'orders', label: 'Orders' },
  { id: 'products', label: 'Products' },
  { id: 'customers', label: 'Customers' },
  { id: 'users', label: 'Users' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'facebook_messages', label: 'Tin nhắn Facebook' },
  { id: 'stock_receipts', label: 'Phiếu nhập kho' },
  { id: 'suppliers', label: 'Nhà cung cấp' },
  { id: 'materials', label: 'Nguyên vật liệu' },
  { id: 'configurations', label: 'Configurations' },
];
