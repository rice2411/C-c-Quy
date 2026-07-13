import { apiClient } from '@/services/api/client';
import { Asset } from '@/types';

/** Danh sách tài sản (khấu hao). */
export const fetchAssets = async (): Promise<Asset[]> => {
  const res = await apiClient.get<Asset[]>('/assets');
  return Array.isArray(res.data) ? res.data : [];
};

/** Tạo/sửa tài sản (có id → sửa). */
export const upsertAsset = async (
  body: Omit<Asset, 'id' | 'createdAt'> & { id?: string },
): Promise<Asset> => {
  const res = await apiClient.post<Asset>('/assets', body);
  return res.data;
};

/** Xoá tài sản. */
export const deleteAsset = async (id: string): Promise<void> => {
  await apiClient.delete(`/assets/${id}`);
};
