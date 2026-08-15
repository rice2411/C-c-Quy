import { apiClient } from '@/services/api/client';
import type { Ingredient, Recipe, RecipeLine } from '@/types';

const BASE = '/recipes';

const num = (v: unknown, d = 0): number => (typeof v === 'number' && !Number.isNaN(v) ? v : d);
const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d);

const normalizeLine = (r: unknown): RecipeLine => {
  const o = (r ?? {}) as Record<string, unknown>;
  return {
    id: typeof o.id === 'number' ? o.id : undefined,
    kind: o.kind === 'recipe' ? 'recipe' : 'ingredient',
    ingredientId: typeof o.ingredientId === 'number' ? o.ingredientId : null,
    childRecipeId: typeof o.childRecipeId === 'number' ? o.childRecipeId : null,
    name: str(o.name),
    qty: num(o.qty),
    unit: str(o.unit, 'g'),
    note: typeof o.note === 'string' ? o.note : null,
    unitCost: num(o.unitCost),
    lineCost: num(o.lineCost),
  };
};

const normalizeRecipe = (r: unknown): Recipe => {
  const o = (r ?? {}) as Record<string, unknown>;
  return {
    id: num(o.id),
    name: str(o.name),
    kind: o.kind === 'semi' ? 'semi' : 'product',
    category: (o.category as Recipe['category']) ?? null,
    yieldQty: num(o.yieldQty, 1),
    yieldUnit: str(o.yieldUnit, 'cai'),
    productId: typeof o.productId === 'string' ? o.productId : null,
    note: typeof o.note === 'string' ? o.note : null,
    laborTier: (o.laborTier as Recipe['laborTier']) ?? null,
    nvl: num(o.nvl),
    packaging: num(o.packaging),
    labor: num(o.labor),
    overhead: num(o.overhead),
    wastePct: num(o.wastePct),
    waste: num(o.waste),
    totalCost: num(o.totalCost),
    marginPct: num(o.marginPct),
    suggestedPrice: num(o.suggestedPrice),
    profit: num(o.profit),
    lines: Array.isArray(o.lines) ? o.lines.map(normalizeLine) : [],
  };
};

export const fetchRecipes = async (): Promise<Recipe[]> => {
  const res = await apiClient.get<unknown[]>(BASE);
  return Array.isArray(res.data) ? res.data.map(normalizeRecipe) : [];
};

export const fetchRecipe = async (id: number): Promise<Recipe | null> => {
  const res = await apiClient.get<unknown>(`${BASE}/${id}`);
  return res.data ? normalizeRecipe(res.data) : null;
};

export interface RecipeUpsertPayload {
  id?: number;
  name: string;
  kind?: 'product' | 'semi';
  category?: string | null;
  yieldQty?: number;
  yieldUnit?: string;
  laborTier?: string | null;
  laborCost?: number;
  overheadCost?: number;
  packagingCost?: number;
  wastePct?: number;
  marginPct?: number;
  productId?: string | null;
  note?: string | null;
  lines?: Array<{
    ingredientId?: number | null;
    childRecipeId?: number | null;
    qty: number;
    unit: string;
    sortOrder?: number;
  }>;
}

export const upsertRecipe = async (body: RecipeUpsertPayload): Promise<Recipe> => {
  const res = await apiClient.post<unknown>(BASE, body);
  return normalizeRecipe(res.data);
};

export const setRecipeMargin = async (id: number, marginPct: number): Promise<Recipe> => {
  const res = await apiClient.patch<unknown>(`${BASE}/${id}/margin`, { marginPct });
  return normalizeRecipe(res.data);
};

export const deleteRecipe = async (id: number): Promise<void> => {
  await apiClient.delete(`${BASE}/${id}`);
};

// --- Nguyên liệu ---
const normalizeIngredient = (r: unknown): Ingredient => {
  const o = (r ?? {}) as Record<string, unknown>;
  return {
    id: num(o.id),
    name: str(o.name),
    unit: str(o.unit, 'g'),
    unitPrice: num(o.unitPrice),
    materialId: typeof o.materialId === 'string' ? o.materialId : null,
    note: typeof o.note === 'string' ? o.note : null,
  };
};

export const fetchIngredients = async (): Promise<Ingredient[]> => {
  const res = await apiClient.get<unknown[]>(`${BASE}/ingredients`);
  return Array.isArray(res.data) ? res.data.map(normalizeIngredient) : [];
};

export const upsertIngredient = async (
  body: { id?: number; name: string; unit: string; unitPrice: number; materialId?: string | null },
): Promise<Ingredient> => {
  const res = await apiClient.post<unknown>(`${BASE}/ingredients`, body);
  return normalizeIngredient(res.data);
};

export const deleteIngredient = async (id: number): Promise<void> => {
  await apiClient.delete(`${BASE}/ingredients/${id}`);
};
