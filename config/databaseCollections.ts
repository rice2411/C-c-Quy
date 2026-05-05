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
  { id: 'stock_receipts', label: 'Stock Receipts' },
  { id: 'import_suppliers', label: 'Import Suppliers' },
  { id: 'import_materials', label: 'Import Materials' },
  { id: 'configurations', label: 'Configurations' },
];
