import { apiClient } from '@/services/api/client';
import { ComputeResult, Promotion } from '@/types/promotion';
import { SurchargeTag } from '@/types/order';

const PATH = '/promotions';

export const fetchPromotions = async (): Promise<Promotion[]> => {
  const res = await apiClient.get<Promotion[]>(PATH);
  return res.data ?? [];
};

export const addPromotion = async (
  data: Partial<Omit<Promotion, 'id' | 'usedCount' | 'createdAt'>>,
): Promise<{ id: string }> => {
  const res = await apiClient.post<{ id: string }>(PATH, data);
  return res.data;
};

export const updatePromotion = async (
  id: string,
  data: Partial<Omit<Promotion, 'id' | 'usedCount'>>,
): Promise<void> => {
  await apiClient.patch(`${PATH}/${id}`, data);
};

export const deletePromotion = async (id: string): Promise<void> => {
  await apiClient.delete(`${PATH}/${id}`);
};

/** Tính trước giảm giá cho giỏ hàng (màn tạo/sửa đơn gọi). */
export const previewPromotion = async (cart: {
  items: { productId?: string; price: number; quantity: number }[];
  /** @deprecated dùng surchargeAmount/surchargeTag (mô hình phụ thu mới) */
  decorations?: { price: number; quantity: number }[];
  /** Phụ thu cả đơn (VND) — cộng vào subtotal trước giảm. */
  surchargeAmount?: number;
  /** Nhãn phụ thu. */
  surchargeTag?: SurchargeTag;
  shippingCost?: number;
  code?: string;
  promotionIds?: string[];
}): Promise<ComputeResult> => {
  const res = await apiClient.post<ComputeResult>(`${PATH}/preview`, cart);
  return res.data;
};
