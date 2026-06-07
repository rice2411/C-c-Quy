/**
 * Category service — CRUD cây danh mục sản phẩm qua BE NestJS.
 * BE lưu trong document `configurations/categories` (Firestore).
 */

import { apiClient } from '@/services/api/client';
import type { ProductCategory } from '@/types/category';

export const fetchCategories = async (): Promise<ProductCategory[]> => {
  try {
    const { data } = await apiClient.get<ProductCategory[]>('/categories');
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('fetchCategories failed:', err);
    return [];
  }
};

export const saveCategories = async (
  categories: ProductCategory[]
): Promise<void> => {
  await apiClient.put('/categories', categories);
};

/** Generate ID dạng slug-friendly (thuần client). */
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
