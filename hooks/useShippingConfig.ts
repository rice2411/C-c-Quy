import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DEFAULT_SHIPPING_CONFIG } from '@/types/shippingConfig';
import type { ShippingConfiguration } from '@/types/shippingConfig';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/hooks/queryKeys';
import { fetchShippingConfiguration, saveShippingConfiguration } from '@/services/configurationService';

export interface CalcShipFeeResult {
  fee: number;
  label: string;
}

/** Pure: tính phí ship theo km dựa trên config truyền vào. */
export const calcShipFeeWithConfig = (
  km: number,
  config: ShippingConfiguration,
): CalcShipFeeResult => {
  const sortedTiers = [...config.tiers].sort((a, b) => a.maxKm - b.maxKm);
  for (const tier of sortedTiers) {
    if (km <= tier.maxKm) return { fee: tier.fee, label: tier.label };
  }
  return { fee: config.overFee, label: config.overLabel };
};

/** Pure: append city vào address nếu chưa có (giảm ambiguity SerpApi geocode). */
export const enrichAddressWithConfig = (
  addr: string,
  config: ShippingConfiguration,
): string => {
  const lower = addr.toLowerCase();
  const cityLower = config.shopOrigin.city.toLowerCase();
  if (lower.includes(cityLower) || lower.includes('hue')) return addr;
  return `${addr}, ${config.shopOrigin.city}`;
};

export interface UseShippingConfigResult {
  config: ShippingConfiguration;
  loading: boolean;
  saving: boolean;
  error: string | null;
  calcShipFee: (km: number) => CalcShipFeeResult;
  enrichAddress: (addr: string) => string;
  refresh: () => Promise<void>;
  save: (next: ShippingConfiguration, updatedBy?: string | null) => Promise<void>;
}

/**
 * Cấu hình phí ship qua React Query (epic #58).
 * - Cache tay (module-level cachedConfig/inflight) trước đây được thay bằng React Query
 *   cache: nhiều consumer mount cùng `qk.shippingConfig.all` → chỉ fetch 1 lần (dedup),
 *   ON-DEMAND (chỉ chạy khi có consumer mount + auth ready).
 * - Default khi chưa có data: `DEFAULT_SHIPPING_CONFIG`.
 * - `calcShipFee`/`enrichAddress` vẫn dùng config hiện tại (pure helper bên trên).
 */
export const useShippingConfig = (): UseShippingConfigResult => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: qk.shippingConfig.all,
    queryFn: fetchShippingConfiguration,
    enabled: !!currentUser,
  });

  const saveMutation = useMutation({
    mutationFn: ({ next, updatedBy }: { next: ShippingConfiguration; updatedBy?: string | null }) =>
      saveShippingConfiguration(next, updatedBy ?? null),
    onSuccess: (_data, { next }) => {
      // Cập nhật cache ngay (tránh nháy data cũ) + invalidate để đồng bộ với server.
      queryClient.setQueryData(qk.shippingConfig.all, next);
      queryClient.invalidateQueries({ queryKey: qk.shippingConfig.all });
    },
  });

  const config = query.data ?? DEFAULT_SHIPPING_CONFIG;

  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const save = useCallback(
    async (next: ShippingConfiguration, updatedBy?: string | null) => {
      await saveMutation.mutateAsync({ next, updatedBy });
    },
    [saveMutation],
  );

  const calcShipFee = useCallback((km: number) => calcShipFeeWithConfig(km, config), [config]);
  const enrichAddress = useCallback((addr: string) => enrichAddressWithConfig(addr, config), [config]);

  const error = query.error
    ? (query.error as Error)?.message || 'Không tải được cấu hình phí ship'
    : saveMutation.error
      ? (saveMutation.error as Error)?.message || 'Không lưu được cấu hình phí ship'
      : null;

  return {
    config,
    loading: query.isLoading,
    saving: saveMutation.isPending,
    error,
    calcShipFee,
    enrichAddress,
    refresh,
    save,
  };
};
