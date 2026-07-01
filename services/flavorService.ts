/**
 * Flavor service — CRUD danh sách vị qua BE NestJS (/flavors).
 */
import { apiClient } from '@/services/api/client';
import type { ProductFlavor } from '@/types/flavor';

export const fetchFlavors = async (): Promise<ProductFlavor[]> => {
  try {
    const { data } = await apiClient.get<ProductFlavor[]>('/flavors');
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('fetchFlavors failed:', err);
    return [];
  }
};

export const saveFlavors = async (flavors: ProductFlavor[]): Promise<void> => {
  await apiClient.put('/flavors', flavors);
};

/** Generate ID dạng slug-friendly (thuần client). */
export const generateFlavorId = (name: string): string => {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || 'flavor'}-${Date.now().toString(36)}`;
};
