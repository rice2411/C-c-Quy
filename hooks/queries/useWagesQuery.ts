/**
 * React Query hooks cho Mức lương giờ (wages). Đọc toàn bộ lịch sử; thêm/xoá bản ghi.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/hooks/queryKeys';
import { fetchWages, addWage, deleteWage } from '@/services/wageService';
import { WageRate, WageRateInput } from '@/types/wage';

export const useWages = () => {
  const { currentUser } = useAuth();
  const q = useQuery({
    queryKey: qk.wages.all,
    queryFn: fetchWages,
    enabled: !!currentUser,
  });
  return {
    wages: (q.data ?? []) as WageRate[],
    loading: q.isLoading,
    error: q.error,
  };
};

export const useWageMutations = () => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.wages.all });

  const addM = useMutation({ mutationFn: (input: WageRateInput) => addWage(input), onSuccess: invalidate });
  const delM = useMutation({ mutationFn: (id: string) => deleteWage(id), onSuccess: invalidate });

  return {
    addWage: (input: WageRateInput) => addM.mutateAsync(input),
    deleteWage: (id: string) => delM.mutateAsync(id),
    adding: addM.isPending,
  };
};
