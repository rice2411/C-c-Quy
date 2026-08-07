/**
 * React Query hooks cho domain Chấm công (attendance). queryFn gọi thẳng attendanceService.
 * enabled theo currentUser (tránh 401). Mutation invalidate các key liên quan.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/hooks/queryKeys';
import {
  checkAttendance,
  clearEmployeeFace,
  deleteNetwork,
  fetchHistory,
  fetchMe,
  fetchNetworks,
  fetchOverview,
  registerFace,
  upsertNetwork,
} from '@/services/attendanceService';
import { AttendanceKind } from '@/types/attendance';

/** Trạng thái chấm công của NV đang đăng nhập (+ IP). */
export const useAttendanceMe = () => {
  const { currentUser } = useAuth();
  const q = useQuery({
    queryKey: qk.attendance.me,
    queryFn: fetchMe,
    enabled: !!currentUser,
  });
  return { me: q.data, loading: q.isLoading, error: q.error, refetch: q.refetch };
};

/** Thao tác chấm công / đăng ký mặt của NV. */
export const useAttendanceActions = () => {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: qk.attendance.me });
    queryClient.invalidateQueries({ queryKey: qk.attendance.overview });
  };

  const registerM = useMutation({
    mutationFn: (v: { image: Blob; employeeId?: string; reset?: boolean }) =>
      registerFace(v.image, { employeeId: v.employeeId, reset: v.reset }),
    onSuccess: invalidate,
  });
  const checkM = useMutation({
    mutationFn: (v: { image: Blob; kind: AttendanceKind; note?: string }) =>
      checkAttendance(v.image, v.kind, v.note),
    onSuccess: invalidate,
  });

  return {
    registerFace: (image: Blob, opts?: { employeeId?: string; reset?: boolean }) =>
      registerM.mutateAsync({ image, ...opts }),
    check: (image: Blob, kind: AttendanceKind, note?: string) =>
      checkM.mutateAsync({ image, kind, note }),
  };
};

// ---- Quản lý (admin) ----

export const useAttendanceOverview = (enabled: boolean) => {
  const q = useQuery({
    queryKey: qk.attendance.overview,
    queryFn: fetchOverview,
    enabled,
  });
  return { rows: q.data ?? [], loading: q.isLoading, error: q.error };
};

export const useAttendanceHistory = (
  params: { employeeId?: string; from?: string; to?: string; limit?: number; offset?: number },
  enabled: boolean,
) => {
  const q = useQuery({
    queryKey: qk.attendance.history(params),
    queryFn: () => fetchHistory(params),
    enabled,
  });
  return { data: q.data, loading: q.isLoading, error: q.error };
};

export const useNetworks = (enabled: boolean) => {
  const q = useQuery({
    queryKey: qk.attendance.networks,
    queryFn: fetchNetworks,
    enabled,
  });
  return { networks: q.data ?? [], loading: q.isLoading, error: q.error };
};

export const useNetworkMutations = () => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.attendance.networks });

  const upsertM = useMutation({ mutationFn: upsertNetwork, onSuccess: invalidate });
  const deleteM = useMutation({ mutationFn: (id: string) => deleteNetwork(id), onSuccess: invalidate });
  const clearFaceM = useMutation({
    mutationFn: (employeeId: string) => clearEmployeeFace(employeeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.attendance.overview }),
  });

  return {
    upsertNetwork: upsertM.mutateAsync,
    deleteNetwork: (id: string) => deleteM.mutateAsync(id),
    clearFace: (employeeId: string) => clearFaceM.mutateAsync(employeeId),
  };
};
