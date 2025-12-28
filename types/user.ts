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
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  COLABORATOR = 'colaborator',
}

