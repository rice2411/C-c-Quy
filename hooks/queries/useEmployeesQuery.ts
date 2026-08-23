/**
 * React Query hooks cho domain Nhân sự (employees). queryFn gọi thẳng employeeService.
 * enabled theo currentUser (tránh 401). Mutations invalidate key 'employees'.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/hooks/queryKeys';
import {
  fetchEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  fetchEmployeeWages,
  addEmployeeWage,
  deleteEmployeeWage,
  type EmployeeInput,
} from '@/services/employeeService';
import { Employee } from '@/types/employee';

export const useEmployees = () => {
  const { currentUser } = useAuth();
  const q = useQuery({
    queryKey: qk.employees.all,
    queryFn: fetchEmployees,
    enabled: !!currentUser,
  });
  return {
    employees: (q.data ?? []) as Employee[],
    loading: q.isLoading,
    error: q.error,
  };
};

export const useEmployeeMutations = () => {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: qk.employees.all });

  const createM = useMutation({ mutationFn: (input: EmployeeInput) => addEmployee(input), onSuccess: invalidate });
  const updateM = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<EmployeeInput> }) => updateEmployee(id, patch),
    onSuccess: invalidate,
  });
  const deleteM = useMutation({ mutationFn: (id: string) => deleteEmployee(id), onSuccess: invalidate });

  return {
    createEmployee: (input: EmployeeInput) => createM.mutateAsync(input),
    updateEmployee: (id: string, patch: Partial<EmployeeInput>) => updateM.mutateAsync({ id, patch }),
    deleteEmployee: (id: string) => deleteM.mutateAsync(id),
  };
};

// ── Mức lương/giờ theo NV ──

/** Lịch sử mức lương/giờ của 1 NV (chỉ chạy khi có employeeId). */
export const useEmployeeWages = (employeeId: string | null) => {
  const q = useQuery({
    queryKey: qk.employees.wages(employeeId ?? ''),
    queryFn: () => fetchEmployeeWages(employeeId as string),
    enabled: !!employeeId,
  });
  return { wages: q.data ?? [], loading: q.isLoading, error: q.error };
};

export const useEmployeeWageMutations = () => {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['employees'] });
  };
  const addM = useMutation({
    mutationFn: ({ employeeId, hourlyRate, effectiveDate, note }: { employeeId: string; hourlyRate: number; effectiveDate: string; note?: string | null }) =>
      addEmployeeWage(employeeId, { hourlyRate, effectiveDate, note }),
    onSuccess: invalidate,
  });
  const removeM = useMutation({
    mutationFn: (wageId: string) => deleteEmployeeWage(wageId),
    onSuccess: invalidate,
  });
  return {
    addWage: addM.mutateAsync,
    deleteWage: (wageId: string) => removeM.mutateAsync(wageId),
  };
};
