/**
 * React Query hooks cho domain Users (epic #58 — P8).
 *
 * - queryFn/mutationFn GỌI THẲNG service hiện có (userService) — KHÔNG viết lại HTTP.
 * - Query `enabled: !!currentUser` để tránh gọi API 401 ở màn login.
 * - Mọi mutation (status / customName / role) invalidate `qk.users.all`.
 * - KHÔNG nuốt lỗi: caller (component) bắt error → toast.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserData, UserRole, UserStatus } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/hooks/queryKeys';
import {
  getAllUsers,
  updateUserCustomName,
  updateUserRole,
  updateUserStatus,
} from '@/services/userService';

export interface UseUsersResult {
  users: UserData[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useUsers = (): UseUsersResult => {
  const { currentUser } = useAuth();
  const query = useQuery({
    queryKey: qk.users.all,
    queryFn: getAllUsers,
    enabled: !!currentUser,
  });
  return {
    users: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: async () => {
      await query.refetch();
    },
  };
};

export interface UpdateUserStatusArgs {
  uid: string;
  status: UserStatus;
}

export interface UpdateUserCustomNameArgs {
  uid: string;
  customName: string;
}

export interface UpdateUserRoleArgs {
  uid: string;
  role: UserRole;
}

export interface UseUserMutationsResult {
  updateStatus: (args: UpdateUserStatusArgs) => Promise<void>;
  updateCustomName: (args: UpdateUserCustomNameArgs) => Promise<void>;
  updateRole: (args: UpdateUserRoleArgs) => Promise<void>;
}

export const useUserMutations = (): UseUserMutationsResult => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.users.all });

  const statusMutation = useMutation({
    mutationFn: ({ uid, status }: UpdateUserStatusArgs) => updateUserStatus(uid, status),
    onSuccess: invalidate,
  });
  const customNameMutation = useMutation({
    mutationFn: ({ uid, customName }: UpdateUserCustomNameArgs) => updateUserCustomName(uid, customName),
    onSuccess: invalidate,
  });
  const roleMutation = useMutation({
    mutationFn: ({ uid, role }: UpdateUserRoleArgs) => updateUserRole(uid, role),
    onSuccess: invalidate,
  });

  return {
    updateStatus: (args) => statusMutation.mutateAsync(args),
    updateCustomName: (args) => customNameMutation.mutateAsync(args),
    updateRole: (args) => roleMutation.mutateAsync(args),
  };
};
