/** React Query hook cho vai trò động (roles). CRUD qua roleService. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchRoles, saveRole, deleteRole } from '@/services/roleService';
import { Role } from '@/types/user';

const ROLES_KEY = ['roles'] as const;

export const useRoles = () => {
  const { currentUser } = useAuth();
  const q = useQuery({
    queryKey: ROLES_KEY,
    queryFn: fetchRoles,
    enabled: !!currentUser,
  });
  return { roles: (q.data ?? []) as Role[], loading: q.isLoading, error: q.error };
};

export const useRoleMutations = () => {
  const queryClient = useQueryClient();
  const onSuccess = (data: Role[]) => {
    queryClient.setQueryData<Role[]>(ROLES_KEY, data);
    queryClient.invalidateQueries({ queryKey: ROLES_KEY });
  };
  const saveM = useMutation({
    mutationFn: (input: { key?: string; name: string; sortOrder?: number }) => saveRole(input),
    onSuccess,
  });
  const deleteM = useMutation({
    mutationFn: (key: string) => deleteRole(key),
    onSuccess,
  });
  return {
    save: (input: { key?: string; name: string; sortOrder?: number }) => saveM.mutateAsync(input),
    remove: (key: string) => deleteM.mutateAsync(key),
    saving: saveM.isPending || deleteM.isPending,
  };
};
