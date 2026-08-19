export type ScreenVisibilityMap = Record<string, boolean>;
/** Override role được truy cập mỗi màn: { '/path': ['admin','staff'] }. Thiếu route → dùng mặc định routes.ts. */
export type ScreenRolesMap = Record<string, string[]>;

export interface ScreenConfiguration {
  screenVisibility: ScreenVisibilityMap;
  screenRoles?: ScreenRolesMap;
  updatedAt?: string;
  updatedBy?: string;
}

