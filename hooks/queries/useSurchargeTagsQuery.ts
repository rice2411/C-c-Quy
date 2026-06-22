/**
 * React Query hooks cho domain Surcharge Tags (tag phụ thu).
 *
 * - queryFn/mutationFn GỌI THẲNG surchargeTagService — KHÔNG viết lại HTTP.
 * - Query `enabled: !!currentUser` (tránh chạy trước auth → 401).
 * - Sau khi lưu invalidate `qk.surchargeTags.all`.
 * - KHÔNG nuốt lỗi: caller bắt error để toast.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SurchargeTag } from '@/types/surchargeTag';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/hooks/queryKeys';
import { fetchSurchargeTags, saveSurchargeTags } from '@/services/surchargeTagService';

export interface UseSurchargeTagsResult {
  surchargeTags: SurchargeTag[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useSurchargeTags = (): UseSurchargeTagsResult => {
  const { currentUser } = useAuth();
  const query = useQuery({
    queryKey: qk.surchargeTags.all,
    queryFn: fetchSurchargeTags,
    enabled: !!currentUser,
  });
  return {
    surchargeTags: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: () => void query.refetch(),
  };
};

export interface UseSaveSurchargeTagsResult {
  saveSurchargeTags: (list: SurchargeTag[]) => Promise<void>;
  saving: boolean;
}

export const useSaveSurchargeTags = (): UseSaveSurchargeTagsResult => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (list: SurchargeTag[]) => saveSurchargeTags(list),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.surchargeTags.all }),
  });
  return {
    saveSurchargeTags: (list) => mutation.mutateAsync(list),
    saving: mutation.isPending,
  };
};
