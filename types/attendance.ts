// Chấm công nhân viên (Face ID + giới hạn IP mạng quán).
export type AttendanceKind = 'in' | 'out';
export type AttendanceShift = 'ca1' | 'ca2' | 'ca3';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string | null;
  kind: AttendanceKind;
  shift: AttendanceShift | null; // ca suy ra theo giờ chấm
  checkedAt: string; // ISO
  ip: string | null;
  faceDistance: number | null;
  imageUrl: string | null;
  note: string | null;
}

/** Vào/ra của 1 ca trong ngày. */
export interface AttendanceShiftStatus {
  shift: AttendanceShift;
  in: string | null;
  out: string | null;
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
  nextKind: AttendanceKind; // hành động kế tiếp (in/out)
  currentShift: AttendanceShift | null; // ca mà lần chấm kế tiếp rơi vào (theo giờ hiện tại)
  todayIn: string | null;
  todayOut: string | null;
  todayCount: number;
  todayShifts: AttendanceShiftStatus[]; // vào/ra từng ca hôm nay
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

/** 3 ca làm việc cố định (giờ hiển thị). Đồng bộ với attendance_shift_at ở BE. */
export const SHIFTS: { value: AttendanceShift; label: string; time: string }[] = [
  { value: 'ca1', label: 'Ca 1', time: '08:00–12:00' },
  { value: 'ca2', label: 'Ca 2', time: '13:30–17:30' },
  { value: 'ca3', label: 'Ca 3', time: '17:30–21:30' },
];

export const shiftLabel = (s?: AttendanceShift | string | null): string =>
  SHIFTS.find((x) => x.value === s)?.label ?? '—';

export const shiftTime = (s?: AttendanceShift | string | null): string =>
  SHIFTS.find((x) => x.value === s)?.time ?? '';
