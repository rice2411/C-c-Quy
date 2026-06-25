import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DEFAULT_PAYMENT_CONFIG } from '@/types/paymentConfig';
import type { PaymentConfiguration } from '@/types/paymentConfig';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/hooks/queryKeys';
import { fetchPaymentConfiguration, savePaymentConfiguration } from '@/services/configurationService';

export interface UsePaymentConfigResult {
  config: PaymentConfiguration;
  loading: boolean;
  saving: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  save: (next: PaymentConfiguration) => Promise<void>;
}

/**
 * Cấu hình thanh toán (số TK nhận tiền + template QR) qua React Query — mirror useShippingConfig.
 * - Cache theo `qk.paymentConfig.all`: nhiều consumer mount → fetch 1 lần (dedup), on-demand.
 * - Default khi chưa có data: `DEFAULT_PAYMENT_CONFIG`.
 * - Mutation set cache ngay + invalidate để đồng bộ server.
 */
export const usePaymentConfig = (): UsePaymentConfigResult => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: qk.paymentConfig.all,
    queryFn: fetchPaymentConfiguration,
    enabled: !!currentUser,
  });

  const saveMutation = useMutation({
    mutationFn: (next: PaymentConfiguration) => savePaymentConfiguration(next),
    onSuccess: (saved, next) => {
      queryClient.setQueryData(qk.paymentConfig.all, saved ?? next);
      queryClient.invalidateQueries({ queryKey: qk.paymentConfig.all });
    },
  });

  const config = query.data ?? DEFAULT_PAYMENT_CONFIG;

  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const save = useCallback(
    async (next: PaymentConfiguration) => {
      await saveMutation.mutateAsync(next);
    },
    [saveMutation],
  );

  const error = query.error
    ? (query.error as Error)?.message || 'Không tải được cấu hình thanh toán'
    : saveMutation.error
      ? (saveMutation.error as Error)?.message || 'Không lưu được cấu hình thanh toán'
      : null;

  return {
    config,
    loading: query.isLoading,
    saving: saveMutation.isPending,
    error,
    refresh,
    save,
  };
};
