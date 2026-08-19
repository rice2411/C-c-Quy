/** React Query cho Đơn vị vận chuyển (carriers). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCarriers, saveCarrier, deleteCarrier, Carrier } from '@/services/carrierService';

const KEY = ['carriers'] as const;

export const useCarriers = () => {
  const { currentUser } = useAuth();
  const q = useQuery({ queryKey: KEY, queryFn: fetchCarriers, enabled: !!currentUser });
  return { carriers: (q.data ?? []) as Carrier[], loading: q.isLoading, error: q.error };
};

export const useCarrierMutations = () => {
  const queryClient = useQueryClient();
  const onSuccess = (data: Carrier[]) => {
    queryClient.setQueryData<Carrier[]>(KEY, data);
    queryClient.invalidateQueries({ queryKey: KEY });
  };
  const saveM = useMutation({
    mutationFn: (input: { id?: string; name: string; phone?: string | null; note?: string | null; active?: boolean }) =>
      saveCarrier(input),
    onSuccess,
  });
  const delM = useMutation({ mutationFn: (id: string) => deleteCarrier(id), onSuccess });
  return {
    save: (input: { id?: string; name: string; phone?: string | null; note?: string | null; active?: boolean }) => saveM.mutateAsync(input),
    remove: (id: string) => delM.mutateAsync(id),
    saving: saveM.isPending || delM.isPending,
  };
};
