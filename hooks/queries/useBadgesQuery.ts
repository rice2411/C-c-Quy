/**
 * React Query hooks cho domain Badges (epic #58).
 *
 * - queryFn/mutationFn GỌI THẲNG badgeService — KHÔNG viết lại HTTP.
 * - Query `enabled: !!currentUser` (tránh chạy trước auth → 401).
 * - Sau khi lưu invalidate `qk.badges.all`.
 * - KHÔNG nuốt lỗi: caller bắt error để toast.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  BadgesConfiguration,
  CustomerBadgeRule,
  OrderBadge,
  ProductBadge,
} from '@/types/badge';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/hooks/queryKeys';
import { fetchBadgesConfiguration, saveBadgesConfiguration } from '@/services/badgeService';

const EMPTY_BADGES: BadgesConfiguration = {
  orderBadges: [],
  productBadges: [],
  customerRules: [],
};

export interface UseBadgesResult {
  badges: BadgesConfiguration;
  orderBadges: OrderBadge[];
  productBadges: ProductBadge[];
  customerRules: CustomerBadgeRule[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useBadges = (): UseBadgesResult => {
  const { currentUser } = useAuth();
  const query = useQuery({
    queryKey: qk.badges.all,
    queryFn: fetchBadgesConfiguration,
    enabled: !!currentUser,
  });
  const badges = query.data ?? EMPTY_BADGES;
  return {
    badges,
    orderBadges: badges.orderBadges ?? [],
    productBadges: badges.productBadges ?? [],
    customerRules: badges.customerRules ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: () => void query.refetch(),
  };
};

export interface SaveBadgesArgs {
  orderBadges: OrderBadge[];
  productBadges: ProductBadge[];
  customerRules: CustomerBadgeRule[];
  updatedBy?: string | null;
}

export interface UseSaveBadgesResult {
  saveBadges: (args: SaveBadgesArgs) => Promise<void>;
  saving: boolean;
}

export const useSaveBadges = (): UseSaveBadgesResult => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ orderBadges, productBadges, customerRules, updatedBy }: SaveBadgesArgs) =>
      saveBadgesConfiguration(orderBadges, productBadges, customerRules, updatedBy ?? null),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.badges.all }),
  });
  return {
    saveBadges: (args) => mutation.mutateAsync(args),
    saving: mutation.isPending,
  };
};
