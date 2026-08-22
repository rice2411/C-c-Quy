/**
 * React Query hooks cho Network Guard (giới hạn theo mạng, mở rộng từ chấm công).
 * - useNetworkStatus: trạng thái IP + danh sách màn guard (mọi user, để chặn/hiện nav).
 * - useNetworkGuardConfig / useNetworks: quản lý (super_admin, màn Cài đặt).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/hooks/queryKeys';
import {
  fetchNetworkStatus,
  fetchGuardedScreens,
  saveGuardedScreens,
  fetchNetworks,
  upsertNetwork,
  deleteNetwork,
  fetchCurrentIp,
  type NetworkStatus,
  type NetworkRange,
} from '@/services/networkService';

const EMPTY_STATUS: NetworkStatus = { configured: false, allowed: false, ip: '', guardedScreens: [] };

export const useNetworkStatus = () => {
  const { currentUser } = useAuth();
  const q = useQuery({
    queryKey: qk.network.status,
    queryFn: fetchNetworkStatus,
    enabled: !!currentUser,
    staleTime: 30_000,
    refetchOnWindowFocus: true, // rời/đổi mạng → cập nhật khi quay lại tab
    refetchInterval: 120_000,
  });
  const status = q.data ?? EMPTY_STATUS;
  // 1 màn bị CHẶN khi: nằm trong danh sách guard + đã cấu hình dải + IP không thuộc dải.
  const isBlocked = (pathname: string): boolean =>
    status.configured && !status.allowed && status.guardedScreens.includes(pathname);
  return { status, isBlocked, loading: q.isLoading };
};

export const useNetworkGuardConfig = () => {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: qk.network.guard, queryFn: fetchGuardedScreens });
  const save = useMutation({
    mutationFn: (routes: string[]) => saveGuardedScreens(routes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.network.guard });
      qc.invalidateQueries({ queryKey: qk.network.status });
    },
  });
  return {
    guarded: (q.data ?? []) as string[],
    loading: q.isLoading,
    saveGuarded: (routes: string[]) => save.mutateAsync(routes),
    saving: save.isPending,
  };
};

export const useNetworks = () => {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: qk.network.ranges, queryFn: fetchNetworks });
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: qk.network.ranges });
    qc.invalidateQueries({ queryKey: qk.network.status });
  };
  const upsert = useMutation({ mutationFn: upsertNetwork, onSuccess: invalidate });
  const remove = useMutation({ mutationFn: deleteNetwork, onSuccess: invalidate });
  return {
    networks: (q.data ?? []) as NetworkRange[],
    loading: q.isLoading,
    upsertNetwork: upsert.mutateAsync,
    deleteNetwork: remove.mutateAsync,
    saving: upsert.isPending || remove.isPending,
    fetchCurrentIp,
  };
};
