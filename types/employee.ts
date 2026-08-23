// Hồ sơ nhân sự (nhân viên) — độc lập với tài khoản đăng nhập.
export type EmployeeStatus = 'active' | 'inactive';

export interface Employee {
  id: string;
  name: string;
  email?: string | null; // email tài khoản đăng nhập (SSO) để chấm công; null = chưa gắn
  position?: string | null; // chức vụ
  phone?: string | null;
  startDate?: string | null; // ISO yyyy-mm-dd (ngày vào làm)
  baseSalary?: number | null; // VND
  hourlyRate?: number | null; // mức lương/giờ đang áp dụng (deal riêng NV); null = chưa đặt
  status: EmployeeStatus;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** 1 mức lương/giờ theo ngày áp dụng của 1 NV (có lịch sử). */
export interface EmployeeWageRate {
  id: string;
  employeeId: string;
  hourlyRate: number; // VND/giờ
  effectiveDate: string; // yyyy-mm-dd
  note?: string | null;
  createdAt?: string;
}

export const EMPLOYEE_STATUSES: { value: EmployeeStatus; label: string }[] = [
  { value: 'active', label: 'Đang làm' },
  { value: 'inactive', label: 'Đã nghỉ' },
];

export const employeeStatusLabel = (s?: EmployeeStatus | string): string =>
  EMPLOYEE_STATUSES.find((x) => x.value === s)?.label ?? 'Đang làm';
