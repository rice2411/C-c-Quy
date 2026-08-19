export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  customName?: string; // Tên gợi nhớ do admin đặt
  status: UserStatus; // pending, active, inactive
  createdAt: string;
  lastLoginAt: string;
  role: UserRole;
  /** Zalo group chat id (API) when user is a CTV assigned to a Zalo group; synced from Settings → Zalo */
  zaloCtvGroupChatId?: string | null;
}

/** Vai trò động (quản lý ở Cài đặt → Màn hình). key lưu ở users.role + screen_visibility.roles. */
export interface Role {
  key: string;
  name: string;
  sortOrder: number;
  builtIn: boolean;
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  COLABORATOR = 'colaborator',
  STAFF = 'staff',
}

