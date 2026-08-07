// Chấm công nhân viên (Face ID + giới hạn IP mạng quán).
export type AttendanceKind = 'in' | 'out';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string | null;
  kind: AttendanceKind;
  checkedAt: string; // ISO
  ip: string | null;
  faceDistance: number | null;
  imageUrl: string | null;
  note: string | null;
}

/** Dải mạng quán được phép chấm công. */
export interface AllowedNetwork {
  id: string;
  label: string | null;
  ipCidr: string; // '113.161.10.20' hoặc '1.2.3.0/24'
  active: boolean;
  createdAt?: string;
}

/** Hồ sơ NV suy ra từ email tài khoản đang đăng nhập. */
export interface EmployeeRef {
  id: string;
  name: string;
  email: string | null;
  status: string;
  faceCount: number;
}

/** Trạng thái IP hiện tại so với whitelist. */
export interface IpStatus {
  configured: boolean;
  allowed: boolean;
  ip: string;
}

/** Trạng thái chấm công hôm nay của NV. */
export interface AttendanceStatus {
  employeeId: string;
  faceCount: number;
  lastKind: AttendanceKind | null;
  lastAt: string | null;
  todayIn: string | null;
  todayOut: string | null;
  todayCount: number;
}

/** Kết quả GET /attendance/me. */
export interface AttendanceMe {
  employee: EmployeeRef | null;
  status: AttendanceStatus | null;
  ip: IpStatus;
}

/** 1 dòng tổng quan quản lý (mỗi NV). */
export interface AttendanceOverviewRow {
  employeeId: string;
  name: string;
  email: string | null;
  position: string | null;
  status: string;
  faceCount: number;
  todayIn: string | null;
  todayOut: string | null;
}

export interface AttendanceHistory {
  items: AttendanceRecord[];
  total: number;
  limit: number;
  offset: number;
}

export const KIND_LABELS: { value: AttendanceKind; label: string }[] = [
  { value: 'in', label: 'Vào ca' },
  { value: 'out', label: 'Tan ca' },
];

export const kindLabel = (k?: AttendanceKind | string | null): string =>
  KIND_LABELS.find((x) => x.value === k)?.label ?? '—';
