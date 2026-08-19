/** React Query hook cho vai trò động (roles). CRUD qua roleService. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchRoles, saveRole, deleteRole, setRolePermissions } from '@/services/roleService';
import { Role, RolePermissions } from '@/types/user';

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
  const permsM = useMutation({
    mutationFn: ({ key, permissions }: { key: string; permissions: RolePermissions }) =>
      setRolePermissions(key, permissions),
    onSuccess,
  });
  return {
    save: (input: { key?: string; name: string; sortOrder?: number }) => saveM.mutateAsync(input),
    remove: (key: string) => deleteM.mutateAsync(key),
    setPermissions: (key: string, permissions: RolePermissions) =>
      permsM.mutateAsync({ key, permissions }),
    saving: saveM.isPending || deleteM.isPending || permsM.isPending,
  };
};
