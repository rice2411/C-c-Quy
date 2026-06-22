/**
 * Surcharge tag service — đọc/ghi danh sách tag phụ thu qua BE NestJS.
 * BE: `GET/PUT /surcharge-tags` trả/nhận SurchargeTag[] (camelCase).
 */

import { apiClient } from '@/services/api/client';
import type { SurchargeTag } from '@/types/surchargeTag';

export const fetchSurchargeTags = async (): Promise<SurchargeTag[]> => {
  try {
    const { data } = await apiClient.get<SurchargeTag[]>('/surcharge-tags');
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('fetchSurchargeTags failed:', err);
    return [];
  }
};

export const saveSurchargeTags = async (list: SurchargeTag[]): Promise<void> => {
  await apiClient.put('/surcharge-tags', list);
};
