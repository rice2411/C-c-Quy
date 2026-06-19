/**
 * React Query hooks cho domain Commission (epic #58 — P6 migrate data-fetching).
 *
 * - queryFn/mutationFn GỌI THẲNG service hiện có (commissionService /
 *   commissionGroupService) — KHÔNG viết lại HTTP.
 * - Query `enabled: !!currentUser` (riêng useMyCommission cần uid → `enabled: !!uid`)
 *   để tránh chạy trước khi auth ready → 401.
 * - Sau mutation invalidate key liên quan:
 *   markPaid/markPending → `qk.commission.summaries`;
 *   create/update/delete group → `qk.commission.groups`.
 * - KHÔNG nuốt lỗi: caller (component) bắt error / dùng `error` để toast.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/hooks/queryKeys';
import {
  CollaboratorCommissionSummary,
  fetchCommissionSummaries,
  fetchMyCommission,
  markCommissionPaid,
  markCommissionPending,
} from '@/services/commissionService';
import {
  createCommissionGroup,
  deleteCommissionGroup,
  fetchCommissionGroups,
  updateCommissionGroup,
} from '@/services/commissionGroupService';
import { CommissionGroup } from '@/types/commissionGroup';

/* ─────────────────────────── Summaries (admin) ─────────────────────────── */

export interface UseCommissionSummariesResult {
  summaries: CollaboratorCommissionSummary[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useCommissionSummaries = (): UseCommissionSummariesResult => {
  const { currentUser } = useAuth();
  const query = useQuery({
    queryKey: qk.commission.summaries,
    queryFn: fetchCommissionSummaries,
    enabled: !!currentUser,
  });
  return {
    summaries: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: () => void query.refetch(),
  };
};

/* ─────────────────────────── My commission (CTV) ───────────────────────── */

export interface UseMyCommissionResult {
  summary: CollaboratorCommissionSummary | null;
  loading: boolean;
  error: Error | null;
}

/** Hoa hồng của chính CTV. `uid` chỉ dùng cho queryKey + guard enabled
 *  (service đọc identity từ token, không nhận tham số). */
export const useMyCommission = (uid: string | undefined): UseMyCommissionResult => {
  const query = useQuery({
    queryKey: qk.commission.mine(uid ?? ''),
    queryFn: fetchMyCommission,
    enabled: !!uid,
  });
  return {
    summary: query.data ?? null,
    loading: query.isLoading,
    error: query.error,
  };
};

/* ─────────────────────── Commission mutations (paid) ───────────────────── */

export interface UseCommissionMutationsResult {
  markPaid: (orderIds: string[]) => Promise<void>;
  markPending: (orderIds: string[]) => Promise<void>;
}

export const useCommissionMutations = (): UseCommissionMutationsResult => {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: qk.commission.summaries });

  const markPaidMutation = useMutation({
    mutationFn: (orderIds: string[]) => markCommissionPaid(orderIds),
    onSuccess: invalidate,
  });
  const markPendingMutation = useMutation({
    mutationFn: (orderIds: string[]) => markCommissionPending(orderIds),
    onSuccess: invalidate,
  });

  return {
    markPaid: (orderIds) => markPaidMutation.mutateAsync(orderIds),
    markPending: (orderIds) => markPendingMutation.mutateAsync(orderIds),
  };
};

/* ───────────────────────────── Commission groups ───────────────────────── */

export interface UseCommissionGroupsResult {
  groups: CommissionGroup[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useCommissionGroups = (): UseCommissionGroupsResult => {
  const { currentUser } = useAuth();
  const query = useQuery({
    queryKey: qk.commission.groups,
    queryFn: fetchCommissionGroups,
    enabled: !!currentUser,
  });
  return {
    groups: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: () => void query.refetch(),
  };
};

export interface UpdateCommissionGroupArgs {
  id: string;
  data: Partial<Omit<CommissionGroup, 'id'>>;
}

export interface UseCommissionGroupMutationsResult {
  createGroup: (data: Omit<CommissionGroup, 'id'>) => Promise<CommissionGroup>;
  updateGroup: (args: UpdateCommissionGroupArgs) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
}

export const useCommissionGroupMutations = (): UseCommissionGroupMutationsResult => {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: qk.commission.groups });

  const createMutation = useMutation({
    mutationFn: (data: Omit<CommissionGroup, 'id'>) => createCommissionGroup(data),
    onSuccess: invalidate,
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: UpdateCommissionGroupArgs) => updateCommissionGroup(id, data),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCommissionGroup(id),
    onSuccess: invalidate,
  });

  return {
    createGroup: (data) => createMutation.mutateAsync(data),
    updateGroup: (args) => updateMutation.mutateAsync(args),
    deleteGroup: (id) => deleteMutation.mutateAsync(id),
  };
};
