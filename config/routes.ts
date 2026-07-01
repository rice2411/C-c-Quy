import { UserRole } from "@/types/user";
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  FileText,
  Truck,
  Package,
  Users,
  Settings,
  Settings2,
  TrendingUp,
  Coins,
  Wallet,
  BookOpen,
  UserCog,
  Bell,
  Activity,
  ShieldCheck,
  Tag,
  Monitor,
  MessageSquare,
  Award,
  QrCode,
  IceCream,
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
    path: "/finance/overview",
    labelKey: "nav.financeOverview",
    icon: LayoutDashboard,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  {
    type: "page",
    path: "/finance/transactions",
    labelKey: "nav.financeTransactions",
    icon: Coins,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  {
    type: "page",
    path: "/promotions",
    labelKey: "nav.promotions",
    icon: Tag,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  {
    type: "page",
    path: "/commission",
    labelKey: "nav.commissionHome",
    icon: TrendingUp,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  {
    type: "page",
    path: "/commission-settings",
    labelKey: "nav.commissionSettings",
    icon: Settings2,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  {
    type: "page",
    path: "/my-commission",
    labelKey: "nav.myCommission",
    icon: Wallet,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLABORATOR],
  },
  {
    type: "page",
    path: "/commission-guide",
    labelKey: "nav.commissionGuide",
    icon: BookOpen,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COLABORATOR],
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
    path: "/stock-receipts",
    labelKey: "nav.stockReceipts",
    icon: FileText,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  {
    type: "page",
    path: "/suppliers",
    labelKey: "nav.suppliers",
    icon: Truck,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  {
    type: "page",
    path: "/materials",
    labelKey: "nav.materials",
    icon: Package,
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
    path: "/admin/request-logs",
    labelKey: "nav.requestLogs",
    icon: Activity,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  {
    type: "page",
    path: "/settings/screens",
    labelKey: "nav.settingsScreens",
    icon: Monitor,
    roles: [UserRole.SUPER_ADMIN],
  },
  {
    type: "page",
    path: "/settings/zalo",
    labelKey: "nav.settingsZalo",
    icon: MessageSquare,
    roles: [UserRole.SUPER_ADMIN],
  },
  {
    type: "page",
    path: "/settings/order",
    labelKey: "nav.settingsOrder",
    icon: ShoppingCart,
    roles: [UserRole.SUPER_ADMIN],
  },
  {
    type: "page",
    path: "/settings/sepay",
    labelKey: "nav.settingsSepay",
    icon: QrCode,
    roles: [UserRole.SUPER_ADMIN],
  },
  {
    type: "page",
    path: "/settings/badges",
    labelKey: "nav.settingsBadges",
    icon: Award,
    roles: [UserRole.SUPER_ADMIN],
  },
  {
    type: "page",
    path: "/settings/categories",
    labelKey: "nav.settingsCategories",
    icon: Tag,
    roles: [UserRole.SUPER_ADMIN],
  },
  {
    type: "page",
    path: "/settings/flavors",
    labelKey: "nav.settingsFlavors",
    icon: IceCream,
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

/**
 * Nhóm menu sidebar dạng xổ xuống: 1 mục cha chứa nhiều route con.
 * childPaths quyết định thứ tự hiển thị các mục con trong nhóm.
 */
export interface NavGroupConfig {
  key: string;
  labelKey: string;
  icon: LucideIcon;
  childPaths: string[];
}

export const navGroups: NavGroupConfig[] = [
  {
    key: "finance",
    labelKey: "nav.financeGroup",
    icon: Wallet,
    childPaths: [
      "/finance/overview",
      "/finance/transactions",
    ],
  },
  {
    key: "commission",
    labelKey: "nav.commissionGroup",
    icon: Coins,
    childPaths: [
      "/commission",
      "/commission-settings",
      "/my-commission",
      "/commission-guide",
    ],
  },
  {
    key: "inventory",
    labelKey: "nav.inventoryGroup",
    icon: Boxes,
    childPaths: [
      "/storage",
      "/stock-receipts",
      "/suppliers",
      "/materials",
    ],
  },
  {
    key: "system",
    labelKey: "nav.systemGroup",
    icon: ShieldCheck,
    childPaths: [
      "/admin/request-logs",
    ],
  },
  {
    key: "settings",
    labelKey: "nav.settingsGroup",
    icon: Settings,
    childPaths: [
      "/settings/screens",
      "/settings/zalo",
      "/settings/order",
      "/settings/sepay",
      "/settings/badges",
      "/settings/categories",
      "/settings/flavors",
    ],
  },
];

export type NavNode =
  | { type: "route"; route: RouteConfig }
  | { type: "group"; group: NavGroupConfig; children: RouteConfig[] };

/**
 * Dựng cây điều hướng: route thường giữ nguyên, các route thuộc 1 nhóm
 * được gom lại dưới mục cha (đặt tại vị trí của mục con đầu tiên).
 */
export const buildNavTree = (
  userRole: UserRole | string | undefined,
  screenVisibility: ScreenVisibilityMap = {},
): NavNode[] => {
  const accessible = getAccessibleRoutes(userRole, screenVisibility);
  const pathToGroup = new Map<string, NavGroupConfig>();
  navGroups.forEach((g) => g.childPaths.forEach((p) => pathToGroup.set(p, g)));

  const nodes: NavNode[] = [];
  const emitted = new Set<string>();

  for (const route of accessible) {
    const group = pathToGroup.get(route.path);
    if (!group) {
      nodes.push({ type: "route", route });
      continue;
    }
    if (emitted.has(group.key)) continue;
    emitted.add(group.key);
    const children = group.childPaths
      .map((p) => accessible.find((r) => r.path === p))
      .filter((r): r is RouteConfig => Boolean(r));
    if (children.length > 0) {
      nodes.push({ type: "group", group, children });
    }
  }

  return nodes;
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
