/**
 * React Query hooks cho domain Promotions (epic #58, phase 5/8).
 *
 * - queryFn/mutationFn GỌI THẲNG promotionService (REST) — KHÔNG viết lại HTTP.
 * - Query `enabled: !!currentUser` (tránh chạy trước khi auth ready → 401).
 * - Sau mutation invalidate `qk.promotions.all` (prefix match → xoá cả preview).
 * - guard `data ?? []`; KHÔNG nuốt lỗi: caller (component) bắt error để toast.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ComputeResult, Promotion } from '@/types/promotion';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/hooks/queryKeys';
import {
  addPromotion,
  deletePromotion,
  fetchPromotions,
  previewPromotion,
  updatePromotion,
} from '@/services/promotionService';

export interface UsePromotionsResult {
  promotions: Promotion[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const usePromotions = (): UsePromotionsResult => {
  const { currentUser } = useAuth();
  const query = useQuery({
    queryKey: qk.promotions.all,
    queryFn: fetchPromotions,
    enabled: !!currentUser,
  });
  return {
    promotions: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: () => void query.refetch(),
  };
};

export type AddPromotionArgs = Partial<Omit<Promotion, 'id' | 'usedCount' | 'createdAt'>>;
export type UpdatePromotionData = Partial<Omit<Promotion, 'id' | 'usedCount'>>;

export interface UpdatePromotionArgs {
  id: string;
  data: UpdatePromotionData;
}

export interface UsePromotionMutationsResult {
  addPromotion: (data: AddPromotionArgs) => Promise<{ id: string }>;
  updatePromotion: (args: UpdatePromotionArgs) => Promise<void>;
  deletePromotion: (id: string) => Promise<void>;
}

export const usePromotionMutations = (): UsePromotionMutationsResult => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.promotions.all });

  const addMutation = useMutation({
    mutationFn: (data: AddPromotionArgs) => addPromotion(data),
    onSuccess: invalidate,
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: UpdatePromotionArgs) => updatePromotion(id, data),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePromotion(id),
    onSuccess: invalidate,
  });

  return {
    addPromotion: (data) => addMutation.mutateAsync(data),
    updatePromotion: (args) => updateMutation.mutateAsync(args),
    deletePromotion: (id) => deleteMutation.mutateAsync(id),
  };
};

export type PreviewPromotionParams = Parameters<typeof previewPromotion>[0];

export interface UsePromotionPreviewResult {
  result: ComputeResult | undefined;
  loading: boolean;
  error: Error | null;
}

/** Tính trước giảm giá cho giỏ hàng (màn tạo/sửa đơn dùng). */
export const usePromotionPreview = (
  params: PreviewPromotionParams,
  enabled = true,
): UsePromotionPreviewResult => {
  const { currentUser } = useAuth();
  const query = useQuery({
    queryKey: qk.promotions.preview(params),
    queryFn: () => previewPromotion(params),
    enabled: !!currentUser && enabled,
  });
  return {
    result: query.data,
    loading: query.isLoading,
    error: query.error,
  };
};
