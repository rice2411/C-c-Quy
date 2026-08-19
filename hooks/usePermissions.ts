/**
 * Quyền của user đang đăng nhập theo ma trận "Quyền và Tính năng".
 * Dùng để gate nút/hành động: const { can } = usePermissions(); can('orders','create').
 * super_admin luôn full. Role khác: theo permissions đã cấu hình (thiếu → false).
 */
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRoles } from '@/hooks/queries/useRolesQuery';
import type { PermAction } from '@/config/permissionModules';

export const usePermissions = () => {
  const { userData } = useAuth();
  const { roles } = useRoles();
  const roleKey = userData?.role as string | undefined;

  return useMemo(() => {
    const role = roles.find((r) => r.key === roleKey);
    const perms = role?.permissions ?? {};
    const can = (moduleKey: string, action: PermAction): boolean => {
      if (roleKey === 'super_admin') return true;
      return perms?.[moduleKey]?.[action] === true;
    };
    return { can, permissions: perms, roleKey };
  }, [roles, roleKey]);
};
