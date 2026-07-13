export interface Asset {
  id: string;
  name: string;
  cost: number; // VND nguyên giá
  usefulMonths: number; // số tháng khấu hao
  startDate: string; // ISO yyyy-mm-dd
  category?: string | null;
  note?: string | null;
  createdAt?: string;
}

export type AssetCategory = 'equipment' | 'furniture' | 'renovation' | 'other';

export const ASSET_CATEGORIES: { value: AssetCategory; label: string }[] = [
  { value: 'equipment', label: 'Thiết bị' },
  { value: 'furniture', label: 'Nội thất' },
  { value: 'renovation', label: 'Sửa chữa/Cải tạo' },
  { value: 'other', label: 'Khác' },
];

export const assetCategoryLabel = (c?: string | null): string =>
  ASSET_CATEGORIES.find((x) => x.value === c)?.label ?? (c ? 'Khác' : '—');
