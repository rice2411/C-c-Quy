import { UserRole } from "@/types/user";
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  FileText,
  Users,
  Settings,
  TrendingUp,
  Coins,
  UserCog,
  Bell,
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import { ScreenVisibilityMap } from "@/types";

export type RouteType = "page" | "tab";

export interface RouteConfig {
  type: RouteType;
  path: string;
  labelKey: string;
  icon: LucideIcon;
  roles: UserRole[]; // Roles có quyền truy cập route này
  tabId?: string; // Dùng cho route type=tab
  parentPath?: string; // Dùng cho route type=tab
  disabled?: boolean;
}

export const getRouteConfigKey = (route: RouteConfig): string => {
  if (route.type === "tab" && route.parentPath && route.tabId) {
    return `${route.parentPath}#${route.tabId}`;
  }
  return route.path;
};

/**
 * Cấu hình routes và quyền truy cập theo role
 */
export const routes: RouteConfig[] = [
  {
    type: "page",
    path: "/",
    labelKey: "nav.dashboard",
    icon: LayoutDashboard,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  {
    type: "page",
    path: "/orders",
    labelKey: "nav.orders",
    icon: ShoppingCart,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLABORATOR],
  },
  {
    type: "page",
    path: "/transactions",
    labelKey: "nav.transactions",
    icon: TrendingUp,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  {
    type: "page",
    path: "/commission",
    labelKey: "nav.commission",
    icon: Coins,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  {
    type: "page",
    path: "/storage",
    labelKey: "nav.inventory",
    icon: Boxes,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  {
    type: "page",
    path: "/bill-import",
    labelKey: "nav.billImport",
    icon: FileText,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  {
    type: "page",
    path: "/customers",
    labelKey: "nav.customers",
    icon: Users,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLABORATOR],
  },
  {
    type: "page",
    path: "/users",
    labelKey: "nav.users",
    icon: UserCog,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], // Chỉ admin mới quản lý users
  },
  {
    type: "page",
    path: "/notifications",
    labelKey: "nav.notifications",
    icon: Bell,
    roles: [UserRole.SUPER_ADMIN],
  },
  {
    type: "page",
    path: "/settings",
    labelKey: "nav.settings",
    icon: Settings,
    roles: [UserRole.SUPER_ADMIN],
  },
];

export const storageTabRoutes: RouteConfig[] = [
  {
    type: "tab",
    path: "/storage",
    parentPath: "/storage",
    tabId: "products",
    labelKey: "inventory.productsTab",
    icon: Boxes,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
];

/**
 * Kiểm tra xem role có quyền truy cập route không
 */
export const hasRoutePermission = (
  routePath: string,
  userRole: UserRole | undefined,
): boolean => {
  if (!userRole) return false;

  const route = routes.find((r) => r.path === routePath);
  if (!route) return false;

  return route.roles.includes(userRole);
};

/**
 * Normalize role từ string hoặc enum về UserRole enum
 */
const normalizeRole = (
  role: UserRole | string | undefined,
): UserRole | undefined => {
  if (!role) return undefined;

  // Nếu đã là enum, return luôn
  if (Object.values(UserRole).includes(role as UserRole)) {
    return role as UserRole;
  }

  // Nếu là string, thử match với enum values
  const roleString = String(role).toLowerCase();
  if (roleString === "super_admin" || roleString === UserRole.SUPER_ADMIN) {
    return UserRole.SUPER_ADMIN;
  }
  if (roleString === "admin" || roleString === UserRole.ADMIN) {
    return UserRole.ADMIN;
  }
  if (roleString === "colaborator" || roleString === UserRole.COLABORATOR) {
    return UserRole.COLABORATOR;
  }

  return undefined;
};

/**
 * Lấy danh sách routes mà user có quyền truy cập
 */
export const getAccessibleRoutes = (
  userRole: UserRole | string | undefined,
  screenVisibility: ScreenVisibilityMap = {},
): RouteConfig[] => {
  const normalizedRole = normalizeRole(userRole);

  if (!normalizedRole) {
    return [];
  }

  return routes
    .filter((route) => route.roles.includes(normalizedRole))
    .map((route) => {
      const configKey = getRouteConfigKey(route);
      const disabledByConfig = screenVisibility[configKey] === false;
      return {
        ...route,
        disabled: Boolean(route.disabled) || disabledByConfig,
      };
    });
};

export const getAccessibleStorageTabs = (
  userRole: UserRole | string | undefined,
  screenVisibility: ScreenVisibilityMap = {},
): RouteConfig[] => {
  const normalizedRole = normalizeRole(userRole);
  if (!normalizedRole) return [];
  return storageTabRoutes
    .filter((tab) => tab.roles.includes(normalizedRole))
    .map((tab) => {
      const configKey = getRouteConfigKey(tab);
      const disabledByConfig = screenVisibility[configKey] === false;
      return {
        ...tab,
        disabled: Boolean(tab.disabled) || disabledByConfig,
      };
    });
};
