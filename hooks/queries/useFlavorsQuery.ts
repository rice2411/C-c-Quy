/**
 * React Query hooks cho domain Flavors (vị).
 * - queryFn/mutationFn gọi thẳng flavorService.
 * - Query enabled: !!currentUser. Sau khi lưu invalidate qk.flavors.all.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProductFlavor } from '@/types/flavor';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/hooks/queryKeys';
import { fetchFlavors, saveFlavors } from '@/services/flavorService';

export interface UseFlavorsResult {
  flavors: ProductFlavor[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useFlavors = (): UseFlavorsResult => {
  const { currentUser } = useAuth();
  const query = useQuery({
    queryKey: qk.flavors.all,
    queryFn: fetchFlavors,
    enabled: !!currentUser,
  });
  return {
    flavors: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: () => void query.refetch(),
  };
};

export interface UseSaveFlavorsResult {
  saveFlavors: (flavors: ProductFlavor[]) => Promise<void>;
  saving: boolean;
}

export const useSaveFlavors = (): UseSaveFlavorsResult => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (flavors: ProductFlavor[]) => saveFlavors(flavors),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.flavors.all }),
  });
  return {
    saveFlavors: (flavors) => mutation.mutateAsync(flavors),
    saving: mutation.isPending,
  };
};
