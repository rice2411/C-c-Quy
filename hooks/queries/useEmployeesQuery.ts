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
