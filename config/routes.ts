import { UserRole } from '@/types/user';
import { LayoutDashboard, ShoppingCart, Package, Users, Settings, ArrowRightLeft, UserCog } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface RouteConfig {
  path: string;
  labelKey: string;
  icon: LucideIcon;
  roles: UserRole[]; // Roles có quyền truy cập route này
  disabled?: boolean;
}

/**
 * Cấu hình routes và quyền truy cập theo role
 */
export const routes: RouteConfig[] = [
  {
    path: '/',
    labelKey: 'nav.dashboard',
    icon: LayoutDashboard,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLABORATOR]
  },
  {
    path: '/orders',
    labelKey: 'nav.orders',
    icon: ShoppingCart,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLABORATOR]
  },
  {
    path: '/transactions',
    labelKey: 'nav.transactions',
    icon: ArrowRightLeft,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
  },
  {
    path: '/inventory',
    labelKey: 'nav.inventory',
    icon: Package,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
  },
  {
    path: '/customers',
    labelKey: 'nav.customers',
    icon: Users,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLABORATOR]
  },
  {
    path: '/users',
    labelKey: 'nav.users',
    icon: UserCog,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] // Chỉ admin mới quản lý users
  },
  {
    path: '/settings',
    labelKey: 'nav.settings',
    icon: Settings,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLABORATOR],
    disabled: true
  }
];

/**
 * Kiểm tra xem role có quyền truy cập route không
 */
export const hasRoutePermission = (routePath: string, userRole: UserRole | undefined): boolean => {
  if (!userRole) return false;
  
  const route = routes.find(r => r.path === routePath);
  if (!route) return false;
  
  return route.roles.includes(userRole);
};

/**
 * Normalize role từ string hoặc enum về UserRole enum
 */
const normalizeRole = (role: UserRole | string | undefined): UserRole | undefined => {
  if (!role) return undefined;
  
  // Nếu đã là enum, return luôn
  if (Object.values(UserRole).includes(role as UserRole)) {
    return role as UserRole;
  }
  
  // Nếu là string, thử match với enum values
  const roleString = String(role).toLowerCase();
  if (roleString === 'super_admin' || roleString === UserRole.SUPER_ADMIN) {
    return UserRole.SUPER_ADMIN;
  }
  if (roleString === 'admin' || roleString === UserRole.ADMIN) {
    return UserRole.ADMIN;
  }
  if (roleString === 'colaborator' || roleString === UserRole.COLABORATOR) {
    return UserRole.COLABORATOR;
  }
  
  return undefined;
};

/**
 * Lấy danh sách routes mà user có quyền truy cập
 */
export const getAccessibleRoutes = (userRole: UserRole | string | undefined): RouteConfig[] => {
  const normalizedRole = normalizeRole(userRole);
  
  if (!normalizedRole) {
    return [];
  }
  
  return routes.filter(route => route.roles.includes(normalizedRole));
};

