export enum SupplierType {
  GROCERY = 'GROCERY',
  TIKTOK = 'TIKTOK',
  SHOPEE = 'SHOPEE',
}

export interface Supplier {
  id: string;
  name: string;
  type?: SupplierType;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  note?: string;
  createdAt?: any;
  updatedAt?: any;
}

