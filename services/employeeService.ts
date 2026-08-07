import { apiClient } from '@/services/api/client';
import { Employee, EmployeeStatus } from '@/types/employee';

const BASE = '/employees';

/** Ép dữ liệu API (untrusted) về Employee với default an toàn. */
function toEmployee(r: any): Employee {
  return {
    id: typeof r?.id === 'string' ? r.id : '',
    name: typeof r?.name === 'string' ? r.name : '',
    email: typeof r?.email === 'string' ? r.email : null,
    position: typeof r?.position === 'string' ? r.position : null,
    phone: typeof r?.phone === 'string' ? r.phone : null,
    startDate: typeof r?.startDate === 'string' ? r.startDate : null,
    baseSalary: typeof r?.baseSalary === 'number' ? r.baseSalary : null,
    status: r?.status === 'inactive' ? 'inactive' : 'active',
    note: typeof r?.note === 'string' ? r.note : null,
    createdAt: typeof r?.createdAt === 'string' ? r.createdAt : undefined,
    updatedAt: typeof r?.updatedAt === 'string' ? r.updatedAt : undefined,
  };
}

export async function fetchEmployees(): Promise<Employee[]> {
  const res = await apiClient.get<any[]>(BASE);
  return Array.isArray(res.data) ? res.data.map(toEmployee) : [];
}

export type EmployeeInput = {
  name: string;
  email?: string | null;
  position?: string | null;
  phone?: string | null;
  startDate?: string | null;
  baseSalary?: number | null;
  status?: EmployeeStatus;
  note?: string | null;
};

export async function addEmployee(input: EmployeeInput): Promise<Employee> {
  const res = await apiClient.post<any>(BASE, input);
  return toEmployee(res.data);
}

export async function updateEmployee(
  id: string,
  patch: Partial<EmployeeInput>,
): Promise<Employee | null> {
  const res = await apiClient.patch<any>(`${BASE}/${id}`, patch);
  return res.data ? toEmployee(res.data) : null;
}

export async function deleteEmployee(id: string): Promise<{ ok: boolean; reason?: string }> {
  const res = await apiClient.delete<{ ok: boolean; reason?: string }>(`${BASE}/${id}`);
  return res.data;
}
