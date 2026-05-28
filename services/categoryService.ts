/**
 * Category service — CRUD cho cây danh mục sản phẩm.
 * Lưu trong `configurations/categories` (Firestore).
 */

import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { ProductCategory } from '@/types/category';

const CONFIG_COLLECTION = 'configurations';
const CATEGORIES_DOC = 'categories';

const sanitize = (raw: unknown): ProductCategory[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item: any, idx: number): ProductCategory | null => {
      if (!item || typeof item !== 'object') return null;
      const id = String(item.id || '').trim();
      const name = String(item.name || '').trim();
      if (!id || !name) return null;
      return {
        id,
        name,
        parentId: item.parentId ? String(item.parentId) : null,
        icon: item.icon ? String(item.icon) : undefined,
        color: item.color ? String(item.color) : undefined,
        sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : idx,
        description: item.description ? String(item.description) : undefined,
      };
    })
    .filter((c): c is ProductCategory => c !== null);
};

export const fetchCategories = async (): Promise<ProductCategory[]> => {
  try {
    const ref = doc(db, CONFIG_COLLECTION, CATEGORIES_DOC);
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];
    const data = snap.data() as { categories?: unknown };
    return sanitize(data?.categories);
  } catch (err) {
    console.error('fetchCategories failed:', err);
    return [];
  }
};

export const saveCategories = async (
  categories: ProductCategory[],
  actor?: { uid?: string; displayName?: string }
): Promise<void> => {
  const ref = doc(db, CONFIG_COLLECTION, CATEGORIES_DOC);
  await setDoc(
    ref,
    {
      categories: sanitize(categories),
      updatedAt: serverTimestamp(),
      updatedBy: actor?.displayName || actor?.uid || 'system',
    },
    { merge: true }
  );
};

/** Generate ID dạng slug-friendly */
export const generateCategoryId = (name: string): string => {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || 'cat'}-${Date.now().toString(36)}`;
};
