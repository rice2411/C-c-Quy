/**
 * React Query hook cho domain Users (epic #58 — P7, dùng cho Dashboard).
 *
 * - queryFn GỌI THẲNG userService (getAllUsers) — KHÔNG viết lại HTTP.
 * - Query `enabled: !!currentUser` (tránh chạy trước auth → 401).
 * - KHÔNG nuốt lỗi: caller dùng `error` để xử lý.
 */
import { useQuery } from '@tanstack/react-query';
import type { UserData } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/hooks/queryKeys';
import { getAllUsers } from '@/services/userService';

export interface UseUsersResult {
  users: UserData[];
  loading: boolean;
  error: Error | null;
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
  };
};
