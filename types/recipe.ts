// Công thức & Giá thành (đa tầng): NVL(giá max) + bao bì + công + vận hành + hao hụt → giá bán theo margin.

export type RecipeKind = 'product' | 'semi';
export type RecipeCategory = 'cake' | 'cookie' | 'drink';
export type LaborTier = 'easy' | 'medium' | 'hard';

export interface RecipeLine {
  id?: number;
  kind: 'ingredient' | 'recipe';
  ingredientId?: number | null;
  childRecipeId?: number | null;
  name: string;
  qty: number;
  unit: string;
  note?: string | null;
  unitCost?: number;
  lineCost?: number;
}

export interface Recipe {
  id: number;
  name: string;
  kind: RecipeKind;
  category?: RecipeCategory | null;
  yieldQty: number;
  yieldUnit: string;
  productId?: string | null;
  note?: string | null;
  laborTier?: LaborTier | null;
  nvl: number;
  packaging: number;
  labor: number;
  overhead: number;
  wastePct: number;
  waste: number;
  totalCost: number;
  marginPct: number;
  suggestedPrice: number;
  profit: number;
  lines: RecipeLine[];
}

export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  unitPrice: number;
  materialId?: string | null;
  note?: string | null;
}

export const RECIPE_CATEGORIES: { value: RecipeCategory; label: string }[] = [
  { value: 'cake', label: 'Bánh' },
  { value: 'cookie', label: 'Cookie' },
  { value: 'drink', label: 'Nước' },
];
export const recipeCategoryLabel = (c?: string | null): string =>
  RECIPE_CATEGORIES.find((x) => x.value === c)?.label ?? (c ? 'Khác' : 'Bán thành phẩm');

export const LABOR_TIERS: { value: LaborTier; label: string }[] = [
  { value: 'easy', label: 'Dễ' },
  { value: 'medium', label: 'Trung bình' },
  { value: 'hard', label: 'Khó' },
];
export const laborTierLabel = (t?: string | null): string =>
  LABOR_TIERS.find((x) => x.value === t)?.label ?? '—';

// Các mức lợi nhuận chọn nhanh cho mỗi sản phẩm
export const MARGIN_OPTIONS: { value: number; label: string }[] = [
  { value: 0.2, label: '20%' },
  { value: 0.3, label: '30%' },
  { value: 0.4, label: '40%' },
  { value: 0.5, label: '50%' },
  { value: 0.6, label: '60%' },
  { value: 0.7, label: '70%' },
];
export const marginLabel = (m: number): string => `${Math.round(m * 100)}%`;
