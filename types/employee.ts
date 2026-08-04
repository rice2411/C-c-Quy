// Hồ sơ nhân sự (nhân viên) — độc lập với tài khoản đăng nhập.
export type EmployeeStatus = 'active' | 'inactive';

export interface Employee {
  id: string;
  name: string;
  position?: string | null; // chức vụ
  phone?: string | null;
  startDate?: string | null; // ISO yyyy-mm-dd (ngày vào làm)
  baseSalary?: number | null; // VND
  status: EmployeeStatus;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const EMPLOYEE_STATUSES: { value: EmployeeStatus; label: string }[] = [
  { value: 'active', label: 'Đang làm' },
  { value: 'inactive', label: 'Đã nghỉ' },
];

export const employeeStatusLabel = (s?: EmployeeStatus | string): string =>
  EMPLOYEE_STATUSES.find((x) => x.value === s)?.label ?? 'Đang làm';
